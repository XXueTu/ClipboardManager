package service

import (
	"context"
	"log"
	"strings"
	"unicode/utf8"

	clipboardLib "golang.design/x/clipboard"

	"Sid/internal/clipboard"
	"Sid/internal/models"
	"Sid/internal/repository"
)

// ClipboardService 剪切板服务接口
type ClipboardService interface {
	// 基础CRUD操作
	GetItems(limit, offset int) ([]models.ClipboardItem, error)
	GetItem(id string) (*models.ClipboardItem, error)
	CreateItem(content string) error
	UpdateItem(item models.ClipboardItem) error
	DeleteItem(id string) error
	UseItem(id string) error

	// 搜索功能
	SearchItems(query models.SearchQuery) (models.SearchResult, error)

	// 回收站管理
	GetTrashItems(limit, offset int) ([]models.ClipboardItem, error)
	RestoreItem(id string) error
	PermanentDeleteItem(id string) error
	BatchPermanentDelete(ids []string) error
	EmptyTrash() error

	// 统计信息
	GetStatistics() (models.Statistics, error)

	// 分类和标签
	GetCategoriesAndTags() (models.CategoryTagsResponse, error)

	// 监听控制
	StartMonitoring() error
	StopMonitoring()
	IsMonitoring() bool

	// AI功能
	GenerateTagsForItem(ctx context.Context, id string) ([]string, error)
}

// clipboardService 剪切板服务实现
type clipboardService struct {
	repo        repository.ClipboardRepository
	monitor     clipboard.Monitor
	itemBuilder *clipboard.ItemBuilder
	settings    *models.Settings
	chatService ChatService
	tagService  TagService
}

// NewClipboardService 创建新的剪切板服务
func NewClipboardService(repo repository.ClipboardRepository, settings *models.Settings, chatService ChatService, tagService TagService) ClipboardService {
	analyzer := clipboard.NewAnalyzer()
	monitor := clipboard.NewMonitor(settings)
	itemBuilder := clipboard.NewItemBuilder(analyzer, settings)

	service := &clipboardService{
		repo:        repo,
		monitor:     monitor,
		itemBuilder: itemBuilder,
		settings:    settings,
		chatService: chatService,
		tagService:  tagService,
	}

	// 设置监听器的内容处理器
	monitor.SetProcessor(service)

	return service
}

// ProcessContent 实现ContentProcessor接口，处理剪切板内容
func (s *clipboardService) ProcessContent(content string) error {
	// 确保内容是有效的UTF-8字符串，如果不是则尝试修复
	if !isValidUTF8(content) {
		log.Println("⚠️  检测到非UTF-8内容，尝试修复...")
		content = fixUTF8String(content)
		if content == "" {
			log.Println("❌ 无法修复UTF-8内容，跳过")
			return nil
		}
		log.Println("✅ UTF-8内容修复成功")
	}

	// 检查是否重复内容
	isDuplicate, err := s.repo.IsDuplicateContent(content)
	if err != nil {
		return err
	}
	if isDuplicate {
		log.Println("🔄 内容已存在，跳过")
		return nil
	}

	// 构建剪切板条目
	item := s.itemBuilder.BuildItem(content)

	// 保存到数据库
	if err := s.repo.Create(item); err != nil {
		log.Printf("❌ 保存剪切板条目失败: %v", err)
		return err
	}

	log.Printf("✅ 保存剪切板条目: %s", item.Title)
	return nil
}

// GetItems 获取剪切板条目列表
func (s *clipboardService) GetItems(limit, offset int) ([]models.ClipboardItem, error) {
	return s.repo.List(limit, offset)
}

// GetItem 获取单个剪切板条目
func (s *clipboardService) GetItem(id string) (*models.ClipboardItem, error) {
	return s.repo.GetByID(id)
}

// CreateItem 创建新的剪切板条目
func (s *clipboardService) CreateItem(content string) error {
	item := s.itemBuilder.BuildItem(content)
	return s.repo.Create(item)
}

// UpdateItem 更新剪切板条目
func (s *clipboardService) UpdateItem(item models.ClipboardItem) error {
	return s.repo.Update(item)
}

// DeleteItem 删除剪切板条目（软删除）
func (s *clipboardService) DeleteItem(id string) error {
	return s.repo.SoftDelete(id)
}

// UseItem 使用剪切板条目
func (s *clipboardService) UseItem(id string) error {
	// 获取条目内容
	item, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}

	// 复制到剪切板
	clipboardLib.Write(clipboardLib.FmtText, []byte(item.Content))

	// 更新使用次数和最后使用时间
	return s.repo.UseItem(id)
}

// SearchItems 搜索剪切板条目
func (s *clipboardService) SearchItems(query models.SearchQuery) (models.SearchResult, error) {
	return s.repo.Search(query)
}

// GetTrashItems 获取回收站条目
func (s *clipboardService) GetTrashItems(limit, offset int) ([]models.ClipboardItem, error) {
	return s.repo.GetTrashItems(limit, offset)
}

// RestoreItem 恢复剪切板条目
func (s *clipboardService) RestoreItem(id string) error {
	return s.repo.Restore(id)
}

// PermanentDeleteItem 永久删除剪切板条目
func (s *clipboardService) PermanentDeleteItem(id string) error {
	return s.repo.PermanentDelete(id)
}

// BatchPermanentDelete 批量永久删除
func (s *clipboardService) BatchPermanentDelete(ids []string) error {
	return s.repo.BatchPermanentDelete(ids)
}

// EmptyTrash 清空回收站
func (s *clipboardService) EmptyTrash() error {
	return s.repo.EmptyTrash()
}

// GetStatistics 获取统计信息
func (s *clipboardService) GetStatistics() (models.Statistics, error) {
	stats, err := s.repo.GetStatistics()
	if err != nil {
		return stats, err
	}

	// 获取最近条目
	recentItems, _ := s.repo.List(5, 0)
	stats.RecentItems = recentItems

	return stats, nil
}

// StartMonitoring 开始监听剪切板
func (s *clipboardService) StartMonitoring() error {
	if !s.settings.AutoCapture {
		return nil
	}
	return s.monitor.Start()
}

// StopMonitoring 停止监听剪切板
func (s *clipboardService) StopMonitoring() {
	s.monitor.Stop()
}

// IsMonitoring 检查是否正在监听
func (s *clipboardService) IsMonitoring() bool {
	return s.monitor.IsRunning()
}

// UpdateSettings 更新设置（用于动态调整监听行为）
func (s *clipboardService) UpdateSettings(settings *models.Settings) {
	s.settings = settings
	s.itemBuilder = clipboard.NewItemBuilder(clipboard.NewAnalyzer(), settings)

	// 根据新设置调整监听状态
	if settings.AutoCapture && !s.monitor.IsRunning() {
		s.monitor.Start()
	} else if !settings.AutoCapture && s.monitor.IsRunning() {
		s.monitor.Stop()
	}
}

// GenerateTagsForItem 为剪切板条目生成AI标签
func (s *clipboardService) GenerateTagsForItem(ctx context.Context, id string) ([]string, error) {
	// 获取条目
	item, err := s.repo.GetByID(id)
	if err != nil {
		log.Printf("❌ 获取剪切板条目失败: %v", err)
		return nil, err
	}

	// 使用AI生成标签
	tags, err := s.chatService.GenerateTags(ctx, item.Content)
	if err != nil {
		log.Printf("❌ AI标签生成失败: %v", err)
		return nil, err
	}

	// 获取现有标签名称
	existingTagNames := make(map[string]bool)
	for _, tag := range item.Tags {
		existingTagNames[tag.Name] = true
	}

	// 筛选出新标签
	var newTagNames []string
	for _, tagName := range tags {
		if !existingTagNames[tagName] {
			newTagNames = append(newTagNames, tagName)
		}
	}

	// 通过标签服务添加新标签（这会处理标签关联）
	if len(newTagNames) > 0 {
		// 获取所有标签名称（现有 + 新增）
		allTagNames := make([]string, 0, len(item.Tags)+len(newTagNames))
		for _, tag := range item.Tags {
			allTagNames = append(allTagNames, tag.Name)
		}
		allTagNames = append(allTagNames, newTagNames...)

		// 更新条目标签关联
		if err := s.tagService.UpdateItemTags(item.ID, allTagNames, "ai-generated"); err != nil {
			log.Printf("❌ 更新条目标签失败: %v", err)
			return nil, err
		}
	}

	log.Printf("✅ 为条目 %s 生成了 %d 个新标签", item.Title, len(newTagNames))
	return newTagNames, nil
}

// GetCategoriesAndTags 获取分类和标签列表
func (s *clipboardService) GetCategoriesAndTags() (models.CategoryTagsResponse, error) {
	categories, err := s.repo.GetAllCategories()
	if err != nil {
		return models.CategoryTagsResponse{}, err
	}

	tags, err := s.repo.GetAllTags()
	if err != nil {
		return models.CategoryTagsResponse{}, err
	}

	return models.CategoryTagsResponse{
		Categories: categories,
		Tags:       tags,
	}, nil
}

// isValidUTF8 检查字符串是否为有效的UTF-8编码
func isValidUTF8(s string) bool {
	return utf8.ValidString(s)
}

// fixUTF8String 尝试修复非UTF-8字符串
func fixUTF8String(s string) string {
	if utf8.ValidString(s) {
		return s
	}

	// 方法1: 使用 strings.ToValidUTF8 替换无效字符
	fixed := strings.ToValidUTF8(s, "�")
	if fixed != "" && !strings.Contains(fixed, "�") {
		return fixed
	}

	// 方法2: 逐字符检查并重建字符串
	var builder strings.Builder
	for _, r := range s {
		if r != utf8.RuneError {
			_, _ = builder.WriteRune(r) // 忽略错误，因为 WriteRune 在这种情况下不会失败
		}
	}
	
	result := builder.String()
	if result != "" {
		return result
	}

	// 方法3: 如果前面的方法都失败，尝试从字节层面修复
	bytes := []byte(s)
	var validBytes []byte
	for len(bytes) > 0 {
		r, size := utf8.DecodeRune(bytes)
		if r != utf8.RuneError || size != 1 {
			validBytes = append(validBytes, bytes[:size]...)
		}
		bytes = bytes[size:]
	}
	
	return string(validBytes)
}
