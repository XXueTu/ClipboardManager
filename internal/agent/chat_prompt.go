package model

import (
	"context"
	"log"

	"github.com/cloudwego/eino/components/prompt"
	"github.com/cloudwego/eino/schema"
)

func ChatPromptBase(ctx context.Context, input string, history []*schema.Message) ([]*schema.Message, error) {

	var inputMsg = []*schema.Message{
		{Role: "user", Content: input},
	}

	chatTpl := prompt.FromMessages(schema.FString,
		schema.MessagesPlaceholder("message_histories", true),
		schema.UserMessage("{user_input}"),
	)

	msgList, err := chatTpl.Format(ctx, map[string]any{
		"user_input":        inputMsg,
		"message_histories": history,
	})
	if err != nil {
		log.Printf("Format failed, err=%v", err)
		return nil, err
	}
	return msgList, nil
}

func ChatPromptSummarize(ctx context.Context, input []*schema.Message, history []*schema.Message) ([]*schema.Message, error) {

	systemTpl := `你是一个专业的内容分析助手，你的任务是根据用户的输入和输入的历史消息，生成一段总结,原来精确概括全文内容，不要遗漏任何细节。用户输入：{user_input}`

	chatTpl := prompt.FromMessages(schema.FString,
		schema.SystemMessage(systemTpl),
		schema.MessagesPlaceholder("message_histories", true),
		schema.UserMessage("{user_input}"),
	)

	// 创建一个新的 slice 来存储修改后的 history
	modifiedHistory := make([]*schema.Message, len(history))
	copy(modifiedHistory, history)
	modifiedHistory = append(modifiedHistory, schema.AssistantMessage("这是上文总结的内容,用来补充上下文", nil))

	msgList, err := chatTpl.Format(ctx, map[string]any{
		"user_input":        input,
		"message_histories": modifiedHistory,
	})
	if err != nil {
		log.Printf("Format failed, err=%v", err)
		return nil, err
	}
	return msgList, nil
}

func ChatPromptLabel(ctx context.Context, input []*schema.Message) ([]*schema.Message, error) {

	systemTpl := "你是一个专业的内容分类助手，你的任务是根据用户的输入，生成最多5个的标签。用户输入：{user_input},你只能输出纯 JSON，不要包含任何额外文本、注释或格式标记（如 ```json ```）。请严格输出一个 JSON 格式的结果，不要包含任何额外文本,json key是 tags,value 是字符串数组"

	chatTpl := prompt.FromMessages(schema.FString,
		schema.SystemMessage(systemTpl),
		schema.UserMessage("{user_input}"),
	)
	msgList, err := chatTpl.Format(ctx, map[string]any{
		"user_input": input,
	})
	if err != nil {
		log.Printf("Format failed, err=%v", err)
		return nil, err
	}
	return msgList, nil
}
