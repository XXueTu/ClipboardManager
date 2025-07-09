import { useState } from 'react';
import { Trash2, RefreshCw, RotateCcw } from 'lucide-react';

// shadcn/ui 组件
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Checkbox } from '../components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog';
import { useToast } from '../components/ui/toast';

import ClipboardItemCard from '../components/ClipboardItemCard';

/**
 * 回收站页面组件
 * @param {Object} props - 组件属性
 * @param {Array} props.trashItems - 回收站条目列表
 * @param {Function} props.onRestore - 恢复回调函数
 * @param {Function} props.onPermanentDelete - 永久删除回调函数
 * @param {Function} props.onBatchDelete - 批量删除回调函数
 * @param {Function} props.onEmptyTrash - 清空回收站回调函数
 * @param {Function} props.onRefresh - 刷新回调函数
 */
const TrashPage = ({ trashItems, onRestore, onPermanentDelete, onBatchDelete, onEmptyTrash, onRefresh }) => {
    const { toast } = useToast();
    const [selectedItems, setSelectedItems] = useState([]);

    const safeTrashItems = Array.isArray(trashItems) ? trashItems : [];

    const handleSelectAll = (checked) => {
        setSelectedItems(checked ? safeTrashItems.map(item => item?.id).filter(Boolean) : []);
    };

    const handleSelect = (id, checked) => {
        setSelectedItems(prev => 
            checked 
                ? [...prev, id]
                : prev.filter(itemId => itemId !== id)
        );
    };

    const handleBatchDelete = async () => {
        if (selectedItems.length === 0) {
            toast.warning('请选择要删除的条目');
            return;
        }
        
        try {
            await onBatchDelete(selectedItems);
            setSelectedItems([]);
            toast.success('批量删除成功');
        } catch (error) {
            toast.error('批量删除失败');
        }
    };

    const handleEmptyTrash = async () => {
        try {
            await onEmptyTrash();
            setSelectedItems([]);
            toast.success('回收站已清空');
        } catch (error) {
            toast.error('清空失败');
        }
    };

    const allSelected = selectedItems.length === safeTrashItems.length && safeTrashItems.length > 0;
    const someSelected = selectedItems.length > 0 && selectedItems.length < safeTrashItems.length;

    return (
        <div className="space-y-4">
            {/* 操作栏 */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    checked={allSelected}
                                    onCheckedChange={handleSelectAll}
                                    className={someSelected ? "data-[state=checked]:bg-primary/50" : ""}
                                />
                                <span className="text-sm font-medium">
                                    {selectedItems.length > 0 ? `已选择 ${selectedItems.length} 项` : '全选'}
                                </span>
                            </div>

                            {selectedItems.length > 0 && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="sm">
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            批量永久删除 ({selectedItems.length})
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>确定永久删除所选项目？</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                此操作不可恢复，将永久删除 {selectedItems.length} 个条目。
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>取消</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleBatchDelete}>
                                                确定删除
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                        </div>

                        <div className="flex items-center space-x-2">
                            {safeTrashItems.length > 0 && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="sm">
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            清空回收站
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>确定清空回收站吗？</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                此操作不可恢复！将永久删除回收站中的所有 {safeTrashItems.length} 个条目。
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>取消</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleEmptyTrash}>
                                                确定清空
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}

                            <Button variant="outline" size="sm" onClick={onRefresh}>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                刷新
                            </Button>
                        </div>
                    </div>

                    {/* 统计信息 */}
                    <div className="mt-4 pt-4 border-t">
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                                <Trash2 className="h-4 w-4" />
                                <span>回收站条目: {safeTrashItems.length}</span>
                            </div>
                            {selectedItems.length > 0 && (
                                <div className="flex items-center space-x-1">
                                    <span>•</span>
                                    <span>已选择: {selectedItems.length}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 内容区域 */}
            {safeTrashItems.length === 0 ? (
                <div className="text-center py-20">
                    <Trash2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground text-lg">回收站为空</p>
                    <p className="text-sm text-muted-foreground mt-2">
                        删除的剪切板条目会出现在这里
                    </p>
                </div>
            ) : (
                <div className="max-h-[calc(100vh-280px)] overflow-y-auto space-y-3">
                    {safeTrashItems.map(item => (
                        <div key={item?.id} className="flex items-start space-x-3">
                            <div className="mt-4">
                                <Checkbox
                                    checked={selectedItems.includes(item?.id)}
                                    onCheckedChange={(checked) => handleSelect(item?.id, checked)}
                                />
                            </div>
                            <div className="flex-1">
                                <ClipboardItemCard
                                    item={item}
                                    onRestore={onRestore}
                                    onDelete={onPermanentDelete}
                                    isTrash={true}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* 底部信息 */}
            {safeTrashItems.length > 0 && (
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center text-sm text-muted-foreground">
                            <div className="flex items-center justify-center space-x-2">
                                <RotateCcw className="h-4 w-4" />
                                <span>提示：点击恢复按钮可以将条目恢复到剪切板</span>
                            </div>
                            <p className="mt-2">
                                永久删除的条目将无法恢复，请谨慎操作
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default TrashPage;