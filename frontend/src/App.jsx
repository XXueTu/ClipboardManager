import {
    BarChart3,
    Heart,
    Inbox,
    MessageCircle,
    Settings,
    Trash2
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
    BatchPermanentDelete,
    CreateClipboardItem,
    DeleteClipboardItem,
    EmptyTrash,
    PermanentDeleteClipboardItem,
    RestoreClipboardItem,
    SearchClipboardItems,
    UpdateClipboardItem,
    UpdateSettings,
    UseClipboardItem
} from "../wailsjs/go/main/App";

// 导入 shadcn/ui 组件
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { ToastProvider, useToast } from './components/ui/toast';

// 导入组件和页面
import { ClipboardItemCard, ErrorBoundary, SearchBar } from './components';
import { ChatPage, FavoritesPage, SettingsPage, StatisticsPage, TrashPage } from './pages';

// 导入 Hooks
import { useClipboardData, useKeyboardShortcuts, useWindowState } from './hooks';

// 导入常量
import { SEARCH_ANIMATION_STYLE } from './constants';

// 导入样式
import './App.css';
import './globals.css';
import './styles/index.css';

// 注入样式
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = SEARCH_ANIMATION_STYLE;
    document.head.appendChild(style);
}

// 主应用组件内容
function AppContent() {
    const { toast } = useToast();
    
    // 使用自定义 Hooks
    const {
        clipboardItems,
        trashItems,
        favoriteItems,
        statistics,
        settings,
        setClipboardItems,
        setFavoriteItems,
        loadClipboardItems,
        loadTrashItems,
        loadFavoriteItems,
        loadStatistics,
        loadInitialData
    } = useClipboardData();
    
    const { windowState } = useWindowState();
    useKeyboardShortcuts();
    
    const [searchResult, setSearchResult] = useState(null);
    const [loading, setLoading] = useState(false);
    
    // 全局搜索状态 - 在页面间共享
    const [globalSearchForm, setGlobalSearchForm] = useState({
        query: '',
        category: '',
        type: '',
        tags: []
    });

    // 初始化数据
    useEffect(() => {
        loadInitialData();
    }, []);

    const handleSearch = async (query) => {
        // 检查是否有搜索条件
        const hasSearchCondition = query.query || query.category || query.type || query.tags?.length > 0;
        
        if (!hasSearchCondition) {
            // 如果没有搜索条件，清除搜索结果
            setSearchResult(null);
            return;
        }

        setLoading(true);
        try {
            const result = await SearchClipboardItems(query);
            // 确保搜索结果有正确的结构
            const safeResult = {
                items: Array.isArray(result?.items) ? result.items : [],
                total: result?.total || 0,
                ...result
            };
            setSearchResult(safeResult);
        } catch (error) {
            console.error('搜索失败:', error);
            toast.error('搜索失败');
            // 设置安全的空结果
            setSearchResult({
                items: [],
                total: 0
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCopyItem = async (id) => {
        await UseClipboardItem(id);
        loadClipboardItems();
    };

    const handleToggleFavorite = async (id) => {
        try {
            // 只从clipboardItems中查找，避免重复
            const item = clipboardItems.find(i => i.id === id);
            if (item) {
                const updatedItem = {
                    ...item,
                    is_favorite: !item.is_favorite
                };
                
                // 先更新后端
                await UpdateClipboardItem(updatedItem);
                
                // 立即更新本地状态，提供即时反馈
                setClipboardItems(prev => 
                    prev.map(i => i.id === id ? updatedItem : i)
                );
                
                // 更新收藏列表
                if (updatedItem.is_favorite) {
                    setFavoriteItems(prev => {
                        const exists = prev.find(i => i.id === id);
                        return exists ? prev.map(i => i.id === id ? updatedItem : i) : [...prev, updatedItem];
                    });
                } else {
                    setFavoriteItems(prev => prev.filter(i => i.id !== id));
                }
                
                // 如果有搜索结果，需要更新搜索结果
                if (searchResult) {
                    setTimeout(() => {
                        handleSearch({
                            ...globalSearchForm,
                            limit: 50,
                            offset: 0
                        });
                    }, 100);
                }
                
                // 延迟刷新数据确保同步
                setTimeout(() => {
                    loadClipboardItems();
                    loadFavoriteItems();
                }, 300);
            }
        } catch (error) {
            console.error('更新收藏状态失败:', error);
            toast.error('更新收藏状态失败');
            // 出错时重新加载数据
            loadClipboardItems();
            loadFavoriteItems();
        }
    };

    const handleDeleteItem = async (id) => {
        try {
            await DeleteClipboardItem(id);
            loadClipboardItems();
            toast.success('已移动到回收站');
        } catch (error) {
            toast.error('删除失败');
        }
    };

    const handleRestoreItem = async (id) => {
        try {
            await RestoreClipboardItem(id);
            loadTrashItems();
            toast.success('恢复成功');
        } catch (error) {
            toast.error('恢复失败');
        }
    };

    const handlePermanentDelete = async (id) => {
        try {
            await PermanentDeleteClipboardItem(id);
            loadTrashItems();
            toast.success('永久删除成功');
        } catch (error) {
            toast.error('删除失败');
        }
    };

    const handleBatchDelete = async (ids) => {
        await BatchPermanentDelete(ids);
        loadTrashItems();
    };

    const handleEmptyTrash = async () => {
        await EmptyTrash();
        loadTrashItems();
    };

    const handleUpdateSettings = async (newSettings) => {
        await UpdateSettings(newSettings);
        loadInitialData(); // 重新加载数据以获取最新设置
    };

    const handleAddItem = async (content, category) => {
        try {
            const newItem = {
                id: '',  // 让后端生成ID
                content: content,
                category: category || '',
                content_type: 'text',
                title: '',
                tags: [],
                is_favorite: false,
                use_count: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                last_used_at: null,
                is_deleted: false,
                deleted_at: null
            };
            
            await CreateClipboardItem(content);
            loadClipboardItems();
            toast.success('添加成功');
        } catch (error) {
            console.error('添加失败:', error);
            toast.error('添加失败');
        }
    };

    const handleEditItem = async (id, content, category) => {
        try {
            const allItems = [...clipboardItems, ...favoriteItems];
            const item = allItems.find(i => i.id === id);
            if (item) {
                const updatedItem = {
                    ...item,
                    content: content,
                    category: category,
                    updated_at: new Date().toISOString()
                };
                await UpdateClipboardItem(updatedItem);
                loadClipboardItems();
                loadFavoriteItems();
            }
        } catch (error) {
            toast.error('更新失败');
        }
    };

    // 获取分类和类型列表 - 安全处理
    const safeClipboardItems = Array.isArray(clipboardItems) ? clipboardItems : [];
    const categories = [...new Set(safeClipboardItems.map(item => item?.category).filter(Boolean))];
    const contentTypes = [...new Set(safeClipboardItems.map(item => item?.content_type).filter(Boolean))];
    
    // 判断是否有搜索活动（搜索查询或筛选条件）
    const hasSearchActivity = searchResult !== null;
    
    // 当前显示的内容：
    // - 如果有搜索活动，显示搜索结果（可能为空）
    // - 如果没有搜索活动，显示所有剪贴板内容
    const currentItems = hasSearchActivity ? 
        (Array.isArray(searchResult?.items) ? searchResult.items : []) : 
        safeClipboardItems;
    
    // 确保数组不为空时的默认值
    const safeCategories = Array.isArray(categories) ? categories : [];
    const safeContentTypes = Array.isArray(contentTypes) ? contentTypes : [];

    // Tab切换处理
    const handleTabChange = (activeKey) => {
        if (activeKey === 'favorites') {
            loadFavoriteItems();
        } else if (activeKey === 'trash') {
            loadTrashItems();
        } else if (activeKey === 'statistics') {
            loadStatistics();
        } else if (activeKey === 'clipboard') {
            loadClipboardItems();
        }
    };

    const handleClearSearch = () => {
        setSearchResult(null);
    };

    // 全局搜索状态管理
    const handleSearchFormChange = (newForm) => {
        setGlobalSearchForm(newForm);
    };

    // 监听全局搜索状态变化，自动触发搜索
    useEffect(() => {
        const hasSearchCondition = globalSearchForm.query || globalSearchForm.category || globalSearchForm.type || globalSearchForm.tags?.length > 0;
        if (hasSearchCondition) {
            handleSearch({
                ...globalSearchForm,
                limit: 50,
                offset: 0
            });
        } else {
            setSearchResult(null);
        }
    }, [globalSearchForm.query, globalSearchForm.category, globalSearchForm.type, globalSearchForm.tags]);

    const renderClipboardContent = () => (
        <div className="h-full flex flex-col">
            <SearchBar 
                onSearch={handleSearch}
                categories={safeCategories}
                contentTypes={safeContentTypes}
                onAddItem={handleAddItem}
                searchResult={searchResult}
                onClearSearch={handleClearSearch}
                searchForm={globalSearchForm}
                onSearchFormChange={handleSearchFormChange}
            />
            
            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center space-y-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <p className="text-muted-foreground">搜索中...</p>
                    </div>
                </div>
            ) : currentItems.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center space-y-4">
                        <div className="p-6 bg-muted/30 rounded-full w-20 h-20 flex items-center justify-center mx-auto">
                            <Inbox className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-lg font-medium text-muted-foreground">
                                {hasSearchActivity ? '没有找到匹配的内容' : '还没有剪切板记录'}
                            </p>
                            <p className="text-sm text-muted-foreground mt-2">
                                {hasSearchActivity ? '尝试使用不同的关键词或筛选条件' : '复制内容后会自动出现在这里'}
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent space-y-3 pr-1">
                    {currentItems.map(item => (
                        <ClipboardItemCard
                            key={item?.id}
                            item={item}
                            onCopy={handleCopyItem}
                            onToggleFavorite={handleToggleFavorite}
                            onDelete={handleDeleteItem}
                            onEdit={handleEditItem}
                        />
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50/50 p-4">
            <div className="max-w-7xl mx-auto">
                <div className="bg-background rounded-2xl border border-border/50 shadow-lg shadow-gray-900/5 h-[calc(100vh-2rem)]">
                    <div className="p-6 h-full">
                        {/* 监听状态指示器 */}
                        {/* {windowState.isMonitoring && (
                            <div style={MONITORING_STATUS_STYLE}>
                                <div style={PULSE_DOT_STYLE} />
                                监听中
                            </div>
                        )} */}

                        {/* 主要内容 - 使用Tabs替代侧边栏 */}
                        <Tabs defaultValue="clipboard" onValueChange={handleTabChange} className="h-full flex flex-col">
                            <TabsList className="grid w-full grid-cols-6 mb-6 bg-muted/50 p-1 rounded-xl">
                                <TabsTrigger value="clipboard" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg">
                                    <Inbox className="h-4 w-4" />
                                    <span className="hidden sm:inline">剪切板</span>
                                </TabsTrigger>
                                <TabsTrigger value="favorites" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg">
                                    <Heart className="h-4 w-4 text-red-500" />
                                    <span className="hidden sm:inline">收藏</span>
                                </TabsTrigger>
                                <TabsTrigger value="chat" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg">
                                    <MessageCircle className="h-4 w-4 text-blue-500" />
                                    <span className="hidden sm:inline">对话</span>
                                </TabsTrigger>
                                <TabsTrigger value="trash" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg">
                                    <Trash2 className="h-4 w-4" />
                                    <span className="hidden sm:inline">回收站</span>
                                </TabsTrigger>
                                <TabsTrigger value="statistics" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg">
                                    <BarChart3 className="h-4 w-4" />
                                    <span className="hidden sm:inline">统计</span>
                                </TabsTrigger>
                                <TabsTrigger value="settings" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg">
                                    <Settings className="h-4 w-4" />
                                    <span className="hidden sm:inline">设置</span>
                                </TabsTrigger>
                            </TabsList>

                            <div className="flex-1 min-h-0">
                                <TabsContent value="clipboard" className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col">
                                    <ErrorBoundary>
                                        {renderClipboardContent()}
                                    </ErrorBoundary>
                                </TabsContent>

                                <TabsContent value="favorites" className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col">
                                    <ErrorBoundary>
                                        <div className="flex-1 overflow-y-auto">
                                            <FavoritesPage
                                                favoriteItems={favoriteItems}
                                                onCopy={handleCopyItem}
                                                onToggleFavorite={handleToggleFavorite}
                                                onDelete={handleDeleteItem}
                                                onEdit={handleEditItem}
                                                onRefresh={loadFavoriteItems}
                                                onSearch={handleSearch}
                                                onAddItem={handleAddItem}
                                                globalSearchForm={globalSearchForm}
                                                onSearchFormChange={handleSearchFormChange}
                                            />
                                        </div>
                                    </ErrorBoundary>
                                </TabsContent>

                                <TabsContent value="chat" className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col">
                                    <ErrorBoundary>
                                        <div className="flex-1 overflow-y-auto">
                                            <ChatPage />
                                        </div>
                                    </ErrorBoundary>
                                </TabsContent>

                                <TabsContent value="trash" className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col">
                                    <ErrorBoundary>
                                        <div className="flex-1 overflow-y-auto">
                                            <TrashPage
                                                trashItems={trashItems}
                                                onRestore={handleRestoreItem}
                                                onPermanentDelete={handlePermanentDelete}
                                                onBatchDelete={handleBatchDelete}
                                                onEmptyTrash={handleEmptyTrash}
                                                onRefresh={loadTrashItems}
                                            />
                                        </div>
                                    </ErrorBoundary>
                                </TabsContent>

                                <TabsContent value="statistics" className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col">
                                    <ErrorBoundary>
                                        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                                            <StatisticsPage statistics={statistics} />
                                        </div>
                                    </ErrorBoundary>
                                </TabsContent>

                                <TabsContent value="settings" className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col">
                                    <ErrorBoundary>
                                        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                                            {settings ? (
                                                <SettingsPage 
                                                    settings={settings} 
                                                    onUpdateSettings={handleUpdateSettings}
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-full">
                                                    <div className="text-center">
                                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                                                        <p className="text-muted-foreground">加载设置中...</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </ErrorBoundary>
                                </TabsContent>
                            </div>
                        </Tabs>
                    </div>
                </div>
            </div>
        </div>
    );
}

// 主应用组件
function App() {
    return (
        <ToastProvider>
            <ErrorBoundary>
                <AppContent />
            </ErrorBoundary>
        </ToastProvider>
    );
}

export default App;