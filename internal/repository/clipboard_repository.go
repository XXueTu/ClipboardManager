package repository

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"react-wails-app/internal/models"
)

// ClipboardRepository 剪切板数据仓库接口
type ClipboardRepository interface {
	Create(item models.ClipboardItem) error
	GetByID(id string) (*models.ClipboardItem, error)
	List(limit, offset int) ([]models.ClipboardItem, error)
	Update(item models.ClipboardItem) error
	SoftDelete(id string) error
	PermanentDelete(id string) error
	BatchPermanentDelete(ids []string) error
	Restore(id string) error
	Search(query models.SearchQuery) (models.SearchResult, error)
	GetTrashItems(limit, offset int) ([]models.ClipboardItem, error)
	EmptyTrash() error
	GetStatistics() (models.Statistics, error)
	IsDuplicateContent(content string) (bool, error)
	UseItem(id string) error
}

// clipboardRepository 剪切板数据仓库实现
type clipboardRepository struct {
	db *sql.DB
}

// NewClipboardRepository 创建新的剪切板数据仓库
func NewClipboardRepository(db *sql.DB) ClipboardRepository {
	return &clipboardRepository{db: db}
}

// Create 创建新的剪切板条目
func (r *clipboardRepository) Create(item models.ClipboardItem) error {
	tagsJSON, _ := json.Marshal(item.Tags)

	query := `
	INSERT INTO clipboard_items (id, content, content_type, title, tags, category, is_favorite, use_count, is_deleted, deleted_at, created_at, updated_at, last_used_at)
	VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	_, err := r.db.Exec(query, item.ID, item.Content, item.ContentType, item.Title, string(tagsJSON),
		item.Category, item.IsFavorite, item.UseCount, item.IsDeleted, item.DeletedAt, item.CreatedAt, item.UpdatedAt, item.LastUsedAt)

	return err
}

// GetByID 根据ID获取剪切板条目
func (r *clipboardRepository) GetByID(id string) (*models.ClipboardItem, error) {
	query := `
	SELECT id, content, content_type, title, tags, category, is_favorite, use_count, is_deleted, deleted_at, created_at, updated_at, last_used_at
	FROM clipboard_items
	WHERE id = ?
	`

	var item models.ClipboardItem
	var tagsJSON string

	err := r.db.QueryRow(query, id).Scan(&item.ID, &item.Content, &item.ContentType, &item.Title, &tagsJSON,
		&item.Category, &item.IsFavorite, &item.UseCount, &item.IsDeleted, &item.DeletedAt, &item.CreatedAt, &item.UpdatedAt, &item.LastUsedAt)

	if err != nil {
		return nil, err
	}

	json.Unmarshal([]byte(tagsJSON), &item.Tags)
	return &item, nil
}

// List 获取剪切板条目列表（仅活跃条目）
func (r *clipboardRepository) List(limit, offset int) ([]models.ClipboardItem, error) {
	query := `
	SELECT id, content, content_type, title, tags, category, is_favorite, use_count, is_deleted, deleted_at, created_at, updated_at, last_used_at
	FROM clipboard_items
	WHERE is_deleted = 0
	ORDER BY created_at DESC
	LIMIT ? OFFSET ?
	`

	rows, err := r.db.Query(query, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return r.scanItems(rows)
}

// GetTrashItems 获取回收站条目
func (r *clipboardRepository) GetTrashItems(limit, offset int) ([]models.ClipboardItem, error) {
	query := `
	SELECT id, content, content_type, title, tags, category, is_favorite, use_count, is_deleted, deleted_at, created_at, updated_at, last_used_at
	FROM clipboard_items
	WHERE is_deleted = 1
	ORDER BY deleted_at DESC
	LIMIT ? OFFSET ?
	`

	rows, err := r.db.Query(query, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return r.scanItems(rows)
}

// Update 更新剪切板条目
func (r *clipboardRepository) Update(item models.ClipboardItem) error {
	tagsJSON, _ := json.Marshal(item.Tags)
	item.UpdatedAt = time.Now()

	query := `
	UPDATE clipboard_items 
	SET content = ?, content_type = ?, title = ?, tags = ?, category = ?, is_favorite = ?, is_deleted = ?, deleted_at = ?, updated_at = ?
	WHERE id = ?
	`

	_, err := r.db.Exec(query, item.Content, item.ContentType, item.Title, string(tagsJSON),
		item.Category, item.IsFavorite, item.IsDeleted, item.DeletedAt, item.UpdatedAt, item.ID)

	return err
}

// SoftDelete 软删除剪切板条目
func (r *clipboardRepository) SoftDelete(id string) error {
	now := time.Now()
	query := `UPDATE clipboard_items SET is_deleted = 1, deleted_at = ?, updated_at = ? WHERE id = ?`
	_, err := r.db.Exec(query, now, now, id)
	return err
}

// PermanentDelete 永久删除剪切板条目
func (r *clipboardRepository) PermanentDelete(id string) error {
	query := `DELETE FROM clipboard_items WHERE id = ?`
	_, err := r.db.Exec(query, id)
	return err
}

// BatchPermanentDelete 批量永久删除
func (r *clipboardRepository) BatchPermanentDelete(ids []string) error {
	if len(ids) == 0 {
		return nil
	}

	placeholders := make([]string, len(ids))
	args := make([]interface{}, len(ids))
	for i, id := range ids {
		placeholders[i] = "?"
		args[i] = id
	}

	query := fmt.Sprintf("DELETE FROM clipboard_items WHERE id IN (%s)", strings.Join(placeholders, ","))
	_, err := r.db.Exec(query, args...)
	return err
}

// Restore 从回收站恢复条目
func (r *clipboardRepository) Restore(id string) error {
	query := `UPDATE clipboard_items SET is_deleted = 0, deleted_at = NULL, updated_at = ? WHERE id = ?`
	_, err := r.db.Exec(query, time.Now(), id)
	return err
}

// EmptyTrash 清空回收站
func (r *clipboardRepository) EmptyTrash() error {
	query := `DELETE FROM clipboard_items WHERE is_deleted = 1`
	_, err := r.db.Exec(query)
	return err
}

// Search 搜索剪切板条目
func (r *clipboardRepository) Search(query models.SearchQuery) (models.SearchResult, error) {
	var result models.SearchResult

	sqlQuery := `
	SELECT id, content, content_type, title, tags, category, is_favorite, use_count, is_deleted, deleted_at, created_at, updated_at, last_used_at
	FROM clipboard_items
	WHERE is_deleted = 0
	`

	var args []interface{}

	if query.Query != "" {
		sqlQuery += " AND (content LIKE ? OR title LIKE ?)"
		searchTerm := "%" + query.Query + "%"
		args = append(args, searchTerm, searchTerm)
	}

	if query.Category != "" {
		sqlQuery += " AND category = ?"
		args = append(args, query.Category)
	}

	if query.Type != "" {
		sqlQuery += " AND content_type = ?"
		args = append(args, query.Type)
	}

	// 获取总数
	countQuery := strings.Replace(sqlQuery, "SELECT id, content, content_type, title, tags, category, is_favorite, use_count, is_deleted, deleted_at, created_at, updated_at, last_used_at", "SELECT COUNT(*)", 1)
	var total int
	err := r.db.QueryRow(countQuery, args...).Scan(&total)
	if err != nil {
		return result, err
	}

	// 添加排序和分页
	sqlQuery += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
	args = append(args, query.Limit, query.Offset)

	// 执行查询
	rows, err := r.db.Query(sqlQuery, args...)
	if err != nil {
		return result, err
	}
	defer rows.Close()

	items, err := r.scanItems(rows)
	if err != nil {
		return result, err
	}

	result.Items = items
	result.Total = total
	result.Page = query.Offset/query.Limit + 1
	result.PageSize = query.Limit
	result.TotalPages = (total + query.Limit - 1) / query.Limit

	return result, nil
}

// GetStatistics 获取统计信息
func (r *clipboardRepository) GetStatistics() (models.Statistics, error) {
	var stats models.Statistics

	// 总条目数
	r.db.QueryRow("SELECT COUNT(*) FROM clipboard_items WHERE is_deleted = 0").Scan(&stats.TotalItems)

	// 今日条目数
	today := time.Now().Format("2006-01-02")
	r.db.QueryRow("SELECT COUNT(*) FROM clipboard_items WHERE is_deleted = 0 AND DATE(created_at) = ?", today).Scan(&stats.TodayItems)

	// 本周条目数
	weekAgo := time.Now().AddDate(0, 0, -7).Format("2006-01-02")
	r.db.QueryRow("SELECT COUNT(*) FROM clipboard_items WHERE is_deleted = 0 AND DATE(created_at) >= ?", weekAgo).Scan(&stats.WeekItems)

	// 本月条目数
	monthAgo := time.Now().AddDate(0, -1, 0).Format("2006-01-02")
	r.db.QueryRow("SELECT COUNT(*) FROM clipboard_items WHERE is_deleted = 0 AND DATE(created_at) >= ?", monthAgo).Scan(&stats.MonthItems)

	// 类型统计
	stats.TypeStats = make(map[string]int)
	rows, _ := r.db.Query("SELECT content_type, COUNT(*) FROM clipboard_items WHERE is_deleted = 0 GROUP BY content_type")
	for rows.Next() {
		var contentType string
		var count int
		rows.Scan(&contentType, &count)
		stats.TypeStats[contentType] = count
	}
	rows.Close()

	// 分类统计
	stats.CategoryStats = make(map[string]int)
	rows, _ = r.db.Query("SELECT category, COUNT(*) FROM clipboard_items WHERE is_deleted = 0 GROUP BY category")
	for rows.Next() {
		var category string
		var count int
		rows.Scan(&category, &count)
		stats.CategoryStats[category] = count
	}
	rows.Close()

	return stats, nil
}

// IsDuplicateContent 检查是否重复内容
func (r *clipboardRepository) IsDuplicateContent(content string) (bool, error) {
	query := `SELECT COUNT(*) FROM clipboard_items WHERE content = ? AND is_deleted = 0 LIMIT 1`
	var count int
	err := r.db.QueryRow(query, content).Scan(&count)
	return err == nil && count > 0, err
}

// UseItem 使用剪切板条目（更新使用次数和最后使用时间）
func (r *clipboardRepository) UseItem(id string) error {
	query := `UPDATE clipboard_items SET use_count = use_count + 1, last_used_at = ? WHERE id = ?`
	_, err := r.db.Exec(query, time.Now(), id)
	return err
}

// scanItems 扫描数据库行到剪切板条目列表
func (r *clipboardRepository) scanItems(rows *sql.Rows) ([]models.ClipboardItem, error) {
	var items []models.ClipboardItem

	for rows.Next() {
		var item models.ClipboardItem
		var tagsJSON string

		err := rows.Scan(&item.ID, &item.Content, &item.ContentType, &item.Title, &tagsJSON,
			&item.Category, &item.IsFavorite, &item.UseCount, &item.IsDeleted, &item.DeletedAt, &item.CreatedAt, &item.UpdatedAt, &item.LastUsedAt)
		if err != nil {
			continue
		}

		json.Unmarshal([]byte(tagsJSON), &item.Tags)
		items = append(items, item)
	}

	return items, nil
}
