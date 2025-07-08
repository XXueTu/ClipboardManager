package window

import (
	"context"
	"fmt"
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
}

// manager 窗口管理器实现
type manager struct {
	ctx          context.Context
	isVisible    bool
	isAnimating  bool
	screenWidth  int
	screenHeight int
	settings     *models.Settings
}

// NewManager 创建新的窗口管理器
func NewManager() Manager {
	return &manager{
		screenWidth:  1920,
		screenHeight: 1080,
	}
}

// Initialize 初始化窗口管理器
func (m *manager) Initialize(ctx context.Context, settings *models.Settings) error {
	m.ctx = ctx
	m.settings = settings
	
	// 初始化侧边栏
	go m.initializeSidebar()
	
	// 注册全局快捷键
	go m.RegisterHotkeys(settings)
	
	return nil
}

// SetScreenSize 设置屏幕大小
func (m *manager) SetScreenSize(width, height int) {
	m.screenWidth = width
	m.screenHeight = height
	if m.ctx != nil {
		runtime.WindowSetSize(m.ctx, 600, height)
	}
}

// initializeSidebar 初始化侧边栏
func (m *manager) initializeSidebar() {
	time.Sleep(300 * time.Millisecond)
	
	if m.ctx == nil {
		return
	}
	
	runtime.WindowSetAlwaysOnTop(m.ctx, true)

	var hiddenX int
	if m.settings.Position == "left" {
		hiddenX = -600
	} else {
		hiddenX = m.screenWidth
	}

	runtime.WindowSetPosition(m.ctx, hiddenX, 0)
	runtime.WindowSetSize(m.ctx, 600, m.screenHeight)
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
		if m.settings.Position == "left" {
			startX = -600
			endX = 0
		} else {
			startX = m.screenWidth
			endX = m.screenWidth - 600
		}

		m.animateWindow(startX, endX)
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
		if m.settings.Position == "left" {
			startX = 0
			endX = -600
		} else {
			startX = m.screenWidth - 600
			endX = m.screenWidth
		}

		m.animateWindow(startX, endX)
		m.isVisible = false
	}()
}

// animateWindow 窗口动画
func (m *manager) animateWindow(startX, endX int) {
	steps := 20
	duration := 300 * time.Millisecond
	stepTime := duration / time.Duration(steps)

	for i := 0; i <= steps; i++ {
		progress := float64(i) / float64(steps)
		var easeProgress float64
		
		if startX < endX {
			// 显示动画 - 缓出
			easeProgress = 1 - (1-progress)*(1-progress)*(1-progress)
		} else {
			// 隐藏动画 - 缓入
			easeProgress = progress * progress * progress
		}

		currentX := startX + int(float64(endX-startX)*easeProgress)
		runtime.WindowSetPosition(m.ctx, currentX, 0)

		time.Sleep(stepTime)
	}
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