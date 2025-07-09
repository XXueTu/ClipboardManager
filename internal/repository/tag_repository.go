package repository

import (
	"database/sql"
	"fmt"
	"time"

	"react-wails-app/internal/models"
)

// TagRepository 标签数据仓库接口
type TagRepository interface {
	// 标签分组管理
	CreateTagGroup(group models.TagGroup) error
	GetTagGroupByID(id string) (*models.TagGroup, error)
	GetTagGroups() ([]models.TagGroup, error)
	UpdateTagGroup(group models.TagGroup) error
	DeleteTagGroup(id string) error

	// 标签管理
	CreateTag(tag models.Tag) error
	GetTagByID(id string) (*models.Tag, error)
	GetTagByName(name string) (*models.Tag, error)
	GetTags() ([]models.Tag, error)
	GetTagsByGroup(groupID string) ([]models.Tag, error)
	SearchTags(query models.TagSearchQuery) ([]models.TagWithStats, error)
	UpdateTag(tag models.Tag) error
	DeleteTag(id string) error
	GetOrCreateTag(name string, source string) (*models.Tag, error)

	// 标签关联管理
	AddTagToItem(itemID, tagID string) error
	RemoveTagFromItem(itemID, tagID string) error
	GetTagsForItem(itemID string) ([]models.Tag, error)
	GetItemsForTag(tagID string) ([]models.ClipboardItem, error)
	BatchUpdateItemTags(itemID string, tagIDs []string) error

	// 标签使用统计
	IncrementTagUsage(tagID string) error
	GetTagStatistics() (models.TagStatistics, error)
	GetMostUsedTags(limit int) ([]models.TagWithStats, error)
	GetRecentTags(limit int) ([]models.TagWithStats, error)
	GetUnusedTags() ([]models.Tag, error)

	// 标签清理
	CleanupUnusedTags() error
	MergeTags(sourceTagID, targetTagID string) error
}

// tagRepository 标签数据仓库实现
type tagRepository struct {
	db *sql.DB
}

// NewTagRepository 创建新的标签数据仓库
func NewTagRepository(db *sql.DB) TagRepository {
	return &tagRepository{db: db}
}

// CreateTagGroup 创建标签分组
func (r *tagRepository) CreateTagGroup(group models.TagGroup) error {
	query := `
	INSERT INTO tag_groups (id, name, description, color, sort_order, created_at, updated_at)
	VALUES (?, ?, ?, ?, ?, ?, ?)
	`
	_, err := r.db.Exec(query, group.ID, group.Name, group.Description, group.Color,
		group.SortOrder, group.CreatedAt, group.UpdatedAt)
	return err
}

// GetTagGroupByID 根据ID获取标签分组
func (r *tagRepository) GetTagGroupByID(id string) (*models.TagGroup, error) {
	query := `
	SELECT id, name, description, color, sort_order, created_at, updated_at
	FROM tag_groups WHERE id = ?
	`
	var group models.TagGroup
	err := r.db.QueryRow(query, id).Scan(&group.ID, &group.Name, &group.Description,
		&group.Color, &group.SortOrder, &group.CreatedAt, &group.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &group, nil
}

// GetTagGroups 获取所有标签分组
func (r *tagRepository) GetTagGroups() ([]models.TagGroup, error) {
	query := `
	SELECT id, name, description, color, sort_order, created_at, updated_at
	FROM tag_groups ORDER BY sort_order ASC, name ASC
	`
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var groups []models.TagGroup
	for rows.Next() {
		var group models.TagGroup
		err := rows.Scan(&group.ID, &group.Name, &group.Description, &group.Color,
			&group.SortOrder, &group.CreatedAt, &group.UpdatedAt)
		if err != nil {
			continue
		}
		groups = append(groups, group)
	}
	return groups, nil
}

// UpdateTagGroup 更新标签分组
func (r *tagRepository) UpdateTagGroup(group models.TagGroup) error {
	group.UpdatedAt = time.Now()
	query := `
	UPDATE tag_groups 
	SET name = ?, description = ?, color = ?, sort_order = ?, updated_at = ?
	WHERE id = ?
	`
	_, err := r.db.Exec(query, group.Name, group.Description, group.Color,
		group.SortOrder, group.UpdatedAt, group.ID)
	return err
}

// DeleteTagGroup 删除标签分组
func (r *tagRepository) DeleteTagGroup(id string) error {
	// 先将该分组下的标签移动到未分组
	updateQuery := `UPDATE tags SET group_id = NULL WHERE group_id = ?`
	_, err := r.db.Exec(updateQuery, id)
	if err != nil {
		return err
	}

	// 删除分组
	deleteQuery := `DELETE FROM tag_groups WHERE id = ?`
	_, err = r.db.Exec(deleteQuery, id)
	return err
}

// CreateTag 创建标签
func (r *tagRepository) CreateTag(tag models.Tag) error {
	query := `
	INSERT INTO tags (id, name, description, color, group_id, use_count, created_at, updated_at, last_used_at)
	VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
	`
	_, err := r.db.Exec(query, tag.ID, tag.Name, tag.Description, tag.Color,
		tag.GroupID, tag.UseCount, tag.CreatedAt, tag.UpdatedAt, tag.LastUsedAt)
	return err
}

// GetTagByID 根据ID获取标签
func (r *tagRepository) GetTagByID(id string) (*models.Tag, error) {
	query := `
	SELECT id, name, description, color, group_id, use_count, created_at, updated_at, last_used_at
	FROM tags WHERE id = ?
	`
	var tag models.Tag
	var groupID sql.NullString
	err := r.db.QueryRow(query, id).Scan(&tag.ID, &tag.Name, &tag.Description,
		&tag.Color, &groupID, &tag.UseCount, &tag.CreatedAt, &tag.UpdatedAt, &tag.LastUsedAt)
	if err != nil {
		return nil, err
	}
	if groupID.Valid {
		tag.GroupID = groupID.String
	}
	return &tag, nil
}

// GetTagByName 根据名称获取标签
func (r *tagRepository) GetTagByName(name string) (*models.Tag, error) {
	query := `
	SELECT id, name, description, color, group_id, use_count, created_at, updated_at, last_used_at
	FROM tags WHERE name = ?
	`
	var tag models.Tag
	var groupID sql.NullString
	err := r.db.QueryRow(query, name).Scan(&tag.ID, &tag.Name, &tag.Description,
		&tag.Color, &groupID, &tag.UseCount, &tag.CreatedAt, &tag.UpdatedAt, &tag.LastUsedAt)
	if err != nil {
		return nil, err
	}
	if groupID.Valid {
		tag.GroupID = groupID.String
	}
	return &tag, nil
}

// GetTags 获取所有标签
func (r *tagRepository) GetTags() ([]models.Tag, error) {
	query := `
	SELECT id, name, description, color, group_id, use_count, created_at, updated_at, last_used_at
	FROM tags ORDER BY use_count DESC, name ASC
	`
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return r.scanTags(rows)
}

// GetTagsByGroup 根据分组获取标签
func (r *tagRepository) GetTagsByGroup(groupID string) ([]models.Tag, error) {
	var query string
	var args []interface{}

	if groupID == "" {
		query = `
		SELECT id, name, description, color, group_id, use_count, created_at, updated_at, last_used_at
		FROM tags WHERE group_id IS NULL ORDER BY use_count DESC, name ASC
		`
	} else {
		query = `
		SELECT id, name, description, color, group_id, use_count, created_at, updated_at, last_used_at
		FROM tags WHERE group_id = ? ORDER BY use_count DESC, name ASC
		`
		args = append(args, groupID)
	}

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return r.scanTags(rows)
}

// SearchTags 搜索标签
func (r *tagRepository) SearchTags(query models.TagSearchQuery) ([]models.TagWithStats, error) {
	sqlQuery := `
	SELECT t.id, t.name, t.description, t.color, t.group_id, t.use_count, 
		   t.created_at, t.updated_at, t.last_used_at,
		   COUNT(DISTINCT cit.item_id) as item_count
	FROM tags t
	LEFT JOIN clipboard_item_tags cit ON t.id = cit.tag_id
	LEFT JOIN clipboard_items ci ON cit.item_id = ci.id AND ci.is_deleted = 0
	WHERE 1=1
	`

	var args []interface{}

	if query.Query != "" {
		sqlQuery += " AND (t.name LIKE ? OR t.description LIKE ?)"
		searchTerm := "%" + query.Query + "%"
		args = append(args, searchTerm, searchTerm)
	}

	if query.GroupID != "" {
		sqlQuery += " AND t.group_id = ?"
		args = append(args, query.GroupID)
	}

	sqlQuery += " GROUP BY t.id"

	// 排序
	switch query.SortBy {
	case "name":
		sqlQuery += " ORDER BY t.name"
	case "use_count":
		sqlQuery += " ORDER BY t.use_count"
	case "created_at":
		sqlQuery += " ORDER BY t.created_at"
	case "last_used_at":
		sqlQuery += " ORDER BY t.last_used_at"
	default:
		sqlQuery += " ORDER BY t.use_count DESC, t.name ASC"
	}

	if query.SortOrder == "desc" {
		sqlQuery += " DESC"
	} else {
		sqlQuery += " ASC"
	}

	// 分页
	if query.Limit > 0 {
		sqlQuery += " LIMIT ? OFFSET ?"
		args = append(args, query.Limit, query.Offset)
	}

	rows, err := r.db.Query(sqlQuery, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tags []models.TagWithStats
	for rows.Next() {
		var tag models.TagWithStats
		var groupID sql.NullString
		err := rows.Scan(&tag.ID, &tag.Name, &tag.Description, &tag.Color, &groupID,
			&tag.UseCount, &tag.CreatedAt, &tag.UpdatedAt, &tag.LastUsedAt, &tag.ItemCount)
		if err != nil {
			continue
		}
		if groupID.Valid {
			tag.GroupID = groupID.String
		}
		tags = append(tags, tag)
	}
	return tags, nil
}

// loadTagsForItem 加载条目的标签信息
func (r *tagRepository) loadTagsForItem(itemID string) ([]models.Tag, error) {
	query := `
	SELECT t.id, t.name, t.description, t.color, t.group_id, t.use_count, t.created_at, t.updated_at, t.last_used_at
	FROM tags t
	INNER JOIN clipboard_item_tags cit ON t.id = cit.tag_id
	WHERE cit.item_id = ?
	ORDER BY t.name ASC
	`
	rows, err := r.db.Query(query, itemID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return r.scanTags(rows)
}

// UpdateTag 更新标签
func (r *tagRepository) UpdateTag(tag models.Tag) error {
	tag.UpdatedAt = time.Now()
	query := `
	UPDATE tags 
	SET name = ?, description = ?, color = ?, group_id = ?, updated_at = ?
	WHERE id = ?
	`
	var groupID interface{}
	if tag.GroupID != "" {
		groupID = tag.GroupID
	}
	_, err := r.db.Exec(query, tag.Name, tag.Description, tag.Color,
		groupID, tag.UpdatedAt, tag.ID)
	return err
}

// DeleteTag 删除标签
func (r *tagRepository) DeleteTag(id string) error {
	// 先删除关联关系
	deleteRelQuery := `DELETE FROM clipboard_item_tags WHERE tag_id = ?`
	_, err := r.db.Exec(deleteRelQuery, id)
	if err != nil {
		return err
	}

	// 删除标签
	deleteQuery := `DELETE FROM tags WHERE id = ?`
	_, err = r.db.Exec(deleteQuery, id)
	return err
}

// GetOrCreateTag 获取或创建标签
func (r *tagRepository) GetOrCreateTag(name string, source string) (*models.Tag, error) {
	// 先尝试获取已有标签
	tag, err := r.GetTagByName(name)
	if err == nil {
		return tag, nil
	}

	if source == "" {
		source = "user-custom"
	}

	// 如果不存在，创建新标签
	newTag := models.Tag{
		ID:          fmt.Sprintf("tag-%d", time.Now().UnixNano()),
		Name:        name,
		Description: "",
		Color:       "#1890ff",
		GroupID:     source,
		UseCount:    0,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
		LastUsedAt:  time.Now(),
	}

	err = r.CreateTag(newTag)
	if err != nil {
		return nil, err
	}

	return &newTag, nil
}

// AddTagToItem 为条目添加标签
func (r *tagRepository) AddTagToItem(itemID, tagID string) error {
	query := `
	INSERT OR IGNORE INTO clipboard_item_tags (id, item_id, tag_id, created_at)
	VALUES (?, ?, ?, ?)
	`
	id := fmt.Sprintf("rel-%d", time.Now().UnixNano())
	_, err := r.db.Exec(query, id, itemID, tagID, time.Now())
	return err
}

// RemoveTagFromItem 从条目移除标签
func (r *tagRepository) RemoveTagFromItem(itemID, tagID string) error {
	query := `DELETE FROM clipboard_item_tags WHERE item_id = ? AND tag_id = ?`
	_, err := r.db.Exec(query, itemID, tagID)
	return err
}

// GetTagsForItem 获取条目的标签
func (r *tagRepository) GetTagsForItem(itemID string) ([]models.Tag, error) {
	query := `
	SELECT t.id, t.name, t.description, t.color, t.group_id, t.use_count, 
		   t.created_at, t.updated_at, t.last_used_at
	FROM tags t
	INNER JOIN clipboard_item_tags cit ON t.id = cit.tag_id
	WHERE cit.item_id = ?
	ORDER BY t.name ASC
	`
	rows, err := r.db.Query(query, itemID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return r.scanTags(rows)
}

// GetItemsForTag 获取标签的条目
func (r *tagRepository) GetItemsForTag(tagID string) ([]models.ClipboardItem, error) {
	query := `
	SELECT ci.id, ci.content, ci.content_type, ci.title, ci.category, ci.is_favorite, ci.use_count, 
		   ci.is_deleted, ci.deleted_at, ci.created_at, ci.updated_at, ci.last_used_at
	FROM clipboard_items ci
	INNER JOIN clipboard_item_tags cit ON ci.id = cit.item_id
	WHERE cit.tag_id = ? AND ci.is_deleted = 0
	ORDER BY ci.created_at DESC
	`
	rows, err := r.db.Query(query, tagID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []models.ClipboardItem
	for rows.Next() {
		var item models.ClipboardItem
		err := rows.Scan(&item.ID, &item.Content, &item.ContentType, &item.Title, &item.Category,
			&item.IsFavorite, &item.UseCount, &item.IsDeleted, &item.DeletedAt,
			&item.CreatedAt, &item.UpdatedAt, &item.LastUsedAt)
		if err != nil {
			continue
		}

		// 加载标签信息
		item.Tags, _ = r.loadTagsForItem(item.ID)
		items = append(items, item)
	}
	return items, nil
}

// BatchUpdateItemTags 批量更新条目标签
func (r *tagRepository) BatchUpdateItemTags(itemID string, tagIDs []string) error {
	// 开启事务
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// 删除现有关联
	deleteQuery := `DELETE FROM clipboard_item_tags WHERE item_id = ?`
	_, err = tx.Exec(deleteQuery, itemID)
	if err != nil {
		return err
	}

	// 添加新关联
	if len(tagIDs) > 0 {
		insertQuery := `INSERT INTO clipboard_item_tags (id, item_id, tag_id, created_at) VALUES (?, ?, ?, ?)`
		for _, tagID := range tagIDs {
			id := fmt.Sprintf("rel-%d-%s", time.Now().UnixNano(), tagID)
			_, err = tx.Exec(insertQuery, id, itemID, tagID, time.Now())
			if err != nil {
				return err
			}
		}
	}

	return tx.Commit()
}

// IncrementTagUsage 增加标签使用次数
func (r *tagRepository) IncrementTagUsage(tagID string) error {
	query := `UPDATE tags SET use_count = use_count + 1, last_used_at = ? WHERE id = ?`
	_, err := r.db.Exec(query, time.Now(), tagID)
	return err
}

// GetTagStatistics 获取标签统计信息
func (r *tagRepository) GetTagStatistics() (models.TagStatistics, error) {
	var stats models.TagStatistics

	// 获取总标签数
	r.db.QueryRow("SELECT COUNT(*) FROM tags").Scan(&stats.TotalTags)

	// 获取最常用标签
	mostUsedTags, _ := r.GetMostUsedTags(10)
	stats.MostUsedTags = mostUsedTags

	// 获取最近使用标签
	recentTags, _ := r.GetRecentTags(10)
	stats.RecentTags = recentTags

	// 获取标签分组
	groups, _ := r.GetTagGroups()
	stats.TagGroups = groups

	// 获取未使用标签
	unusedTags, _ := r.GetUnusedTags()
	stats.UnusedTags = unusedTags

	return stats, nil
}

// GetMostUsedTags 获取最常用标签
func (r *tagRepository) GetMostUsedTags(limit int) ([]models.TagWithStats, error) {
	query := `
	SELECT t.id, t.name, t.description, t.color, t.group_id, t.use_count, 
		   t.created_at, t.updated_at, t.last_used_at,
		   COUNT(DISTINCT cit.item_id) as item_count
	FROM tags t
	LEFT JOIN clipboard_item_tags cit ON t.id = cit.tag_id
	LEFT JOIN clipboard_items ci ON cit.item_id = ci.id AND ci.is_deleted = 0
	GROUP BY t.id
	ORDER BY t.use_count DESC
	LIMIT ?
	`
	rows, err := r.db.Query(query, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tags []models.TagWithStats
	for rows.Next() {
		var tag models.TagWithStats
		var groupID sql.NullString
		err := rows.Scan(&tag.ID, &tag.Name, &tag.Description, &tag.Color, &groupID,
			&tag.UseCount, &tag.CreatedAt, &tag.UpdatedAt, &tag.LastUsedAt, &tag.ItemCount)
		if err != nil {
			continue
		}
		if groupID.Valid {
			tag.GroupID = groupID.String
		}
		tags = append(tags, tag)
	}
	return tags, nil
}

// GetRecentTags 获取最近使用标签
func (r *tagRepository) GetRecentTags(limit int) ([]models.TagWithStats, error) {
	query := `
	SELECT t.id, t.name, t.description, t.color, t.group_id, t.use_count, 
		   t.created_at, t.updated_at, t.last_used_at,
		   COUNT(DISTINCT cit.item_id) as item_count
	FROM tags t
	LEFT JOIN clipboard_item_tags cit ON t.id = cit.tag_id
	LEFT JOIN clipboard_items ci ON cit.item_id = ci.id AND ci.is_deleted = 0
	GROUP BY t.id
	ORDER BY t.last_used_at DESC
	LIMIT ?
	`
	rows, err := r.db.Query(query, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tags []models.TagWithStats
	for rows.Next() {
		var tag models.TagWithStats
		var groupID sql.NullString
		err := rows.Scan(&tag.ID, &tag.Name, &tag.Description, &tag.Color, &groupID,
			&tag.UseCount, &tag.CreatedAt, &tag.UpdatedAt, &tag.LastUsedAt, &tag.ItemCount)
		if err != nil {
			continue
		}
		if groupID.Valid {
			tag.GroupID = groupID.String
		}
		tags = append(tags, tag)
	}
	return tags, nil
}

// GetUnusedTags 获取未使用标签
func (r *tagRepository) GetUnusedTags() ([]models.Tag, error) {
	query := `
	SELECT t.id, t.name, t.description, t.color, t.group_id, t.use_count, 
		   t.created_at, t.updated_at, t.last_used_at
	FROM tags t
	LEFT JOIN clipboard_item_tags cit ON t.id = cit.tag_id
	WHERE cit.tag_id IS NULL
	ORDER BY t.created_at ASC
	`
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return r.scanTags(rows)
}

// CleanupUnusedTags 清理未使用标签
func (r *tagRepository) CleanupUnusedTags() error {
	query := `
	DELETE FROM tags 
	WHERE id NOT IN (
		SELECT DISTINCT tag_id FROM clipboard_item_tags
	)
	`
	_, err := r.db.Exec(query)
	return err
}

// MergeTags 合并标签
func (r *tagRepository) MergeTags(sourceTagID, targetTagID string) error {
	// 开启事务
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// 将源标签的所有关联转移到目标标签
	updateQuery := `
	UPDATE OR IGNORE clipboard_item_tags 
	SET tag_id = ? 
	WHERE tag_id = ?
	`
	_, err = tx.Exec(updateQuery, targetTagID, sourceTagID)
	if err != nil {
		return err
	}

	// 删除重复的关联
	deleteQuery := `DELETE FROM clipboard_item_tags WHERE tag_id = ?`
	_, err = tx.Exec(deleteQuery, sourceTagID)
	if err != nil {
		return err
	}

	// 删除源标签
	deleteTagQuery := `DELETE FROM tags WHERE id = ?`
	_, err = tx.Exec(deleteTagQuery, sourceTagID)
	if err != nil {
		return err
	}

	return tx.Commit()
}

// scanTags 扫描标签数据
func (r *tagRepository) scanTags(rows *sql.Rows) ([]models.Tag, error) {
	var tags []models.Tag
	for rows.Next() {
		var tag models.Tag
		var groupID sql.NullString
		err := rows.Scan(&tag.ID, &tag.Name, &tag.Description, &tag.Color, &groupID,
			&tag.UseCount, &tag.CreatedAt, &tag.UpdatedAt, &tag.LastUsedAt)
		if err != nil {
			continue
		}
		if groupID.Valid {
			tag.GroupID = groupID.String
		}
		tags = append(tags, tag)
	}
	return tags, nil
}
