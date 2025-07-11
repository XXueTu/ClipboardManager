import {
    Bot,
    Copy,
    Edit3,
    Heart,
    Plus,
    RotateCcw,
    Sparkles,
    Trash2,
    X
} from 'lucide-react';
import { useState } from 'react';

// shadcn/ui 组件
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { useToast } from './ui/toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

import { categoriesToOptions, CONTENT_MAX_LENGTH, FALLBACK_CATEGORY_OPTIONS } from '../constants';
import { useCategoriesAndTags } from '../hooks';
import { formatDate, getContentTypeIcon, getFileName, shouldShowTitle } from '../utils';

/**
 * 剪切板条目卡片组件
 * @param {Object} props - 组件属性
 * @param {Object} props.item - 剪切板条目数据
 * @param {Function} props.onCopy - 复制回调函数
 * @param {Function} props.onToggleFavorite - 切换收藏状态回调
 * @param {Function} props.onDelete - 删除回调函数
 * @param {Function} props.onRestore - 恢复回调函数
 * @param {Function} props.onEdit - 编辑回调函数
 * @param {Function} props.onGenerateAITags - 生成AI标签回调函数
 * @param {boolean} props.isTrash - 是否为回收站页面
 * @param {boolean} props.isFavorites - 是否为收藏页面
 */
const ClipboardItemCard = ({
    item,
    onCopy,
    onToggleFavorite,
    onDelete,
    onRestore,
    onEdit,
    onGenerateAITags,
    isTrash = false,
    isFavorites = false
}) => {
    const { toast } = useToast();

    // 获取动态分类和标签
    const { categories: backendCategories, loading: categoriesLoading } = useCategoriesAndTags();

    // 使用后端分类，如果加载中或失败则使用后备分类
    const categoryOptions = categoriesLoading || backendCategories.length === 0
        ? FALLBACK_CATEGORY_OPTIONS
        : categoriesToOptions(backendCategories);

    const [modalVisible, setModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editContent, setEditContent] = useState('');
    const [editCategory, setEditCategory] = useState('');
    const [editTags, setEditTags] = useState([]);
    const [newTag, setNewTag] = useState('');
    const [isGeneratingTags, setIsGeneratingTags] = useState(false);
    const maxLength = CONTENT_MAX_LENGTH;

    const handleCopy = async () => {
        try {
            if (isTrash) {
                toast.error('回收站中的条目无法复制，请先恢复');
                return;
            }
            await onCopy(item?.id);
            toast.success('已复制到剪切板');
        } catch (error) {
            toast.error('复制失败');
        }
    };

    const itemContent = item?.content || '';
    const shouldTruncate = itemContent.length > maxLength;
    const displayContent = shouldTruncate
        ? itemContent.substring(0, maxLength) + '...'
        : itemContent;

    const showTitle = shouldShowTitle(item?.content_type);
    const title = showTitle ? getFileName(itemContent) : null;

    const handleContentClick = () => {
        if (shouldTruncate) {
            setModalVisible(true);
        }
    };

    const handleEditClick = () => {
        setEditContent(itemContent);
        setEditCategory(item?.category || '');
        setEditTags(item?.tags || []);
        setEditModalVisible(true);
    };

    const handleAddTag = () => {
        if (newTag.trim() && !editTags.some(tag => 
            (typeof tag === 'string' ? tag : tag.name) === newTag.trim()
        )) {
            setEditTags([...editTags, newTag.trim()]);
            setNewTag('');
        }
    };

    const handleRemoveTag = (indexToRemove) => {
        setEditTags(editTags.filter((_, index) => index !== indexToRemove));
    };

    const handleEditSubmit = () => {
        onEdit(item?.id, editContent, editCategory, editTags);
        setEditModalVisible(false);
        setEditContent('');
        setEditCategory('');
        setEditTags([]);
        setNewTag('');
        toast.success('内容已更新');
    };

    const handleGenerateAITags = async () => {
        if (!onGenerateAITags) return;

        setIsGeneratingTags(true);
        try {
            const newTags = await onGenerateAITags(item?.id);
            if (newTags && newTags.length > 0) {
                toast.success(`成功生成了 ${newTags.length} 个AI标签`);
            } else {
                toast.info('未生成新的标签');
            }
        } catch (error) {
            console.error('生成AI标签失败:', error);
            toast.error('生成AI标签失败');
        } finally {
            setIsGeneratingTags(false);
        }
    };

    const getTypeColor = (type) => {
        const colorMap = {
            'text': 'bg-blue-100 text-blue-800',
            'image': 'bg-green-100 text-green-800',
            'file': 'bg-purple-100 text-purple-800',
            'url': 'bg-orange-100 text-orange-800'
        };
        return colorMap[type] || 'bg-gray-100 text-gray-800';
    };

    return (
        <TooltipProvider>
            <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 text-left">
                    {/* 标题和操作按钮区域 */}
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                            {getContentTypeIcon(item?.content_type)}
                            <span className="font-medium text-sm">{title}</span>
                        </div>
                        
                        {/* 操作按钮 */}
                        <div className="flex items-start space-x-0.5 flex-shrink-0">
                            {!isTrash && (
                                <>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7"
                                                onClick={() => onToggleFavorite(item?.id)}
                                            >
                                                {item?.is_favorite ? (
                                                    <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                                                ) : (
                                                    <Heart className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            {item?.is_favorite ? '取消收藏' : '收藏'}
                                        </TooltipContent>
                                    </Tooltip>

                                    {isFavorites && (
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7"
                                                    onClick={handleEditClick}
                                                >
                                                    <Edit3 className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>编辑</TooltipContent>
                                        </Tooltip>
                                    )}

                                    {/* AI标签生成按钮 - 在所有非回收站页面都显示 */}
                                    {!isTrash && onGenerateAITags && (
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7"
                                                    onClick={handleGenerateAITags}
                                                    disabled={isGeneratingTags}
                                                >
                                                    {isGeneratingTags ? (
                                                        <Sparkles className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Bot className="h-4 w-4 text-blue-500" />
                                                    )}
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                {isGeneratingTags ? 'AI标签生成中...' : 'AI自动生成标签'}
                                            </TooltipContent>
                                        </Tooltip>
                                    )}

                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7"
                                                onClick={handleCopy}
                                            >
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>复制</TooltipContent>
                                    </Tooltip>
                                </>
                            )}

                            {isTrash && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7"
                                            onClick={() => onRestore(item?.id)}
                                        >
                                            <RotateCcw className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>恢复</TooltipContent>
                                </Tooltip>
                            )}

                            <AlertDialog>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent>{isTrash ? '永久删除' : '删除'}</TooltipContent>
                                </Tooltip>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>
                                            {isTrash ? '确定永久删除吗？' : '确定删除吗？'}
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                            {isTrash ? '此操作不可恢复。' : '此操作将把内容移动到回收站。'}
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>取消</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => onDelete(item?.id)}>
                                            确定
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>

                    {/* 内容区域 - 占据全宽 */}
                    <div className="mb-4">
                        <div
                            className={`text-sm leading-relaxed break-words whitespace-pre-wrap text-left ${shouldTruncate ? 'cursor-pointer hover:bg-muted p-2 -mx-2 rounded' : ''
                                }`}
                            onClick={handleContentClick}
                        >
                            {displayContent}
                        </div>
                        {shouldTruncate && (
                            <p className="text-xs text-muted-foreground italic mt-1 text-left">
                                点击查看完整内容
                            </p>
                        )}
                    </div>

                    {/* 标签显示区域 */}
                    {item?.tags && item.tags.length > 0 && (
                        <div className="mb-3">
                            <div className="flex flex-wrap gap-1">
                                {item.tags.map((tag, index) => (
                                    <Badge
                                        key={index}
                                        variant="outline"
                                        className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 border-blue-200"
                                        style={{ backgroundColor: tag.color ? `${tag.color}20` : '#eff6ff', borderColor: tag.color || '#93c5fd' }}
                                    >
                                        {typeof tag === 'string' ? tag : tag.name}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 底部信息 */}
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                            <Badge variant="secondary" className={getTypeColor(item?.content_type)}>
                                {item?.category || '未分类'}
                            </Badge>
                            {(item?.use_count || 0) > 0 && (
                                <span className="text-xs text-muted-foreground">
                                    已用{item?.use_count || 0}次
                                </span>
                            )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                            {formatDate(isTrash ? item?.deleted_at : item?.created_at)}
                        </span>
                    </div>
                </CardContent>
            </Card>

            {/* 内容详情模态框 */}
            <Dialog open={modalVisible} onOpenChange={setModalVisible}>
                <DialogContent className="max-w-4xl w-[90vw] h-[80vh] p-0 flex flex-col">
                    <DialogHeader className="flex-shrink-0 p-6 pb-0">
                        <DialogTitle className="flex items-center space-x-2 text-lg">
                            {getContentTypeIcon(item?.content_type)}
                            <span>{showTitle ? title : '内容详情'}</span>
                        </DialogTitle>
                    </DialogHeader>
                    
                    <div className="flex-1 px-6 py-4 min-h-0">
                        <div 
                            className="w-full h-full overflow-y-scroll bg-slate-50 border rounded-lg p-4 text-left"
                            style={{
                                scrollbarWidth: 'thin',
                                scrollbarColor: '#94a3b8 #e2e8f0'
                            }}
                        >
                            <div className="text-sm leading-relaxed whitespace-pre-wrap break-words font-mono text-left">
                                {itemContent}
                            </div>
                        </div>
                    </div>
                    
                    <DialogFooter className="flex-shrink-0 p-6 pt-0">
                        <div className="flex items-center justify-between w-full">
                            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                <span>字符数: {itemContent.length}</span>
                                <span>•</span>
                                <span>创建时间: {formatDate(item?.created_at)}</span>
                            </div>
                            <div className="flex space-x-2">
                              
                                <Button onClick={handleCopy} className="bg-blue-600 hover:bg-blue-700">
                                    复制
                                </Button>
                            </div>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 编辑模态框 */}
            <Dialog open={editModalVisible} onOpenChange={setEditModalVisible}>
                <DialogContent className="max-w-4xl w-[90vw] max-h-[85vh] p-0 flex flex-col">
                    <DialogHeader className="flex-shrink-0 p-6 pb-4 border-b">
                        <DialogTitle className="flex items-center space-x-2 text-lg">
                            <Edit3 className="h-5 w-5 text-blue-600" />
                            <span>编辑剪切板内容</span>
                        </DialogTitle>
                    </DialogHeader>
                    
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* 内容编辑区域 */}
                        <div className="space-y-3">
                            <Label htmlFor="edit-content" className="text-sm font-medium flex items-center space-x-2">
                                <span>内容</span>
                                <span className="text-xs text-muted-foreground">({editContent.length} 字符)</span>
                            </Label>
                            <Textarea
                                id="edit-content"
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                placeholder="请输入内容..."
                                rows={8}
                                className="resize-none font-mono text-sm leading-relaxed text-left"
                            />
                        </div>

                        {/* 分类选择区域 */}
                        <div className="space-y-3">
                            <Label htmlFor="edit-category" className="text-sm font-medium">分类</Label>
                            <Select value={editCategory} onValueChange={setEditCategory}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="选择分类" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categoryOptions.map(option => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* 标签编辑区域 */}
                        <div className="space-y-3">
                            <Label className="text-sm font-medium">标签管理</Label>
                            
                            {/* 当前标签显示 */}
                            {editTags.length > 0 && (
                                <div className="space-y-2">
                                    <div className="text-xs text-muted-foreground">当前标签</div>
                                    <div className="flex flex-wrap gap-2">
                                        {editTags.map((tag, index) => (
                                            <Badge
                                                key={index}
                                                variant="secondary"
                                                className="flex items-center space-x-1 px-2 py-1 bg-blue-50 text-blue-700 border-blue-200"
                                            >
                                                <span>{typeof tag === 'string' ? tag : tag.name}</span>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-4 w-4 p-0 hover:bg-blue-100"
                                                    onClick={() => handleRemoveTag(index)}
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            {/* 添加新标签 */}
                            <div className="space-y-2">
                                <div className="text-xs text-muted-foreground">添加新标签</div>
                                <div className="flex space-x-2">
                                    <Input
                                        value={newTag}
                                        onChange={(e) => setNewTag(e.target.value)}
                                        placeholder="输入标签名称..."
                                        className="flex-1"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAddTag();
                                            }
                                        }}
                                    />
                                    <Button
                                        onClick={handleAddTag}
                                        disabled={!newTag.trim()}
                                        size="sm"
                                        variant="outline"
                                        className="px-3"
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <DialogFooter className="flex-shrink-0 p-6 pt-4 border-t">
                        <div className="flex items-center justify-between w-full">
                            <div className="text-xs text-muted-foreground">
                                <span>最后修改: {formatDate(item?.updated_at)}</span>
                            </div>
                            <div className="flex space-x-3">
                                <DialogClose asChild>
                                    <Button variant="outline">
                                        取消
                                    </Button>
                                </DialogClose>
                                <Button
                                    onClick={handleEditSubmit}
                                    disabled={!editContent.trim()}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    保存更改
                                </Button>
                            </div>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </TooltipProvider>
    );
};

export default ClipboardItemCard;