import {
    Filter, Plus,
    Search, X
} from 'lucide-react';
import { useRef, useState } from 'react';

// shadcn/ui 组件
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { useToast } from './ui/toast';

import { CATEGORY_OPTIONS } from '../constants';
import { getContentTypeIcon } from '../utils/contentTypeUtils.jsx';

/**
 * 搜索栏组件 - 优化交互设计
 * @param {Object} props - 组件属性
 * @param {Function} props.onSearch - 搜索回调函数
 * @param {Array} props.categories - 分类列表
 * @param {Array} props.contentTypes - 内容类型列表
 * @param {Function} props.onAddItem - 添加条目回调函数
 * @param {Object} props.searchResult - 搜索结果（用于统计展示）
 * @param {Function} props.onClearSearch - 清除搜索回调
 */
const SearchBar = ({ onSearch, categories, contentTypes, onAddItem, searchResult, onClearSearch, searchForm, onSearchFormChange }) => {
    const { toast } = useToast();
    const filterPanelRef = useRef(null);
    const filterButtonRef = useRef(null);
    
    // 确保props有默认值
    const safeSearchForm = searchForm || { query: '', category: '', type: '', tags: [] };
    const safeOnSearchFormChange = onSearchFormChange || (() => {});
    
    // 使用安全的props
    const currentSearchForm = safeSearchForm;
    const handleFormChange = safeOnSearchFormChange;
    
    // 使用传入的全局搜索状态，而不是本地状态
    const [showFilters, setShowFilters] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [addContent, setAddContent] = useState('');
    const [addCategory, setAddCategory] = useState('');

    // 暂时禁用自动关闭，只允许手动关闭
    // useEffect(() => {
    //     const handleClickOutside = (event) => {
    //         // 检查是否点击在下拉菜单内容区域
    //         const isDropdownContent = event.target.closest('[role="listbox"]') || 
    //                                 event.target.closest('[data-radix-popper-content-wrapper]') ||
    //                                 event.target.closest('[data-radix-select-content]');
            
    //         if (showFilters && 
    //             !isDropdownContent &&
    //             filterPanelRef.current && 
    //             !filterPanelRef.current.contains(event.target) &&
    //             filterButtonRef.current &&
    //             !filterButtonRef.current.contains(event.target)) {
    //             setShowFilters(false);
    //         }
    //     };

    //     document.addEventListener('mousedown', handleClickOutside);
    //     return () => document.removeEventListener('mousedown', handleClickOutside);
    // }, [showFilters]);

    const handleSearch = () => {
        onSearch({
            ...currentSearchForm,
            limit: 50,
            offset: 0
        });
    };

    const handleFilterChange = (key, value) => {
        // 将 "all" 转换为空字符串，用于后端查询
        const cleanValue = value === 'all' ? '' : (value || '');
        const newForm = { ...currentSearchForm, [key]: cleanValue };
        handleFormChange(newForm);
        
        // 自动触发搜索，无需手动点击
        onSearch({
            ...newForm,
            limit: 50,
            offset: 0
        });
    };

    const handleClear = () => {
        const clearedForm = { query: '', category: '', type: '', tags: [] };
        handleFormChange(clearedForm);
        onSearch({
            ...clearedForm,
            limit: 50,
            offset: 0
        });
        setShowFilters(false);
        if (onClearSearch) onClearSearch();
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const handleAddSubmit = async () => {
        if (!addContent.trim()) {
            toast.error('请输入内容');
            return;
        }
        
        try {
            await onAddItem(addContent, addCategory);
            setAddModalVisible(false);
            setAddContent('');
            setAddCategory('');
        } catch (error) {
            console.error('添加失败:', error);
            toast.error('添加失败');
        }
    };

    const hasActiveFilters = currentSearchForm.category || currentSearchForm.type || currentSearchForm.tags?.length > 0;
    const activeFilterCount = [currentSearchForm.category, currentSearchForm.type].filter(Boolean).length + (currentSearchForm.tags?.length || 0);

    return (
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b pb-4 mb-6 rounded-t-xl">
            {/* 主搜索栏 */}
            <div className={`relative transition-all duration-200 ${isFocused ? 'transform scale-[1.01]' : ''}`}>
                <div className="flex items-center space-x-3">
                    {/* 搜索输入框 */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder=""
                            value={currentSearchForm.query}
                            onChange={(e) => {
                                const newForm = { ...currentSearchForm, query: e.target.value };
                                handleFormChange(newForm);
                            }}
                            onKeyPress={handleKeyPress}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            className="pl-10 pr-4 h-12 text-base rounded-xl border-2 border-border/50 focus:border-primary/50 transition-all duration-200"
                        />
                    </div>

                    {/* 过滤器按钮 */}
                    <Button
                        ref={filterButtonRef}
                        variant={showFilters ? "default" : "outline"}
                        size="icon"
                        onClick={() => setShowFilters(!showFilters)}
                        className="h-12 w-12 relative rounded-xl border-2 border-border/50 hover:border-primary/50 transition-all duration-200"
                    >
                        <Filter className="h-4 w-4" />
                        {hasActiveFilters && (
                            <Badge 
                                variant="destructive" 
                                className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs flex items-center justify-center rounded-full"
                            >
                                {activeFilterCount}
                            </Badge>
                        )}
                    </Button>

                    {/* 搜索按钮 */}
                    <Button 
                        onClick={handleSearch}
                        variant="outline"
                        className="h-12 px-4 rounded-xl border-2 border-border/50 hover:border-primary/50 transition-all duration-200 bg-transparent"
                    >
                        <Search className="h-4 w-4" />
                        
                    </Button>

                    {/* 添加按钮 */}
                    <Button
                        variant="outline"
                        onClick={() => setAddModalVisible(true)}
                        className="h-12 px-4 rounded-xl border-2 border-border/50 hover:border-primary/50 transition-all duration-200"
                    >
                        <Plus className="h-4 w-4" />
                        
                    </Button>
                </div>

             
            </div>

            {/* 搜索结果统计和活跃筛选器 */}
            {(searchResult || hasActiveFilters) && (
                <div className="mt-4 space-y-3">
                    {/* 搜索结果统计 */}
                    {searchResult && (
                        <div className="flex items-center justify-between px-4 py-3 bg-primary/5 rounded-xl border border-primary/20">
                            <div className="flex items-center space-x-2 text-sm">
                                <div className="p-1.5 bg-primary/20 rounded-full">
                                    <Search className="h-3 w-3 text-primary" />
                                </div>
                                <span className="font-medium text-primary">
                                    找到 {searchResult.total || 0} 个结果
                                </span>
                                {currentSearchForm.query && (
                                    <span className="text-muted-foreground">
                                        包含 "{currentSearchForm.query}"
                                    </span>
                                )}
                            </div>
                            <Button 
                                variant="ghost"
                                size="sm"
                                onClick={handleClear}
                                className="h-8 px-3 text-primary hover:text-primary hover:bg-primary/10 rounded-lg"
                            >
                                <X className="h-3 w-3 mr-1" />
                                清除全部
                            </Button>
                        </div>
                    )}
                    
                    {/* 活跃筛选器标签 */}
                    {hasActiveFilters && (
                        <div className="flex flex-wrap items-center gap-2 px-4 py-3 bg-muted/30 rounded-xl border">
                            <span className="text-xs font-medium text-muted-foreground">筛选条件:</span>
                            {currentSearchForm.category && (
                                <Badge variant="secondary" className="flex items-center gap-1 cursor-pointer hover:bg-secondary/80 rounded-lg">
                                    分类: {currentSearchForm.category}
                                    <X 
                                        className="h-3 w-3 hover:text-destructive" 
                                        onClick={() => handleFilterChange('category', '')}
                                    />
                                </Badge>
                            )}
                            {currentSearchForm.type && (
                                <Badge variant="secondary" className="flex items-center gap-1 cursor-pointer hover:bg-secondary/80 rounded-lg">
                                    类型: {currentSearchForm.type}
                                    <X 
                                        className="h-3 w-3 hover:text-destructive" 
                                        onClick={() => handleFilterChange('type', '')}
                                    />
                                </Badge>
                            )}
                            {/* 预留标签显示区域 */}
                            {currentSearchForm.tags?.map((tag, index) => (
                                <Badge key={tag} variant="outline" className="flex items-center gap-1 cursor-pointer hover:bg-muted/50 rounded-lg">
                                    #{tag}
                                    <X 
                                        className="h-3 w-3 hover:text-destructive" 
                                        onClick={() => {
                                            const newTags = currentSearchForm.tags.filter((_, i) => i !== index);
                                            handleFilterChange('tags', newTags);
                                        }}
                                    />
                                </Badge>
                            ))}
                            <Button 
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    const clearedForm = { ...currentSearchForm, category: '', type: '', tags: [] };
                                    handleFormChange(clearedForm);
                                    onSearch({
                                        ...clearedForm,
                                        limit: 50,
                                        offset: 0
                                    });
                                }}
                                className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive rounded-lg"
                            >
                                <X className="h-3 w-3 mr-1" />
                                清除筛选
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* 过滤器面板 - 绝对定位弹出层 */}
            {showFilters && (
                <div 
                    ref={filterPanelRef}
                    className="absolute top-full left-0 right-0 mt-2 z-50"
                >
                    <Card className="border-2 border-border/50 shadow-xl bg-background/95 backdrop-blur-sm rounded-2xl">
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {/* 分类过滤 */}
                                <div className="space-y-3">
                                    <Label className="text-sm font-medium">分类筛选</Label>
                                    <Select 
                                        value={currentSearchForm.category || 'all'} 
                                        onValueChange={(value) => handleFilterChange('category', value)}
                                    >
                                        <SelectTrigger className="h-10 rounded-xl border-2 border-border/50 focus:border-primary/50">
                                            <SelectValue placeholder="选择分类" />
                                        </SelectTrigger>
                                        <SelectContent 
                                            position="popper"
                                            sideOffset={4}
                                            className="rounded-xl"
                                        >
                                            <SelectItem value="all">全部分类</SelectItem>
                                            {categories.map(category => (
                                                <SelectItem key={category} value={category}>
                                                    {category}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* 类型过滤 */}
                                <div className="space-y-3">
                                    <Label className="text-sm font-medium">类型筛选</Label>
                                    <Select 
                                        value={currentSearchForm.type || 'all'} 
                                        onValueChange={(value) => handleFilterChange('type', value)}
                                    >
                                        <SelectTrigger className="h-10 rounded-xl border-2 border-border/50 focus:border-primary/50">
                                            <SelectValue placeholder="选择类型" />
                                        </SelectTrigger>
                                        <SelectContent 
                                            position="popper"
                                            sideOffset={4}
                                            className="rounded-xl"
                                        >
                                            <SelectItem value="all">全部类型</SelectItem>
                                            {contentTypes.map(type => (
                                                <SelectItem key={type} value={type}>
                                                    <div className="flex items-center space-x-2">
                                                        {getContentTypeIcon(type)}
                                                        <span>{type}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* 标签筛选 - 预留 */}
                                <div className="space-y-3">
                                    <Label className="text-sm font-medium">标签筛选</Label>
                                    <div className="h-10 flex items-center text-sm text-muted-foreground bg-muted/50 rounded-xl px-3 border-2 border-border/30">
                                        即将推出...
                                    </div>
                                </div>
                            </div>

                            {/* 过滤器操作栏 */}
                            <div className="flex justify-between items-center mt-6 pt-4 border-t">
                                <div className="text-sm text-muted-foreground">
                                    {hasActiveFilters ? (
                                        <span>已应用 {activeFilterCount} 个筛选器</span>
                                    ) : (
                                        <span>选择筛选条件以缩小搜索范围</span>
                                    )}
                                </div>
                                <div className="flex space-x-3">
                                    {hasActiveFilters && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleClear}
                                            className="text-destructive border-destructive/20 hover:bg-destructive/10 rounded-lg"
                                        >
                                            <X className="h-3 w-3 mr-1" />
                                            清除筛选
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowFilters(false)}
                                        className="rounded-lg"
                                    >
                                        收起
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* 添加条目模态框 */}
            <Dialog open={addModalVisible} onOpenChange={setAddModalVisible}>
                <DialogContent className="max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center space-x-2">
                            <Plus className="h-5 w-5 text-primary" />
                            <span>添加新条目</span>
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="add-content">内容</Label>
                            <Textarea
                                id="add-content"
                                value={addContent}
                                onChange={(e) => setAddContent(e.target.value)}
                                placeholder="请输入要添加的内容..."
                                rows={4}
                                className="resize-none rounded-xl border-2 border-border/50 focus:border-primary/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="add-category">分类</Label>
                            <Select value={addCategory} onValueChange={setAddCategory}>
                                <SelectTrigger className="rounded-xl border-2 border-border/50 focus:border-primary/50">
                                    <SelectValue placeholder="选择分类（可选）" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    {CATEGORY_OPTIONS.map(option => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button 
                            onClick={handleAddSubmit}
                            disabled={!addContent.trim()}
                            className="rounded-xl"
                        >
                            添加
                        </Button>
                        <DialogClose asChild>
                            <Button variant="outline" className="rounded-xl">取消</Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default SearchBar;