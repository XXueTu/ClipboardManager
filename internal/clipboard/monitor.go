package clipboard

import (
	"log"
	"strings"
	"time"

	clipboardPkg "github.com/atotto/clipboard"
	"github.com/google/uuid"

	"react-wails-app/internal/models"
)

// Monitor 剪切板监听器接口
type Monitor interface {
	Start() error
	Stop()
	IsRunning() bool
	SetProcessor(processor ContentProcessor)
}

// ContentProcessor 内容处理器接口
type ContentProcessor interface {
	ProcessContent(content string) error
}

// Analyzer 内容分析器接口
type Analyzer interface {
	DetectContentType(content string) string
	GenerateTitle(content string) string
	AutoDetectCategory(content string, contentType string) string
	AutoGenerateTags(content string, contentType string) []string
	IsLikelyPassword(content string) bool
}

// monitor 剪切板监听器实现
type monitor struct {
	isRunning       bool
	stopChan        chan bool
	lastClipboard   string
	processor       ContentProcessor
	analyzer        Analyzer
	settings        *models.Settings
	tickerInterval  time.Duration
}

// NewMonitor 创建新的剪切板监听器
func NewMonitor(settings *models.Settings) Monitor {
	return &monitor{
		stopChan:       make(chan bool),
		analyzer:       NewAnalyzer(),
		settings:       settings,
		tickerInterval: 500 * time.Millisecond,
	}
}

// SetProcessor 设置内容处理器
func (m *monitor) SetProcessor(processor ContentProcessor) {
	m.processor = processor
}

// Start 开始监听剪切板
func (m *monitor) Start() error {
	if m.isRunning {
		return nil
	}

	if m.processor == nil {
		log.Println("⚠️  剪切板监听器缺少内容处理器")
		return nil
	}

	m.isRunning = true
	go m.monitorLoop()
	log.Println("🎯 开始监听剪切板...")
	return nil
}

// Stop 停止监听剪切板
func (m *monitor) Stop() {
	if !m.isRunning {
		return
	}

	m.stopChan <- true
	m.isRunning = false
	log.Println("🛑 停止监听剪切板")
}

// IsRunning 检查是否正在运行
func (m *monitor) IsRunning() bool {
	return m.isRunning
}

// monitorLoop 监听循环
func (m *monitor) monitorLoop() {
	ticker := time.NewTicker(m.tickerInterval)
	defer ticker.Stop()

	for {
		select {
		case <-m.stopChan:
			return
		case <-ticker.C:
			if content, err := clipboardPkg.ReadAll(); err == nil {
				if content != "" && content != m.lastClipboard {
					m.lastClipboard = content
					m.processClipboardContent(content)
				}
			}
		}
	}
}

// processClipboardContent 处理剪切板内容
func (m *monitor) processClipboardContent(content string) {
	// 过滤敏感内容
	if m.settings.IgnorePasswords && m.analyzer.IsLikelyPassword(content) {
		log.Println("🚫 跳过疑似密码内容")
		return
	}

	// 处理内容
	if err := m.processor.ProcessContent(content); err != nil {
		log.Printf("❌ 处理剪切板内容失败: %v", err)
	}
}

// analyzer 内容分析器实现
type analyzer struct{}

// NewAnalyzer 创建新的内容分析器
func NewAnalyzer() Analyzer {
	return &analyzer{}
}

// DetectContentType 检测内容类型
func (a *analyzer) DetectContentType(content string) string {
	// URL检测
	if strings.HasPrefix(content, "http://") || strings.HasPrefix(content, "https://") {
		return models.ContentTypeURL
	}

	// 文件路径检测
	if strings.Contains(content, "/") && (strings.Contains(content, ".") || strings.HasPrefix(content, "/")) {
		return models.ContentTypeFile
	}

	// 邮箱检测
	if strings.Contains(content, "@") && strings.Contains(content, ".") {
		return models.ContentTypeEmail
	}

	// 电话号码检测
	if len(content) >= 10 && strings.ContainsAny(content, "0123456789-+() ") {
		digitCount := 0
		for _, char := range content {
			if char >= '0' && char <= '9' {
				digitCount++
			}
		}
		if digitCount >= 10 {
			return models.ContentTypePhone
		}
	}

	// 默认文本
	return models.ContentTypeText
}

// GenerateTitle 生成标题
func (a *analyzer) GenerateTitle(content string) string {
	title := content
	if len(title) > 50 {
		title = title[:50] + "..."
	}

	// 替换换行符
	title = strings.ReplaceAll(title, "\n", " ")
	title = strings.ReplaceAll(title, "\r", " ")

	// 清理多余空格
	title = strings.TrimSpace(title)

	return title
}

// AutoDetectCategory 自动检测分类
func (a *analyzer) AutoDetectCategory(content string, contentType string) string {
	switch contentType {
	case models.ContentTypeURL:
		return models.CategoryURL
	case models.ContentTypeFile:
		return models.CategoryFile
	case models.ContentTypeEmail:
		return models.CategoryEmail
	case models.ContentTypePhone:
		return models.CategoryPhone
	default:
		// 根据内容关键词分类
		lower := strings.ToLower(content)
		if strings.Contains(lower, "password") || strings.Contains(lower, "密码") {
			return models.CategoryPassword
		}
		if strings.Contains(lower, "code") || strings.Contains(lower, "代码") {
			return models.CategoryCode
		}
		if strings.Contains(lower, "note") || strings.Contains(lower, "笔记") {
			return models.CategoryNote
		}
		return models.CategoryDefault
	}
}

// AutoGenerateTags 自动生成标签
func (a *analyzer) AutoGenerateTags(content string, contentType string) []string {
	var tags []string

	// 根据内容类型添加标签
	tags = append(tags, contentType)

	// 根据长度添加标签
	if len(content) > 200 {
		tags = append(tags, "长文本")
	} else if len(content) < 20 {
		tags = append(tags, "短文本")
	}

	// 根据时间添加标签
	now := time.Now()
	if now.Hour() < 6 || now.Hour() > 22 {
		tags = append(tags, "深夜")
	} else if now.Hour() >= 9 && now.Hour() <= 17 {
		tags = append(tags, "工作时间")
	}

	return tags
}

// IsLikelyPassword 检查是否像密码
func (a *analyzer) IsLikelyPassword(content string) bool {
	// 简单的密码检测逻辑
	if len(content) < 4 || len(content) > 100 {
		return false
	}

	// 包含常见密码特征
	hasUpper := strings.ContainsAny(content, "ABCDEFGHIJKLMNOPQRSTUVWXYZ")
	hasLower := strings.ContainsAny(content, "abcdefghijklmnopqrstuvwxyz")
	hasNumber := strings.ContainsAny(content, "0123456789")
	hasSpecial := strings.ContainsAny(content, "!@#$%^&*()_+-=[]{}|;':\",./<>?")

	// 如果包含3种以上字符类型且长度适中，可能是密码
	charTypes := 0
	if hasUpper {
		charTypes++
	}
	if hasLower {
		charTypes++
	}
	if hasNumber {
		charTypes++
	}
	if hasSpecial {
		charTypes++
	}

	return charTypes >= 3 && len(content) >= 8 && len(content) <= 50
}

// ItemBuilder 剪切板条目构建器
type ItemBuilder struct {
	analyzer Analyzer
	settings *models.Settings
}

// NewItemBuilder 创建新的条目构建器
func NewItemBuilder(analyzer Analyzer, settings *models.Settings) *ItemBuilder {
	return &ItemBuilder{
		analyzer: analyzer,
		settings: settings,
	}
}

// BuildItem 构建剪切板条目
func (b *ItemBuilder) BuildItem(content string) models.ClipboardItem {
	contentType := b.analyzer.DetectContentType(content)
	category := models.CategoryDefault
	var tags []string

	if b.settings.AutoCategorize {
		category = b.analyzer.AutoDetectCategory(content, contentType)
		tags = b.analyzer.AutoGenerateTags(content, contentType)
	} else {
		category = b.settings.DefaultCategory
	}

	return models.ClipboardItem{
		ID:          uuid.New().String(),
		Content:     content,
		ContentType: contentType,
		Title:       b.analyzer.GenerateTitle(content),
		Tags:        tags,
		Category:    category,
		IsFavorite:  false,
		UseCount:    0,
		IsDeleted:   false,
		DeletedAt:   nil,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
		LastUsedAt:  time.Now(),
	}
}