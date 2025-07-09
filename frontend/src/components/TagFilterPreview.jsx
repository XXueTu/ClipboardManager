import { Hash, Plus, Search, X } from 'lucide-react';
import { useState } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { useCategoriesAndTags } from '../hooks';

/**
 * 标签筛选预览组件 - 为将来的标签功能设计
 * 展示如何优雅地处理大量标签的筛选
 */
const TagFilterPreview = ({ 
    availableTags = [], 
    selectedTags = [], 
    onTagSelect, 
    onTagDeselect,
    onAddTag,
    maxVisibleTags = 10,
    searchPlaceholder = "搜索标签..." 
}) => {
    // 获取动态标签
    const { tags: backendTags, loading: tagsLoading } = useCategoriesAndTags();
    const [tagSearch, setTagSearch] = useState('');
    const [showAllTags, setShowAllTags] = useState(false);

    // 过滤标签
    const filteredTags = availableTags.filter(tag => 
        tag.toLowerCase().includes(tagSearch.toLowerCase()) &&
        !selectedTags.includes(tag)
    );

    // 显示的标签
    const visibleTags = showAllTags ? filteredTags : filteredTags.slice(0, maxVisibleTags);
    const hasMoreTags = filteredTags.length > maxVisibleTags;

    const handleTagClick = (tag) => {
        if (selectedTags.includes(tag)) {
            onTagDeselect?.(tag);
        } else {
            onTagSelect?.(tag);
        }
    };

    const handleAddNewTag = () => {
        if (tagSearch.trim() && !availableTags.includes(tagSearch.trim())) {
            onAddTag?.(tagSearch.trim());
            setTagSearch('');
        }
    };

    return (
        <div className="space-y-3">
            {/* 标签搜索 */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder={searchPlaceholder}
                    value={tagSearch}
                    onChange={(e) => setTagSearch(e.target.value)}
                    className="pl-10 pr-10 h-9"
                />
                {tagSearch && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setTagSearch('')}
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                    >
                        <X className="h-3 w-3" />
                    </Button>
                )}
            </div>

            {/* 已选择的标签 */}
            {selectedTags.length > 0 && (
                <div className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground">
                        已选择 ({selectedTags.length})
                    </div>
                    <div className="flex flex-wrap gap-1">
                        {selectedTags.map(tag => (
                            <Badge 
                                key={tag} 
                                variant="default" 
                                className="flex items-center gap-1 cursor-pointer hover:bg-primary/80"
                                onClick={() => handleTagClick(tag)}
                            >
                                <Hash className="h-3 w-3" />
                                {tag}
                                <X className="h-3 w-3" />
                            </Badge>
                        ))}
                    </div>
                </div>
            )}

            {/* 可选择的标签 */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <div className="text-xs font-medium text-muted-foreground">
                        {tagSearch ? `搜索结果 (${filteredTags.length})` : `所有标签 (${availableTags.length})`}
                    </div>
                    {tagSearch && !availableTags.includes(tagSearch.trim()) && tagSearch.trim() && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleAddNewTag}
                            className="h-6 px-2 text-xs"
                        >
                            <Plus className="h-3 w-3 mr-1" />
                            添加 "{tagSearch.trim()}"
                        </Button>
                    )}
                </div>

                {visibleTags.length > 0 ? (
                    <ScrollArea className={hasMoreTags && !showAllTags ? "h-32" : "max-h-48"}>
                        <div className="flex flex-wrap gap-1 p-1">
                            {visibleTags.map(tag => (
                                <Badge 
                                    key={tag} 
                                    variant="outline" 
                                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                                    onClick={() => handleTagClick(tag)}
                                >
                                    <Hash className="h-3 w-3 mr-1" />
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                    </ScrollArea>
                ) : (
                    <div className="text-center py-4 text-sm text-muted-foreground">
                        {tagSearch ? '没有找到匹配的标签' : '暂无可用标签'}
                    </div>
                )}

                {/* 展开/收起按钮 */}
                {hasMoreTags && (
                    <div className="text-center">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowAllTags(!showAllTags)}
                            className="h-7 px-3 text-xs"
                        >
                            {showAllTags ? '收起' : `显示更多 (+${filteredTags.length - maxVisibleTags})`}
                        </Button>
                    </div>
                )}
            </div>

            {/* 快速标签建议 */}
            {!tagSearch && selectedTags.length === 0 && (
                <div className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground">
                        常用标签
                    </div>
                    <div className="flex flex-wrap gap-1">
                        {(backendTags.length > 0 ? backendTags.slice(0, 5) : ['工作', '个人', '重要', '待办', '代码']).map(tag => (
                            <Badge 
                                key={tag} 
                                variant="secondary" 
                                className="cursor-pointer hover:bg-secondary/80"
                                onClick={() => handleTagClick(tag)}
                            >
                                <Hash className="h-3 w-3 mr-1" />
                                {tag}
                            </Badge>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TagFilterPreview; 