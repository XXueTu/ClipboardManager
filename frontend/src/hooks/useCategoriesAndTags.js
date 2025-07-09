import { useEffect, useState } from 'react';
import { GetCategoriesAndTags } from '../../wailsjs/go/main/App';

/**
 * 获取分类和标签的自定义Hook
 */
export const useCategoriesAndTags = () => {
    const [categoriesAndTags, setCategoriesAndTags] = useState({
        categories: [],
        tags: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadCategoriesAndTags = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // 检查 Wails 运行时是否可用
            if (typeof window === 'undefined' || !window.go || !window.go.main || !window.go.main.App) {
                throw new Error('Wails runtime not ready');
            }
            
            const response = await GetCategoriesAndTags();
            setCategoriesAndTags({
                categories: response.categories || [],
                tags: response.tags || []
            });
        } catch (err) {
            console.error('获取分类和标签失败:', err);
            setError(err.message || '获取分类和标签失败');
            // 使用默认分类作为后备
            setCategoriesAndTags({
                categories: ['未分类', '网址', '文件', '邮箱', '电话', '代码', '笔记', '命令', 'JSON', '标识符', '地址', '数字'],
                tags: []
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // 延迟加载，等待 Wails 运行时准备好
        const timer = setTimeout(() => {
            loadCategoriesAndTags();
        }, 100);
        
        return () => clearTimeout(timer);
    }, []);

    return {
        categories: categoriesAndTags.categories,
        tags: categoriesAndTags.tags,
        loading,
        error,
        reload: loadCategoriesAndTags
    };
};