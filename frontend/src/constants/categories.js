/**
 * 分类相关常量和工具函数
 */

// 默认分类（用作后备）
export const DEFAULT_CATEGORY = '文本';

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
 * 后备分类选项（当API调用失败时使用）- 简化版本，匹配后端
 */
export const FALLBACK_CATEGORY_OPTIONS = [
    { value: '文本', label: '文本' },
    { value: '文件', label: '文件' },
    { value: '网站', label: '网站' },
    { value: '路径', label: '路径' },
    { value: '邮箱', label: '邮箱' },
    { value: '数字', label: '数字' }
];