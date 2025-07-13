package model

import (
	"context"
	"log"
	"os"

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

// getModelConfig 获取模型配置，支持环境变量
func getModelConfig() *ChatModelConfig {
	// 尝试从环境变量获取配置
	baseURL := os.Getenv("CHAT_MODEL_BASE_URL")
	apiKey := os.Getenv("CHAT_MODEL_API_KEY")
	modelName := os.Getenv("CHAT_MODEL_NAME")

	// 如果环境变量不存在，使用默认配置
	if baseURL == "" {
		baseURL = "https://ark.cn-beijing.volces.com/api/v3"
	}
	if apiKey == "" {
		apiKey = "9567f3a1-7e2e-4fa7-a8db-5a7ee0926d79"
	}
	if modelName == "" {
		modelName = "doubao-1-5-pro-32k-250115"
	}

	return &ChatModelConfig{
		BaseURL: baseURL,
		APIKey:  apiKey,
		Model:   modelName,
	}
}

// newChatModel component initialization function of node 'CustomChatModel1' in graph 'dev'
func NewChatModel(ctx context.Context) (cm model.ToolCallingChatModel, err error) {
	config := getModelConfig()

	log.Printf("🤖 正在初始化聊天模型...")
	log.Printf("🔧 BaseURL: %s", config.BaseURL)
	log.Printf("🔧 Model: %s", config.Model)
	log.Printf("🔧 APIKey: %s...", maskAPIKey(config.APIKey))

	opcm, err := openai.NewChatModel(ctx, &openai.ChatModelConfig{
		BaseURL: config.BaseURL,
		APIKey:  config.APIKey,
		Model:   config.Model,
	})
	if err != nil {
		log.Printf("❌ 初始化ChatModel失败: %v", err)
		log.Printf("💡 请检查网络连接和API密钥是否正确")
		log.Printf("💡 您可以通过以下环境变量自定义配置:")
		log.Printf("   - CHAT_MODEL_BASE_URL: API基础URL")
		log.Printf("   - CHAT_MODEL_API_KEY: API密钥")
		log.Printf("   - CHAT_MODEL_NAME: 模型名称")
		return nil, err
	}

	cm = &ChatModelImpl{config: config, model: opcm}
	log.Printf("✅ 聊天模型初始化成功")
	return cm, nil
}

// maskAPIKey 掩码API密钥用于日志显示
func maskAPIKey(apiKey string) string {
	if len(apiKey) <= 10 {
		return apiKey
	}
	return apiKey[:10] + "..."
}

func (c *ChatModelImpl) Generate(ctx context.Context, input []*schema.Message, opts ...model.Option) (*schema.Message, error) {
	return c.model.Generate(ctx, input, opts...)
}

func (c *ChatModelImpl) Stream(ctx context.Context, input []*schema.Message, opts ...model.Option) (*schema.StreamReader[*schema.Message], error) {
	return c.model.Stream(ctx, input, opts...)
}

func (c *ChatModelImpl) WithTools(tools []*schema.ToolInfo) (model.ToolCallingChatModel, error) {
	return c.model.WithTools(tools)
}
