package clipboard

import (
	"log"
	"strings"
	"time"

	"github.com/atotto/clipboard"
	"github.com/google/uuid"
	"github.com/jbrukh/bayesian"

	"Sid/internal/models"
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
	GenerateTitle(content string) string
	AutoDetectCategory(content string) string
	IsLikelyPassword(content string) bool
}

// monitor 剪切板监听器实现
type monitor struct {
	isRunning      bool
	stopChan       chan bool
	lastClipboard  string
	processor      ContentProcessor
	analyzer       Analyzer
	settings       *models.Settings
	tickerInterval time.Duration
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
			if content, err := clipboard.ReadAll(); err == nil {
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
type analyzer struct {
	classifier *bayesian.Classifier
}

// NewAnalyzer 创建新的内容分析器
func NewAnalyzer() Analyzer {
	// 定义分类类别(简化版 - 仅6个基础类型)
	classifier := bayesian.NewClassifier(
		bayesian.Class(models.CategoryText),
		bayesian.Class(models.CategoryFile),
		bayesian.Class(models.CategoryURL),
		bayesian.Class(models.CategoryPath),
		bayesian.Class(models.CategoryEmail),
		bayesian.Class(models.CategoryNumber),
	)
	return &analyzer{
		classifier: classifier,
	}
}

// GenerateTitle 生成标题
func (a *analyzer) GenerateTitle(content string) string {
	title := content
	if len(title) > 10 {
		title = title[:10] + "..."
	}

	// 替换换行符
	title = strings.ReplaceAll(title, "\n", " ")
	title = strings.ReplaceAll(title, "\r", " ")

	// 清理多余空格
	title = strings.TrimSpace(title)

	return title
}

// AutoDetectCategory 自动检测分类 - 简化版本
func (a *analyzer) AutoDetectCategory(content string) string {
	// 性能优化：超过50个字符直接返回文本类型
	if len(content) > 50 {
		return models.CategoryText
	}

	// 使用简化的启发式规则进行分类
	return a.fallbackClassification(content)
}

// fallbackClassification 简化的启发式分类规则 - 仅保留6个基础类型
func (a *analyzer) fallbackClassification(content string) string {
	lower := strings.ToLower(content)
	trimmed := strings.TrimSpace(content)

	// 1. 网站检测 (优先级最高)
	if strings.HasPrefix(content, "http://") || strings.HasPrefix(content, "https://") || strings.Contains(lower, "www.") {
		return models.CategoryURL
	}

	// 2. 邮箱检测
	if strings.Contains(content, "@") && strings.Contains(content, ".") && !strings.Contains(content, " ") {
		return models.CategoryEmail
	}

	// 3. 纯数字检测
	if len(trimmed) > 0 {
		isNumber := true
		for _, char := range trimmed {
			if !(char >= '0' && char <= '9') && char != '.' && char != '-' && char != '+' && char != ',' {
				isNumber = false
				break
			}
		}
		if isNumber {
			return models.CategoryNumber
		}
	}

	// 4. 文件检测 (使用后缀匹配)
	if strings.Contains(content, ".") && !strings.Contains(content, " ") {
		parts := strings.Split(content, ".")
		if len(parts) >= 2 {
			ext := strings.ToLower(parts[len(parts)-1])
			// 常见文件扩展名
			fileExts := []string{
				"txt", "doc", "docx", "pdf", "xls", "xlsx", "ppt", "pptx",
				"jpg", "jpeg", "png", "gif", "bmp", "svg", "webp",
				"mp4", "mp3", "avi", "mov", "wav", "flac",
				"zip", "rar", "7z", "tar", "gz",
				"html", "css", "js", "json", "xml", "yaml", "yml",
				"go", "py", "java", "cpp", "c", "h", "rs", "swift",
				"exe", "app", "dmg", "deb", "rpm",
			}
			for _, validExt := range fileExts {
				if ext == validExt {
					return models.CategoryFile
				}
			}
		}
	}

	// 5. 路径检测
	if strings.Contains(content, "/") && (strings.HasPrefix(content, "/") || strings.HasPrefix(content, "~") || strings.HasPrefix(content, ".")) {
		return models.CategoryPath
	}

	// 6. 默认为文本类型
	return models.CategoryText
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
	category := models.CategoryText

	if b.settings.AutoCategorize {
		category = b.analyzer.AutoDetectCategory(content)
	} else {
		category = b.settings.DefaultCategory
	}

	return models.ClipboardItem{
		ID:         uuid.New().String(),
		Content:    content,
		Title:      b.analyzer.GenerateTitle(content),
		Tags:       []models.Tag{}, // 标签在创建后通过关联表添加
		Category:   category,
		IsFavorite: false,
		UseCount:   0,
		IsDeleted:  false,
		DeletedAt:  nil,
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
		LastUsedAt: time.Now(),
	}
}
