package service

import (
	"context"

	"react-wails-app/internal/config"
	"react-wails-app/internal/models"
	"react-wails-app/internal/window"
)

// AppService 应用程序服务接口
type AppService interface {
	// 初始化
	Initialize(ctx context.Context) error
	
	// 设置管理
	GetSettings() (*models.Settings, error)
	UpdateSettings(settings *models.Settings) error
	
	// 窗口管理
	ShowWindow()
	HideWindow()
	ToggleWindow()
	GetWindowState() models.WindowState
	SetScreenSize(width, height int)
	
	// 应用状态
	Shutdown()
}

// appService 应用程序服务实现
type appService struct {
	configManager   config.Manager
	windowManager   window.Manager
	clipboardService ClipboardService
	settings        *models.Settings
}

// NewAppService 创建新的应用程序服务
func NewAppService(
	configManager config.Manager,
	windowManager window.Manager,
	clipboardService ClipboardService,
) AppService {
	return &appService{
		configManager:    configManager,
		windowManager:    windowManager,
		clipboardService: clipboardService,
	}
}

// Initialize 初始化应用程序服务
func (s *appService) Initialize(ctx context.Context) error {
	// 加载配置
	settings, err := s.configManager.Load()
	if err != nil {
		return err
	}
	s.settings = settings

	// 初始化窗口管理器
	if err := s.windowManager.Initialize(ctx, settings); err != nil {
		return err
	}

	// 开始剪切板监听
	if err := s.clipboardService.StartMonitoring(); err != nil {
		return err
	}

	return nil
}

// GetSettings 获取设置
func (s *appService) GetSettings() (*models.Settings, error) {
	if s.settings == nil {
		return s.configManager.Load()
	}
	return s.settings, nil
}

// UpdateSettings 更新设置
func (s *appService) UpdateSettings(settings *models.Settings) error {
	// 保存配置到文件
	if err := s.configManager.Save(settings); err != nil {
		return err
	}

	// 更新内存中的设置
	s.settings = settings

	// 更新剪切板服务设置
	if clipboardService, ok := s.clipboardService.(*clipboardService); ok {
		clipboardService.UpdateSettings(settings)
	}

	return nil
}

// ShowWindow 显示窗口
func (s *appService) ShowWindow() {
	s.windowManager.ShowWindow()
}

// HideWindow 隐藏窗口
func (s *appService) HideWindow() {
	s.windowManager.HideWindow()
}

// ToggleWindow 切换窗口显示状态
func (s *appService) ToggleWindow() {
	s.windowManager.ToggleWindow()
}

// GetWindowState 获取窗口状态
func (s *appService) GetWindowState() models.WindowState {
	state := s.windowManager.GetState()
	state.IsMonitoring = s.clipboardService.IsMonitoring()
	return state
}

// SetScreenSize 设置屏幕大小
func (s *appService) SetScreenSize(width, height int) {
	s.windowManager.SetScreenSize(width, height)
}

// Shutdown 关闭应用程序
func (s *appService) Shutdown() {
	// 停止剪切板监听
	s.clipboardService.StopMonitoring()
}