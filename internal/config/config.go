package config

import (
	"encoding/json"
	"os"
	"path/filepath"

	"react-wails-app/internal/models"
)

// Manager 配置管理器接口
type Manager interface {
	Load() (*models.Settings, error)
	Save(settings *models.Settings) error
	GetConfigPath() string
	GetDatabasePath() string
}

// configManager 配置管理器实现
type configManager struct {
	configPath string
	dbPath     string
}

// NewManager 创建新的配置管理器
func NewManager() Manager {
	homeDir, _ := os.UserHomeDir()
	configPath := filepath.Join(homeDir, ".clipboard-manager-config.json")
	dbPath := filepath.Join(homeDir, ".clipboard-manager.db")

	return &configManager{
		configPath: configPath,
		dbPath:     dbPath,
	}
}

// Load 加载配置
func (c *configManager) Load() (*models.Settings, error) {
	// 先使用默认配置
	settings := models.DefaultSettings()

	// 尝试从文件加载配置
	if data, err := os.ReadFile(c.configPath); err == nil {
		// 如果文件存在，则覆盖默认配置
		if err := json.Unmarshal(data, &settings); err != nil {
			return nil, err
		}
	}

	return &settings, nil
}

// Save 保存配置
func (c *configManager) Save(settings *models.Settings) error {
	data, err := json.MarshalIndent(settings, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(c.configPath, data, 0644)
}

// GetConfigPath 获取配置文件路径
func (c *configManager) GetConfigPath() string {
	return c.configPath
}

// GetDatabasePath 获取数据库文件路径
func (c *configManager) GetDatabasePath() string {
	return c.dbPath
}