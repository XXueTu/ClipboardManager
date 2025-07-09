package models

import "time"

// ClipboardItem 剪切板条目模型
type ClipboardItem struct {
	ID          string     `json:"id" db:"id"`
	Content     string     `json:"content" db:"content"`
	ContentType string     `json:"content_type" db:"content_type"`
	Title       string     `json:"title" db:"title"`
	Tags        []Tag      `json:"tags,omitempty"` // 通过关联查询获取的标签
	Category    string     `json:"category" db:"category"`
	IsFavorite  bool       `json:"is_favorite" db:"is_favorite"`
	UseCount    int        `json:"use_count" db:"use_count"`
	IsDeleted   bool       `json:"is_deleted" db:"is_deleted"`
	DeletedAt   *time.Time `json:"deleted_at" db:"deleted_at"`
	CreatedAt   time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at" db:"updated_at"`
	LastUsedAt  time.Time  `json:"last_used_at" db:"last_used_at"`
}

// GetTagNames 获取标签名称列表
func (c *ClipboardItem) GetTagNames() []string {
	if c.Tags == nil {
		return []string{}
	}
	
	names := make([]string, len(c.Tags))
	for i, tag := range c.Tags {
		names[i] = tag.Name
	}
	return names
}

// SearchQuery 搜索查询参数
type SearchQuery struct {
	Query    string   `json:"query"`
	Category string   `json:"category"`
	Tags     []string `json:"tags"`     // 标签名称列表
	TagMode  string   `json:"tag_mode"` // all, any, none
	Limit    int      `json:"limit"`
	Offset   int      `json:"offset"`
}

// SearchResult 搜索结果
type SearchResult struct {
	Items      []ClipboardItem `json:"items"`
	Total      int             `json:"total"`
	Page       int             `json:"page"`
	PageSize   int             `json:"page_size"`
	TotalPages int             `json:"total_pages"`
}

// Statistics 统计信息
type Statistics struct {
	TotalItems    int             `json:"total_items"`
	TodayItems    int             `json:"today_items"`
	WeekItems     int             `json:"week_items"`
	MonthItems    int             `json:"month_items"`
	CategoryStats map[string]int  `json:"category_stats"`
	TopTags       []TagStat       `json:"top_tags"`
	RecentItems   []ClipboardItem `json:"recent_items"`
}

// Tag 标签模型
type Tag struct {
	ID          string    `json:"id" db:"id"`
	Name        string    `json:"name" db:"name"`
	Description string    `json:"description" db:"description"`
	Color       string    `json:"color" db:"color"`
	GroupID     string    `json:"group_id" db:"group_id"`
	UseCount    int       `json:"use_count" db:"use_count"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
	LastUsedAt  time.Time `json:"last_used_at" db:"last_used_at"`
}

// TagStat 标签统计
type TagStat struct {
	Tag   string `json:"tag"`
	Count int    `json:"count"`
}

// TagGroup 标签分组
type TagGroup struct {
	ID          string    `json:"id" db:"id"`
	Name        string    `json:"name" db:"name"`
	Description string    `json:"description" db:"description"`
	Color       string    `json:"color" db:"color"`
	SortOrder   int       `json:"sort_order" db:"sort_order"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}

// TagWithStats 带统计信息的标签
type TagWithStats struct {
	Tag
	ItemCount int `json:"item_count"`
}

// TagSearchQuery 标签搜索查询
type TagSearchQuery struct {
	Query     string `json:"query"`
	GroupID   string `json:"group_id"`
	SortBy    string `json:"sort_by"`    // name, use_count, created_at, last_used_at
	SortOrder string `json:"sort_order"` // asc, desc
	Limit     int    `json:"limit"`
	Offset    int    `json:"offset"`
}

// TagStatistics 标签统计信息
type TagStatistics struct {
	TotalTags     int            `json:"total_tags"`
	MostUsedTags  []TagWithStats `json:"most_used_tags"`
	RecentTags    []TagWithStats `json:"recent_tags"`
	TagGroups     []TagGroup     `json:"tag_groups"`
	UnusedTags    []Tag          `json:"unused_tags"`
}

// CategoryTagsResponse 分类和标签响应
type CategoryTagsResponse struct {
	Categories []string `json:"categories"`
	Tags       []string `json:"tags"`
}

// Category 分类常量
const (
	CategoryText   = "文本"
	CategoryFile   = "文件"
	CategoryURL    = "网站"
	CategoryPath   = "路径"
	CategoryEmail  = "邮箱"
	CategoryNumber = "数字"
)

// GetAllCategories 获取所有分类
func GetAllCategories() []string {
	return []string{
		CategoryText,
		CategoryFile,
		CategoryURL,
		CategoryPath,
		CategoryEmail,
		CategoryNumber,
	}
}