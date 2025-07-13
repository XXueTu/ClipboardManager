package repository

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"time"

	_ "github.com/mattn/go-sqlite3"
)

// Database 数据库连接管理器
type Database struct {
	*sql.DB
}

// NewDatabase 创建新的数据库连接
func NewDatabase(dbPath string) (*Database, error) {
	// 添加 SQLite 参数确保UTF-8编码支持
	dsn := fmt.Sprintf("%s?_busy_timeout=10000&_case_sensitive_like=OFF&_encoding=UTF-8&_foreign_keys=ON&_journal_mode=WAL&_synchronous=NORMAL", dbPath)
	db, err := sql.Open("sqlite3", dsn)
	if err != nil {
		return nil, err
	}

	// 设置连接池参数
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(25)
	db.SetConnMaxLifetime(5 * time.Minute)

	// 执行 PRAGMA 设置确保 UTF-8 编码
	if _, err := db.Exec("PRAGMA encoding = 'UTF-8'"); err != nil {
		return nil, fmt.Errorf("failed to set UTF-8 encoding: %v", err)
	}

	database := &Database{DB: db}
	if err := database.migrate(); err != nil {
		return nil, err
	}

	return database, nil
}

// migrate 执行数据库迁移
func (db *Database) migrate() error {

	// 创建基础表结构
	createTableSQL := `
	CREATE TABLE IF NOT EXISTS clipboard_items (
		id TEXT PRIMARY KEY,
		content TEXT NOT NULL,
		content_type TEXT DEFAULT 'text',
		title TEXT NOT NULL,
		category TEXT DEFAULT '未分类',
		is_favorite BOOLEAN DEFAULT 0,
		use_count INTEGER DEFAULT 0,
		is_deleted BOOLEAN DEFAULT 0,
		deleted_at DATETIME NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		last_used_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE INDEX IF NOT EXISTS idx_created_at ON clipboard_items(created_at);
	CREATE INDEX IF NOT EXISTS idx_category ON clipboard_items(category);
	CREATE INDEX IF NOT EXISTS idx_is_favorite ON clipboard_items(is_favorite);
	CREATE INDEX IF NOT EXISTS idx_use_count ON clipboard_items(use_count);
	CREATE INDEX IF NOT EXISTS idx_is_deleted ON clipboard_items(is_deleted);
	
	-- 聊天会话表
	CREATE TABLE IF NOT EXISTS chat_sessions (
		id TEXT PRIMARY KEY,
		title TEXT NOT NULL,
		description TEXT DEFAULT '',
		last_message TEXT DEFAULT '',
		message_count INTEGER DEFAULT 0,
		is_active BOOLEAN DEFAULT 1,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		last_active_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE INDEX IF NOT EXISTS idx_chat_sessions_created_at ON chat_sessions(created_at);
	CREATE INDEX IF NOT EXISTS idx_chat_sessions_is_active ON chat_sessions(is_active);
	CREATE INDEX IF NOT EXISTS idx_chat_sessions_last_active_at ON chat_sessions(last_active_at);
	
	-- 聊天消息表
	CREATE TABLE IF NOT EXISTS chat_messages (
		id TEXT PRIMARY KEY,
		session_id TEXT NOT NULL,
		role TEXT NOT NULL,
		content TEXT NOT NULL,
		content_type TEXT DEFAULT 'text',
		metadata TEXT DEFAULT '{}',
		is_streaming BOOLEAN DEFAULT 0,
		is_complete BOOLEAN DEFAULT 1,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
	);

	CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
	CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
	CREATE INDEX IF NOT EXISTS idx_chat_messages_role ON chat_messages(role);

	-- 标签分组表
	CREATE TABLE IF NOT EXISTS tag_groups (
		id TEXT PRIMARY KEY,
		name TEXT NOT NULL UNIQUE,
		description TEXT DEFAULT '',
		color TEXT DEFAULT '#1890ff',
		sort_order INTEGER DEFAULT 0,
		is_system BOOLEAN DEFAULT 0,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE INDEX IF NOT EXISTS idx_tag_groups_sort_order ON tag_groups(sort_order);
	CREATE INDEX IF NOT EXISTS idx_tag_groups_is_system ON tag_groups(is_system);

	-- 标签表
	CREATE TABLE IF NOT EXISTS tags (
		id TEXT PRIMARY KEY,
		name TEXT NOT NULL UNIQUE,
		description TEXT DEFAULT '',
		color TEXT DEFAULT '#1890ff',
		group_id TEXT,
		use_count INTEGER DEFAULT 0,
		is_system BOOLEAN DEFAULT 0,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		last_used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (group_id) REFERENCES tag_groups(id) ON DELETE SET NULL
	);

	CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
	CREATE INDEX IF NOT EXISTS idx_tags_group_id ON tags(group_id);
	CREATE INDEX IF NOT EXISTS idx_tags_use_count ON tags(use_count);
	CREATE INDEX IF NOT EXISTS idx_tags_is_system ON tags(is_system);
	CREATE INDEX IF NOT EXISTS idx_tags_last_used_at ON tags(last_used_at);

	-- 剪切板条目标签关联表
	CREATE TABLE IF NOT EXISTS clipboard_item_tags (
		id TEXT PRIMARY KEY,
		item_id TEXT NOT NULL,
		tag_id TEXT NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (item_id) REFERENCES clipboard_items(id) ON DELETE CASCADE,
		FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
		UNIQUE(item_id, tag_id)
	);

	CREATE INDEX IF NOT EXISTS idx_clipboard_item_tags_item_id ON clipboard_item_tags(item_id);
	CREATE INDEX IF NOT EXISTS idx_clipboard_item_tags_tag_id ON clipboard_item_tags(tag_id);
	CREATE INDEX IF NOT EXISTS idx_clipboard_item_tags_created_at ON clipboard_item_tags(created_at);
	`

	_, err := db.Exec(createTableSQL)
	if err != nil {
		return err
	}
	// 查询 ai-generated 标签分组是否存在
	var count int
	err = db.QueryRow("SELECT COUNT(*) FROM tag_groups WHERE id = ?", "ai-generated").Scan(&count)
	if err != nil {
		return err
	}

	if count == 0 {
		// 创建 ai-generated 标签分组
		_, err = db.Exec(`INSERT OR IGNORE INTO tag_groups (id, name, description, color, sort_order, is_system, created_at, updated_at) 
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
			"ai-generated", "AI生成", "AI自动生成的标签", "#52c41a", 0, true, "2024-01-01 00:00:00", "2024-01-01 00:00:00")
		if err != nil {
			return err
		}
	}
	log.Println("数据库表创建成功")
	return nil
}

// migrateTagsToRelationships 迁移旧的标签数据到新的关系表
func (db *Database) migrateTagsToRelationships() error {
	log.Println("开始迁移标签数据...")

	// 查询所有包含标签的条目
	query := `SELECT id, tags FROM clipboard_items WHERE tags IS NOT NULL AND tags != '[]'`
	rows, err := db.Query(query)
	if err != nil {
		return err
	}
	defer rows.Close()

	// 创建默认标签分组
	defaultGroupID := "ai-generated"
	_, err = db.Exec(`INSERT OR IGNORE INTO tag_groups (id, name, description, color, sort_order, is_system, created_at, updated_at) 
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		defaultGroupID, "AI生成", "AI自动生成的标签", "#52c41a", 0, true, "2024-01-01 00:00:00", "2024-01-01 00:00:00")
	if err != nil {
		return err
	}

	userGroupID := "user-custom"
	_, err = db.Exec(`INSERT OR IGNORE INTO tag_groups (id, name, description, color, sort_order, is_system, created_at, updated_at) 
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		userGroupID, "用户自定义", "用户手动创建的标签", "#1890ff", 1, false, "2024-01-01 00:00:00", "2024-01-01 00:00:00")
	if err != nil {
		return err
	}

	tagMap := make(map[string]string) // tag name -> tag id

	for rows.Next() {
		var itemID, tagsJSON string
		if err := rows.Scan(&itemID, &tagsJSON); err != nil {
			continue
		}

		// 解析标签JSON
		var tags []string
		if err := json.Unmarshal([]byte(tagsJSON), &tags); err != nil {
			continue
		}

		// 为每个标签创建关联
		for _, tagName := range tags {
			if tagName == "" {
				continue
			}

			// 获取或创建标签
			tagID, exists := tagMap[tagName]
			if !exists {
				tagID = fmt.Sprintf("tag-%d", time.Now().UnixNano())

				// 创建标签
				_, err = db.Exec(`INSERT OR IGNORE INTO tags (id, name, description, color, group_id, use_count, is_system, created_at, updated_at, last_used_at) 
					VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
					tagID, tagName, "", "#1890ff", defaultGroupID, 0, true, "2024-01-01 00:00:00", "2024-01-01 00:00:00", "2024-01-01 00:00:00")
				if err != nil {
					log.Printf("创建标签失败: %v", err)
					continue
				}
				tagMap[tagName] = tagID
			}

			// 创建关联
			relID := fmt.Sprintf("rel-%d", time.Now().UnixNano())
			_, err = db.Exec(`INSERT OR IGNORE INTO clipboard_item_tags (id, item_id, tag_id, created_at) 
				VALUES (?, ?, ?, ?)`,
				relID, itemID, tagID, "2024-01-01 00:00:00")
			if err != nil {
				log.Printf("创建标签关联失败: %v", err)
				continue
			}
		}
	}

	log.Printf("迁移了 %d 个标签", len(tagMap))
	return nil
}

// Close 关闭数据库连接
func (db *Database) Close() error {
	return db.DB.Close()
}
