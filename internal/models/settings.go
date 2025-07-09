package models

// Settings 应用程序配置
type Settings struct {
	MainHotkey      []string `json:"main_hotkey"`
	EscapeHotkey    []string `json:"escape_hotkey"`
	Position        string   `json:"position"` // "left" or "right"
	AutoCapture     bool     `json:"auto_capture"`
	MaxItems        int      `json:"max_items"`
	IgnorePasswords bool     `json:"ignore_passwords"`
	IgnoreImages    bool     `json:"ignore_images"`
	DefaultCategory string   `json:"default_category"`
	AutoCategorize  bool     `json:"auto_categorize"`
}

// DefaultSettings 返回默认设置
func DefaultSettings() Settings {
	return Settings{
		MainHotkey:      []string{"cmd", "space"},
		EscapeHotkey:    []string{"esc"},
		Position:        "left",
		AutoCapture:     true,
		MaxItems:        1000,
		IgnorePasswords: true,
		IgnoreImages:    false,
		DefaultCategory: CategoryText,
		AutoCategorize:  true,
	}
}

// WindowState 窗口状态
type WindowState struct {
	Visible      bool   `json:"visible"`
	Animating    bool   `json:"animating"`
	Message      string `json:"message"`
	ScreenSize   string `json:"screenSize"`
	Position     string `json:"position"`
	IsMonitoring bool   `json:"isMonitoring"`
}