import {
    MessageSquare, Globe, Mail,
    Phone, Folder, Shield,
    Code, Image
} from 'lucide-react';

/**
 * 内容类型相关的工具函数
 */

/**
 * 根据内容类型获取对应的图标
 * @param {string} type - 内容类型
 * @returns {JSX.Element} 图标组件
 */
export const getContentTypeIcon = (type) => {
    const iconMap = {
        text: <MessageSquare className="h-4 w-4 text-blue-500" />,
        url: <Globe className="h-4 w-4 text-green-500" />,
        email: <Mail className="h-4 w-4 text-yellow-500" />,
        phone: <Phone className="h-4 w-4 text-purple-500" />,
        file: <Folder className="h-4 w-4 text-cyan-500" />,
        password: <Shield className="h-4 w-4 text-red-500" />,
        code: <Code className="h-4 w-4 text-pink-500" />,
        image: <Image className="h-4 w-4 text-orange-500" />
    };
    return iconMap[type] || <MessageSquare className="h-4 w-4 text-blue-500" />;
};

/**
 * 根据内容类型获取对应的颜色
 * @param {string} type - 内容类型
 * @returns {string} 颜色值
 */
export const getContentTypeColor = (type) => {
    const colorMap = {
        text: 'blue',
        url: 'cyan',
        email: 'orange',
        phone: 'purple',
        file: 'green',
        password: 'red'
    };
    return colorMap[type] || 'blue';
};