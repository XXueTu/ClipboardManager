import { useEffect, useState } from 'react';
import {
    Layout, Input, Card, Button, Space, Typography, Select, Switch, 
    InputNumber, message, Popconfirm, Row, Col, Statistic,
    Tooltip, Tag, Empty, Checkbox, Tabs, Modal, Form
} from 'antd';
import {
    CopyOutlined, DeleteOutlined, StarOutlined, StarFilled,
    SearchOutlined, ClearOutlined, SettingOutlined, 
    BarChartOutlined, InboxOutlined,
    FileTextOutlined, LinkOutlined, MailOutlined,
    PhoneOutlined, FileOutlined, LockOutlined,
    EyeOutlined, EyeInvisibleOutlined, ReloadOutlined,
    FilterOutlined, CloseOutlined, PlusOutlined,
    GlobalOutlined, SafetyOutlined, FolderOutlined,
    MessageOutlined, CodeOutlined, PictureOutlined,
    EditOutlined, SaveOutlined, HeartOutlined
} from '@ant-design/icons';
import {
    DeleteClipboardItem, GetClipboardItems, GetSettings, GetStatistics,
    GetWindowState, HideWindow, SearchClipboardItems, UpdateClipboardItem,
    UpdateSettings, UseClipboardItem, GetTrashItems, RestoreClipboardItem,
    PermanentDeleteClipboardItem, BatchPermanentDelete, EmptyTrash
} from "../wailsjs/go/main/App";
import './App.css';

// 添加搜索动画样式
const searchAnimationStyle = `
@keyframes pulse {
    0% { opacity: 0.6; }
    50% { opacity: 1; }
    100% { opacity: 0.6; }
}

.search-container:hover {
    transform: translateY(-1px);
}

.filter-option:hover {
    background-color: rgba(24,144,255,0.08);
}

.content-clickable {
    cursor: pointer;
    transition: all 0.2s ease;
}

.content-clickable:hover {
    background-color: rgba(24,144,255,0.04);
    border-radius: 4px;
}
`;

// 注入样式
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = searchAnimationStyle;
    document.head.appendChild(style);
}

const { Content } = Layout;
const { Text } = Typography;
const { Option } = Select;

// 工具函数
const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;
    
    return date.toLocaleDateString();
};

const getContentTypeIcon = (type) => {
    const iconMap = {
        text: <MessageOutlined style={{ color: '#1890ff' }} />,
        url: <GlobalOutlined style={{ color: '#52c41a' }} />,
        email: <MailOutlined style={{ color: '#faad14' }} />,
        phone: <PhoneOutlined style={{ color: '#722ed1' }} />,
        file: <FolderOutlined style={{ color: '#13c2c2' }} />,
        password: <SafetyOutlined style={{ color: '#f5222d' }} />,
        code: <CodeOutlined style={{ color: '#eb2f96' }} />,
        image: <PictureOutlined style={{ color: '#fa8c16' }} />
    };
    return iconMap[type] || <MessageOutlined style={{ color: '#1890ff' }} />;
};

const getContentTypeColor = (type) => {
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

// 获取文件名（用于文件类型）
const getFileName = (content) => {
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

// 检查是否需要显示标题
const shouldShowTitle = (contentType) => {
    // 只有文件、图片等类型才显示标题（文件名）
    if (contentType === 'file') {
        return true;
    }
    // 其他类型直接显示内容，不需要标题
    return false;
};

// 剪切板条目卡片组件
const ClipboardItemCard = ({ item, onCopy, onToggleFavorite, onDelete, onRestore, onEdit, isTrash = false, isFavorites = false }) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editForm] = Form.useForm();
    const maxLength = 150;
    
    const handleCopy = async () => {
        try {
            if (isTrash) {
                message.error('回收站中的条目无法复制，请先恢复');
                return;
            }
            await onCopy(item.id);
            message.success('已复制到剪切板');
        } catch (error) {
            message.error('复制失败');
        }
    };

    const shouldTruncate = item.content.length > maxLength;
    const displayContent = shouldTruncate 
        ? item.content.substring(0, maxLength) + '...' 
        : item.content;

    const showTitle = shouldShowTitle(item.content_type);
    const title = showTitle ? getFileName(item.content) : null;

    const handleContentClick = () => {
        if (shouldTruncate) {
            setModalVisible(true);
        }
    };

    return (
        <>
            <Card
                size="small"
                style={{ marginBottom: 12 }}
                styles={{ body: { padding: '16px' } }}
                hoverable
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, marginRight: 12, minWidth: 0 }}>
                        {/* 只有文件等类型才显示标题 */}
                        {showTitle && (
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                                <Space size={6}>
                                    {getContentTypeIcon(item.content_type)}
                                    <Text strong style={{ fontSize: '14px', textAlign: 'left' }}>{title}</Text>
                                </Space>
                            </div>
                        )}
                        
                        {/* 内容区域 */}
                        <div style={{ marginBottom: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: showTitle ? 0 : 8 }}>
                                {/* 如果没有标题，在内容前显示图标 */}
                                {!showTitle && (
                                    <div style={{ marginTop: 2, flexShrink: 0 }}>
                                        {getContentTypeIcon(item.content_type)}
                                    </div>
                                )}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div
                                        className={shouldTruncate ? 'content-clickable' : ''}
                                        onClick={handleContentClick}
                                        style={{ 
                                            fontSize: '13px', 
                                            lineHeight: '1.5',
                                            wordBreak: 'break-word',
                                            whiteSpace: 'pre-wrap',
                                            textAlign: 'left',
                                            padding: shouldTruncate ? '4px 8px' : '0',
                                            marginLeft: shouldTruncate ? '-8px' : '0',
                                            cursor: shouldTruncate ? 'pointer' : 'default'
                                        }}
                                    >
                                        {displayContent}
                                    </div>
                                    {shouldTruncate && (
                                        <Text 
                                            type="secondary" 
                                            style={{ 
                                                fontSize: '11px', 
                                                fontStyle: 'italic',
                                                marginTop: '4px',
                                                display: 'block'
                                            }}
                                        >
                                            点击查看完整内容
                                        </Text>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        {/* 底部信息 */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Space size={8}>
                                <Tag 
                                    color={getContentTypeColor(item.content_type)} 
                                    style={{ fontSize: '11px', margin: 0 }}
                                >
                                    {item.category}
                                </Tag>
                                {item.use_count > 0 && (
                                    <Text type="secondary" style={{ fontSize: '11px' }}>
                                        已用{item.use_count}次
                                    </Text>
                                )}
                            </Space>
                            <Text type="secondary" style={{ fontSize: '11px' }}>
                                {formatDate(isTrash ? item.deleted_at : item.created_at)}
                            </Text>
                        </div>
                    </div>
                    
                    {/* 操作按钮 */}
                    <Space size={6} style={{ flexShrink: 0 }}>
                        {!isTrash && (
                            <>
                                <Tooltip title={item.is_favorite ? '取消收藏' : '收藏'}>
                                    <Button
                                        type="text"
                                        size="small"
                                        icon={item.is_favorite ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
                                        onClick={() => onToggleFavorite(item.id)}
                                    />
                                </Tooltip>
                                {isFavorites && (
                                    <Tooltip title="编辑">
                                        <Button
                                            type="text"
                                            size="small"
                                            icon={<EditOutlined />}
                                            onClick={() => {
                                                editForm.setFieldsValue({
                                                    content: item.content,
                                                    category: item.category
                                                });
                                                setEditModalVisible(true);
                                            }}
                                        />
                                    </Tooltip>
                                )}
                                <Tooltip title="复制">
                                    <Button
                                        type="text"
                                        size="small"
                                        icon={<CopyOutlined />}
                                        onClick={handleCopy}
                                    />
                                </Tooltip>
                            </>
                        )}
                        {isTrash && (
                            <Tooltip title="恢复">
                                <Button
                                    type="text"
                                    size="small"
                                    icon={<ReloadOutlined />}
                                    onClick={() => onRestore(item.id)}
                                />
                            </Tooltip>
                        )}
                        <Tooltip title={isTrash ? '永久删除' : '删除'}>
                            <Popconfirm
                                title={isTrash ? '确定永久删除吗？' : '确定删除吗？'}
                                onConfirm={() => onDelete(item.id)}
                                okText="确定"
                                cancelText="取消"
                            >
                                <Button
                                    type="text"
                                    size="small"
                                    icon={<DeleteOutlined />}
                                />
                            </Popconfirm>
                        </Tooltip>
                    </Space>
                </div>
            </Card>
            
            {/* 内容详情模态框 */}
            <Modal
                title={(
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {getContentTypeIcon(item.content_type)}
                        <span>{showTitle ? title : '内容详情'}</span>
                    </div>
                )}
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={[
                    <Button key="copy" type="primary" onClick={handleCopy}>
                        复制内容
                    </Button>,
                    <Button key="close" onClick={() => setModalVisible(false)}>
                        关闭
                    </Button>
                ]}
                width={600}
            >
                <div style={{
                    padding: '16px',
                    background: '#f9f9f9',
                    borderRadius: '8px',
                    maxHeight: '400px',
                    overflowY: 'auto',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                }}>
                    {item.content}
                </div>
            </Modal>
            
            {/* 编辑模态框 */}
            <Modal
                title={(
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <EditOutlined style={{ color: '#1890ff' }} />
                        <span>编辑内容</span>
                    </div>
                )}
                open={editModalVisible}
                onCancel={() => {
                    setEditModalVisible(false);
                    editForm.resetFields();
                }}
                onOk={() => {
                    editForm.validateFields().then(values => {
                        onEdit(item.id, values.content, values.category);
                        setEditModalVisible(false);
                        editForm.resetFields();
                        message.success('内容已更新');
                    }).catch(err => {
                        console.error('表单验证失败:', err);
                    });
                }}
                okText="保存"
                cancelText="取消"
                width={600}
            >
                <Form
                    form={editForm}
                    layout="vertical"
                >
                    <Form.Item
                        name="content"
                        label="内容"
                        rules={[{ required: true, message: '请输入内容' }]}
                    >
                        <Input.TextArea
                            placeholder="请输入内容..."
                            rows={6}
                            style={{
                                borderRadius: '8px',
                                border: '1px solid #d9d9d9'
                            }}
                        />
                    </Form.Item>
                    <Form.Item
                        name="category"
                        label="分类"
                    >
                        <Select
                            placeholder="选择分类"
                            style={{ borderRadius: '8px' }}
                            options={[
                                { value: '文本', label: '文本' },
                                { value: '网址', label: '网址' },
                                { value: '邮箱', label: '邮箱' },
                                { value: '电话', label: '电话' },
                                { value: '文件', label: '文件' },
                                { value: '代码', label: '代码' },
                                { value: '其他', label: '其他' }
                            ]}
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
};

// 搜索栏组件 - 创新简约设计
const SearchBar = ({ onSearch, categories, contentTypes, onAddItem }) => {
    const [searchForm, setSearchForm] = useState({
        query: '',
        category: '',
        type: ''
    });
    const [showFilters, setShowFilters] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [addForm] = Form.useForm();

    const handleSearch = () => {
        onSearch({
            ...searchForm,
            limit: 50,
            offset: 0
        });
    };

    const handleClear = () => {
        const clearedForm = { query: '', category: '', type: '' };
        setSearchForm(clearedForm);
        onSearch({
            ...clearedForm,
            limit: 50,
            offset: 0
        });
    };

    const hasFilters = searchForm.category || searchForm.type;
    const hasQuery = searchForm.query.trim();

    return (
        <div style={{ marginBottom: 16 }}>
            {/* 主搜索区域 */}
            <div style={{
                position: 'relative',
                background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                borderRadius: '16px',
                padding: '4px',
                boxShadow: isFocused 
                    ? '0 8px 32px rgba(0,0,0,0.12), 0 0 0 1px rgba(24,144,255,0.3)' 
                    : '0 2px 8px rgba(0,0,0,0.06)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                border: '1px solid transparent',
                backgroundClip: 'padding-box'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* 搜索输入框 */}
                    <div style={{ flex: 1, position: 'relative' }}>
                        <Input
                            placeholder="搜索剪切板内容..."
                            value={searchForm.query}
                            onChange={(e) => setSearchForm(prev => ({ ...prev, query: e.target.value }))}
                            onPressEnter={handleSearch}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            style={{
                                border: 'none',
                                background: 'transparent',
                                fontSize: '15px',
                                padding: '12px 16px',
                                boxShadow: 'none',
                                outline: 'none'
                            }}
                            suffix={
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    {hasQuery && (
                                        <Button
                                            type="text"
                                            size="small"
                                            icon={<CloseOutlined />}
                                            onClick={handleClear}
                                            style={{
                                                padding: '4px',
                                                minWidth: 'auto',
                                                height: '20px',
                                                borderRadius: '50%',
                                                opacity: 0.6,
                                                transition: 'all 0.2s'
                                            }}
                                        />
                                    )}
                                    <div style={{
                                        width: '1px',
                                        height: '16px',
                                        background: '#e8e8e8',
                                        margin: '0 4px'
                                    }} />
                                    <SearchOutlined style={{ color: '#8c8c8c', fontSize: '16px' }} />
                                </div>
                            }
                        />
                    </div>
                    
                    {/* 筛选按钮 */}
                    <Button
                        type="text"
                        icon={<FilterOutlined />}
                        onClick={() => setShowFilters(!showFilters)}
                        style={{
                            borderRadius: '12px',
                            padding: '8px 12px',
                            height: '40px',
                            background: showFilters ? 'rgba(24,144,255,0.1)' : 'transparent',
                            color: showFilters ? '#1890ff' : '#8c8c8c',
                            border: showFilters ? '1px solid rgba(24,144,255,0.3)' : '1px solid transparent',
                            transition: 'all 0.2s',
                            position: 'relative'
                        }}
                    >
                        筛选
                        {hasFilters && (
                            <div style={{
                                position: 'absolute',
                                top: '6px',
                                right: '6px',
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                background: '#ff4d4f'
                            }} />
                        )}
                    </Button>
                </div>
            </div>
            
            {/* 筛选选项 - 优化动画性能 */}
            <div style={{
                maxHeight: showFilters ? '200px' : '0',
                overflow: 'hidden',
                transition: 'max-height 0.3s ease-out, opacity 0.2s ease-out',
                opacity: showFilters ? 1 : 0
            }}>
                <div style={{
                    padding: '16px',
                    background: 'rgba(255,255,255,0.8)',
                    borderRadius: '12px',
                    marginTop: '8px',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(0,0,0,0.06)'
                }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <Text style={{ fontSize: '13px', color: '#666', minWidth: '40px' }}>分类</Text>
                        <Select
                            placeholder="全部分类"
                            value={searchForm.category || undefined}
                            onChange={(value) => setSearchForm(prev => ({ ...prev, category: value || '' }))}
                            style={{ width: 140 }}
                            allowClear
                            size="small"
                        >
                            {categories.map(cat => (
                                <Option key={cat} value={cat}>{cat}</Option>
                            ))}
                        </Select>
                        
                        <Text style={{ fontSize: '13px', color: '#666', minWidth: '40px' }}>类型</Text>
                        <Select
                            placeholder="全部类型"
                            value={searchForm.type || undefined}
                            onChange={(value) => setSearchForm(prev => ({ ...prev, type: value || '' }))}
                            style={{ width: 140 }}
                            allowClear
                            size="small"
                        >
                            {contentTypes.map(type => (
                                <Option key={type} value={type}>
                                    {getContentTypeIcon(type)} {type}
                                </Option>
                            ))}
                        </Select>
                        
                        <div style={{ flex: 1 }} />
                        
                        {hasFilters && (
                            <Button
                                type="text"
                                size="small"
                                onClick={handleClear}
                                style={{
                                    color: '#ff4d4f',
                                    fontSize: '12px',
                                    padding: '4px 8px'
                                }}
                            >
                                清除筛选
                            </Button>
                        )}
                        
                        {/* 新增按钮 */}
                        <Button
                            type="primary"
                            size="small"
                            icon={<PlusOutlined />}
                            onClick={() => setAddModalVisible(true)}
                            style={{
                                background: 'linear-gradient(135deg, #1890ff, #40a9ff)',
                                border: 'none',
                                borderRadius: '6px',
                                boxShadow: '0 2px 4px rgba(24,144,255,0.3)'
                            }}
                        >
                            新增
                        </Button>
                    </div>
                </div>
            </div>
            
            {/* 新增内容模态框 */}
            <Modal
                title="新增内容"
                open={addModalVisible}
                onCancel={() => {
                    setAddModalVisible(false);
                    addForm.resetFields();
                }}
                onOk={() => {
                    addForm.validateFields().then(values => {
                        onAddItem(values.content, values.category || '文本');
                        setAddModalVisible(false);
                        addForm.resetFields();
                        message.success('内容已添加');
                    }).catch(err => {
                        console.error('表单验证失败:', err);
                    });
                }}
                okText="添加"
                cancelText="取消"
                width={500}
            >
                <Form
                    form={addForm}
                    layout="vertical"
                    initialValues={{
                        category: '文本'
                    }}
                >
                    <Form.Item
                        name="content"
                        label="内容"
                        rules={[{ required: true, message: '请输入内容' }]}
                    >
                        <Input.TextArea
                            placeholder="请输入要保存的内容..."
                            rows={4}
                            style={{
                                borderRadius: '8px',
                                border: '1px solid #d9d9d9'
                            }}
                        />
                    </Form.Item>
                    <Form.Item
                        name="category"
                        label="分类"
                    >
                        <Select
                            placeholder="选择分类"
                            style={{ borderRadius: '8px' }}
                            options={[
                                { value: '文本', label: '文本' },
                                { value: '网址', label: '网址' },
                                { value: '邮箱', label: '邮箱' },
                                { value: '电话', label: '电话' },
                                { value: '文件', label: '文件' },
                                { value: '代码', label: '代码' },
                                { value: '其他', label: '其他' }
                            ]}
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

// 统计页面
const StatisticsPage = ({ statistics }) => {
    if (!statistics) {
        return <Empty description="暂无统计数据" />;
    }

    return (
        <div>
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col span={8}>
                    <Card>
                        <Statistic
                            title="总条目"
                            value={statistics.total_items}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card>
                        <Statistic
                            title="今日新增"
                            value={statistics.today_items}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card>
                        <Statistic
                            title="本周新增"
                            value={statistics.week_items}
                            valueStyle={{ color: '#fa8c16' }}
                        />
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]}>
                <Col span={12}>
                    <Card title="内容类型分布" size="small">
                        {Object.entries(statistics.type_stats || {}).map(([type, count]) => (
                            <div key={type} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <Space>
                                    {getContentTypeIcon(type)}
                                    <Text>{type}</Text>
                                </Space>
                                <Text strong>{count}</Text>
                            </div>
                        ))}
                    </Card>
                </Col>
                <Col span={12}>
                    <Card title="分类统计" size="small">
                        {Object.entries(statistics.category_stats || {}).map(([category, count]) => (
                            <div key={category} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <Text>{category}</Text>
                                <Text strong>{count}</Text>
                            </div>
                        ))}
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

// 设置页面
const SettingsPage = ({ settings, onUpdateSettings }) => {
    const [form, setForm] = useState(settings);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setForm(settings);
    }, [settings]);

    const handleSave = async () => {
        setLoading(true);
        try {
            await onUpdateSettings(form);
            message.success('设置已保存');
        } catch (error) {
            message.error('保存失败');
        } finally {
            setLoading(false);
        }
    };

    if (!settings) {
        return <Empty description="加载设置中..." />;
    }

    return (
        <Card title="应用设置">
            <Space direction="vertical" style={{ width: '100%' }} size="large">
                <div>
                    <Text strong>自动捕获剪切板</Text>
                    <br />
                    <Switch
                        checked={form.auto_capture}
                        onChange={(checked) => setForm(prev => ({ ...prev, auto_capture: checked }))}
                        style={{ marginTop: 8 }}
                    />
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        自动监听并保存剪切板内容
                    </Text>
                </div>

                <div>
                    <Text strong>最大条目数</Text>
                    <br />
                    <InputNumber
                        value={form.max_items}
                        onChange={(value) => setForm(prev => ({ ...prev, max_items: value || 1000 }))}
                        min={100}
                        max={10000}
                        style={{ marginTop: 8 }}
                    />
                </div>

                <div>
                    <Text strong>忽略密码</Text>
                    <br />
                    <Switch
                        checked={form.ignore_passwords}
                        onChange={(checked) => setForm(prev => ({ ...prev, ignore_passwords: checked }))}
                        style={{ marginTop: 8 }}
                    />
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        自动跳过疑似密码内容
                    </Text>
                </div>

                <div>
                    <Text strong>自动分类</Text>
                    <br />
                    <Switch
                        checked={form.auto_categorize}
                        onChange={(checked) => setForm(prev => ({ ...prev, auto_categorize: checked }))}
                        style={{ marginTop: 8 }}
                    />
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        根据内容自动分类和标签
                    </Text>
                </div>

                <div>
                    <Text strong>默认分类</Text>
                    <br />
                    <Input
                        value={form.default_category}
                        onChange={(e) => setForm(prev => ({ ...prev, default_category: e.target.value }))}
                        style={{ marginTop: 8, width: 200 }}
                    />
                </div>

                <div>
                    <Text strong>侧边栏位置</Text>
                    <br />
                    <Select
                        value={form.position}
                        onChange={(value) => setForm(prev => ({ ...prev, position: value }))}
                        style={{ marginTop: 8, width: 200 }}
                    >
                        <Option value="left">左侧</Option>
                        <Option value="right">右侧</Option>
                    </Select>
                </div>

                <Button
                    type="primary"
                    loading={loading}
                    onClick={handleSave}
                    style={{ marginTop: 16 }}
                >
                    保存设置
                </Button>
            </Space>
        </Card>
    );
};

// 回收站页面
const TrashPage = ({ trashItems, onRestore, onPermanentDelete, onBatchDelete, onEmptyTrash, onRefresh }) => {
    const [selectedItems, setSelectedItems] = useState([]);

    const handleSelectAll = (checked) => {
        setSelectedItems(checked ? trashItems.map(item => item.id) : []);
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
            message.warning('请选择要删除的条目');
            return;
        }
        
        try {
            await onBatchDelete(selectedItems);
            setSelectedItems([]);
            message.success('批量删除成功');
        } catch (error) {
            message.error('批量删除失败');
        }
    };

    const handleEmptyTrash = async () => {
        try {
            await onEmptyTrash();
            setSelectedItems([]);
            message.success('回收站已清空');
        } catch (error) {
            message.error('清空失败');
        }
    };

    return (
        <div>
            <Card size="small" style={{ marginBottom: 16 }}>
                <Space>
                    <Checkbox
                        checked={selectedItems.length === trashItems.length && trashItems.length > 0}
                        indeterminate={selectedItems.length > 0 && selectedItems.length < trashItems.length}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                    >
                        全选
                    </Checkbox>
                    <Button 
                        danger
                        disabled={selectedItems.length === 0}
                        onClick={handleBatchDelete}
                    >
                        批量永久删除 ({selectedItems.length})
                    </Button>
                    <Popconfirm
                        title="确定清空回收站吗？此操作不可恢复！"
                        onConfirm={handleEmptyTrash}
                        okText="确定"
                        cancelText="取消"
                    >
                        <Button danger disabled={trashItems.length === 0}>
                            清空回收站
                        </Button>
                    </Popconfirm>
                    <Button icon={<ReloadOutlined />} onClick={onRefresh}>
                        刷新
                    </Button>
                </Space>
            </Card>

            {trashItems.length === 0 ? (
                <Empty description="回收站为空" />
            ) : (
                <div style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                    {trashItems.map(item => (
                        <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 8 }}>
                            <Checkbox
                                checked={selectedItems.includes(item.id)}
                                onChange={(e) => handleSelect(item.id, e.target.checked)}
                                style={{ marginRight: 8, marginTop: 16 }}
                            />
                            <div style={{ flex: 1 }}>
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
        </div>
    );
};

// 收藏页面组件
const FavoritesPage = ({ favoriteItems, onCopy, onToggleFavorite, onDelete, onEdit, onRefresh }) => {
    return (
        <div>
            <Card size="small" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <HeartOutlined style={{ color: '#ff4d4f', fontSize: '16px' }} />
                        <Text strong>我的收藏 ({favoriteItems.length})</Text>
                    </div>
                    <Button icon={<ReloadOutlined />} onClick={onRefresh} size="small">
                        刷新
                    </Button>
                </div>
            </Card>

            {favoriteItems.length === 0 ? (
                <Empty 
                    description="还没有收藏任何内容" 
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    style={{ padding: '40px 0' }}
                />
            ) : (
                <div style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                    {favoriteItems.map(item => (
                        <ClipboardItemCard
                            key={item.id}
                            item={item}
                            onCopy={onCopy}
                            onToggleFavorite={onToggleFavorite}
                            onDelete={onDelete}
                            onEdit={onEdit}
                            isFavorites={true}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

// 主应用组件
function App() {
    const [clipboardItems, setClipboardItems] = useState([]);
    const [trashItems, setTrashItems] = useState([]);
    const [favoriteItems, setFavoriteItems] = useState([]);
    const [searchResult, setSearchResult] = useState(null);
    const [statistics, setStatistics] = useState(null);
    const [settings, setSettings] = useState(null);
    const [windowState, setWindowState] = useState({});
    const [loading, setLoading] = useState(false);

    // 初始化数据
    useEffect(() => {
        loadInitialData();
        updateWindowState();
        
        const interval = setInterval(updateWindowState, 3000);
        return () => clearInterval(interval);
    }, []);

    const loadInitialData = async () => {
        try {
            const [items, stats, config] = await Promise.all([
                GetClipboardItems(50, 0),
                GetStatistics(),
                GetSettings()
            ]);
            
            setClipboardItems(items || []);
            setStatistics(stats);
            setSettings(config);
        } catch (error) {
            console.error('加载数据失败:', error);
            message.error('加载数据失败');
        }
    };

    const loadClipboardItems = async () => {
        try {
            const items = await GetClipboardItems(50, 0);
            setClipboardItems(items || []);
            setSearchResult(null);
        } catch (error) {
            message.error('加载剪切板数据失败');
        }
    };

    const loadTrashItems = async () => {
        try {
            const items = await GetTrashItems(50, 0);
            setTrashItems(items || []);
        } catch (error) {
            message.error('加载回收站数据失败');
        }
    };

    const loadFavoriteItems = async () => {
        try {
            const items = await GetClipboardItems(200, 0);
            const favorites = items ? items.filter(item => item.is_favorite) : [];
            setFavoriteItems(favorites);
        } catch (error) {
            message.error('加载收藏数据失败');
        }
    };

    const loadStatistics = async () => {
        try {
            const stats = await GetStatistics();
            setStatistics(stats);
        } catch (error) {
            message.error('加载统计数据失败');
        }
    };

    const updateWindowState = async () => {
        try {
            const state = await GetWindowState();
            setWindowState(state);
        } catch (error) {
            console.error('获取窗口状态失败:', error);
        }
    };

    const handleSearch = async (query) => {
        setLoading(true);
        try {
            const result = await SearchClipboardItems(query);
            setSearchResult(result);
        } catch (error) {
            message.error('搜索失败');
        } finally {
            setLoading(false);
        }
    };

    const handleCopyItem = async (id) => {
        await UseClipboardItem(id);
        loadInitialData();
    };

    const handleToggleFavorite = async (id) => {
        try {
            const item = [...clipboardItems, ...favoriteItems].find(i => i.id === id);
            if (item) {
                await UpdateClipboardItem({
                    ...item,
                    is_favorite: !item.is_favorite
                });
                loadClipboardItems();
                loadFavoriteItems();
            }
        } catch (error) {
            message.error('更新收藏状态失败');
        }
    };

    const handleDeleteItem = async (id) => {
        try {
            await DeleteClipboardItem(id);
            loadClipboardItems();
            message.success('已移动到回收站');
        } catch (error) {
            message.error('删除失败');
        }
    };

    const handleRestoreItem = async (id) => {
        try {
            await RestoreClipboardItem(id);
            loadTrashItems();
            message.success('恢复成功');
        } catch (error) {
            message.error('恢复失败');
        }
    };

    const handlePermanentDelete = async (id) => {
        try {
            await PermanentDeleteClipboardItem(id);
            loadTrashItems();
            message.success('永久删除成功');
        } catch (error) {
            message.error('删除失败');
        }
    };

    const handleBatchDelete = async (ids) => {
        await BatchPermanentDelete(ids);
        loadTrashItems();
    };

    const handleEmptyTrash = async () => {
        await EmptyTrash();
        loadTrashItems();
    };

    const handleUpdateSettings = async (newSettings) => {
        await UpdateSettings(newSettings);
        setSettings(newSettings);
    };

    const handleAddItem = async (content, category) => {
        try {
            const newItem = {
                id: Date.now().toString(),
                content: content,
                category: category,
                content_type: 'text',
                is_favorite: false,
                use_count: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                last_used: null,
                is_deleted: false,
                deleted_at: null
            };
            
            await UpdateClipboardItem(newItem);
            loadClipboardItems();
        } catch (error) {
            message.error('添加失败');
        }
    };

    const handleEditItem = async (id, content, category) => {
        try {
            const item = [...clipboardItems, ...favoriteItems].find(i => i.id === id);
            if (item) {
                const updatedItem = {
                    ...item,
                    content: content,
                    category: category,
                    updated_at: new Date().toISOString()
                };
                await UpdateClipboardItem(updatedItem);
                loadClipboardItems();
                loadFavoriteItems();
                loadFavoriteItems();
            }
        } catch (error) {
            message.error('更新失败');
        }
    };

    const handleHideWindow = () => {
        HideWindow();
    };

    // 键盘快捷键
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                handleHideWindow();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // 获取分类和类型列表
    const categories = [...new Set(clipboardItems.map(item => item.category))];
    const contentTypes = [...new Set(clipboardItems.map(item => item.content_type))];
    const currentItems = searchResult ? searchResult.items : clipboardItems;

    // Tab切换处理
    const handleTabChange = (activeKey) => {
        if (activeKey === '2') { // 收藏
            loadFavoriteItems();
        } else if (activeKey === '3') { // 回收站
            loadTrashItems();
        } else if (activeKey === '4') { // 统计
            loadStatistics();
        } else if (activeKey === '1') { // 剪切板
            loadClipboardItems();
        }
    };

    const renderClipboardContent = () => (
        <div>
            <SearchBar 
                onSearch={handleSearch}
                categories={categories}
                contentTypes={contentTypes}
                onAddItem={handleAddItem}
            />
            
            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <Text>搜索中...</Text>
                </div>
            ) : (
                <>
                    {searchResult && (
                        <Card size="small" style={{ marginBottom: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text>找到 {searchResult.total} 个结果</Text>
                                <Button type="link" size="small" onClick={() => setSearchResult(null)}>
                                    清除搜索
                                </Button>
                            </div>
                        </Card>
                    )}
                    
                    {currentItems.length === 0 ? (
                        <Empty description={searchResult ? '没有找到匹配的内容' : '还没有剪切板记录'} />
                    ) : (
                        <div style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                            {currentItems.map(item => (
                                <ClipboardItemCard
                                    key={item.id}
                                    item={item}
                                    onCopy={handleCopyItem}
                                    onToggleFavorite={handleToggleFavorite}
                                    onDelete={handleDeleteItem}
                                    onEdit={handleEditItem}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );

    return (
        <Layout style={{ height: '100vh', background: '#f0f2f5' }}>
            <Content style={{ padding: '16px', overflow: 'hidden' }}>
                {/* 监听状态指示器 */}
                {windowState.isMonitoring && (
                    <div style={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        color: '#52c41a',
                        fontSize: '12px',
                        background: 'rgba(82, 196, 26, 0.1)',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        border: '1px solid rgba(82, 196, 26, 0.3)',
                        zIndex: 10
                    }}>
                        <div style={{ 
                            width: 6, 
                            height: 6, 
                            borderRadius: '50%', 
                            backgroundColor: '#52c41a',
                            animation: 'pulse 2s infinite'
                        }} />
                        监听中
                    </div>
                )}

                {/* 主要内容 - 使用Tabs替代侧边栏 */}
                <Tabs 
                    defaultActiveKey="1" 
                    onChange={handleTabChange}
                    style={{ height: '100%' }}
                    items={[
                        {
                            key: '1',
                            label: (
                                <span>
                                    <InboxOutlined />
                                    剪切板
                                </span>
                            ),
                            children: renderClipboardContent()
                        },
                        {
                            key: '2',
                            label: (
                                <span>
                                    <HeartOutlined style={{ color: '#ff4d4f' }} />
                                    收藏
                                </span>
                            ),
                            children: (
                                <FavoritesPage
                                    favoriteItems={favoriteItems}
                                    onCopy={handleCopyItem}
                                    onToggleFavorite={handleToggleFavorite}
                                    onDelete={handleDeleteItem}
                                    onEdit={handleEditItem}
                                    onRefresh={loadFavoriteItems}
                                />
                            )
                        },
                        {
                            key: '3',
                            label: (
                                <span>
                                    <DeleteOutlined />
                                    回收站
                                </span>
                            ),
                            children: (
                                <TrashPage
                                    trashItems={trashItems}
                                    onRestore={handleRestoreItem}
                                    onPermanentDelete={handlePermanentDelete}
                                    onBatchDelete={handleBatchDelete}
                                    onEmptyTrash={handleEmptyTrash}
                                    onRefresh={loadTrashItems}
                                />
                            )
                        },
                        {
                            key: '4',
                            label: (
                                <span>
                                    <BarChartOutlined />
                                    统计
                                </span>
                            ),
                            children: <StatisticsPage statistics={statistics} />
                        },
                        {
                            key: '5',
                            label: (
                                <span>
                                    <SettingOutlined />
                                    设置
                                </span>
                            ),
                            children: settings ? (
                                <SettingsPage 
                                    settings={settings} 
                                    onUpdateSettings={handleUpdateSettings}
                                />
                            ) : (
                                <Empty description="加载设置中..." />
                            )
                        }
                    ]}
                />
            </Content>
        </Layout>
    );
}

export default App;