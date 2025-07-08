# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **智能剪切板管理器** (Smart Clipboard Manager) - a modern desktop application built with Wails v2 that provides intelligent clipboard history management. The application features automatic capture, smart categorization, full-text search, and lifecycle management of clipboard content.

## Architecture

### Tech Stack
- **Backend**: Go 1.21+ with Wails v2 framework and modular architecture
- **Frontend**: React 18 with Vite build tool and Ant Design UI library
- **Database**: SQLite for local storage with migration support
- **System Integration**: Global hotkeys and clipboard monitoring

### Modular Backend Architecture

The backend follows a clean, layered architecture for better maintainability and extensibility:

#### **Models Layer** (`internal/models/`)
- **clipboard.go**: Core data models (ClipboardItem, SearchQuery, Statistics)
- **settings.go**: Configuration models and default settings

#### **Repository Layer** (`internal/repository/`)
- **database.go**: Database connection management and migrations
- **clipboard_repository.go**: Data access layer with full CRUD operations
- Implements repository pattern for clean data access abstraction

#### **Service Layer** (`internal/service/`)
- **clipboard_service.go**: Business logic for clipboard operations and monitoring
- **app_service.go**: Application-level services for settings and window management
- Orchestrates between repositories and external dependencies

#### **Package-Specific Modules**
- **config** (`internal/config/`): Configuration file management
- **clipboard** (`internal/clipboard/`): Monitoring and content analysis
- **window** (`internal/window/`): Window management and animations

#### **Main App Controller** (`app.go`)
- Thin controller layer that delegates to services
- Clean API surface for Wails bindings
- Dependency injection for all components

### Key Benefits of New Architecture

1. **Separation of Concerns**: Each package has a single responsibility
2. **Easy Testing**: Interfaces allow for easy mocking and unit testing
3. **Extensibility**: New features can be added without modifying existing code
4. **Maintainability**: Clear dependency flow and modular structure
5. **Reusability**: Services and repositories can be reused across different contexts

#### Frontend (`frontend/src/App.jsx`)
- **Modern UI**: Built with Ant Design for clean, professional interface
- **Multi-page SPA**: Clipboard history, trash/recycle bin, statistics, and settings pages
- **Search Interface**: Real-time search with category and type filtering
- **Statistics Dashboard**: Visual data representation of clipboard usage
- **Settings Panel**: User preferences and configuration management
- **Trash Management**: Soft delete with batch operations and recovery

## Development Commands

### Setup
```bash
# Install Go dependencies
go mod download

# Install frontend dependencies (includes Ant Design UI library)
cd frontend && npm install
```

### Development
```bash
# Start development server with hot reload
wails dev
```

### Building
```bash
# Build production application
wails build

# Built application location
./build/bin/react-wails-app.app/Contents/MacOS/react-wails-app
```

### Testing
No specific test commands are configured. Add tests by creating `*_test.go` files for Go code and following React testing patterns for frontend.

### Database Management
The application automatically handles database migrations when started. If you need to reset the database, delete `~/.clipboard-manager.db` and restart the application.

## Key Features Implementation

### Clipboard Monitoring
- **Auto-capture**: Polls clipboard every 500ms when enabled
- **Smart filtering**: Automatically skips passwords and duplicate content
- **Content analysis**: Detects URLs, emails, phone numbers, and file paths
- **Tagging system**: Auto-generates tags based on content type, length, and time

### Window Management
- **Global hotkeys**: `Cmd+Space` to toggle, `Esc` to hide
- **Animated sidebar**: Smooth slide-in/out animations with easing
- **Configurable positioning**: Left or right side of screen
- **Always on top**: Maintains focus when visible

### Data Management
- **SQLite database**: Stored in `~/.clipboard-manager.db`
- **Automatic indexing**: Optimized queries for search and retrieval
- **Configuration**: JSON config file at `~/.clipboard-manager-config.json`

## Database Schema

```sql
CREATE TABLE clipboard_items (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    content_type TEXT NOT NULL DEFAULT 'text',
    title TEXT NOT NULL,
    tags TEXT DEFAULT '[]',
    category TEXT DEFAULT '未分类',
    is_favorite BOOLEAN DEFAULT 0,
    use_count INTEGER DEFAULT 0,
    is_deleted BOOLEAN DEFAULT 0,
    deleted_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_used_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## API Methods (Go to JS)

### Core Operations
- `GetClipboardItems(limit, offset)` - Retrieve active clipboard history (excludes deleted)
- `SearchClipboardItems(query)` - Search with filters (excludes deleted)
- `UseClipboardItem(id)` - Copy item to clipboard and update usage
- `UpdateClipboardItem(item)` - Modify existing item
- `DeleteClipboardItem(id)` - Soft delete item (move to trash)

### Trash Management
- `GetTrashItems(limit, offset)` - Retrieve deleted items
- `RestoreClipboardItem(id)` - Restore item from trash
- `PermanentDeleteClipboardItem(id)` - Permanently delete single item
- `BatchPermanentDelete(ids)` - Permanently delete multiple items
- `EmptyTrash()` - Clear all items from trash permanently

### System Management
- `GetStatistics()` - Usage statistics and analytics
- `GetSettings()` / `UpdateSettings(settings)` - Configuration management
- `GetWindowState()` - Current window status
- `ShowWindow()` / `HideWindow()` - Window control

## Configuration Structure

```json
{
  "main_hotkey": ["cmd", "space"],
  "escape_hotkey": ["esc"],
  "position": "left",
  "auto_capture": true,
  "max_items": 1000,
  "ignore_passwords": true,
  "ignore_images": false,
  "default_category": "未分类",
  "auto_categorize": true
}
```

## File Structure

```
/
├── app.go                          # Main controller (thin layer)
├── main.go                         # Application entry point
├── go.mod/go.sum                   # Go module dependencies
├── wails.json                      # Wails framework configuration
├── internal/                       # Internal packages (modular architecture)
│   ├── models/
│   │   ├── clipboard.go            # Core data models
│   │   └── settings.go             # Configuration models
│   ├── repository/
│   │   ├── database.go             # Database connection and migrations
│   │   └── clipboard_repository.go # Data access layer
│   ├── service/
│   │   ├── clipboard_service.go    # Business logic for clipboard
│   │   └── app_service.go          # Application services
│   ├── config/
│   │   └── config.go               # Configuration management
│   ├── clipboard/
│   │   └── monitor.go              # Clipboard monitoring and analysis
│   └── window/
│       └── manager.go              # Window management and animations
├── frontend/
│   ├── src/
│   │   ├── App.jsx                 # Main React component (Ant Design)
│   │   ├── App.css                 # Enhanced styles
│   │   └── main.jsx                # React application entry point
│   ├── index.html                  # HTML template
│   ├── package.json                # Frontend dependencies (includes Ant Design)
│   └── wailsjs/                    # Auto-generated Wails bindings
└── build/                          # Build output directory
```

## Development Notes

### Content Type Detection
The application automatically categorizes clipboard content:
- **URL**: Starts with http:// or https://
- **Email**: Contains @ and . characters
- **Phone**: 10+ digits with formatting characters
- **File**: Contains / and . patterns
- **Password**: Complex patterns with multiple character types

### Performance Considerations
- Clipboard monitoring runs in background goroutine
- Database queries are indexed for fast search
- Frontend uses React hooks for state management
- Window animations use requestAnimationFrame for smooth performance

### Security Features
- Password detection and automatic skipping
- Local-only data storage (no cloud sync)
- Configurable content filtering
- Automatic cleanup of old entries

## Architectural Patterns

### Repository Pattern
- **Interface**: `ClipboardRepository` defines data access contract
- **Implementation**: `clipboardRepository` handles SQLite operations
- **Benefits**: Easy to mock for testing, can swap data sources

### Service Layer Pattern  
- **ClipboardService**: Orchestrates business logic and monitors
- **AppService**: Manages application-level concerns
- **Benefits**: Separates business logic from data access and UI

### Dependency Injection
- Dependencies are injected through constructors
- Enables easy testing and loose coupling
- Clear dependency flow: `App -> Service -> Repository`

### Interface Segregation
- Small, focused interfaces for each component
- `Monitor`, `Analyzer`, `ContentProcessor` interfaces
- Easy to extend without breaking existing code

## Common Development Tasks

When working with this codebase:

1. **Adding new content types**: 
   - Extend `detectContentType()` in `internal/clipboard/monitor.go`
   - Add constants to `internal/models/clipboard.go`
   - Update UI icons in frontend

2. **Adding new clipboard operations**:
   - Add method to `ClipboardRepository` interface
   - Implement in `clipboardRepository` struct
   - Expose via `ClipboardService`
   - Add API method in `app.go`

3. **Modifying window behavior**: 
   - Update `internal/window/manager.go`
   - Animation and positioning logic is contained here

4. **Adding settings**: 
   - Update `Settings` struct in `internal/models/settings.go`
   - Update configuration logic in `internal/config/config.go`
   - Add UI components in frontend

5. **Database changes**: 
   - Update schema in `internal/repository/database.go`
   - Add migration logic to handle existing databases
   - Update models if needed

6. **Adding new monitoring features**:
   - Extend `Monitor` interface in `internal/clipboard/monitor.go`
   - Implement new analysis in `Analyzer` interface
   - Update `ClipboardService` to use new features

## Troubleshooting

- **Global hotkeys not working**: Check system permissions for accessibility
- **Database errors**: Ensure write permissions to home directory
- **Window positioning issues**: Verify screen size detection logic
- **Missing clipboard content**: Check auto-capture settings and filters