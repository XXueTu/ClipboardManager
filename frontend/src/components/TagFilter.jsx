import {
    ClearOutlined,
    ClockCircleOutlined,
    FilterOutlined,
    FireOutlined,
    FolderOutlined,
    SyncOutlined
} from '@ant-design/icons';
import {
    Badge,
    Button,
    Checkbox,
    Divider,
    Empty,
    Input,
    Popover,
    Radio,
    Select,
    Space,
    Spin,
    Tag
} from 'antd';
import React, { useEffect, useState } from 'react';
import {
    GetMostUsedTags,
    GetRecentTags,
    GetTagGroups,
    GetTags,
    SearchTags
} from '../../wailsjs/go/main/App';

const { Search } = Input;

const TagFilter = ({ 
  value = [], 
  onChange, 
  onGroupChange,
  selectedGroup = '',
  tagMode = 'any', // any, all, none
  onTagModeChange,
  placeholder = '选择标签过滤...',
  showModeSelector = true,
  showGroupFilter = true,
  showQuickFilters = true,
  maxHeight = 400,
  style = {}
}) => {
  const [tags, setTags] = useState([]);
  const [tagGroups, setTagGroups] = useState([]);
  const [mostUsedTags, setMostUsedTags] = useState([]);
  const [recentTags, setRecentTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [quickFilterMode, setQuickFilterMode] = useState('most_used'); // most_used, recent, group

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadTags(),
        loadTagGroups(),
        loadMostUsedTags(),
        loadRecentTags()
      ]);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTags = async () => {
    try {
      const result = await GetTags();
      setTags(result || []);
    } catch (error) {
      console.error('加载标签失败:', error);
    }
  };

  const loadTagGroups = async () => {
    try {
      const result = await GetTagGroups();
      setTagGroups(result || []);
    } catch (error) {
      console.error('加载标签分组失败:', error);
    }
  };

  const loadMostUsedTags = async () => {
    try {
      const result = await GetMostUsedTags(10);
      setMostUsedTags(result || []);
    } catch (error) {
      console.error('加载热门标签失败:', error);
    }
  };

  const loadRecentTags = async () => {
    try {
      const result = await GetRecentTags(10);
      setRecentTags(result || []);
    } catch (error) {
      console.error('加载最近标签失败:', error);
    }
  };

  const handleTagSelect = (selectedTags) => {
    onChange?.(selectedTags);
  };

  const handleGroupSelect = (groupId) => {
    onGroupChange?.(groupId);
  };

  const handleTagModeChange = (mode) => {
    onTagModeChange?.(mode);
  };

  const handleQuickSelect = (tagName) => {
    if (value.includes(tagName)) {
      // 如果已选中，则取消选中
      const newValue = value.filter(t => t !== tagName);
      onChange?.(newValue);
    } else {
      // 否则添加到选中列表
      const newValue = [...value, tagName];
      onChange?.(newValue);
    }
  };

  const handleClearAll = () => {
    onChange?.([]);
    onGroupChange?.('');
  };

  const handleSearch = async (searchValue) => {
    setSearchText(searchValue);
    if (searchValue) {
      try {
        const result = await SearchTags({
          query: searchValue,
          limit: 50,
          offset: 0
        });
        setTags(result || []);
      } catch (error) {
        console.error('搜索标签失败:', error);
      }
    } else {
      loadTags();
    }
  };

  const filteredTags = tags.filter(tag => 
    tag.name.toLowerCase().includes(searchText.toLowerCase()) ||
    tag.description?.toLowerCase().includes(searchText.toLowerCase())
  );

  const getTagsByGroup = (groupId) => {
    if (!groupId) return tags.filter(tag => !tag.group_id);
    return tags.filter(tag => tag.group_id === groupId);
  };

  const renderTagModeSelector = () => (
    <div style={{ marginBottom: 12 }}>
      <div style={{ marginBottom: 8, fontSize: '12px', color: '#666' }}>
        标签匹配模式：
      </div>
      <Radio.Group 
        value={tagMode} 
        onChange={(e) => handleTagModeChange(e.target.value)}
        size="small"
      >
        <Radio.Button value="any">任意匹配</Radio.Button>
        <Radio.Button value="all">全部匹配</Radio.Button>
        <Radio.Button value="none">排除标签</Radio.Button>
      </Radio.Group>
    </div>
  );

  const renderGroupFilter = () => (
    <div style={{ marginBottom: 12 }}>
      <div style={{ marginBottom: 8, fontSize: '12px', color: '#666' }}>
        按分组过滤：
      </div>
      <Select
        placeholder="选择分组"
        value={selectedGroup}
        onChange={handleGroupSelect}
        style={{ width: '100%' }}
        allowClear
        size="small"
      >
        {tagGroups.map(group => (
          <Select.Option key={group.id} value={group.id}>
            <Tag color={group.color} style={{ margin: 0 }}>
              <FolderOutlined /> {group.name}
            </Tag>
          </Select.Option>
        ))}
      </Select>
    </div>
  );

  const renderQuickFilters = () => (
    <div style={{ marginBottom: 12 }}>
      <div style={{ marginBottom: 8, fontSize: '12px', color: '#666' }}>
        快速选择：
      </div>
      <Radio.Group 
        value={quickFilterMode} 
        onChange={(e) => setQuickFilterMode(e.target.value)}
        size="small"
        style={{ marginBottom: 8 }}
      >
        <Radio.Button value="most_used">
          <FireOutlined /> 热门
        </Radio.Button>
        <Radio.Button value="recent">
          <ClockCircleOutlined /> 最近
        </Radio.Button>
        <Radio.Button value="group">
          <FolderOutlined /> 分组
        </Radio.Button>
      </Radio.Group>
      
      <div style={{ maxHeight: 120, overflowY: 'auto' }}>
        {quickFilterMode === 'most_used' && (
          <div>
            {mostUsedTags.map(tag => (
              <Tag
                key={tag.id}
                color={value.includes(tag.name) ? 'green' : tag.color}
                style={{ margin: '2px', cursor: 'pointer' }}
                onClick={() => handleQuickSelect(tag.name)}
              >
                {tag.name} ({tag.use_count})
                {value.includes(tag.name) && ' ✓'}
              </Tag>
            ))}
          </div>
        )}
        
        {quickFilterMode === 'recent' && (
          <div>
            {recentTags.map(tag => (
              <Tag
                key={tag.id}
                color={value.includes(tag.name) ? 'green' : tag.color}
                style={{ margin: '2px', cursor: 'pointer' }}
                onClick={() => handleQuickSelect(tag.name)}
              >
                {tag.name}
                {value.includes(tag.name) && ' ✓'}
              </Tag>
            ))}
          </div>
        )}
        
        {quickFilterMode === 'group' && (
          <div>
            {tagGroups.map(group => {
              const groupTags = getTagsByGroup(group.id);
              return (
                <div key={group.id} style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>
                    <Tag color={group.color} size="small">
                      {group.name}
                    </Tag>
                  </div>
                  <div>
                    {groupTags.map(tag => (
                      <Tag
                        key={tag.id}
                        color={value.includes(tag.name) ? 'green' : tag.color}
                        style={{ margin: '2px', cursor: 'pointer' }}
                        onClick={() => handleQuickSelect(tag.name)}
                        size="small"
                      >
                        {tag.name}
                        {value.includes(tag.name) && ' ✓'}
                      </Tag>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  const renderFilterContent = () => (
    <div style={{ width: 350 }}>
      <Spin spinning={loading}>
        {showModeSelector && renderTagModeSelector()}
        {showGroupFilter && renderGroupFilter()}
        {showQuickFilters && renderQuickFilters()}
        
        <Divider style={{ margin: '12px 0' }} />
        
        <div style={{ marginBottom: 8 }}>
          <Search
            placeholder="搜索标签..."
            onSearch={handleSearch}
            onChange={(e) => setSearchText(e.target.value)}
            size="small"
            style={{ width: '100%' }}
          />
        </div>
        
        <div style={{ 
          maxHeight: maxHeight - 200, 
          overflowY: 'auto',
          border: '1px solid #f0f0f0',
          borderRadius: 4,
          padding: 8
        }}>
          {filteredTags.length === 0 ? (
            <Empty 
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="没有找到标签"
              style={{ margin: '20px 0' }}
            />
          ) : (
            <Checkbox.Group
              value={value}
              onChange={handleTagSelect}
              style={{ width: '100%' }}
            >
              {filteredTags.map(tag => (
                <div key={tag.id} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '4px 0',
                  borderBottom: '1px solid #f5f5f5'
                }}>
                  <Checkbox value={tag.name}>
                    <Tag color={tag.color} style={{ margin: 0 }}>
                      {tag.name}
                    </Tag>
                  </Checkbox>
                  <div style={{ fontSize: '12px', color: '#999' }}>
                    {tag.use_count > 0 && (
                      <Badge count={tag.use_count} style={{ backgroundColor: '#52c41a' }} />
                    )}
                  </div>
                </div>
              ))}
            </Checkbox.Group>
          )}
        </div>
        
        <div style={{ marginTop: 12, textAlign: 'right' }}>
          <Space>
            <Button 
              size="small" 
              icon={<ClearOutlined />} 
              onClick={handleClearAll}
            >
              清空
            </Button>
            <Button 
              size="small" 
              icon={<SyncOutlined />} 
              onClick={loadAllData}
            >
              刷新
            </Button>
          </Space>
        </div>
      </Spin>
    </div>
  );

  const getFilterSummary = () => {
    let summary = [];
    
    if (value.length > 0) {
      summary.push(`${value.length} 个标签`);
    }
    
    if (selectedGroup) {
      const group = tagGroups.find(g => g.id === selectedGroup);
      if (group) {
        summary.push(`分组: ${group.name}`);
      }
    }
    
    if (tagMode !== 'any') {
      const modeText = {
        'all': '全部匹配',
        'none': '排除标签'
      };
      summary.push(modeText[tagMode]);
    }
    
    return summary.join(', ');
  };

  return (
    <div style={style}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Select
          mode="multiple"
          placeholder={placeholder}
          value={value}
          onChange={handleTagSelect}
          style={{ minWidth: 200, flex: 1 }}
          maxTagCount="responsive"
          showSearch
          filterOption={(input, option) => {
            const tag = tags.find(t => t.name === option.value);
            return tag?.name.toLowerCase().includes(input.toLowerCase()) ||
                   tag?.description?.toLowerCase().includes(input.toLowerCase());
          }}
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

        <Popover
          content={renderFilterContent()}
          title={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span><FilterOutlined /> 标签过滤</span>
              <Button 
                type="text" 
                size="small" 
                icon={<ClearOutlined />}
                onClick={handleClearAll}
              >
                清空
              </Button>
            </div>
          }
          trigger="click"
          open={filterVisible}
          onOpenChange={setFilterVisible}
          placement="bottomRight"
        >
          <Button icon={<FilterOutlined />}>
            过滤
            {(value.length > 0 || selectedGroup) && (
              <Badge count={value.length} style={{ backgroundColor: '#52c41a' }} />
            )}
          </Button>
        </Popover>
      </div>

      {/* 当前过滤状态显示 */}
      {(value.length > 0 || selectedGroup) && (
        <div style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', color: '#666' }}>
              当前过滤: {getFilterSummary()}
            </span>
            
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {value.map(tagName => {
                const tag = tags.find(t => t.name === tagName);
                return (
                  <Tag
                    key={tagName}
                    closable
                    onClose={() => handleQuickSelect(tagName)}
                    color={tag?.color || 'default'}
                    size="small"
                  >
                    {tagName}
                  </Tag>
                );
              })}
              
              {selectedGroup && (
                <Tag
                  closable
                  onClose={() => handleGroupSelect('')}
                  color="blue"
                  size="small"
                >
                  <FolderOutlined /> 
                  {tagGroups.find(g => g.id === selectedGroup)?.name || '未知分组'}
                </Tag>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TagFilter;