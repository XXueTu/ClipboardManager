package models

import (
	"time"
)

// ChatSession 聊天会话模型
type ChatSession struct {
	ID           string    `json:"id" db:"id"`
	Title        string    `json:"title" db:"title"`
	Description  string    `json:"description" db:"description"`
	LastMessage  string    `json:"last_message" db:"last_message"`
	MessageCount int       `json:"message_count" db:"message_count"`
	IsActive     bool      `json:"is_active" db:"is_active"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time `json:"updated_at" db:"updated_at"`
	LastActiveAt time.Time `json:"last_active_at" db:"last_active_at"`
}

// ChatMessage 聊天消息模型
type ChatMessage struct {
	ID          string                 `json:"id" db:"id"`
	SessionID   string                 `json:"session_id" db:"session_id"`
	Role        string                 `json:"role" db:"role"` // user, assistant, system
	Content     string                 `json:"content" db:"content"`
	ContentType string                 `json:"content_type" db:"content_type"` // text, image, file
	Metadata    map[string]interface{} `json:"metadata" db:"metadata"`
	IsStreaming bool                   `json:"is_streaming" db:"is_streaming"`
	IsComplete  bool                   `json:"is_complete" db:"is_complete"`
	CreatedAt   time.Time              `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time              `json:"updated_at" db:"updated_at"`
}

// ChatRequest 聊天请求模型
type ChatRequest struct {
	SessionID string `json:"session_id"`
	Message   string `json:"message"`
	Stream    bool   `json:"stream"`
}

// ChatResponse 聊天响应模型
type ChatResponse struct {
	SessionID  string      `json:"session_id"`
	MessageID  string      `json:"message_id"`
	Content    string      `json:"content"`
	Role       string      `json:"role"`
	IsStream   bool        `json:"is_stream"`
	IsComplete bool        `json:"is_complete"`
	Metadata   interface{} `json:"metadata,omitempty"`
	Error      string      `json:"error,omitempty"`
}

// ChatSessionListResponse 聊天会话列表响应
type ChatSessionListResponse struct {
	Sessions []ChatSession `json:"sessions"`
	Total    int           `json:"total"`
}

// ChatMessageListResponse 聊天消息列表响应
type ChatMessageListResponse struct {
	Messages []ChatMessage `json:"messages"`
	Total    int           `json:"total"`
	HasMore  bool          `json:"has_more"`
}

// StreamResponse 流式响应
type StreamResponse struct {
	Type      string      `json:"type"` // message, error, complete
	Data      interface{} `json:"data"` // 响应数据
	MessageID string      `json:"message_id,omitempty"`
	Error     string      `json:"error,omitempty"`
}

// MessageRole 消息角色常量
const (
	MessageRoleUser      = "user"
	MessageRoleAssistant = "assistant"
	MessageRoleSystem    = "system"
)

// MessageContentType 消息内容类型常量
const (
	MessageContentTypeText  = "text"
	MessageContentTypeImage = "image"
	MessageContentTypeFile  = "file"
)

// StreamResponseType 流式响应类型常量
const (
	StreamTypeMessage  = "message"
	StreamTypeError    = "error"
	StreamTypeComplete = "complete"
)
