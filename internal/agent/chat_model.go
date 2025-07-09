package model

import (
	"context"
	"log"

	"github.com/cloudwego/eino-ext/components/model/openai"
	"github.com/cloudwego/eino/components/model"
	"github.com/cloudwego/eino/schema"
)

type ChatModelImpl struct {
	config *ChatModelConfig
	model  *openai.ChatModel
}

type ChatModelConfig struct {
	BaseURL string
	APIKey  string
	Model   string
}

// newChatModel component initialization function of node 'CustomChatModel1' in graph 'dev'
func NewChatModel(ctx context.Context) (cm model.ToolCallingChatModel, err error) {
	config := &ChatModelConfig{
		BaseURL: "https://ark.cn-beijing.volces.com/api/v3",
		APIKey:  "9567f3a1-7e2e-4fa7-a8db-5a7ee0926d79",
		Model:   "doubao-1-5-pro-32k-250115",
	}

	log.Printf("🤖 正在初始化聊天模型...")
	log.Printf("🔧 BaseURL: %s", config.BaseURL)
	log.Printf("🔧 Model: %s", config.Model)
	log.Printf("🔧 APIKey: %s...", config.APIKey[:10])

	opcm, err := openai.NewChatModel(ctx, &openai.ChatModelConfig{
		BaseURL: config.BaseURL,
		APIKey:  config.APIKey,
		Model:   config.Model,
	})
	if err != nil {
		log.Printf("❌ 初始化OpenAI ChatModel失败: %v", err)
		return nil, err
	}

	cm = &ChatModelImpl{config: config, model: opcm}
	log.Printf("✅ 聊天模型初始化成功")
	return cm, nil
}

// Generate implements model.ToolCallingChatModel.
func (c *ChatModelImpl) Generate(ctx context.Context, input []*schema.Message, opts ...model.Option) (*schema.Message, error) {
	return c.model.Generate(ctx, input, opts...)
}

// Stream implements model.ToolCallingChatModel.
func (c *ChatModelImpl) Stream(ctx context.Context, input []*schema.Message, opts ...model.Option) (*schema.StreamReader[*schema.Message], error) {
	log.Println("Stream implements model.ToolCallingChatModel.", input)
	return c.model.Stream(ctx, input, opts...)
}

// WithTools implements model.ToolCallingChatModel.
func (c *ChatModelImpl) WithTools(tools []*schema.ToolInfo) (model.ToolCallingChatModel, error) {
	return c.model.WithTools(tools)
}
