package window

import (
	"context"
	"fmt"
	"math"
	"time"

	hook "github.com/robotn/gohook"
	"github.com/wailsapp/wails/v2/pkg/runtime"

	"react-wails-app/internal/models"
)

// Manager 窗口管理器接口
type Manager interface {
	Initialize(ctx context.Context, settings *models.Settings) error
	SetScreenSize(width, height int)
	ShowWindow()
	HideWindow()
	ToggleWindow()
	GetState() models.WindowState
	RegisterHotkeys(settings *models.Settings)
	IsVisible() bool
	IsAnimating() bool
	OptimizeForPlatform() // 新增：平台优化
}

// manager 窗口管理器实现
type manager struct {
	ctx          context.Context
	isVisible    bool
	isAnimating  bool
	screenWidth  int
	screenHeight int
	settings     *models.Settings
	windowWidth  int // 新增：窗口宽度
	windowHeight int // 新增：窗口高度
}

// NewManager 创建新的窗口管理器
func NewManager() Manager {
	return &manager{
		screenWidth:  1920,
		screenHeight: 1080,
		windowWidth:  500,  // 默认宽度
		windowHeight: 1080, // 默认高度
	}
}

// Initialize 初始化窗口管理器
func (m *manager) Initialize(ctx context.Context, settings *models.Settings) error {
	m.ctx = ctx
	m.settings = settings

	// 平台优化
	m.OptimizeForPlatform()

	// 初始化侧边栏
	go m.initializeSidebar()

	// 注册全局快捷键
	go m.RegisterHotkeys(settings)

	return nil
}

// OptimizeForPlatform 平台特定优化
func (m *manager) OptimizeForPlatform() {
	if m.ctx == nil {
		return
	}

	// 设置窗口居中（首次启动时）
	// runtime.WindowCenter(m.ctx)

	// 设置窗口完全透明背景
	runtime.WindowSetBackgroundColour(m.ctx, 0, 0, 0, 0)

	// 确保窗口层级正确
	runtime.WindowSetAlwaysOnTop(m.ctx, true)
}

// SetScreenSize 设置屏幕大小
func (m *manager) SetScreenSize(width, height int) {
	m.screenWidth = width
	m.screenHeight = height

	// 根据屏幕尺寸调整窗口大小
	m.windowHeight = min(height, 1080)
	m.windowWidth = min(500, width/4) // 最大不超过屏幕宽度的1/4

	if m.ctx != nil {
		runtime.WindowSetSize(m.ctx, m.windowWidth, m.windowHeight)
	}
}

// initializeSidebar 初始化侧边栏
func (m *manager) initializeSidebar() {
	time.Sleep(300 * time.Millisecond)

	if m.ctx == nil {
		return
	}

	// 平台优化设置
	m.OptimizeForPlatform()

	var hiddenX int
	if m.settings.Position == "left" {
		hiddenX = -m.windowWidth
	} else {
		hiddenX = m.screenWidth
	}

	// 计算垂直居中位置
	centerY := (m.screenHeight - m.windowHeight) / 2
	if centerY < 0 {
		centerY = 0
	}

	runtime.WindowSetPosition(m.ctx, hiddenX, centerY)
	runtime.WindowSetSize(m.ctx, m.windowWidth, m.windowHeight)
	runtime.WindowShow(m.ctx)
}

// RegisterHotkeys 注册全局快捷键
func (m *manager) RegisterHotkeys(settings *models.Settings) {
	fmt.Printf("🔑 正在注册全局快捷键: %v\n", settings.MainHotkey)

	hook.Register(hook.KeyDown, settings.MainHotkey, func(e hook.Event) {
		fmt.Printf("🚀 全局快捷键触发: %v\n", settings.MainHotkey)
		m.ToggleWindow()
	})

	hook.Register(hook.KeyDown, settings.EscapeHotkey, func(e hook.Event) {
		if m.isVisible {
			fmt.Printf("🚀 Escape 键触发，隐藏窗口: %v\n", settings.EscapeHotkey)
			m.HideWindow()
		}
	})

	fmt.Println("✅ 全局快捷键注册完成")
	s := hook.Start()
	<-hook.Process(s)
}

// ToggleWindow 切换窗口显示状态
func (m *manager) ToggleWindow() {
	if m.isAnimating {
		return
	}

	if m.isVisible {
		m.HideWindow()
	} else {
		m.ShowWindow()
	}
}

// ShowWindow 显示窗口
func (m *manager) ShowWindow() {
	if m.isAnimating || m.isVisible || m.ctx == nil {
		return
	}

	m.isAnimating = true
	go func() {
		defer func() { m.isAnimating = false }()

		runtime.WindowShow(m.ctx)
		runtime.WindowSetAlwaysOnTop(m.ctx, true)
		runtime.WindowUnminimise(m.ctx)

		var startX, endX int
		centerY := (m.screenHeight - m.windowHeight) / 2
		if centerY < 0 {
			centerY = 0
		}

		if m.settings.Position == "left" {
			startX = -m.windowWidth
			endX = 0
		} else {
			startX = m.screenWidth
			endX = m.screenWidth - m.windowWidth
		}

		m.animateWindow(startX, endX, centerY)
		m.isVisible = true
	}()
}

// HideWindow 隐藏窗口
func (m *manager) HideWindow() {
	if m.isAnimating || !m.isVisible || m.ctx == nil {
		return
	}

	m.isAnimating = true
	go func() {
		defer func() { m.isAnimating = false }()

		var startX, endX int
		centerY := (m.screenHeight - m.windowHeight) / 2
		if centerY < 0 {
			centerY = 0
		}

		if m.settings.Position == "left" {
			startX = 0
			endX = -m.windowWidth
		} else {
			startX = m.screenWidth - m.windowWidth
			endX = m.screenWidth
		}

		m.animateWindow(startX, endX, centerY)
		m.isVisible = false
	}()
}

// animateWindow 增强的窗口动画
func (m *manager) animateWindow(startX, endX, y int) {
	steps := 30                        // 增加步数以获得更流畅的动画
	duration := 250 * time.Millisecond // 稍微缩短动画时间
	stepTime := duration / time.Duration(steps)

	for i := 0; i <= steps; i++ {
		progress := float64(i) / float64(steps)

		// 使用更高级的缓动函数
		var easeProgress float64
		if startX < endX {
			// 显示动画 - 缓出（弹性效果）
			easeProgress = m.easeOutBack(progress)
		} else {
			// 隐藏动画 - 缓入（加速离开）
			easeProgress = m.easeInQuart(progress)
		}

		currentX := startX + int(float64(endX-startX)*easeProgress)
		runtime.WindowSetPosition(m.ctx, currentX, y)

		time.Sleep(stepTime)
	}
}

// easeOutBack 弹性缓出动画
func (m *manager) easeOutBack(t float64) float64 {
	const c1 = 1.70158
	const c3 = c1 + 1
	return 1 + c3*math.Pow(t-1, 3) + c1*math.Pow(t-1, 2)
}

// easeInQuart 四次方缓入动画
func (m *manager) easeInQuart(t float64) float64 {
	return t * t * t * t
}

// GetState 获取窗口状态
func (m *manager) GetState() models.WindowState {
	message := ""
	if m.settings != nil {
		message = fmt.Sprintf("按 %v 切换侧边栏 | 按 %v 隐藏", m.settings.MainHotkey, m.settings.EscapeHotkey)
	}

	position := "left"
	if m.settings != nil {
		position = m.settings.Position
	}

	return models.WindowState{
		Visible:    m.isVisible,
		Animating:  m.isAnimating,
		Message:    message,
		ScreenSize: fmt.Sprintf("%dx%d", m.screenWidth, m.screenHeight),
		Position:   position,
	}
}

// IsVisible 检查窗口是否可见
func (m *manager) IsVisible() bool {
	return m.isVisible
}

// IsAnimating 检查窗口是否正在动画
func (m *manager) IsAnimating() bool {
	return m.isAnimating
}

// min 辅助函数
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
