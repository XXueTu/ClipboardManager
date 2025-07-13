package main

import (
	"Sid/internal/config"
	"Sid/internal/models"
	"Sid/internal/repository"
	"Sid/internal/service"
	"Sid/internal/window"
	"context"
	"log"

	clipboardLib "golang.design/x/clipboard"
)

// App 应用程序主结构体
type App struct {
	ctx              context.Context
	appService       service.AppService
	clipboardService service.ClipboardService
	chatService      service.ChatService
	tagService       service.TagService
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
	tagRepo := repository.NewTagRepository(db.DB)

	// 创建服务层
	chatService := service.NewChatService(chatRepo)
	tagService := service.NewTagService(tagRepo, clipboardRepo)
	clipboardService := service.NewClipboardService(clipboardRepo, settings, chatService, tagService)
	windowManager := window.NewManager()
	appService := service.NewAppService(configManager, windowManager, clipboardService, chatService)

	return &App{
		appService:       appService,
		clipboardService: clipboardService,
		chatService:      chatService,
		tagService:       tagService,
		db:               db,
	}
}

// startup 应用程序启动时调用
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	// 初始化剪切板库
	err := clipboardLib.Init()
	if err != nil {
		log.Printf("初始化剪切板库失败: %v", err)
		return
	}

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

// GenerateTagsForClipboardItem 为剪切板条目生成AI标签
func (a *App) GenerateTagsForClipboardItem(id string) ([]string, error) {
	return a.clipboardService.GenerateTagsForItem(a.ctx, id)
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

// GetCategoriesAndTags 获取分类和标签列表
func (a *App) GetCategoriesAndTags() (models.CategoryTagsResponse, error) {
	return a.clipboardService.GetCategoriesAndTags()
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

// === 标签管理 API ===

// GetTags 获取所有标签
func (a *App) GetTags() ([]models.Tag, error) {
	return a.tagService.GetTags()
}

// GetTagGroups 获取所有标签分组
func (a *App) GetTagGroups() ([]models.TagGroup, error) {
	return a.tagService.GetTagGroups()
}

// GetTagsByGroup 根据分组获取标签
func (a *App) GetTagsByGroup(groupID string) ([]models.Tag, error) {
	return a.tagService.GetTagsByGroup(groupID)
}

// SearchTags 搜索标签
func (a *App) SearchTags(query models.TagSearchQuery) ([]models.TagWithStats, error) {
	return a.tagService.SearchTags(query)
}

// CreateTag 创建标签
func (a *App) CreateTag(name, description, color, groupID string) (*models.Tag, error) {
	return a.tagService.CreateTag(name, description, color, groupID)
}

// UpdateTag 更新标签
func (a *App) UpdateTag(tag models.Tag) error {
	return a.tagService.UpdateTag(tag)
}

// DeleteTag 删除标签
func (a *App) DeleteTag(id string) error {
	return a.tagService.DeleteTag(id)
}

// CreateTagGroup 创建标签分组
func (a *App) CreateTagGroup(name, description, color string, sortOrder int) (*models.TagGroup, error) {
	return a.tagService.CreateTagGroup(name, description, color, sortOrder)
}

// UpdateTagGroup 更新标签分组
func (a *App) UpdateTagGroup(group models.TagGroup) error {
	return a.tagService.UpdateTagGroup(group)
}

// DeleteTagGroup 删除标签分组
func (a *App) DeleteTagGroup(id string) error {
	return a.tagService.DeleteTagGroup(id)
}

// GetTagsForItem 获取条目的标签
func (a *App) GetTagsForItem(itemID string) ([]models.Tag, error) {
	return a.tagService.GetTagsForItem(itemID)
}

// UpdateItemTags 更新条目标签
func (a *App) UpdateItemTags(itemID string, tagNames []string, source string) error {
	return a.tagService.UpdateItemTags(itemID, tagNames, source)
}

// AddTagsToItem 为条目添加标签
func (a *App) AddTagsToItem(itemID string, tagNames []string) error {
	return a.tagService.AddTagsToItem(itemID, tagNames)
}

// RemoveTagsFromItem 从条目移除标签
func (a *App) RemoveTagsFromItem(itemID string, tagNames []string) error {
	return a.tagService.RemoveTagsFromItem(itemID, tagNames)
}

// GetTagStatistics 获取标签统计信息
func (a *App) GetTagStatistics() (models.TagStatistics, error) {
	return a.tagService.GetTagStatistics()
}

// GetMostUsedTags 获取最常用标签
func (a *App) GetMostUsedTags(limit int) ([]models.TagWithStats, error) {
	return a.tagService.GetMostUsedTags(limit)
}

// GetRecentTags 获取最近使用标签
func (a *App) GetRecentTags(limit int) ([]models.TagWithStats, error) {
	return a.tagService.GetRecentTags(limit)
}

// SuggestTags 建议标签
func (a *App) SuggestTags(content string, limit int) ([]string, error) {
	return a.tagService.SuggestTags(content, limit)
}

// AutoGenerateTags 自动生成标签
func (a *App) AutoGenerateTags(content, contentType string) ([]string, error) {
	return a.tagService.AutoGenerateTags(content, contentType)
}

// CleanupUnusedTags 清理未使用标签
func (a *App) CleanupUnusedTags() error {
	return a.tagService.CleanupUnusedTags()
}

// MergeTags 合并标签
func (a *App) MergeTags(sourceTagName, targetTagName string) error {
	return a.tagService.MergeTags(sourceTagName, targetTagName)
}

// GetSimilarTags 获取相似标签
func (a *App) GetSimilarTags(tagName string, limit int) ([]models.Tag, error) {
	return a.tagService.GetSimilarTags(tagName, limit)
}

// SendChatMessageStream 发送流式聊天消息（Wails 原生版本）
func (a *App) SendChatMessageStream(sessionID, message string) error {
	log.Printf("🔄 开始流式聊天处理: sessionID=%s, message=%s", sessionID, message)
	
	// 导入 runtime 包需要在文件开头添加
	// "github.com/wailsapp/wails/v2/pkg/runtime"
	
	// 使用 chatService 的流式方法
	err := a.chatService.SendMessageStream(a.ctx, sessionID, message, func(response *models.StreamResponse) {
		// 临时注释掉 runtime 调用，稍后修复
		log.Printf("📤 发送事件: type=%s", response.Type)
		
		// TODO: 添加 runtime.EventsEmit 调用
		// runtime.EventsEmit(a.ctx, "chat:stream:message", ...)
	})
	
	if err != nil {
		log.Printf("❌ 流式聊天处理失败: %v", err)
		return err
	}
	
	log.Printf("✅ 流式聊天处理完成")
	return nil
}
