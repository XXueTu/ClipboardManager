/**
 * 文件处理相关的工具函数
 */

/**
 * 从文件路径中提取文件名
 * @param {string} content - 文件路径
 * @returns {string} 文件名
 */
export const getFileName = (content) => {
    if (content.includes('/')) {
        const parts = content.split('/');
        return parts[parts.length - 1];
    }
    if (content.includes('\\')) {
        const parts = content.split('\\');
        return parts[parts.length - 1];
    }
    return content;
};

/**
 * 检查是否需要显示标题（主要用于文件类型）
 * @param {string} contentType - 内容类型
 * @returns {boolean} 是否显示标题
 */
export const shouldShowTitle = (contentType) => {
    // 只有文件、图片等类型才显示标题（文件名）
    if (contentType === 'file') {
        return true;
    }
    // 其他类型直接显示内容，不需要标题
    return false;
};