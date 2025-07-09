/**
 * 分类相关常量和工具函数
 */

// 默认分类（用作后备）
export const DEFAULT_CATEGORY = '未分类';

/**
 * 将分类数组转换为选项格式
 * @param {string[]} categories - 分类数组
 * @returns {Array<{value: string, label: string}>} 选项数组
 */
export const categoriesToOptions = (categories = []) => {
    return categories.map(category => ({
        value: category,
        label: category
    }));
};

/**
 * 后备分类选项（当API调用失败时使用）
 */
export const FALLBACK_CATEGORY_OPTIONS = [
    { value: '未分类', label: '未分类' },
    { value: '网址', label: '网址' },
    { value: '文件', label: '文件' },
    { value: '邮箱', label: '邮箱' },
    { value: '电话', label: '电话' },
    { value: '代码', label: '代码' },
    { value: '笔记', label: '笔记' },
    { value: '命令', label: '命令' },
    { value: 'JSON', label: 'JSON' },
    { value: '标识符', label: '标识符' },
    { value: '地址', label: '地址' },
    { value: '数字', label: '数字' }
];