package service

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"time"

	"github.com/cloudwego/eino/schema"
	"github.com/google/uuid"

	model "react-wails-app/internal/agent"
	"react-wails-app/internal/models"
	"react-wails-app/internal/repository"
)

// ChatService 聊天服务接口
type ChatService interface {
	// 会话管理
	CreateSession(ctx context.Context, title string) (*models.ChatSession, error)
	GetSession(ctx context.Context, sessionID string) (*models.ChatSession, error)
	ListSessions(ctx context.Context) (*models.ChatSessionListResponse, error)
	DeleteSession(ctx context.Context, sessionID string) error
	UpdateSession(ctx context.Context, sessionID string, title string) error

	// 消息管理
	SendMessage(ctx context.Context, sessionID, message string) (*models.ChatMessage, error)
	SendMessageStream(ctx context.Context, sessionID, message string, callback func(*models.StreamResponse)) error
	GetMessages(ctx context.Context, sessionID string, limit, offset int) (*models.ChatMessageListResponse, error)

	// 实用功能
	GenerateTitle(ctx context.Context, message string) (string, error)
	GenerateTags(ctx context.Context, message string) ([]string, error)
}

// chatService 聊天服务实现
type chatService struct {
	repo repository.ChatRepository
}

// NewChatService 创建新的聊天服务
func NewChatService(repo repository.ChatRepository) ChatService {
	return &chatService{
		repo: repo,
	}
}

// CreateSession 创建新的聊天会话
func (s *chatService) CreateSession(ctx context.Context, title string) (*models.ChatSession, error) {
	session := &models.ChatSession{
		ID:           uuid.New().String(),
		Title:        title,
		Description:  "",
		LastMessage:  "",
		MessageCount: 0,
		IsActive:     true,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
		LastActiveAt: time.Now(),
	}

	if err := s.repo.CreateChatSession(session); err != nil {
		return nil, fmt.Errorf("failed to create chat session: %w", err)
	}

	return session, nil
}

// GetSession 获取聊天会话
func (s *chatService) GetSession(ctx context.Context, sessionID string) (*models.ChatSession, error) {
	session, err := s.repo.GetChatSession(sessionID)
	if err != nil {
		return nil, fmt.Errorf("failed to get chat session: %w", err)
	}
	return session, nil
}

// ListSessions 获取聊天会话列表
func (s *chatService) ListSessions(ctx context.Context) (*models.ChatSessionListResponse, error) {
	sessions, err := s.repo.ListChatSessions()
	if err != nil {
		return nil, fmt.Errorf("failed to list chat sessions: %w", err)
	}

	return &models.ChatSessionListResponse{
		Sessions: sessions,
		Total:    len(sessions),
	}, nil
}

// DeleteSession 删除聊天会话
func (s *chatService) DeleteSession(ctx context.Context, sessionID string) error {
	if err := s.repo.DeleteChatSession(sessionID); err != nil {
		return fmt.Errorf("failed to delete chat session: %w", err)
	}
	return nil
}

// UpdateSession 更新聊天会话
func (s *chatService) UpdateSession(ctx context.Context, sessionID string, title string) error {
	if err := s.repo.UpdateChatSession(sessionID, title); err != nil {
		return fmt.Errorf("failed to update chat session: %w", err)
	}
	return nil
}

// SendMessage 发送消息（非流式）
func (s *chatService) SendMessage(ctx context.Context, sessionID, message string) (*models.ChatMessage, error) {
	// 保存用户消息
	userMessage := &models.ChatMessage{
		ID:          uuid.New().String(),
		SessionID:   sessionID,
		Role:        models.MessageRoleUser,
		Content:     message,
		ContentType: models.MessageContentTypeText,
		IsStreaming: false,
		IsComplete:  true,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	if err := s.repo.CreateChatMessage(userMessage); err != nil {
		return nil, fmt.Errorf("failed to save user message: %w", err)
	}

	// 获取历史消息
	historyResp, err := s.GetMessages(ctx, sessionID, 20, 0)
	if err != nil {
		return nil, fmt.Errorf("failed to get message history: %w", err)
	}

	// 转换为聊天模型所需的格式
	messages := s.convertToSchemaMessages(historyResp.Messages)

	// 调用聊天模型
	chatModel, err := model.NewChatModel(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to create chat model: %w", err)
	}

	response, err := chatModel.Generate(ctx, messages)
	if err != nil {
		return nil, fmt.Errorf("failed to generate response: %w", err)
	}

	// 保存AI响应
	aiMessage := &models.ChatMessage{
		ID:          uuid.New().String(),
		SessionID:   sessionID,
		Role:        models.MessageRoleAssistant,
		Content:     response.Content,
		ContentType: models.MessageContentTypeText,
		IsStreaming: false,
		IsComplete:  true,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	if err := s.repo.CreateChatMessage(aiMessage); err != nil {
		return nil, fmt.Errorf("failed to save AI message: %w", err)
	}

	// 更新会话信息
	if err := s.updateSessionAfterMessage(sessionID, response.Content); err != nil {
		log.Printf("failed to update session: %v", err)
	}

	return aiMessage, nil
}

// SendMessageStream 发送消息（流式）
func (s *chatService) SendMessageStream(ctx context.Context, sessionID, message string, callback func(*models.StreamResponse)) error {
	// 保存用户消息
	userMessage := &models.ChatMessage{
		ID:          uuid.New().String(),
		SessionID:   sessionID,
		Role:        models.MessageRoleUser,
		Content:     message,
		ContentType: models.MessageContentTypeText,
		IsStreaming: false,
		IsComplete:  true,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	if err := s.repo.CreateChatMessage(userMessage); err != nil {
		callback(&models.StreamResponse{
			Type:  models.StreamTypeError,
			Error: fmt.Sprintf("failed to save user message: %v", err),
		})
		return err
	}

	// 获取历史消息
	historyResp, err := s.GetMessages(ctx, sessionID, 20, 0)
	if err != nil {
		callback(&models.StreamResponse{
			Type:  models.StreamTypeError,
			Error: fmt.Sprintf("failed to get message history: %v", err),
		})
		return err
	}

	// 转换为聊天模型所需的格式
	messages := s.convertToSchemaMessages(historyResp.Messages)

	// 创建聊天模型
	chatModel, err := model.NewChatModel(ctx)
	if err != nil {
		callback(&models.StreamResponse{
			Type:  models.StreamTypeError,
			Error: fmt.Sprintf("failed to create chat model: %v", err),
		})
		return err
	}

	// 创建AI消息记录
	aiMessageID := uuid.New().String()
	aiMessage := &models.ChatMessage{
		ID:          aiMessageID,
		SessionID:   sessionID,
		Role:        models.MessageRoleAssistant,
		Content:     "",
		ContentType: models.MessageContentTypeText,
		IsStreaming: true,
		IsComplete:  false,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	if err := s.repo.CreateChatMessage(aiMessage); err != nil {
		callback(&models.StreamResponse{
			Type:  models.StreamTypeError,
			Error: fmt.Sprintf("failed to create AI message: %v", err),
		})
		return err
	}

	// 开始流式生成
	stream, err := chatModel.Stream(ctx, messages)
	if err != nil {
		callback(&models.StreamResponse{
			Type:  models.StreamTypeError,
			Error: fmt.Sprintf("failed to start stream: %v", err),
		})
		return err
	}

	defer stream.Close()

	var fullContent string
	for {
		msg, err := stream.Recv()
		if err == io.EOF {
			// 流结束
			break
		}
		if err != nil {
			callback(&models.StreamResponse{
				Type:      models.StreamTypeError,
				Error:     fmt.Sprintf("stream error: %v", err),
				MessageID: aiMessageID,
			})
			return err
		}

		// 累积内容
		fullContent += msg.Content

		// 发送流式响应
		callback(&models.StreamResponse{
			Type:      models.StreamTypeMessage,
			MessageID: aiMessageID,
			Data: models.ChatResponse{
				SessionID:  sessionID,
				MessageID:  aiMessageID,
				Content:    msg.Content,
				Role:       models.MessageRoleAssistant,
				IsStream:   true,
				IsComplete: false,
			},
		})
	}

	// 更新完成的消息
	aiMessage.Content = fullContent
	aiMessage.IsStreaming = false
	aiMessage.IsComplete = true
	aiMessage.UpdatedAt = time.Now()

	if err := s.repo.UpdateChatMessage(aiMessage); err != nil {
		log.Printf("failed to update AI message: %v", err)
	}

	// 发送完成信号
	callback(&models.StreamResponse{
		Type:      models.StreamTypeComplete,
		MessageID: aiMessageID,
		Data: models.ChatResponse{
			SessionID:  sessionID,
			MessageID:  aiMessageID,
			Content:    fullContent,
			Role:       models.MessageRoleAssistant,
			IsStream:   false,
			IsComplete: true,
		},
	})

	// 更新会话信息
	if err := s.updateSessionAfterMessage(sessionID, fullContent); err != nil {
		log.Printf("failed to update session: %v", err)
	}

	return nil
}

// GetMessages 获取消息历史
func (s *chatService) GetMessages(ctx context.Context, sessionID string, limit, offset int) (*models.ChatMessageListResponse, error) {
	messages, err := s.repo.GetChatMessages(sessionID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to get messages: %w", err)
	}

	total, err := s.repo.GetChatMessageCount(sessionID)
	if err != nil {
		return nil, fmt.Errorf("failed to get message count: %w", err)
	}

	return &models.ChatMessageListResponse{
		Messages: messages,
		Total:    total,
		HasMore:  offset+len(messages) < total,
	}, nil
}

// GenerateTitle 生成会话标题
func (s *chatService) GenerateTitle(ctx context.Context, message string) (string, error) {
	chatModel, err := model.NewChatModel(ctx)
	if err != nil {
		return "", fmt.Errorf("failed to create chat model: %w", err)
	}

	titlePrompt := []*schema.Message{
		{Role: "system", Content: "你是一个专业的标题生成助手。根据用户的输入，生成一个简洁、准确的对话标题，不超过20个字符。只返回标题，不要其他内容。"},
		{Role: "user", Content: fmt.Sprintf("请为以下内容生成标题：%s", message)},
	}

	response, err := chatModel.Generate(ctx, titlePrompt)
	if err != nil {
		return "", fmt.Errorf("failed to generate title: %w", err)
	}

	return response.Content, nil
}

// GenerateTags 生成标签
func (s *chatService) GenerateTags(ctx context.Context, message string) ([]string, error) {
	chatModel, err := model.NewChatModel(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to create chat model: %w", err)
	}

	input := []*schema.Message{
		{Role: "user", Content: message},
	}

	tagsPrompt, err := model.ChatPromptLabel(ctx, input)
	if err != nil {
		return nil, fmt.Errorf("failed to create tags prompt: %w", err)
	}

	response, err := chatModel.Generate(ctx, tagsPrompt)
	if err != nil {
		return nil, fmt.Errorf("failed to generate tags: %w", err)
	}

	// 解析JSON响应
	var result struct {
		Tags []string `json:"tags"`
	}
	if err := json.Unmarshal([]byte(response.Content), &result); err != nil {
		return nil, fmt.Errorf("failed to parse tags response: %w", err)
	}

	return result.Tags, nil
}

// convertToSchemaMessages 转换消息格式
func (s *chatService) convertToSchemaMessages(messages []models.ChatMessage) []*schema.Message {
	schemaMessages := make([]*schema.Message, len(messages))
	for i, msg := range messages {
		schemaMessages[i] = &schema.Message{
			Role:    schema.RoleType(msg.Role),
			Content: msg.Content,
		}
	}
	return schemaMessages
}

// updateSessionAfterMessage 在消息发送后更新会话信息
func (s *chatService) updateSessionAfterMessage(sessionID, lastMessage string) error {
	return s.repo.UpdateChatSessionAfterMessage(sessionID, lastMessage)
}
