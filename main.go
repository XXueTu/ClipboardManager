package main

import (
	"embed"
	"fmt"
	"log"
	"os"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/linux"
	"github.com/wailsapp/wails/v2/pkg/options/mac"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
)

// 绑定 wails generate module
// 构建 wails build
// 启动 ./build/bin/react-wails-app.app/Contents/MacOS/react-wails-app

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	// Create an instance of the app structure
	app := NewApp()

	// 检查是否在开发模式
	isDev := os.Getenv("WAILS_DEV") == "true"

	// 根据模式配置AssetServer
	var assetServerOptions *assetserver.Options
	if isDev {
		// 开发模式：使用自定义Handler支持流式API
		assetServerOptions = &assetserver.Options{
			Assets:  assets,
			Handler: app.appService.CreateAssetHandler(),
		}
	} else {
		// 生产模式：使用自定义Handler
		assetServerOptions = &assetserver.Options{
			Assets:  assets,
			Handler: app.appService.CreateAssetHandler(),
		}
	}

	// Create application with options
	err := wails.Run(&options.App{
		Title:            "Clipboard Manager",
		Width:            500,  // 更宽的界面
		Height:           1080, // 全屏高度
		AssetServer:      assetServerOptions,
		BackgroundColour: &options.RGBA{R: 0, G: 0, B: 0, A: 0}, // 完全透明背景
		OnStartup:        app.startup,
		OnShutdown:       app.shutdown,

		// 基础窗口属性
		DisableResize:     true,
		Fullscreen:        false,
		AlwaysOnTop:       true,
		StartHidden:       false,
		HideWindowOnClose: true,
		Frameless:         true,

		// 窗口尺寸约束
		MinWidth:  400,
		MinHeight: 600,
		MaxWidth:  800,
		MaxHeight: 1200,

		// 单实例锁定 - 确保只有一个实例运行
		SingleInstanceLock: &options.SingleInstanceLock{
			UniqueId: "clipboard-manager-unique-id-2024",
			OnSecondInstanceLaunch: func(secondInstanceData options.SecondInstanceData) {
				// 当尝试启动第二个实例时显示现有窗口
				log.Println("第二个实例启动，显示现有窗口")
			},
		},

		// 拖拽支持
		DragAndDrop: &options.DragAndDrop{
			EnableFileDrop:     true,
			DisableWebViewDrop: false,
			CSSDropProperty:    "--wails-drop-target",
			CSSDropValue:       "drop",
		},

		// Windows 特定优化
		Windows: &windows.Options{
			WebviewIsTransparent: true,
			WindowIsTranslucent:  true,
			BackdropType:         windows.Mica, // 现代 Mica 效果
			DisablePinchZoom:     true,
			Theme:                windows.SystemDefault, // 跟随系统主题
			// 现代化主题配置
			// CustomTheme: &windows.ThemeSettings{
			// 	DarkModeTitleBar:   windows.RGB(32, 32, 32),
			// 	DarkModeTitleText:  windows.RGB(255, 255, 255),
			// 	DarkModeBorder:     windows.RGB(64, 64, 64),
			// 	LightModeTitleBar:  windows.RGB(248, 250, 252),
			// 	LightModeTitleText: windows.RGB(16, 16, 16),
			// 	LightModeBorder:    windows.RGB(229, 231, 235),
			// },
			WebviewGpuIsDisabled: false, // 启用GPU硬件加速
		},

		// macOS 特定优化
		Mac: &mac.Options{
			TitleBar: &mac.TitleBar{
				TitlebarAppearsTransparent: true,
				HideTitle:                  true,
				HideTitleBar:               false,
				FullSizeContent:            true,
				UseToolbar:                 false,
				HideToolbarSeparator:       true,
			},
			Appearance:           mac.DefaultAppearance, // 跟随系统外观
			WebviewIsTransparent: true,
			WindowIsTranslucent:  true,
			About: &mac.AboutInfo{
				Title:   "Clipboard Manager",
				Message: "现代化剪贴板管理工具\n© 2024",
			},
		},

		// Linux 特定优化
		Linux: &linux.Options{
			WindowIsTranslucent: true,
			WebviewGpuPolicy:    linux.WebviewGpuPolicyOnDemand,
			ProgramName:         "clipboard-manager",
		},

		// 调试配置
		Debug: options.Debug{
			OpenInspectorOnStartup: false,
		},

		Bind: []interface{}{
			app,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}

// 处理第二个实例启动的回调
func (a *App) onSecondInstanceLaunch(secondInstanceData options.SecondInstanceData) {
	// 可以在这里添加显示窗口的逻辑
	fmt.Printf("Second instance launched with data: %+v\n", secondInstanceData)
}
