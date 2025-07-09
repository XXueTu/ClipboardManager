package service

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"react-wails-app/internal/config"
	"react-wails-app/internal/models"
	"react-wails-app/internal/window"
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

	// 获取请求参数
	sessionID := r.URL.Query().Get("session_id")
	message := r.URL.Query().Get("message")

	if sessionID == "" || message == "" {
		s.writeSSEError(w, "Missing session_id or message parameter")
		return
	}

	// 创建flusher
	flusher, ok := w.(http.Flusher)
	if !ok {
		s.writeSSEError(w, "Streaming not supported")
		return
	}

	// 发送开始事件
	s.writeSSEEvent(w, "start", fmt.Sprintf(`{"session_id": "%s", "message": "%s"}`, sessionID, message))
	flusher.Flush()

	// 使用回调函数处理流式响应
	err := s.chatService.SendMessageStream(r.Context(), sessionID, message, func(response *models.StreamResponse) {
		switch response.Type {
		case models.StreamTypeMessage:
			// 序列化响应数据
			dataBytes, _ := json.Marshal(response.Data)
			s.writeSSEEvent(w, "message", fmt.Sprintf(`{"data": %s}`, string(dataBytes)))
		case models.StreamTypeComplete:
			// 序列化响应数据
			dataBytes, _ := json.Marshal(response.Data)
			s.writeSSEEvent(w, "complete", fmt.Sprintf(`{"data": %s}`, string(dataBytes)))
		case models.StreamTypeError:
			s.writeSSEEvent(w, "error", fmt.Sprintf(`{"error": "%s"}`, response.Error))
		}
		flusher.Flush()
	})

	if err != nil {
		s.writeSSEError(w, fmt.Sprintf("Stream error: %v", err))
		flusher.Flush()
	}

	// 发送结束事件
	s.writeSSEEvent(w, "end", fmt.Sprintf(`{"session_id": "%s"}`, sessionID))
	flusher.Flush()
}

// writeSSEEvent 写入SSE事件
func (s *appService) writeSSEEvent(w http.ResponseWriter, event string, data string) {
	fmt.Fprintf(w, "event: %s\n", event)
	fmt.Fprintf(w, "data: %s\n\n", data)
}

// writeSSEError 写入SSE错误事件
func (s *appService) writeSSEError(w http.ResponseWriter, message string) {
	fmt.Fprintf(w, "event: error\n")
	fmt.Fprintf(w, "data: {\"error\": \"%s\"}\n\n", message)
}
