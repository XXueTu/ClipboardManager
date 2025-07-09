package repository

import (
	"database/sql"
	"log"

	_ "github.com/mattn/go-sqlite3"
)

// Database 数据库连接管理器
type Database struct {
	*sql.DB
}

// NewDatabase 创建新的数据库连接
func NewDatabase(dbPath string) (*Database, error) {
	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		return nil, err
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
		tags TEXT DEFAULT '[]',
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

	// 执行数据库迁移
	if err := db.runMigrations(); err != nil {
		return err
	}

	// 初始化系统标签分组
	if err := db.initSystemTagGroups(); err != nil {
		return err
	}

	// 初始化系统标签
	if err := db.initSystemTags(); err != nil {
		return err
	}

	log.Println("数据库表创建成功")
	return nil
}

// initSystemTagGroups 初始化系统标签分组
func (db *Database) initSystemTagGroups() error {
	systemGroups := []struct {
		id, name, description, color string
		sortOrder                    int
	}{
		{"system-content", "内容类型", "按内容类型分类的标签", "#1890ff", 1},
		{"system-source", "来源应用", "按来源应用分类的标签", "#52c41a", 2},
		{"system-time", "时间标签", "按时间分类的标签", "#faad14", 3},
		{"system-priority", "优先级", "按优先级分类的标签", "#f5222d", 4},
		{"user-custom", "自定义", "用户自定义标签", "#722ed1", 5},
	}

	for _, group := range systemGroups {
		query := `INSERT OR IGNORE INTO tag_groups (id, name, description, color, sort_order, is_system) VALUES (?, ?, ?, ?, ?, ?)`
		_, err := db.Exec(query, group.id, group.name, group.description, group.color, group.sortOrder, true)
		if err != nil {
			return err
		}
	}

	return nil
}

// initSystemTags 初始化系统标签
func (db *Database) initSystemTags() error {
	systemTags := []struct {
		id, name, description, color, groupID string
	}{
		// 内容类型标签
		{"tag-url", "URL", "网址链接", "#1890ff", "system-content"},
		{"tag-email", "邮箱", "邮件地址", "#1890ff", "system-content"},
		{"tag-phone", "电话", "电话号码", "#1890ff", "system-content"},
		{"tag-file", "文件", "文件路径", "#1890ff", "system-content"},
		{"tag-code", "代码", "代码片段", "#1890ff", "system-content"},
		{"tag-json", "JSON", "JSON数据", "#1890ff", "system-content"},
		{"tag-text", "文本", "纯文本", "#1890ff", "system-content"},
		{"tag-image", "图片", "图片内容", "#1890ff", "system-content"},

		// 时间标签
		{"tag-today", "今天", "今天的内容", "#faad14", "system-time"},
		{"tag-yesterday", "昨天", "昨天的内容", "#faad14", "system-time"},
		{"tag-this-week", "本周", "本周的内容", "#faad14", "system-time"},
		{"tag-last-week", "上周", "上周的内容", "#faad14", "system-time"},

		// 优先级标签
		{"tag-important", "重要", "重要内容", "#f5222d", "system-priority"},
		{"tag-urgent", "紧急", "紧急内容", "#f5222d", "system-priority"},
		{"tag-normal", "一般", "一般内容", "#f5222d", "system-priority"},
	}

	for _, tag := range systemTags {
		query := `INSERT OR IGNORE INTO tags (id, name, description, color, group_id, is_system) VALUES (?, ?, ?, ?, ?, ?)`
		_, err := db.Exec(query, tag.id, tag.name, tag.description, tag.color, tag.groupID, true)
		if err != nil {
			return err
		}
	}

	return nil
}

// runMigrations 执行数据库迁移
func (db *Database) runMigrations() error {
	// 检查是否缺少 content_type 字段
	var columnExists bool
	err := db.QueryRow("PRAGMA table_info(clipboard_items)").Scan(&columnExists)
	if err != nil {
		// 查询表结构
		rows, err := db.Query("PRAGMA table_info(clipboard_items)")
		if err != nil {
			return err
		}
		defer rows.Close()
		
		hasContentType := false
		for rows.Next() {
			var cid int
			var name, dataType string
			var notNull, dfltValue, pk interface{}
			err := rows.Scan(&cid, &name, &dataType, &notNull, &dfltValue, &pk)
			if err != nil {
				continue
			}
			if name == "content_type" {
				hasContentType = true
				break
			}
		}
		
		if !hasContentType {
			// 添加 content_type 字段
			_, err = db.Exec("ALTER TABLE clipboard_items ADD COLUMN content_type TEXT DEFAULT 'text'")
			if err != nil {
				return err
			}
			log.Println("添加 content_type 字段成功")
		}
	}
	
	return nil
}

// Close 关闭数据库连接
func (db *Database) Close() error {
	return db.DB.Close()
}
