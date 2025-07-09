import { Heart, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';

// shadcn/ui 组件
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { useToast } from '../components/ui/toast';

import ClipboardItemCard from '../components/ClipboardItemCard';
import SearchBar from '../components/SearchBar';

/**
 * 收藏页面组件
 * @param {Object} props - 组件属性
 * @param {Array} props.favoriteItems - 收藏条目列表
 * @param {Function} props.onCopy - 复制回调函数
 * @param {Function} props.onToggleFavorite - 切换收藏状态回调
 * @param {Function} props.onDelete - 删除回调函数
 * @param {Function} props.onEdit - 编辑回调函数
 * @param {Function} props.onRefresh - 刷新回调函数
 * @param {Function} props.onSearch - 搜索回调函数
 * @param {Function} props.onAddItem - 添加条目回调函数
 * @param {Object} props.globalSearchForm - 全局搜索表单状态
 * @param {Function} props.onSearchFormChange - 搜索表单变化回调
 */
const FavoritesPage = ({ favoriteItems, onCopy, onToggleFavorite, onDelete, onEdit, onRefresh, onSearch, onAddItem, globalSearchForm, onSearchFormChange }) => {
    const { toast } = useToast();
    const [searchResult, setSearchResult] = useState(null);
    const [loading, setLoading] = useState(false);

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
            // 在收藏列表中搜索
            const result = await onSearch(query);
            // 确保结果安全，只显示收藏的结果
            const safeItems = Array.isArray(result?.items) ? result.items : [];
            const favoriteItems = safeItems.filter(item => item?.is_favorite);
            
            const favoriteResult = {
                items: favoriteItems,
                total: favoriteItems.length,
                originalTotal: result?.total || 0
            };
            setSearchResult(favoriteResult);
        } catch (error) {
            console.error('搜索失败:', error);
            toast.error('搜索失败');
            setSearchResult({ items: [], total: 0 }); // 设置安全的空结果
        } finally {
            setLoading(false);
        }
    };

    const handleClearSearch = () => {
        setSearchResult(null);
    };

    // 处理收藏状态变化 - 需要更新搜索结果
    const handleToggleFavoriteWithUpdate = async (id) => {
        try {
            // 调用原始的收藏切换函数
            await onToggleFavorite(id);
            
            // 如果当前有搜索结果，需要更新搜索结果
            if (searchResult) {
                // 重新执行搜索以获取最新数据
                setTimeout(() => {
                    handleSearch({
                        ...globalSearchForm,
                        limit: 50,
                        offset: 0
                    });
                }, 100);
            }
        } catch (error) {
            console.error('更新收藏状态失败:', error);
            toast.error('更新收藏状态失败');
        }
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

    // 监听favoriteItems变化，如果有搜索结果需要更新
    useEffect(() => {
        if (searchResult && favoriteItems) {
            // 延迟更新，避免与收藏状态更新冲突
            const timer = setTimeout(() => {
                const hasSearchCondition = globalSearchForm.query || globalSearchForm.category || globalSearchForm.type || globalSearchForm.tags?.length > 0;
                if (hasSearchCondition) {
                    handleSearch({
                        ...globalSearchForm,
                        limit: 50,
                        offset: 0
                    });
                }
            }, 200);
            
            return () => clearTimeout(timer);
        }
    }, [favoriteItems]);

    // 获取分类和类型列表 - 安全处理
    const safeFavoriteItems = Array.isArray(favoriteItems) ? favoriteItems : [];
    const categories = [...new Set(safeFavoriteItems.map(item => item?.category).filter(Boolean))];
    const contentTypes = [...new Set(safeFavoriteItems.map(item => item?.content_type).filter(Boolean))];
    
    // 判断是否有搜索活动
    const hasSearchActivity = searchResult !== null;
    
    // 当前显示的内容：
    // - 如果有搜索活动，显示搜索结果（可能为空）
    // - 如果没有搜索活动，显示所有收藏内容
    const currentItems = hasSearchActivity ? 
        (Array.isArray(searchResult?.items) ? searchResult.items : []) : 
        safeFavoriteItems;

    return (
        <div className="h-full flex flex-col">
            <SearchBar 
                onSearch={handleSearch}
                categories={categories}
                contentTypes={contentTypes}
                onAddItem={onAddItem}
                searchResult={searchResult}
                onClearSearch={handleClearSearch}
                searchForm={globalSearchForm}
                onSearchFormChange={onSearchFormChange}
            />
            
            {/* 收藏信息卡片 - 简化版 */}
            <Card className="mb-6 rounded-2xl border-2 border-border/50 shadow-sm">
                <CardContent className="py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                            <Heart className="h-5 w-5 text-red-500 fill-red-500" />
                            <span className="font-medium">
                                我的收藏 ({hasSearchActivity ? currentItems.length : safeFavoriteItems?.length || 0})
                                {hasSearchActivity && (
                                    <span className="text-sm text-muted-foreground ml-1">
                                        / 共{safeFavoriteItems?.length || 0}个
                                    </span>
                                )}
                            </span>
                        </div>
                        <Button 
                            variant="outline"
                            size="sm"
                            onClick={onRefresh}
                            className="flex items-center space-x-1 rounded-lg border-2 border-border/50 hover:border-primary/50 transition-all duration-200"
                        >
                            <RefreshCw className="h-4 w-4" />
                            <span>刷新</span>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* 内容区域 */}
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
                        <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground text-lg">
                            {hasSearchActivity ? '没有找到匹配的收藏内容' : '还没有收藏任何内容'}
                        </p>
                        {!hasSearchActivity && (
                            <p className="text-sm text-muted-foreground mt-2">
                                点击剪切板条目的心形图标来收藏内容
                            </p>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent space-y-3 pr-1">
                    {currentItems.map(item => (
                        <ClipboardItemCard
                            key={item?.id}
                            item={item}
                            onCopy={onCopy}
                            onToggleFavorite={handleToggleFavoriteWithUpdate}
                            onDelete={onDelete}
                            onEdit={onEdit}
                            isFavorites={true}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default FavoritesPage;