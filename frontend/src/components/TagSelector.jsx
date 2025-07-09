import {
    BulbOutlined,
    ClockCircleOutlined,
    FireOutlined,
    PlusOutlined,
    SyncOutlined
} from '@ant-design/icons';
import {
    Badge,
    Button,
    Divider,
    Form,
    Input,
    message,
    Modal,
    Popover,
    Select,
    Space,
    Tag
} from 'antd';
import React, { useEffect, useState } from 'react';
import {
    AutoGenerateTags,
    CreateTag,
    GetMostUsedTags,
    GetRecentTags,
    GetTags,
    SuggestTags,
    UpdateItemTags
} from '../../wailsjs/go/main/App';

const TagSelector = ({ 
  value = [], 
  onChange, 
  itemId, 
  content = '', 
  contentType = 'text',
  mode = 'multiple', // multiple, single
  placeholder = '选择标签...',
  showSuggestions = true,
  showAutoGenerate = true,
  showQuickActions = true,
  maxTagLength = 20,
  disabled = false,
  style = {}
}) => {
  const [tags, setTags] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [mostUsedTags, setMostUsedTags] = useState([]);
  const [recentTags, setRecentTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [suggestionsVisible, setSuggestionsVisible] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [form] = Form.useForm();

  useEffect(() => {
    loadTags();
    if (showSuggestions) {
      loadSuggestions();
      loadMostUsedTags();
      loadRecentTags();
    }
  }, []);

  useEffect(() => {
    if (content && showSuggestions) {
      loadContentSuggestions();
    }
  }, [content, contentType]);

  const loadTags = async () => {
    try {
      const result = await GetTags();
      setTags(result || []);
    } catch (error) {
      console.error('加载标签失败:', error);
    }
  };

  const loadSuggestions = async () => {
    try {
      const result = await SuggestTags(content, 5);
      setSuggestions(result || []);
    } catch (error) {
      console.error('加载建议失败:', error);
    }
  };

  const loadContentSuggestions = async () => {
    if (!content) return;
    try {
      const result = await SuggestTags(content, 8);
      setSuggestions(result || []);
    } catch (error) {
      console.error('加载内容建议失败:', error);
    }
  };

  const loadMostUsedTags = async () => {
    try {
      const result = await GetMostUsedTags(6);
      setMostUsedTags(result || []);
    } catch (error) {
      console.error('加载热门标签失败:', error);
    }
  };

  const loadRecentTags = async () => {
    try {
      const result = await GetRecentTags(6);
      setRecentTags(result || []);
    } catch (error) {
      console.error('加载最近标签失败:', error);
    }
  };

  const handleAutoGenerate = async () => {
    if (!content) {
      message.warning('没有内容可以分析');
      return;
    }

    setLoading(true);
    try {
      const autoTags = await AutoGenerateTags(content, contentType);
      const newTags = [...new Set([...value, ...autoTags])];
      
      onChange?.(newTags);
      
      if (itemId) {
        await UpdateItemTags(itemId, newTags);
      }
      
      message.success(`自动生成了 ${autoTags.length} 个标签`);
    } catch (error) {
      message.error('自动生成失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTag = async (values) => {
    try {
      const newTag = await CreateTag(
        values.name, 
        values.description || '', 
        values.color || '#1890ff', 
        values.group_id || ''
      );
      
      await loadTags();
      
      const newTags = [...value, values.name];
      onChange?.(newTags);
      
      if (itemId) {
        await UpdateItemTags(itemId, newTags);
      }
      
      message.success('标签创建成功');
      setCreateModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('创建失败');
    }
  };

  const handleQuickAdd = (tagName) => {
    if (value.includes(tagName)) {
      message.warning('标签已存在');
      return;
    }
    
    const newTags = [...value, tagName];
    onChange?.(newTags);
    
    if (itemId) {
      UpdateItemTags(itemId, newTags);
    }
  };

  const handleRemoveTag = (tagName) => {
    const newTags = value.filter(tag => tag !== tagName);
    onChange?.(newTags);
    
    if (itemId) {
      UpdateItemTags(itemId, newTags);
    }
  };

  const handleSelectChange = (selectedTags) => {
    onChange?.(selectedTags);
    
    if (itemId) {
      UpdateItemTags(itemId, selectedTags);
    }
  };

  const handleSearch = (searchValue) => {
    setSearchText(searchValue);
  };

  const filteredTags = tags.filter(tag => 
    tag.name.toLowerCase().includes(searchText.toLowerCase()) ||
    tag.description?.toLowerCase().includes(searchText.toLowerCase())
  );

  const renderSuggestionsContent = () => (
    <div style={{ width: 300 }}>
      {showAutoGenerate && (
        <>
          <div style={{ marginBottom: 12 }}>
            <Button 
              type="primary" 
              icon={<BulbOutlined />} 
              onClick={handleAutoGenerate}
              loading={loading}
              size="small"
              block
            >
              智能生成标签
            </Button>
          </div>
          <Divider style={{ margin: '8px 0' }} />
        </>
      )}
      
      {suggestions.length > 0 && (
        <>
          <div style={{ marginBottom: 8, fontWeight: 'bold' }}>
            <BulbOutlined /> 建议标签
          </div>
          <div style={{ marginBottom: 12 }}>
            {suggestions.map(tag => (
              <Tag 
                key={tag}
                style={{ margin: '2px', cursor: 'pointer' }}
                onClick={() => handleQuickAdd(tag)}
                color={value.includes(tag) ? 'green' : 'default'}
              >
                {tag}
                {value.includes(tag) && ' ✓'}
              </Tag>
            ))}
          </div>
          <Divider style={{ margin: '8px 0' }} />
        </>
      )}

      {mostUsedTags.length > 0 && (
        <>
          <div style={{ marginBottom: 8, fontWeight: 'bold' }}>
            <FireOutlined /> 热门标签
          </div>
          <div style={{ marginBottom: 12 }}>
            {mostUsedTags.map(tag => (
              <Tag 
                key={tag.id}
                style={{ margin: '2px', cursor: 'pointer' }}
                onClick={() => handleQuickAdd(tag.name)}
                color={value.includes(tag.name) ? 'green' : tag.color}
              >
                {tag.name} ({tag.use_count})
                {value.includes(tag.name) && ' ✓'}
              </Tag>
            ))}
          </div>
          <Divider style={{ margin: '8px 0' }} />
        </>
      )}

      {recentTags.length > 0 && (
        <>
          <div style={{ marginBottom: 8, fontWeight: 'bold' }}>
            <ClockCircleOutlined /> 最近使用
          </div>
          <div style={{ marginBottom: 12 }}>
            {recentTags.map(tag => (
              <Tag 
                key={tag.id}
                style={{ margin: '2px', cursor: 'pointer' }}
                onClick={() => handleQuickAdd(tag.name)}
                color={value.includes(tag.name) ? 'green' : tag.color}
              >
                {tag.name}
                {value.includes(tag.name) && ' ✓'}
              </Tag>
            ))}
          </div>
        </>
      )}

      <div style={{ textAlign: 'center', marginTop: 8 }}>
        <Button 
          type="link" 
          icon={<PlusOutlined />} 
          onClick={() => setCreateModalVisible(true)}
          size="small"
        >
          创建新标签
        </Button>
      </div>
    </div>
  );

  return (
    <div style={style}>
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <Select
          mode={mode}
          placeholder={placeholder}
          value={value}
          onChange={handleSelectChange}
          onSearch={handleSearch}
          showSearch
          filterOption={false}
          style={{ minWidth: 200, flex: 1 }}
          disabled={disabled}
          maxTagCount="responsive"
          dropdownRender={(menu) => (
            <div>
              {menu}
              <Divider style={{ margin: '8px 0' }} />
              <div style={{ padding: '8px', textAlign: 'center' }}>
                <Button 
                  type="text" 
                  icon={<PlusOutlined />} 
                  onClick={() => setCreateModalVisible(true)}
                  size="small"
                >
                  创建新标签
                </Button>
              </div>
            </div>
          )}
        >
          {filteredTags.map(tag => (
            <Select.Option key={tag.id} value={tag.name}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Tag color={tag.color} style={{ margin: 0 }}>
                  {tag.name}
                </Tag>
                {tag.use_count > 0 && (
                  <Badge count={tag.use_count} style={{ backgroundColor: '#52c41a' }} />
                )}
              </div>
            </Select.Option>
          ))}
        </Select>

        {showQuickActions && (
          <Space>
            {showSuggestions && (
              <Popover 
                content={renderSuggestionsContent()}
                title="标签建议"
                trigger="click"
                open={suggestionsVisible}
                onOpenChange={setSuggestionsVisible}
                placement="bottomRight"
              >
                <Button icon={<BulbOutlined />} size="small">
                  建议
                </Button>
              </Popover>
            )}
            
            <Button 
              icon={<SyncOutlined />} 
              size="small" 
              onClick={() => {
                loadTags();
                loadSuggestions();
              }}
            />
          </Space>
        )}
      </div>

      {/* 已选标签显示 */}
      {value.length > 0 && (
        <div style={{ marginTop: 8 }}>
          {value.map(tagName => {
            const tag = tags.find(t => t.name === tagName);
            return (
              <Tag
                key={tagName}
                closable={!disabled}
                onClose={() => handleRemoveTag(tagName)}
                color={tag?.color || 'default'}
                style={{ marginBottom: 4 }}
              >
                {tagName}
              </Tag>
            );
          })}
        </div>
      )}

      {/* 创建标签模态框 */}
      <Modal
        title="创建新标签"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={400}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateTag}
          initialValues={{ color: '#1890ff' }}
        >
          <Form.Item
            label="标签名称"
            name="name"
            rules={[
              { required: true, message: '请输入标签名称' },
              { max: maxTagLength, message: `标签名称不能超过${maxTagLength}个字符` }
            ]}
          >
            <Input 
              placeholder="输入标签名称" 
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
            />
          </Form.Item>
          
          <Form.Item
            label="描述"
            name="description"
          >
            <Input.TextArea 
              placeholder="输入描述（可选）" 
              rows={2}
            />
          </Form.Item>
          
          <Form.Item
            label="颜色"
            name="color"
          >
            <Input type="color" />
          </Form.Item>
          
          <Form.Item style={{ marginBottom: 0 }}>
            <Space>
              <Button type="primary" htmlType="submit">
                创建
              </Button>
              <Button onClick={() => {
                setCreateModalVisible(false);
                form.resetFields();
              }}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TagSelector;