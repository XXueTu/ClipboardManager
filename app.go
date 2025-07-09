package main

import (
	"context"
	"log"

	"react-wails-app/internal/config"
	"react-wails-app/internal/models"
	"react-wails-app/internal/repository"
	"react-wails-app/internal/service"
	"react-wails-app/internal/window"
)

// App 应用程序主结构体
type App struct {
	ctx              context.Context
	appService       service.AppService
	clipboardService service.ClipboardService
	chatService      service.ChatService
	db               *repository.Database
}

// NewApp 创建新的应用程序实例
func NewApp() *App {
	// 创建配置管理器
	configManager := config.NewManager()

	// 创建数据库连接
	db, err := repository.NewDatabase(configManager.GetDatabasePath())
	if err != nil {
		log.Fatal("无法连接数据库:", err)
	}

	// 加载配置
	settings, err := configManager.Load()
	if err != nil {
		log.Fatal("无法加载配置:", err)
	}

	// 创建仓库层
	clipboardRepo := repository.NewClipboardRepository(db.DB)
	chatRepo := repository.NewChatRepository(db.DB)

	// 创建服务层
	clipboardService := service.NewClipboardService(clipboardRepo, settings)
	chatService := service.NewChatService(chatRepo)
	windowManager := window.NewManager()
	appService := service.NewAppService(configManager, windowManager, clipboardService, chatService)

	return &App{
		appService:       appService,
		clipboardService: clipboardService,
		chatService:      chatService,
		db:               db,
	}
}

// startup 应用程序启动时调用
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	// 初始化应用程序服务
	if err := a.appService.Initialize(ctx); err != nil {
		log.Printf("初始化应用程序失败: %v", err)
		return
	}

	log.Println("✅ 应用程序初始化完成")
}

// shutdown 应用程序关闭时调用
func (a *App) shutdown(ctx context.Context) {
	// 关闭应用程序服务
	a.appService.Shutdown()

	// 关闭数据库连接
	if a.db != nil {
		a.db.Close()
	}

	log.Println("✅ 应用程序已关闭")
}

// === 剪切板管理 API ===

// GetClipboardItems 获取剪切板条目列表
func (a *App) GetClipboardItems(limit, offset int) ([]models.ClipboardItem, error) {
	return a.clipboardService.GetItems(limit, offset)
}

// SearchClipboardItems 搜索剪切板条目
func (a *App) SearchClipboardItems(query models.SearchQuery) (models.SearchResult, error) {
	return a.clipboardService.SearchItems(query)
}

// CreateClipboardItem 创建剪切板条目
func (a *App) CreateClipboardItem(content string) error {
	return a.clipboardService.CreateItem(content)
}

// UpdateClipboardItem 更新剪切板条目
func (a *App) UpdateClipboardItem(item models.ClipboardItem) error {
	return a.clipboardService.UpdateItem(item)
}

// DeleteClipboardItem 删除剪切板条目（软删除）
func (a *App) DeleteClipboardItem(id string) error {
	return a.clipboardService.DeleteItem(id)
}

// UseClipboardItem 使用剪切板条目
func (a *App) UseClipboardItem(id string) error {
	return a.clipboardService.UseItem(id)
}

// === 回收站管理 API ===

// GetTrashItems 获取回收站条目
func (a *App) GetTrashItems(limit, offset int) ([]models.ClipboardItem, error) {
	return a.clipboardService.GetTrashItems(limit, offset)
}

// RestoreClipboardItem 从回收站恢复条目
func (a *App) RestoreClipboardItem(id string) error {
	return a.clipboardService.RestoreItem(id)
}

// PermanentDeleteClipboardItem 永久删除剪切板条目
func (a *App) PermanentDeleteClipboardItem(id string) error {
	return a.clipboardService.PermanentDeleteItem(id)
}

// BatchPermanentDelete 批量永久删除
func (a *App) BatchPermanentDelete(ids []string) error {
	return a.clipboardService.BatchPermanentDelete(ids)
}

// EmptyTrash 清空回收站
func (a *App) EmptyTrash() error {
	return a.clipboardService.EmptyTrash()
}

// === 统计信息 API ===

// GetStatistics 获取统计信息
func (a *App) GetStatistics() (models.Statistics, error) {
	return a.clipboardService.GetStatistics()
}

// === 设置管理 API ===

// GetSettings 获取设置
func (a *App) GetSettings() (models.Settings, error) {
	settings, err := a.appService.GetSettings()
	if err != nil {
		return models.Settings{}, err
	}
	return *settings, nil
}

// UpdateSettings 更新设置
func (a *App) UpdateSettings(settings models.Settings) error {
	return a.appService.UpdateSettings(&settings)
}

// === 窗口管理 API ===

// ShowWindow 显示窗口
func (a *App) ShowWindow() {
	a.appService.ShowWindow()
}

// HideWindow 隐藏窗口
func (a *App) HideWindow() {
	a.appService.HideWindow()
}

// ToggleWindow 切换窗口显示状态
func (a *App) ToggleWindow() {
	a.appService.ToggleWindow()
}

// GetWindowState 获取窗口状态
func (a *App) GetWindowState() models.WindowState {
	return a.appService.GetWindowState()
}

// SetScreenSize 设置屏幕大小
func (a *App) SetScreenSize(width, height int) {
	a.appService.SetScreenSize(width, height)
}

// === 聊天管理 API ===

// CreateChatSession 创建聊天会话
func (a *App) CreateChatSession(title string) (*models.ChatSession, error) {
	return a.chatService.CreateSession(a.ctx, title)
}

// GetChatSessions 获取聊天会话列表
func (a *App) GetChatSessions() (*models.ChatSessionListResponse, error) {
	return a.chatService.ListSessions(a.ctx)
}

// GetChatSession 获取聊天会话
func (a *App) GetChatSession(sessionID string) (*models.ChatSession, error) {
	return a.chatService.GetSession(a.ctx, sessionID)
}

// UpdateChatSession 更新聊天会话
func (a *App) UpdateChatSession(sessionID string, title string) error {
	return a.chatService.UpdateSession(a.ctx, sessionID, title)
}

// DeleteChatSession 删除聊天会话
func (a *App) DeleteChatSession(sessionID string) error {
	return a.chatService.DeleteSession(a.ctx, sessionID)
}

// SendChatMessage 发送聊天消息
func (a *App) SendChatMessage(sessionID, message string) (*models.ChatMessage, error) {
	return a.chatService.SendMessage(a.ctx, sessionID, message)
}

// GetChatMessages 获取聊天消息列表
func (a *App) GetChatMessages(sessionID string, limit, offset int) (*models.ChatMessageListResponse, error) {
	return a.chatService.GetMessages(a.ctx, sessionID, limit, offset)
}

// GenerateChatTitle 生成聊天标题
func (a *App) GenerateChatTitle(message string) (string, error) {
	return a.chatService.GenerateTitle(a.ctx, message)
}

// GenerateChatTags 生成聊天标签
func (a *App) GenerateChatTags(message string) ([]string, error) {
	return a.chatService.GenerateTags(a.ctx, message)
}
