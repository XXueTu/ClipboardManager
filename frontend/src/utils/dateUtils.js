/**
 * 日期格式化工具函数
 */

/**
 * 格式化日期为相对时间显示
 * @param {string} dateString - ISO 日期字符串
 * @returns {string} 格式化后的时间字符串
 */
export const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;
    
    return date.toLocaleDateString();
};