package service

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"

	"Sid/internal/config"
	"Sid/internal/models"
	"Sid/internal/window"
)

// AppService 应用程序服务接口
type AppService interface {
	// 初始化
	Initialize(ctx context.Context) error

	// 设置管理
	GetSettings() (*models.Settings, error)
	UpdateSettings(settings *models.Settings) error

	// 窗口管理
	ShowWindow()
	HideWindow()
	ToggleWindow()
	GetWindowState() models.WindowState
	SetScreenSize(width, height int)

	// 应用状态
	Shutdown()

	// HTTP处理
	CreateAssetHandler() http.HandlerFunc
}

// appService 应用程序服务实现
type appService struct {
	configManager    config.Manager
	windowManager    window.Manager
	clipboardService ClipboardService
	chatService      ChatService
	settings         *models.Settings
}

// NewAppService 创建新的应用程序服务
func NewAppService(
	configManager config.Manager,
	windowManager window.Manager,
	clipboardService ClipboardService,
	chatService ChatService,
) AppService {
	return &appService{
		configManager:    configManager,
		windowManager:    windowManager,
		clipboardService: clipboardService,
		chatService:      chatService,
	}
}

// Initialize 初始化应用程序服务
func (s *appService) Initialize(ctx context.Context) error {
	// 加载配置
	settings, err := s.configManager.Load()
	if err != nil {
		return err
	}
	s.settings = settings

	// 初始化窗口管理器
	if err := s.windowManager.Initialize(ctx, settings); err != nil {
		return err
	}

	// 开始剪切板监听
	if err := s.clipboardService.StartMonitoring(); err != nil {
		return err
	}

	return nil
}

// GetSettings 获取设置
func (s *appService) GetSettings() (*models.Settings, error) {
	if s.settings == nil {
		return s.configManager.Load()
	}
	return s.settings, nil
}

// UpdateSettings 更新设置
func (s *appService) UpdateSettings(settings *models.Settings) error {
	// 保存配置到文件
	if err := s.configManager.Save(settings); err != nil {
		return err
	}

	// 更新内存中的设置
	s.settings = settings

	// 更新剪切板服务设置
	if clipboardService, ok := s.clipboardService.(*clipboardService); ok {
		clipboardService.UpdateSettings(settings)
	}

	return nil
}

// ShowWindow 显示窗口
func (s *appService) ShowWindow() {
	s.windowManager.ShowWindow()
}

// HideWindow 隐藏窗口
func (s *appService) HideWindow() {
	s.windowManager.HideWindow()
}

// ToggleWindow 切换窗口显示状态
func (s *appService) ToggleWindow() {
	s.windowManager.ToggleWindow()
}

// GetWindowState 获取窗口状态
func (s *appService) GetWindowState() models.WindowState {
	state := s.windowManager.GetState()
	state.IsMonitoring = s.clipboardService.IsMonitoring()
	return state
}

// SetScreenSize 设置屏幕大小
func (s *appService) SetScreenSize(width, height int) {
	s.windowManager.SetScreenSize(width, height)
}

// Shutdown 关闭应用程序
func (s *appService) Shutdown() {
	// 停止剪切板监听
	s.clipboardService.StopMonitoring()
}

// CreateAssetHandler 创建资产处理器以支持流式请求
func (s *appService) CreateAssetHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// 处理流式聊天请求
		if strings.HasPrefix(r.URL.Path, "/api/chat/stream") {
			s.handleChatStream(w, r)
			return
		}

		// 其他静态资源请求 - 返回404
		http.NotFound(w, r)
	}
}

// handleChatStream 处理流式聊天请求
func (s *appService) handleChatStream(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// 设置SSE头部
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	// 处理OPTIONS预检请求
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	// 从JSON body中解析请求参数
	var requestBody struct {
		SessionId string `json:"sessionId"`
		Message   string `json:"message"`
	}

	if err := json.NewDecoder(r.Body).Decode(&requestBody); err != nil {
		s.writeSSEError(w, "Invalid request body")
		return
	}

	sessionID := requestBody.SessionId
	message := requestBody.Message

	if sessionID == "" || message == "" {
		s.writeSSEError(w, "Missing sessionId or message parameter")
		return
	}

	// 创建flusher（如果不支持flushing也继续处理）
	flusher, flushSupported := w.(http.Flusher)
	if !flushSupported {
		log.Printf("⚠️ HTTP Flushing不支持，但继续处理流式响应")
	}

	// 发送开始事件
	s.writeSSEEvent(w, "start", fmt.Sprintf(`{"session_id": "%s", "message": "%s"}`, sessionID, message))
	if flushSupported {
		flusher.Flush()
	}

	// 使用回调函数处理流式响应
	err := s.chatService.SendMessageStream(r.Context(), sessionID, message, func(response *models.StreamResponse) {
		switch response.Type {
		case models.StreamTypeMessage:
			// 发送简单的content内容
			if chatResp, ok := response.Data.(models.ChatResponse); ok {
				log.Printf("📤 发送SSE message事件: content='%s'", chatResp.Content)
				s.writeSSEEvent(w, "message", chatResp.Content)
			}
		case models.StreamTypeComplete:
			// 前端期望的是done事件
			if chatResp, ok := response.Data.(models.ChatResponse); ok {
				log.Printf("📤 发送SSE done事件: content='%s'", chatResp.Content)
				s.writeSSEEvent(w, "done", chatResp.Content)
			}
		case models.StreamTypeError:
			log.Printf("📤 发送SSE error事件: error='%s'", response.Error)
			s.writeSSEEvent(w, "error", response.Error)
		}
		if flushSupported {
			flusher.Flush()
		}
	})

	if err != nil {
		s.writeSSEError(w, fmt.Sprintf("Stream error: %v", err))
		if flushSupported {
			flusher.Flush()
		}
	}

	// 发送结束事件
	s.writeSSEEvent(w, "end", fmt.Sprintf(`{"session_id": "%s"}`, sessionID))
	if flushSupported {
		flusher.Flush()
	}
}

// writeSSEEvent 写入SSE事件
func (s *appService) writeSSEEvent(w http.ResponseWriter, event string, data string) {
	log.Printf("🔄 写入SSE事件 - event: '%s', data: '%s'", event, data)
	fmt.Fprintf(w, "event: %s\n", event)
	fmt.Fprintf(w, "data: %s\n\n", data)
}

// writeSSEError 写入SSE错误事件
func (s *appService) writeSSEError(w http.ResponseWriter, message string) {
	fmt.Fprintf(w, "event: error\n")
	fmt.Fprintf(w, "data: {\"error\": \"%s\"}\n\n", message)
}
