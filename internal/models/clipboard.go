package models

import "time"

// ClipboardItem 剪切板条目模型
type ClipboardItem struct {
	ID          string     `json:"id" db:"id"`
	Content     string     `json:"content" db:"content"`
	ContentType string     `json:"content_type" db:"content_type"` // text, image, file, url
	Title       string     `json:"title" db:"title"`
	Tags        []string   `json:"tags" db:"tags"`
	Category    string     `json:"category" db:"category"`
	IsFavorite  bool       `json:"is_favorite" db:"is_favorite"`
	UseCount    int        `json:"use_count" db:"use_count"`
	IsDeleted   bool       `json:"is_deleted" db:"is_deleted"`
	DeletedAt   *time.Time `json:"deleted_at" db:"deleted_at"`
	CreatedAt   time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at" db:"updated_at"`
	LastUsedAt  time.Time  `json:"last_used_at" db:"last_used_at"`
}

// SearchQuery 搜索查询参数
type SearchQuery struct {
	Query    string   `json:"query"`
	Category string   `json:"category"`
	Tags     []string `json:"tags"`
	Type     string   `json:"type"`
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
	TypeStats     map[string]int  `json:"type_stats"`
	CategoryStats map[string]int  `json:"category_stats"`
	TopTags       []TagStat       `json:"top_tags"`
	RecentItems   []ClipboardItem `json:"recent_items"`
}

// TagStat 标签统计
type TagStat struct {
	Tag   string `json:"tag"`
	Count int    `json:"count"`
}

// ContentType 内容类型常量
const (
	ContentTypeText     = "text"
	ContentTypeURL      = "url"
	ContentTypeEmail    = "email"
	ContentTypePhone    = "phone"
	ContentTypeFile     = "file"
	ContentTypePassword = "password"
)

// Category 分类常量
const (
	CategoryDefault  = "未分类"
	CategoryURL      = "网址"
	CategoryFile     = "文件"
	CategoryEmail    = "邮箱"
	CategoryPhone    = "电话"
	CategoryPassword = "密码"
	CategoryCode     = "代码"
	CategoryNote     = "笔记"
)