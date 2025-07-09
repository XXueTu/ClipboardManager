package repository

import (
	"database/sql"
	"encoding/json"
	"time"

	"Sid/internal/models"
)

// ChatRepository 聊天数据仓库接口
type ChatRepository interface {
	// 会话操作
	CreateChatSession(session *models.ChatSession) error
	GetChatSession(sessionID string) (*models.ChatSession, error)
	ListChatSessions() ([]models.ChatSession, error)
	UpdateChatSession(sessionID string, title string) error
	DeleteChatSession(sessionID string) error
	UpdateChatSessionAfterMessage(sessionID, lastMessage string) error

	// 消息操作
	CreateChatMessage(message *models.ChatMessage) error
	GetChatMessages(sessionID string, limit, offset int) ([]models.ChatMessage, error)
	GetChatMessageCount(sessionID string) (int, error)
	UpdateChatMessage(message *models.ChatMessage) error
	DeleteChatMessage(messageID string) error
}

// chatRepository 聊天数据仓库实现
type chatRepository struct {
	db *sql.DB
}

// NewChatRepository 创建新的聊天数据仓库
func NewChatRepository(db *sql.DB) ChatRepository {
	return &chatRepository{db: db}
}

// CreateChatSession 创建聊天会话
func (r *chatRepository) CreateChatSession(session *models.ChatSession) error {
	query := `
	INSERT INTO chat_sessions (id, title, description, last_message, message_count, is_active, created_at, updated_at, last_active_at)
	VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	_, err := r.db.Exec(query, session.ID, session.Title, session.Description, session.LastMessage,
		session.MessageCount, session.IsActive, session.CreatedAt, session.UpdatedAt, session.LastActiveAt)
	return err
}

// GetChatSession 获取聊天会话
func (r *chatRepository) GetChatSession(sessionID string) (*models.ChatSession, error) {
	query := `
	SELECT id, title, description, last_message, message_count, is_active, created_at, updated_at, last_active_at
	FROM chat_sessions
	WHERE id = ?
	`

	var session models.ChatSession
	err := r.db.QueryRow(query, sessionID).Scan(
		&session.ID, &session.Title, &session.Description, &session.LastMessage,
		&session.MessageCount, &session.IsActive, &session.CreatedAt, &session.UpdatedAt, &session.LastActiveAt)

	if err != nil {
		return nil, err
	}

	return &session, nil
}

// ListChatSessions 获取所有聊天会话
func (r *chatRepository) ListChatSessions() ([]models.ChatSession, error) {
	query := `
	SELECT id, title, description, last_message, message_count, is_active, created_at, updated_at, last_active_at
	FROM chat_sessions
	WHERE is_active = 1
	ORDER BY last_active_at DESC
	`

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sessions []models.ChatSession
	for rows.Next() {
		var session models.ChatSession
		err := rows.Scan(
			&session.ID, &session.Title, &session.Description, &session.LastMessage,
			&session.MessageCount, &session.IsActive, &session.CreatedAt, &session.UpdatedAt, &session.LastActiveAt)
		if err != nil {
			return nil, err
		}
		sessions = append(sessions, session)
	}

	return sessions, nil
}

// UpdateChatSession 更新聊天会话
func (r *chatRepository) UpdateChatSession(sessionID string, title string) error {
	query := `UPDATE chat_sessions SET title = ?, updated_at = ? WHERE id = ?`
	_, err := r.db.Exec(query, title, time.Now(), sessionID)
	return err
}

// DeleteChatSession 删除聊天会话
func (r *chatRepository) DeleteChatSession(sessionID string) error {
	// 开始事务
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// 删除所有相关消息
	_, err = tx.Exec("DELETE FROM chat_messages WHERE session_id = ?", sessionID)
	if err != nil {
		return err
	}

	// 删除会话
	_, err = tx.Exec("DELETE FROM chat_sessions WHERE id = ?", sessionID)
	if err != nil {
		return err
	}

	return tx.Commit()
}

// UpdateChatSessionAfterMessage 在消息发送后更新会话信息
func (r *chatRepository) UpdateChatSessionAfterMessage(sessionID, lastMessage string) error {
	query := `
	UPDATE chat_sessions 
	SET last_message = ?, message_count = message_count + 1, last_active_at = ?, updated_at = ?
	WHERE id = ?
	`
	now := time.Now()
	_, err := r.db.Exec(query, lastMessage, now, now, sessionID)
	return err
}

// CreateChatMessage 创建聊天消息
func (r *chatRepository) CreateChatMessage(message *models.ChatMessage) error {
	metadataJSON, _ := json.Marshal(message.Metadata)

	query := `
	INSERT INTO chat_messages (id, session_id, role, content, content_type, metadata, is_streaming, is_complete, created_at, updated_at)
	VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	_, err := r.db.Exec(query, message.ID, message.SessionID, message.Role, message.Content,
		message.ContentType, string(metadataJSON), message.IsStreaming, message.IsComplete,
		message.CreatedAt, message.UpdatedAt)
	return err
}

// GetChatMessages 获取聊天消息
func (r *chatRepository) GetChatMessages(sessionID string, limit, offset int) ([]models.ChatMessage, error) {
	query := `
	SELECT id, session_id, role, content, content_type, metadata, is_streaming, is_complete, created_at, updated_at
	FROM chat_messages
	WHERE session_id = ?
	ORDER BY created_at ASC
	LIMIT ? OFFSET ?
	`

	rows, err := r.db.Query(query, sessionID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []models.ChatMessage
	for rows.Next() {
		var message models.ChatMessage
		var metadataJSON string

		err := rows.Scan(
			&message.ID, &message.SessionID, &message.Role, &message.Content,
			&message.ContentType, &metadataJSON, &message.IsStreaming, &message.IsComplete,
			&message.CreatedAt, &message.UpdatedAt)
		if err != nil {
			return nil, err
		}

		// 解析metadata
		if metadataJSON != "" {
			json.Unmarshal([]byte(metadataJSON), &message.Metadata)
		}

		messages = append(messages, message)
	}

	return messages, nil
}

// GetChatMessageCount 获取聊天消息总数
func (r *chatRepository) GetChatMessageCount(sessionID string) (int, error) {
	query := `SELECT COUNT(*) FROM chat_messages WHERE session_id = ?`
	var count int
	err := r.db.QueryRow(query, sessionID).Scan(&count)
	return count, err
}

// UpdateChatMessage 更新聊天消息
func (r *chatRepository) UpdateChatMessage(message *models.ChatMessage) error {
	metadataJSON, _ := json.Marshal(message.Metadata)

	query := `
	UPDATE chat_messages 
	SET content = ?, metadata = ?, is_streaming = ?, is_complete = ?, updated_at = ?
	WHERE id = ?
	`

	_, err := r.db.Exec(query, message.Content, string(metadataJSON), message.IsStreaming,
		message.IsComplete, message.UpdatedAt, message.ID)
	return err
}

// DeleteChatMessage 删除聊天消息
func (r *chatRepository) DeleteChatMessage(messageID string) error {
	query := `DELETE FROM chat_messages WHERE id = ?`
	_, err := r.db.Exec(query, messageID)
	return err
}
