package service

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/cloudwego/eino/schema"

	model "react-wails-app/internal/agent"
	"react-wails-app/internal/models"
	"react-wails-app/internal/repository"
)

// TagService 标签服务接口
type TagService interface {
	// 标签分组管理
	CreateTagGroup(name, description, color string, sortOrder int) (*models.TagGroup, error)
	GetTagGroups() ([]models.TagGroup, error)
	UpdateTagGroup(group models.TagGroup) error
	DeleteTagGroup(id string) error

	// 标签管理
	CreateTag(name, description, color, groupID string) (*models.Tag, error)
	GetTags() ([]models.Tag, error)
	GetTagsByGroup(groupID string) ([]models.Tag, error)
	SearchTags(query models.TagSearchQuery) ([]models.TagWithStats, error)
	UpdateTag(tag models.Tag) error
	DeleteTag(id string) error
	GetOrCreateTagByName(name string, source string) (*models.Tag, error)

	// 智能标签处理
	ProcessClipboardItemTags(item *models.ClipboardItem) ([]string, error)
	AutoGenerateTags(content, contentType string) ([]string, error)
	SuggestTags(content string, limit int) ([]string, error)

	// 标签关联管理
	AddTagsToItem(itemID string, tagNames []string) error
	RemoveTagsFromItem(itemID string, tagNames []string) error
	GetTagsForItem(itemID string) ([]models.Tag, error)
	UpdateItemTags(itemID string, tagNames []string, source string) error

	// 统计和分析
	GetTagStatistics() (models.TagStatistics, error)
	GetMostUsedTags(limit int) ([]models.TagWithStats, error)
	GetRecentTags(limit int) ([]models.TagWithStats, error)
	GetSimilarTags(tagName string, limit int) ([]models.Tag, error)

	// 标签清理和维护
	CleanupUnusedTags() error
	MergeTags(sourceTagName, targetTagName string) error
	ValidateTagName(name string) error
}

// tagService 标签服务实现
type tagService struct {
	tagRepo       repository.TagRepository
	clipboardRepo repository.ClipboardRepository
}

// NewTagService 创建新的标签服务
func NewTagService(tagRepo repository.TagRepository, clipboardRepo repository.ClipboardRepository) TagService {
	return &tagService{
		tagRepo:       tagRepo,
		clipboardRepo: clipboardRepo,
	}
}

// CreateTagGroup 创建标签分组
func (s *tagService) CreateTagGroup(name, description, color string, sortOrder int) (*models.TagGroup, error) {
	if name == "" {
		return nil, fmt.Errorf("标签分组名称不能为空")
	}

	group := models.TagGroup{
		ID:          fmt.Sprintf("group-%d", time.Now().UnixNano()),
		Name:        name,
		Description: description,
		Color:       color,
		SortOrder:   sortOrder,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	if group.Color == "" {
		group.Color = "#1890ff"
	}

	err := s.tagRepo.CreateTagGroup(group)
	if err != nil {
		return nil, err
	}

	return &group, nil
}

// GetTagGroups 获取所有标签分组
func (s *tagService) GetTagGroups() ([]models.TagGroup, error) {
	return s.tagRepo.GetTagGroups()
}

// UpdateTagGroup 更新标签分组
func (s *tagService) UpdateTagGroup(group models.TagGroup) error {
	if group.Name == "" {
		return fmt.Errorf("标签分组名称不能为空")
	}
	return s.tagRepo.UpdateTagGroup(group)
}

// DeleteTagGroup 删除标签分组
func (s *tagService) DeleteTagGroup(id string) error {
	// 检查分组是否存在
	_, err := s.tagRepo.GetTagGroupByID(id)
	if err != nil {
		return err
	}
	return s.tagRepo.DeleteTagGroup(id)
}

// CreateTag 创建标签
func (s *tagService) CreateTag(name, description, color, groupID string) (*models.Tag, error) {
	if err := s.ValidateTagName(name); err != nil {
		return nil, err
	}

	// 检查标签是否已存在
	existingTag, _ := s.tagRepo.GetTagByName(name)
	if existingTag != nil {
		return nil, fmt.Errorf("标签 '%s' 已存在", name)
	}

	tag := models.Tag{
		ID:          fmt.Sprintf("tag-%d", time.Now().UnixNano()),
		Name:        name,
		Description: description,
		Color:       color,
		GroupID:     groupID,
		UseCount:    0,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
		LastUsedAt:  time.Now(),
	}

	if tag.Color == "" {
		tag.Color = "#1890ff"
	}

	if tag.GroupID == "" {
		tag.GroupID = "user-custom"
	}

	err := s.tagRepo.CreateTag(tag)
	if err != nil {
		return nil, err
	}

	return &tag, nil
}

// GetTags 获取所有标签
func (s *tagService) GetTags() ([]models.Tag, error) {
	return s.tagRepo.GetTags()
}

// GetTagsByGroup 根据分组获取标签
func (s *tagService) GetTagsByGroup(groupID string) ([]models.Tag, error) {
	return s.tagRepo.GetTagsByGroup(groupID)
}

// SearchTags 搜索标签
func (s *tagService) SearchTags(query models.TagSearchQuery) ([]models.TagWithStats, error) {
	// 设置默认分页参数
	if query.Limit <= 0 {
		query.Limit = 50
	}
	if query.SortBy == "" {
		query.SortBy = "use_count"
	}
	if query.SortOrder == "" {
		query.SortOrder = "desc"
	}

	return s.tagRepo.SearchTags(query)
}

// UpdateTag 更新标签
func (s *tagService) UpdateTag(tag models.Tag) error {
	if err := s.ValidateTagName(tag.Name); err != nil {
		return err
	}

	// 检查标签是否存在
	_, err := s.tagRepo.GetTagByID(tag.ID)
	if err != nil {
		return err
	}

	return s.tagRepo.UpdateTag(tag)
}

// DeleteTag 删除标签
func (s *tagService) DeleteTag(id string) error {
	// 检查标签是否存在
	_, err := s.tagRepo.GetTagByID(id)
	if err != nil {
		return err
	}

	return s.tagRepo.DeleteTag(id)
}

// GetOrCreateTagByName 根据名称获取或创建标签
func (s *tagService) GetOrCreateTagByName(name string, source string) (*models.Tag, error) {
	if err := s.ValidateTagName(name); err != nil {
		return nil, err
	}
	return s.tagRepo.GetOrCreateTag(name, source)
}

// ProcessClipboardItemTags 处理剪切板条目标签
func (s *tagService) ProcessClipboardItemTags(item *models.ClipboardItem) ([]string, error) {
	// 自动生成标签
	autoTags, err := s.AutoGenerateTags(item.Content, item.ContentType)
	if err != nil {
		return nil, err
	}

	// 合并现有标签和自动生成的标签
	tagMap := make(map[string]bool)

	// 添加现有标签（从关联表中获取的标签名称）
	for _, tag := range item.Tags {
		if tag.Name != "" {
			tagMap[tag.Name] = true
		}
	}

	// 添加自动生成的标签
	for _, tag := range autoTags {
		if tag != "" {
			tagMap[tag] = true
		}
	}

	// 转换为切片
	var tags []string
	for tag := range tagMap {
		tags = append(tags, tag)
	}

	return tags, nil
}

// AutoGenerateTags 自动生成标签 - 使用AI生成
func (s *tagService) AutoGenerateTags(content, contentType string) ([]string, error) {
	// 使用AI生成标签
	ctx := context.Background()
	chatModel, err := model.NewChatModel(ctx)
	if err != nil {
		// 如果AI不可用，使用简单的备用逻辑
		return s.generateFallbackTags(content, contentType), nil
	}

	input := []*schema.Message{
		{Role: "user", Content: content},
	}

	tagsPrompt, err := model.ChatPromptLabel(ctx, input)
	if err != nil {
		return s.generateFallbackTags(content, contentType), nil
	}

	response, err := chatModel.Generate(ctx, tagsPrompt)
	if err != nil {
		return s.generateFallbackTags(content, contentType), nil
	}

	// 解析JSON响应
	var result struct {
		Tags []string `json:"tags"`
	}
	if err := json.Unmarshal([]byte(response.Content), &result); err != nil {
		return s.generateFallbackTags(content, contentType), nil
	}

	// 确保AI生成的标签在数据库中存在
	var finalTags []string
	for _, tagName := range result.Tags {
		if tagName == "" {
			continue
		}

		// 获取或创建标签
		tag, err := s.GetOrCreateTagByName(tagName, "ai-generated")
		if err != nil {
			continue // 跳过创建失败的标签
		}

		finalTags = append(finalTags, tag.Name)
	}

	return finalTags, nil
}

// generateFallbackTags 备用标签生成逻辑（简化版）
func (s *tagService) generateFallbackTags(content, contentType string) []string {
	// 基于内容类型的基础标签
	var typeTag string
	switch contentType {
	case "url":
		typeTag = "链接"
	case "email":
		typeTag = "邮箱"
	case "phone":
		typeTag = "电话"
	case "file":
		typeTag = "路径"
	case "code":
		typeTag = "代码"
	case "json":
		typeTag = "数据"
	default:
		typeTag = "文本"
	}

	// 基于内容长度的使用意图标签
	var intentTag string
	if len(content) < 100 {
		intentTag = "临时"
	} else {
		intentTag = "保存"
	}

	// 通用应用领域标签
	domainTag := "其他"

	return []string{typeTag, domainTag, intentTag}
}

// SuggestTags 建议标签
func (s *tagService) SuggestTags(content string, limit int) ([]string, error) {
	// 获取最常用的标签作为建议
	mostUsedTags, err := s.GetMostUsedTags(limit * 2)
	if err != nil {
		return nil, err
	}

	var suggestions []string

	// 基于内容匹配相关标签
	for _, tagStat := range mostUsedTags {
		if len(suggestions) >= limit {
			break
		}

		// 简单的关键词匹配
		tagName := tagStat.Name
		if contains(content, tagName) || containsSimilar(content, tagName) {
			suggestions = append(suggestions, tagName)
		}
	}

	// 如果建议不够，尝试从最常用标签中补充
	if len(suggestions) < limit {
		for _, tagStat := range mostUsedTags {
			if len(suggestions) >= limit {
				break
			}
			tagName := tagStat.Name
			if !containsString(suggestions, tagName) {
				suggestions = append(suggestions, tagName)
			}
		}
	}

	return suggestions, nil
}

// AddTagsToItem 为条目添加标签
func (s *tagService) AddTagsToItem(itemID string, tagNames []string) error {
	for _, tagName := range tagNames {
		// 获取或创建标签
		tag, err := s.GetOrCreateTagByName(tagName, "user-custom")
		if err != nil {
			return err
		}

		// 添加关联
		err = s.tagRepo.AddTagToItem(itemID, tag.ID)
		if err != nil {
			return err
		}

		// 增加使用次数
		err = s.tagRepo.IncrementTagUsage(tag.ID)
		if err != nil {
			return err
		}
	}

	return nil
}

// RemoveTagsFromItem 从条目移除标签
func (s *tagService) RemoveTagsFromItem(itemID string, tagNames []string) error {
	for _, tagName := range tagNames {
		tag, err := s.tagRepo.GetTagByName(tagName)
		if err != nil {
			continue // 标签不存在，跳过
		}

		err = s.tagRepo.RemoveTagFromItem(itemID, tag.ID)
		if err != nil {
			return err
		}
	}

	return nil
}

// GetTagsForItem 获取条目的标签
func (s *tagService) GetTagsForItem(itemID string) ([]models.Tag, error) {
	return s.tagRepo.GetTagsForItem(itemID)
}

// UpdateItemTags 更新条目标签
func (s *tagService) UpdateItemTags(itemID string, tagNames []string, source string) error {
	// 获取或创建所有标签
	var tagIDs []string
	for _, tagName := range tagNames {
		if tagName == "" {
			continue
		}

		tag, err := s.GetOrCreateTagByName(tagName, source)
		if err != nil {
			return err
		}

		tagIDs = append(tagIDs, tag.ID)

		// 增加使用次数
		err = s.tagRepo.IncrementTagUsage(tag.ID)
		if err != nil {
			return err
		}
	}

	// 批量更新关联
	return s.tagRepo.BatchUpdateItemTags(itemID, tagIDs)
}

// GetTagStatistics 获取标签统计信息
func (s *tagService) GetTagStatistics() (models.TagStatistics, error) {
	return s.tagRepo.GetTagStatistics()
}

// GetMostUsedTags 获取最常用标签
func (s *tagService) GetMostUsedTags(limit int) ([]models.TagWithStats, error) {
	if limit <= 0 {
		limit = 10
	}
	return s.tagRepo.GetMostUsedTags(limit)
}

// GetRecentTags 获取最近使用标签
func (s *tagService) GetRecentTags(limit int) ([]models.TagWithStats, error) {
	if limit <= 0 {
		limit = 10
	}
	return s.tagRepo.GetRecentTags(limit)
}

// GetSimilarTags 获取相似标签
func (s *tagService) GetSimilarTags(tagName string, limit int) ([]models.Tag, error) {
	// 简单的相似性匹配，可以扩展为更复杂的算法
	query := models.TagSearchQuery{
		Query:  tagName,
		Limit:  limit * 2, // 获取更多结果进行筛选
		SortBy: "use_count",
	}

	tagsWithStats, err := s.tagRepo.SearchTags(query)
	if err != nil {
		return nil, err
	}

	var similarTags []models.Tag
	for _, tagStat := range tagsWithStats {
		if len(similarTags) >= limit {
			break
		}

		if tagStat.Name != tagName && isSimilar(tagStat.Name, tagName) {
			similarTags = append(similarTags, tagStat.Tag)
		}
	}

	return similarTags, nil
}

// CleanupUnusedTags 清理未使用标签
func (s *tagService) CleanupUnusedTags() error {
	return s.tagRepo.CleanupUnusedTags()
}

// MergeTags 合并标签
func (s *tagService) MergeTags(sourceTagName, targetTagName string) error {
	sourceTag, err := s.tagRepo.GetTagByName(sourceTagName)
	if err != nil {
		return fmt.Errorf("源标签不存在: %s", sourceTagName)
	}

	targetTag, err := s.tagRepo.GetTagByName(targetTagName)
	if err != nil {
		return fmt.Errorf("目标标签不存在: %s", targetTagName)
	}

	// 标签合并检查通过

	return s.tagRepo.MergeTags(sourceTag.ID, targetTag.ID)
}

// ValidateTagName 验证标签名称
func (s *tagService) ValidateTagName(name string) error {
	if name == "" {
		return fmt.Errorf("标签名称不能为空")
	}

	if len(name) > 50 {
		return fmt.Errorf("标签名称不能超过50个字符")
	}

	// 检查特殊字符
	invalidChars := []string{"/", "\\", "?", "%", "*", ":", "|", "\"", "<", ">"}
	for _, char := range invalidChars {
		if contains(name, char) {
			return fmt.Errorf("标签名称不能包含特殊字符: %s", char)
		}
	}

	return nil
}

// 辅助函数
func contains(s, substr string) bool {
	return len(substr) > 0 && len(s) >= len(substr) &&
		(s == substr || findInString(s, substr))
}

func containsString(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}

func findInString(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}

func containsSimilar(content, tag string) bool {
	// 简单的相似性检查，可以扩展
	return contains(content, tag) || contains(tag, content)
}

func isSimilar(tag1, tag2 string) bool {
	// 简单的相似性算法，可以用更复杂的算法替换
	if len(tag1) == 0 || len(tag2) == 0 {
		return false
	}

	// 检查是否有共同的子字符串
	for i := 0; i < len(tag1)-1; i++ {
		for j := i + 2; j <= len(tag1); j++ {
			substr := tag1[i:j]
			if len(substr) >= 2 && contains(tag2, substr) {
				return true
			}
		}
	}

	return false
}
