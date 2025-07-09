package clipboard

import (
	"log"
	"strings"
	"time"

	clipboardPkg "github.com/atotto/clipboard"
	"github.com/google/uuid"
	"github.com/jbrukh/bayesian"

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
type analyzer struct {
	classifier *bayesian.Classifier
}

// NewAnalyzer 创建新的内容分析器
func NewAnalyzer() Analyzer {
	// 定义分类类别
	classifier := bayesian.NewClassifier(
		bayesian.Class(models.CategoryDefault),
		bayesian.Class(models.CategoryURL),
		bayesian.Class(models.CategoryFile),
		bayesian.Class(models.CategoryEmail),
		bayesian.Class(models.CategoryPhone),
		bayesian.Class(models.CategoryCode),
		bayesian.Class(models.CategoryNote),
		bayesian.Class(models.CategoryCommand),
		bayesian.Class(models.CategoryJson),
		bayesian.Class(models.CategoryID),
		bayesian.Class(models.CategoryAddress),
		bayesian.Class(models.CategoryNumber),
	)

	// 训练分类器
	trainClassifier(classifier)

	return &analyzer{
		classifier: classifier,
	}
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
func (a *analyzer) AutoDetectCategory(content string) string {
	// 使用贝叶斯分类器进行智能分类
	words := strings.Fields(strings.ToLower(content))
	if len(words) == 0 {
		return models.CategoryDefault
	}

	// 获取分类结果
	scores, likely, _ := a.classifier.LogScores(words)
	if len(scores) == 0 {
		log.Printf("分类失败: 无法获取分类结果")
		return models.CategoryDefault
	}

	// 如果置信度太低，使用启发式规则
	if len(scores) > 0 && scores[0] < -10 {
		return a.fallbackClassification(content)
	}

	return string(likely)
}

// fallbackClassification 启发式分类规则（作为贝叶斯分类的后备方案）
func (a *analyzer) fallbackClassification(content string) string {
	lower := strings.ToLower(content)
	
	// URL检测
	if strings.HasPrefix(content, "http://") || strings.HasPrefix(content, "https://") || strings.Contains(lower, "www.") {
		return models.CategoryURL
	}
	
	// 文件路径检测
	if strings.Contains(content, "/") && (strings.Contains(content, ".") || strings.HasPrefix(content, "/")) {
		return models.CategoryFile
	}
	
	// 邮箱检测
	if strings.Contains(content, "@") && strings.Contains(content, ".") && !strings.Contains(content, " ") {
		return models.CategoryEmail
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
			return models.CategoryPhone
		}
	}
	
	// JSON检测
	if strings.HasPrefix(strings.TrimSpace(content), "{") && strings.HasSuffix(strings.TrimSpace(content), "}") {
		return models.CategoryJson
	}
	
	// 代码检测
	if strings.Contains(lower, "function") || strings.Contains(lower, "class") || strings.Contains(lower, "import") || strings.Contains(lower, "package") {
		return models.CategoryCode
	}
	
	// 命令检测
	if strings.HasPrefix(content, "sudo ") || strings.HasPrefix(content, "git ") || strings.HasPrefix(content, "npm ") || strings.HasPrefix(content, "docker ") {
		return models.CategoryCommand
	}
	
	// ID检测（长度合适且包含字母数字组合）
	if len(content) >= 10 && len(content) <= 50 && !strings.Contains(content, " ") {
		hasLetter := false
		hasNumber := false
		for _, char := range content {
			if (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') {
				hasLetter = true
			}
			if char >= '0' && char <= '9' {
				hasNumber = true
			}
		}
		if hasLetter && hasNumber {
			return models.CategoryID
		}
	}
	
	// 地址检测
	if strings.Contains(lower, "省") || strings.Contains(lower, "市") || strings.Contains(lower, "区") || strings.Contains(lower, "县") || strings.Contains(lower, "街道") {
		return models.CategoryAddress
	}
	
	// 纯数字检测
	if len(content) > 0 && strings.TrimSpace(content) != "" {
		isNumber := true
		for _, char := range strings.TrimSpace(content) {
			if !(char >= '0' && char <= '9') && char != '.' && char != '-' && char != '+' {
				isNumber = false
				break
			}
		}
		if isNumber {
			return models.CategoryNumber
		}
	}
	
	return models.CategoryDefault
}

// trainClassifier 训练贝叶斯分类器
func trainClassifier(classifier *bayesian.Classifier) {
	// 训练URL分类
	urlSamples := []string{
		"http://example.com", "https://www.google.com", "https://github.com/user/repo",
		"www.baidu.com", "api.example.com", "cdn.jsdelivr.net",
	}
	for _, sample := range urlSamples {
		classifier.Learn(strings.Fields(strings.ToLower(sample)), bayesian.Class(models.CategoryURL))
	}
	
	// 训练文件路径分类
	fileSamples := []string{
		"/home/user/document.txt", "/var/log/system.log", "C:\\Users\\User\\file.pdf",
		"./src/main.go", "../config/app.yaml", "/tmp/temp.json",
	}
	for _, sample := range fileSamples {
		classifier.Learn(strings.Fields(strings.ToLower(sample)), bayesian.Class(models.CategoryFile))
	}
	
	// 训练邮箱分类
	emailSamples := []string{
		"user@example.com", "admin@company.org", "support@service.net",
		"info@website.com", "contact@business.co", "hello@startup.io",
	}
	for _, sample := range emailSamples {
		classifier.Learn(strings.Fields(strings.ToLower(sample)), bayesian.Class(models.CategoryEmail))
	}
	
	// 训练电话分类
	phoneSamples := []string{
		"138-8888-8888", "400-123-4567", "+86 138 8888 8888",
		"(010) 6666-7777", "13888888888", "021-12345678",
	}
	for _, sample := range phoneSamples {
		classifier.Learn(strings.Fields(strings.ToLower(sample)), bayesian.Class(models.CategoryPhone))
	}
	
	// 训练代码分类
	codeSamples := []string{
		"function main() { return 0; }", "class MyClass { public void method(); }",
		"import java.util.*; public class", "package main import fmt",
		"def function_name(): return None", "const variable = 'value';",
	}
	for _, sample := range codeSamples {
		classifier.Learn(strings.Fields(strings.ToLower(sample)), bayesian.Class(models.CategoryCode))
	}
	
	// 训练笔记分类
	noteSamples := []string{
		"今天的会议记录", "学习笔记：数据结构", "待办事项列表",
		"重要提醒事项", "会议纪要", "学习总结",
	}
	for _, sample := range noteSamples {
		classifier.Learn(strings.Fields(strings.ToLower(sample)), bayesian.Class(models.CategoryNote))
	}
	
	// 训练命令分类
	commandSamples := []string{
		"sudo apt-get install", "git clone repository", "npm install package",
		"docker run image", "kubectl get pods", "ssh user@server",
	}
	for _, sample := range commandSamples {
		classifier.Learn(strings.Fields(strings.ToLower(sample)), bayesian.Class(models.CategoryCommand))
	}
	
	// 训练JSON分类
	jsonSamples := []string{
		"{\"name\": \"value\", \"key\": \"data\"}", "[{\"id\": 1, \"name\": \"item\"}]",
		"{\"config\": {\"port\": 8080}}", "{\"status\": \"success\", \"data\": []}",
	}
	for _, sample := range jsonSamples {
		classifier.Learn(strings.Fields(strings.ToLower(sample)), bayesian.Class(models.CategoryJson))
	}
	
	// 训练ID分类
	idSamples := []string{
		"abc123def456", "user_id_12345", "session_token_abcdef",
		"order_20231101_001", "uuid_a1b2c3d4", "auth_token_xyz789",
	}
	for _, sample := range idSamples {
		classifier.Learn(strings.Fields(strings.ToLower(sample)), bayesian.Class(models.CategoryID))
	}
	
	// 训练地址分类
	addressSamples := []string{
		"北京市海淀区中关村", "上海市浦东新区陆家嘴", "广东省深圳市南山区",
		"江苏省南京市玄武区", "浙江省杭州市西湖区", "四川省成都市锦江区",
	}
	for _, sample := range addressSamples {
		classifier.Learn(strings.Fields(strings.ToLower(sample)), bayesian.Class(models.CategoryAddress))
	}
	
	// 训练数字分类
	numberSamples := []string{
		"123456", "3.14159", "-42", "+86", "1000000", "0.618",
	}
	for _, sample := range numberSamples {
		classifier.Learn(strings.Fields(strings.ToLower(sample)), bayesian.Class(models.CategoryNumber))
	}
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
	category := models.CategoryDefault
	var tags []string // 标签默认为空，后续使用AI生成

	if b.settings.AutoCategorize {
		category = b.analyzer.AutoDetectCategory(content)
	} else {
		category = b.settings.DefaultCategory
	}

	return models.ClipboardItem{
		ID:         uuid.New().String(),
		Content:    content,
		Title:      b.analyzer.GenerateTitle(content),
		Tags:       tags,
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
