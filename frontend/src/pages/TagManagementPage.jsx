import {
  BulbOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FolderOutlined,
  PlusOutlined,
  SettingOutlined,
  TagOutlined,
  FolderOpenOutlined,
  MoreOutlined,
  BarChartOutlined,
  AppstoreAddOutlined
} from '@ant-design/icons';
import {
  Badge,
  Button,
  Card,
  ColorPicker,
  Drawer,
  Dropdown,
  Form,
  Input,
  message,
  Modal,
  Select,
  Space,
  Statistic,
  Tag,
  Tree
} from 'antd';
import React, { useEffect, useState } from 'react';
import {
  CreateTag,
  CreateTagGroup,
  DeleteTag,
  DeleteTagGroup,
  GetTagGroups,
  GetTags,
  GetTagStatistics,
  UpdateTag,
  UpdateTagGroup
} from '../../wailsjs/go/main/App';

const { Search } = Input;

// 统一错误处理函数
const getErrorMessage = (error) => {
  // 如果是字符串，直接返回
  if (typeof error === 'string') {
    return error;
  }
  
  // 处理 Wails 的错误格式
  if (error && typeof error === 'object') {
    // 检查是否有 error 字段（Wails 常见格式）
    if (error.error && typeof error.error === 'string') {
      return error.error;
    }
    
    // 检查是否有 message 字段
    if (error.message && typeof error.message === 'string') {
      return error.message;
    }
    
    // 检查是否有 data 字段
    if (error.data && typeof error.data === 'string') {
      return error.data;
    }
    
    // 如果是错误对象，尝试获取其描述
    if (error.toString && typeof error.toString === 'function') {
      const errorStr = error.toString();
      if (errorStr !== '[object Object]') {
        return errorStr;
      }
    }
    
    // 作为最后手段，将对象序列化
    try {
      const serialized = JSON.stringify(error);
      if (serialized && serialized !== '{}') {
        return serialized;
      }
    } catch (e) {
      // JSON.stringify 失败
    }
  }
  
  return '操作失败，请重试';
};

const TagManagementPage = () => {
  const [tags, setTags] = useState([]);
  const [tagGroups, setTagGroups] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [selectedKeys, setSelectedKeys] = useState([]);
  
  // 模态框状态
  const [tagModalVisible, setTagModalVisible] = useState(false);
  const [groupModalVisible, setGroupModalVisible] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [editingGroup, setEditingGroup] = useState(null);
  const [statisticsDrawerVisible, setStatisticsDrawerVisible] = useState(false);

  // 表单
  const [tagForm] = Form.useForm();
  const [groupForm] = Form.useForm();

  // 加载数据
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadTags(),
        loadTagGroups(),
        loadStatistics()
      ]);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const loadTags = async () => {
    try {
      const result = await GetTags();
      setTags(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error('加载标签失败:', error);
    }
  };

  const loadTagGroups = async () => {
    try {
      const result = await GetTagGroups();
      setTagGroups(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error('加载分组失败:', error);
    }
  };

  const loadStatistics = async () => {
    try {
      const result = await GetTagStatistics();
      setStatistics(result);
    } catch (error) {
      console.error('加载统计失败:', error);
    }
  };

  // 标签操作
  const handleCreateTag = (groupId = null) => {
    setEditingTag(null);
    tagForm.resetFields();
    if (groupId) {
      tagForm.setFieldsValue({ group_id: groupId });
    }
    setTagModalVisible(true);
  };

  const handleEditTag = (tag) => {
    setEditingTag(tag);
    tagForm.setFieldsValue({
      name: tag.name,
      description: tag.description,
      color: tag.color,
      group_id: tag.group_id
    });
    setTagModalVisible(true);
  };

  const handleDeleteTag = async (tagId) => {
    try {
      await DeleteTag(tagId);
      message.success('标签删除成功');
      loadTags();
    } catch (error) {
      console.error('删除标签失败:', error);
      const errorMsg = getErrorMessage(error);
      message.error(`删除失败: ${errorMsg}`);
    }
  };

  const handleTagSubmit = async (values) => {
    try {
      const color = typeof values.color === 'object' ? values.color.toHexString() : values.color;
      
      if (editingTag) {
        await UpdateTag({
          ...editingTag,
          name: values.name,
          description: values.description || '',
          color: color,
          group_id: values.group_id
        });
        message.success('标签更新成功');
      } else {
        await CreateTag(
          values.name,
          values.description || '',
          color,
          values.group_id
        );
        message.success('标签创建成功');
      }
      setTagModalVisible(false);
      loadTags();
    } catch (error) {
      console.error('标签操作失败:', error);
      const errorMsg = getErrorMessage(error);
      message.error(editingTag ? `更新失败: ${errorMsg}` : `创建失败: ${errorMsg}`);
    }
  };

  // 分组操作
  const handleCreateGroup = () => {
    setEditingGroup(null);
    groupForm.resetFields();
    setGroupModalVisible(true);
  };

  const handleEditGroup = (group) => {
    setEditingGroup(group);
    groupForm.setFieldsValue({
      name: group.name,
      description: group.description,
      color: group.color,
      sort_order: group.sort_order
    });
    setGroupModalVisible(true);
  };

  const handleDeleteGroup = async (groupId) => {
    try {
      await DeleteTagGroup(groupId);
      message.success('分组删除成功');
      loadTagGroups();
      loadTags();
    } catch (error) {
      console.error('删除分组失败:', error);
      const errorMsg = getErrorMessage(error);
      message.error(`删除失败: ${errorMsg}`);
    }
  };

  const handleGroupSubmit = async (values) => {
    try {
      const color = typeof values.color === 'object' ? values.color.toHexString() : values.color;
      const sortOrder = parseInt(values.sort_order) || 0;
      
      if (editingGroup) {
        await UpdateTagGroup({
          ...editingGroup,
          name: values.name,
          description: values.description || '',
          color: color,
          sort_order: sortOrder
        });
        message.success('分组更新成功');
      } else {
        await CreateTagGroup(
          values.name, 
          values.description || '', 
          color, 
          sortOrder
        );
        message.success('分组创建成功');
      }
      setGroupModalVisible(false);
      loadTagGroups();
    } catch (error) {
      console.error('分组操作失败:', error);
      const errorMsg = getErrorMessage(error);
      message.error(editingGroup ? `更新失败: ${errorMsg}` : `创建失败: ${errorMsg}`);
    }
  };


  // 构建树形数据
  const buildTreeData = () => {
    const filteredTags = tags.filter(tag => 
      !searchText || tag.name.toLowerCase().includes(searchText.toLowerCase())
    );
    
    const groupedTags = {};
    const ungroupedTags = [];
    
    filteredTags.forEach(tag => {
      if (tag.group_id) {
        if (!groupedTags[tag.group_id]) {
          groupedTags[tag.group_id] = [];
        }
        groupedTags[tag.group_id].push(tag);
      } else {
        ungroupedTags.push(tag);
      }
    });

    const treeData = [];
    
    // 添加分组节点
    tagGroups.forEach(group => {
      const groupTags = groupedTags[group.id] || [];
      const node = {
        key: `group-${group.id}`,
        title: (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <Space>
              <span style={{ 
                color: group.color || '#333', 
                fontWeight: 'bold',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <FolderOutlined />
                {group.name}
              </span>
              <Badge count={groupTags.length} size="small" />
            </Space>
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'add-tag',
                    label: '添加标签',
                    icon: <PlusOutlined />,
                    onClick: () => handleCreateTag(group.id)
                  },
                  {
                    key: 'edit-group',
                    label: '编辑分组',
                    icon: <EditOutlined />,
                    onClick: () => handleEditGroup(group)
                  },
                  {
                    key: 'delete-group',
                    label: '删除分组',
                    icon: <DeleteOutlined />,
                    danger: true,
                    onClick: () => {
                      Modal.confirm({
                        title: '确定删除分组?',
                        content: '删除分组后，其中的标签将变为未分组状态。',
                        onOk: () => handleDeleteGroup(group.id)
                      });
                    }
                  }
                ]
              }}
              trigger={['hover']}
            >
              <Button type="text" size="small" icon={<MoreOutlined />} />
            </Dropdown>
          </div>
        ),
        children: groupTags.map(tag => ({
          key: `tag-${tag.id}`,
          title: (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', color: '#333' }}>
                  {tag.name}
                  {tag.is_system && (
                    <span style={{ fontSize: '10px', opacity: 0.6, marginLeft: '4px' }}>(系统)</span>
                  )}
                </span>
                {tag.use_count > 0 && (
                  <Badge count={tag.use_count} size="small" />
                )}
              </div>
              <Dropdown
                menu={{
                  items: [
                    {
                      key: 'edit-tag',
                      label: tag.is_system ? '查看标签' : '编辑标签',
                      icon: tag.is_system ? <EyeOutlined /> : <EditOutlined />,
                      onClick: () => {
                        if (tag.is_system) {
                          message.warning('系统标签不可编辑');
                        } else {
                          handleEditTag(tag);
                        }
                      }
                    },
                    {
                      key: 'delete-tag',
                      label: '删除标签',
                      icon: <DeleteOutlined />,
                      danger: true,
                      disabled: tag.is_system,
                      onClick: () => {
                        if (tag.is_system) {
                          message.warning('系统标签不可删除');
                          return;
                        }
                        Modal.confirm({
                          title: '确定删除标签?',
                          content: '删除后无法恢复。',
                          onOk: () => handleDeleteTag(tag.id)
                        });
                      }
                    }
                  ]
                }}
                trigger={['hover']}
              >
                <Button type="text" size="small" icon={<MoreOutlined />} />
              </Dropdown>
            </div>
          ),
          isLeaf: true,
          data: tag
        }))
      };
      treeData.push(node);
    });

    // 添加未分组标签
    if (ungroupedTags.length > 0) {
      const node = {
        key: 'ungrouped',
        title: (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <Space>
              <span style={{ 
                color: '#666', 
                fontWeight: 'bold',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <FolderOpenOutlined />
                未分组
              </span>
              <Badge count={ungroupedTags.length} size="small" />
            </Space>
            <Button 
              type="text" 
              size="small" 
              icon={<PlusOutlined />}
              onClick={() => handleCreateTag(null)}
            />
          </div>
        ),
        children: ungroupedTags.map(tag => ({
          key: `tag-${tag.id}`,
          title: (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', color: '#333' }}>
                  {tag.name}
                  {tag.is_system && (
                    <span style={{ fontSize: '10px', opacity: 0.6, marginLeft: '4px' }}>(系统)</span>
                  )}
                </span>
                {tag.use_count > 0 && (
                  <Badge count={tag.use_count} size="small" />
                )}
              </div>
              <Dropdown
                menu={{
                  items: [
                    {
                      key: 'edit-tag',
                      label: tag.is_system ? '查看标签' : '编辑标签',
                      icon: tag.is_system ? <EyeOutlined /> : <EditOutlined />,
                      onClick: () => {
                        if (tag.is_system) {
                          message.warning('系统标签不可编辑');
                        } else {
                          handleEditTag(tag);
                        }
                      }
                    },
                    {
                      key: 'delete-tag',
                      label: '删除标签',
                      icon: <DeleteOutlined />,
                      danger: true,
                      disabled: tag.is_system,
                      onClick: () => {
                        if (tag.is_system) {
                          message.warning('系统标签不可删除');
                          return;
                        }
                        Modal.confirm({
                          title: '确定删除标签?',
                          content: '删除后无法恢复。',
                          onOk: () => handleDeleteTag(tag.id)
                        });
                      }
                    }
                  ]
                }}
                trigger={['hover']}
              >
                <Button type="text" size="small" icon={<MoreOutlined />} />
              </Dropdown>
            </div>
          ),
          isLeaf: true,
          data: tag
        }))
      };
      treeData.push(node);
    }

    return treeData;
  };

  const treeData = buildTreeData();

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 顶部工具栏 */}
      <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Search
            placeholder="搜索标签..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            size="small"
            allowClear
            style={{ flex: 1 }}
          />
          <Button 
            type="primary" 
            size="small"
            icon={<AppstoreAddOutlined />}
            onClick={handleCreateGroup}
            title="新建分组"
          />
          <Button
            size="small"
            icon={<BarChartOutlined />}
            onClick={() => setStatisticsDrawerVisible(true)}
            title="统计"
          />
        </div>
      </div>

      {/* 树形标签列表 */}
      <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
        <Tree
          showLine
          showIcon={false}
          blockNode
          treeData={treeData}
          expandedKeys={expandedKeys}
          selectedKeys={selectedKeys}
          onExpand={(keys) => setExpandedKeys(keys)}
          onSelect={(keys) => setSelectedKeys(keys)}
          loading={loading}
          style={{ fontSize: '12px' }}
          height={400}
        />
      </div>

      {/* 标签编辑模态框 */}
      <Modal
        title={editingTag ? '编辑标签' : '新建标签'}
        open={tagModalVisible}
        onCancel={() => setTagModalVisible(false)}
        footer={null}
        width={400}
      >
        <Form
          form={tagForm}
          layout="vertical"
          onFinish={handleTagSubmit}
          size="small"
        >
          <Form.Item
            label="标签名称"
            name="name"
            rules={[{ required: true, message: '请输入标签名称' }]}
          >
            <Input placeholder="请输入标签名称" />
          </Form.Item>
          <Form.Item
            label="描述"
            name="description"
          >
            <Input.TextArea placeholder="请输入描述（可选）" rows={3} />
          </Form.Item>
          <Form.Item
            label="颜色"
            name="color"
            initialValue="#1890ff"
          >
            <ColorPicker 
              showText 
              format="hex"
              size="small"
              presets={[
                { label: '蓝色', colors: ['#1890ff', '#096dd9', '#0050b3'] },
                { label: '绿色', colors: ['#52c41a', '#389e0d', '#237804'] },
                { label: '橙色', colors: ['#fa8c16', '#d46b08', '#ad4e00'] },
                { label: '红色', colors: ['#f5222d', '#cf1322', '#a8071a'] },
                { label: '紫色', colors: ['#722ed1', '#531dab', '#391085'] }
              ]}
            />
          </Form.Item>
          <Form.Item
            label="分组"
            name="group_id"
          >
            <Select placeholder="选择分组（可选）" allowClear>
              {tagGroups.map(group => (
                <Select.Option key={group.id} value={group.id}>
                  <Tag color={group.color} style={{ margin: 0 }}>
                    {group.name}
                  </Tag>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setTagModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingTag ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 分组编辑模态框 */}
      <Modal
        title={editingGroup ? '编辑分组' : '新建分组'}
        open={groupModalVisible}
        onCancel={() => setGroupModalVisible(false)}
        footer={null}
        width={400}
      >
        <Form
          form={groupForm}
          layout="vertical"
          onFinish={handleGroupSubmit}
          size="small"
        >
          <Form.Item
            label="分组名称"
            name="name"
            rules={[{ required: true, message: '请输入分组名称' }]}
          >
            <Input placeholder="请输入分组名称" />
          </Form.Item>
          <Form.Item
            label="描述"
            name="description"
          >
            <Input.TextArea placeholder="请输入描述（可选）" rows={3} />
          </Form.Item>
          <Form.Item
            label="颜色"
            name="color"
            initialValue="#1890ff"
          >
            <ColorPicker 
              showText 
              format="hex"
              size="small"
              presets={[
                { label: '蓝色', colors: ['#1890ff', '#096dd9', '#0050b3'] },
                { label: '绿色', colors: ['#52c41a', '#389e0d', '#237804'] },
                { label: '橙色', colors: ['#fa8c16', '#d46b08', '#ad4e00'] },
                { label: '红色', colors: ['#f5222d', '#cf1322', '#a8071a'] },
                { label: '紫色', colors: ['#722ed1', '#531dab', '#391085'] }
              ]}
            />
          </Form.Item>
          <Form.Item
            label="排序"
            name="sort_order"
            initialValue={0}
          >
            <Input type="number" placeholder="排序序号" />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setGroupModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingGroup ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 统计信息抽屉 */}
      <Drawer
        title="标签统计"
        placement="right"
        onClose={() => setStatisticsDrawerVisible(false)}
        open={statisticsDrawerVisible}
        width={320}
      >
        {statistics && (
          <div>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <Card size="small">
                <Statistic
                  title="总标签数"
                  value={statistics.total_tags}
                  prefix={<TagOutlined />}
                />
              </Card>
              <Card size="small">
                <Statistic
                  title="系统标签"
                  value={statistics.system_tags}
                  prefix={<SettingOutlined />}
                />
              </Card>
              <Card size="small">
                <Statistic
                  title="用户标签"
                  value={statistics.user_tags}
                  prefix={<BulbOutlined />}
                />
              </Card>
              <Card size="small">
                <Statistic
                  title="标签分组"
                  value={tagGroups.length}
                  prefix={<FolderOutlined />}
                />
              </Card>
            </Space>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default TagManagementPage;