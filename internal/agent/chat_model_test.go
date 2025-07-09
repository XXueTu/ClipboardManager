package model

import (
	"context"
	"io"
	"log"
	"testing"

	"github.com/cloudwego/eino/schema"
)

func TestChatModelImpl_Stream(t *testing.T) {
	var ctx = context.Background()
	cm, err := NewChatModel(ctx)
	if err != nil {
		t.Fatal(err)
	}
	var input = []*schema.Message{
		{Role: "user", Content: "你好，你能帮我做什么?"},
	}
	prompt, err := ChatPromptLabel(ctx, input)
	if err != nil {
		t.Fatal(err)
	}
	resultStream, err := cm.Stream(ctx, prompt)
	if err != nil {
		t.Fatal(err)
	}
	i := 0
	for {
		message, err := resultStream.Recv()
		if err == io.EOF { // 流式输出结束
			break
		}
		if err != nil {
			log.Fatalf("recv failed: %v", err)
		}
		log.Printf("message[%d]: %+v\n", i, message)
		i++
	}
	resultStream.Close()
}
