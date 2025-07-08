package main

import (
	"embed"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

// 绑定 wails generate module
// 构建 wails build
// 启动 ./build/bin/react-wails-app.app/Contents/MacOS/react-wails-app

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	// Create an instance of the app structure
	app := NewApp()

	// Create application with options
	err := wails.Run(&options.App{
		Title:  "Clipboard Manager",
		Width:  500,  // 更宽的界面
		Height: 1080, // 全屏高度
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 0, G: 0, B: 0, A: 240}, // 半透明背景
		OnStartup:        app.startup,
		OnShutdown:       app.shutdown,

		// 窗口属性配置
		DisableResize:     true,
		Fullscreen:        false,
		AlwaysOnTop:       true,
		StartHidden:       false, // 先显示再动画
		HideWindowOnClose: true,
		// 移除窗口装饰
		Frameless: true,
		Bind: []interface{}{
			app,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
