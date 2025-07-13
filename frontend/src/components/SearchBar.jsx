import {
    Plus,
    RefreshCw,
    Search, X
} from 'lucide-react';
import { useState } from 'react';

// shadcn/ui 组件
import { Button } from './ui/button';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { SimpleTreeSelect } from './ui/simple-tree-select';
import { Textarea } from './ui/textarea';
import { useToast } from './ui/toast';

import { useCategoriesAndTags } from '../hooks';

/**
 * 搜索栏组件 - 使用小选择框的简化设计
 * @param {Object} props - 组件属性
 * @param {Function} props.onSearch - 搜索回调函数
 * @param {Array} props.categories - 分类列表
 * @param {Array} props.contentTypes - 内容类型列表
 * @param {Function} props.onAddItem - 添加条目回调函数
 * @param {Object} props.searchResult - 搜索结果（用于统计展示）
 * @param {Function} props.onClearSearch - 清除搜索回调
 * @param {Function} props.onRefresh - 刷新列表回调
 */
const SearchBar = ({ onSearch, categories, contentTypes, onAddItem, searchResult, onClearSearch, searchForm, onSearchFormChange, onRefresh }) => {
    const { toast } = useToast();
    
    // 获取动态分类和标签
    const { categories: backendCategories, tags: backendTags, loading: categoriesLoading } = useCategoriesAndTags();
    
    // 使用后端分类数据
    
    // 确保props有默认值
    const safeSearchForm = searchForm || { query: '', category: '', tags: [], tag_mode: 'any' };
    const safeOnSearchFormChange = onSearchFormChange || (() => {});
    
    // 使用安全的props
    const currentSearchForm = safeSearchForm;
    const handleFormChange = safeOnSearchFormChange;
    
    // 组件状态
    const [isFocused, setIsFocused] = useState(false);
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [addContent, setAddContent] = useState('');
    const [addCategory, setAddCategory] = useState('');

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
        const clearedForm = { query: '', category: '', tags: [], tag_mode: 'any' };
        handleFormChange(clearedForm);
        onSearch({
            ...clearedForm,
            limit: 50,
            offset: 0
        });
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

    const hasActiveFilters = currentSearchForm.category || currentSearchForm.tags?.length > 0;
    const activeFilterCount = [currentSearchForm.category].filter(Boolean).length + (currentSearchForm.tags?.length || 0);

    return (
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b pb-3 mb-4">
            {/* 主搜索栏 */}
            <div className={`relative transition-all duration-200 ${isFocused ? 'transform scale-[1.01]' : ''}`}>
                <div className="flex items-center space-x-2">
                    {/* 搜索输入框 */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="搜索内容..."
                            value={currentSearchForm.query}
                            onChange={(e) => {
                                const newForm = { ...currentSearchForm, query: e.target.value };
                                handleFormChange(newForm);
                            }}
                            onKeyPress={handleKeyPress}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            className="pl-10 pr-4 h-9 text-sm rounded-lg border focus:border-primary transition-all duration-200"
                        />
                    </div>


                    {/* 添加按钮 */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAddModalVisible(true)}
                        className="h-9 px-3 rounded-lg"
                    >
                        <Plus className="h-4 w-4" />
                    </Button>

                    {/* 刷新按钮 */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onRefresh}
                        className="h-9 px-3 rounded-lg"
                        title="刷新列表"
                    >
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* 小选择框筛选行 */}
            <div className="mt-3 flex items-center gap-2 flex-wrap">
                {/* 分类选择 */}
                <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500 whitespace-nowrap">分类:</span>
                    <Select 
                        value={currentSearchForm.category || 'all'} 
                        onValueChange={(value) => handleFilterChange('category', value)}
                    >
                        <SelectTrigger className="h-7 w-20 text-xs border rounded-md">
                            <SelectValue placeholder="全部" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">全部</SelectItem>
                            {backendCategories.map(category => (
                                <SelectItem key={category} value={category}>
                                    {category}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* 标签选择 */}
                <div className="flex items-center gap-1 flex-1 min-w-0">
                    <span className="text-xs text-gray-500 whitespace-nowrap">标签:</span>
                    <SimpleTreeSelect
                        value={currentSearchForm.tags || []}
                        onChange={(tags) => handleFilterChange('tags', tags)}
                        placeholder="选择标签"
                        className="flex-1"
                        size="sm"
                    />
                </div>

                {/* 清除筛选按钮 */}
                {hasActiveFilters && (
                    <Button 
                        variant="ghost"
                        size="sm"
                        onClick={handleClear}
                        className="h-7 w-7 p-0 text-gray-500 hover:text-red-500 hover:bg-red-50"
                        title="清除所有筛选"
                    >
                        <X className="h-3 w-3" />
                    </Button>
                )}
            </div>

            

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
                                    {backendCategories.map(category => (
                                        <SelectItem key={category} value={category}>
                                            {category}
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