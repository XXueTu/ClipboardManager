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
		content_type TEXT NOT NULL DEFAULT 'text',
		title TEXT NOT NULL,
		tags TEXT DEFAULT '[]',
		category TEXT DEFAULT '未分类',
		is_favorite BOOLEAN DEFAULT 0,
		use_count INTEGER DEFAULT 0,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		last_used_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE INDEX IF NOT EXISTS idx_created_at ON clipboard_items(created_at);
	CREATE INDEX IF NOT EXISTS idx_category ON clipboard_items(category);
	CREATE INDEX IF NOT EXISTS idx_content_type ON clipboard_items(content_type);
	CREATE INDEX IF NOT EXISTS idx_is_favorite ON clipboard_items(is_favorite);
	CREATE INDEX IF NOT EXISTS idx_use_count ON clipboard_items(use_count);
	`

	_, err := db.Exec(createTableSQL)
	if err != nil {
		return err
	}

	// 数据库迁移：添加软删除字段
	migrationSQL := `
	ALTER TABLE clipboard_items ADD COLUMN is_deleted BOOLEAN DEFAULT 0;
	ALTER TABLE clipboard_items ADD COLUMN deleted_at DATETIME NULL;
	CREATE INDEX IF NOT EXISTS idx_is_deleted ON clipboard_items(is_deleted);
	`

	// 检查字段是否已存在，如果不存在则添加
	var columnCount int
	checkSQL := `SELECT COUNT(*) as CNTREC FROM pragma_table_info('clipboard_items') WHERE name='is_deleted'`
	err = db.QueryRow(checkSQL).Scan(&columnCount)
	if err == nil && columnCount == 0 {
		// 字段不存在，执行迁移
		_, err = db.Exec(migrationSQL)
		if err != nil {
			log.Printf("数据库迁移失败，但可以继续运行: %v", err)
		} else {
			log.Println("数据库迁移成功：添加软删除字段")
		}
	}

	return nil
}

// Close 关闭数据库连接
func (db *Database) Close() error {
	return db.DB.Close()
}