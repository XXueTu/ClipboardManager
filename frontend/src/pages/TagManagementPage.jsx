import {
  BulbOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  FireOutlined,
  FolderOutlined,
  PlusOutlined,
  SettingOutlined,
  TagOutlined
} from '@ant-design/icons';
import {
  Badge,
  Button,
  Card,
  Col,
  ColorPicker,
  Divider,
  Drawer,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Statistic,
  Switch,
  Table,
  Tabs,
  Tag,
  Typography
} from 'antd';
import React, { useEffect, useState } from 'react';
import {
  CleanupUnusedTags,
  CreateTag,
  CreateTagGroup,
  DeleteTag,
  DeleteTagGroup,
  GetMostUsedTags,
  GetRecentTags,
  GetTagGroups,
  GetTags,
  GetTagStatistics,
  SearchTags,
  UpdateTag,
  UpdateTagGroup
} from '../../wailsjs/go/main/App';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Search } = Input;

const TagManagementPage = () => {
  const [tags, setTags] = useState([]);
  const [tagGroups, setTagGroups] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [mostUsedTags, setMostUsedTags] = useState([]);
  const [recentTags, setRecentTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [activeTab, setActiveTab] = useState('tags');
  const [viewMode, setViewMode] = useState('table'); // table, grid

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
        loadStatistics(),
        loadMostUsedTags(),
        loadRecentTags()
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

  const loadStatistics = async () => {
    try {
      const result = await GetTagStatistics();
      setStatistics(result);
    } catch (error) {
      console.error('加载统计信息失败:', error);
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

  // 搜索和过滤
  const handleSearch = async (value) => {
    setSearchText(value);
    if (value) {
      try {
        const result = await SearchTags({
          query: value,
          group_id: selectedGroup,
          limit: 100,
          offset: 0
        });
        setTags(result || []);
      } catch (error) {
        message.error('搜索失败');
      }
    } else {
      loadTags();
    }
  };

  const handleGroupFilter = (groupId) => {
    setSelectedGroup(groupId);
    // 实际应该调用API按分组过滤
    loadTags();
  };

  // 标签操作
  const handleCreateTag = () => {
    setEditingTag(null);
    tagForm.resetFields();
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
      loadStatistics();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleTagSubmit = async (values) => {
    try {
      if (editingTag) {
        await UpdateTag({
          ...editingTag,
          ...values
        });
        message.success('标签更新成功');
      } else {
        await CreateTag(values.name, values.description, values.color, values.group_id);
        message.success('标签创建成功');
      }
      setTagModalVisible(false);
      loadTags();
      loadStatistics();
    } catch (error) {
      message.error(editingTag ? '更新失败' : '创建失败');
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
      message.error('删除失败');
    }
  };

  const handleGroupSubmit = async (values) => {
    try {
      // 确保颜色值正确处理
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
      message.error(editingGroup ? '更新失败: ' + error.message : '创建失败: ' + error.message);
    }
  };

  // 维护操作
  const handleCleanupUnusedTags = async () => {
    try {
      await CleanupUnusedTags();
      message.success('清理完成');
      loadTags();
      loadStatistics();
    } catch (error) {
      message.error('清理失败');
    }
  };

  // 表格列配置
  const tagColumns = [
    {
      title: '标签名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Tag color={record.color} style={{ margin: 0 }}>
          {text}
        </Tag>
      ),
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '分组',
      dataIndex: 'group_id',
      key: 'group_id',
      render: (groupId) => {
        const group = tagGroups.find(g => g.id === groupId);
        return group ? (
          <Tag color={group.color} icon={<FolderOutlined />}>
            {group.name}
          </Tag>
        ) : '未分组';
      },
      filters: tagGroups.map(group => ({
        text: group.name,
        value: group.id,
      })),
      onFilter: (value, record) => record.group_id === value,
    },
    {
      title: '使用次数',
      dataIndex: 'use_count',
      key: 'use_count',
      render: (count) => (
        <Badge count={count} style={{ backgroundColor: '#52c41a' }} />
      ),
      sorter: (a, b) => a.use_count - b.use_count,
    },
    {
      title: '系统标签',
      dataIndex: 'is_system',
      key: 'is_system',
      render: (isSystem) => (
        <Switch checked={isSystem} disabled size="small" />
      ),
      filters: [
        { text: '系统标签', value: true },
        { text: '用户标签', value: false },
      ],
      onFilter: (value, record) => record.is_system === value,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (time) => new Date(time).toLocaleString(),
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={() => handleEditTag(record)}
            disabled={record.is_system}
          />
          <Popconfirm
            title="确定要删除这个标签吗？"
            onConfirm={() => handleDeleteTag(record.id)}
            okText="是"
            cancelText="否"
            disabled={record.is_system}
          >
            <Button 
              type="text" 
              danger 
              icon={<DeleteOutlined />}
              disabled={record.is_system}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const groupColumns = [
    {
      title: '分组名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Tag color={record.color} icon={<FolderOutlined />}>
          {text}
        </Tag>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '排序',
      dataIndex: 'sort_order',
      key: 'sort_order',
      sorter: (a, b) => a.sort_order - b.sort_order,
    },
    {
      title: '系统分组',
      dataIndex: 'is_system',
      key: 'is_system',
      render: (isSystem) => (
        <Switch checked={isSystem} disabled size="small" />
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={() => handleEditGroup(record)}
            disabled={record.is_system}
          />
          <Popconfirm
            title="确定要删除这个分组吗？"
            onConfirm={() => handleDeleteGroup(record.id)}
            okText="是"
            cancelText="否"
            disabled={record.is_system}
          >
            <Button 
              type="text" 
              danger 
              icon={<DeleteOutlined />}
              disabled={record.is_system}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab={<span><TagOutlined />标签</span>} key="tags">
          <Card>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
              <Space>
                <Search
                  placeholder="搜索标签..."
                  style={{ width: 300 }}
                  onSearch={handleSearch}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
                <Select
                  placeholder="选择分组"
                  style={{ width: 200 }}
                  value={selectedGroup}
                  onChange={handleGroupFilter}
                  allowClear
                >
                  {tagGroups.map(group => (
                    <Select.Option key={group.id} value={group.id}>
                      <Tag color={group.color} style={{ margin: 0 }}>
                        {group.name}
                      </Tag>
                    </Select.Option>
                  ))}
                </Select>
              </Space>
              <Space>
              
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />} 
                  onClick={handleCreateTag}
                >
                  新建
                </Button>
            
              </Space>
            </div>

            <Table
              columns={tagColumns}
              dataSource={tags}
              rowKey="id"
              loading={loading}
              pagination={{
                total: tags.length,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} 共 ${total} 条`,
              }}
              scroll={{ x: 1000 }}
            />
          </Card>
        </TabPane>

        <TabPane tab={<span><FolderOutlined />分组</span>} key="groups">
          <Card>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
              <div />
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={handleCreateGroup}
              >
                新建
              </Button>
            </div>

            <Table
              columns={groupColumns}
              dataSource={tagGroups}
              rowKey="id"
              loading={loading}
              pagination={false}
            />
          </Card>
        </TabPane>
      </Tabs>

      {/* 标签编辑模态框 */}
      <Modal
        title={editingTag ? '编辑标签' : '新建标签'}
        open={tagModalVisible}
        onCancel={() => setTagModalVisible(false)}
        footer={null}
      >
        <Form
          form={tagForm}
          layout="vertical"
          onFinish={handleTagSubmit}
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
            <Input.TextArea placeholder="请输入描述（可选）" />
          </Form.Item>
          <Form.Item
            label="颜色"
            name="color"
            initialValue="#1890ff"
          >
            <ColorPicker />
          </Form.Item>
          <Form.Item
            label="分组"
            name="group_id"
          >
            <Select placeholder="选择分组（可选）" allowClear>
              {tagGroups.map(group => (
                <Select.Option key={group.id} value={group.id}>
                  {group.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingTag ? '更新' : '创建'}
              </Button>
              <Button onClick={() => setTagModalVisible(false)}>
                取消
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
      >
        <Form
          form={groupForm}
          layout="vertical"
          onFinish={handleGroupSubmit}
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
            <Input.TextArea placeholder="请输入描述（可选）" />
          </Form.Item>
          <Form.Item
            label="颜色"
            name="color"
            initialValue="#1890ff"
          >
            <ColorPicker />
          </Form.Item>
          <Form.Item
            label="排序"
            name="sort_order"
            initialValue={0}
          >
            <Input type="number" placeholder="排序序号" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingGroup ? '更新' : '创建'}
              </Button>
              <Button onClick={() => setGroupModalVisible(false)}>
                取消
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
        width={600}
      >
        {statistics && (
          <div>
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="总标签数"
                    value={statistics.total_tags}
                    prefix={<TagOutlined />}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="系统标签"
                    value={statistics.system_tags}
                    prefix={<SettingOutlined />}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="用户标签"
                    value={statistics.user_tags}
                    prefix={<BulbOutlined />}
                  />
                </Card>
              </Col>
            </Row>

            <Divider />

            <Title level={4}>
              <FireOutlined /> 热门标签
            </Title>
            <div style={{ marginBottom: 24 }}>
              {mostUsedTags.map(tag => (
                <Tag key={tag.id} color={tag.color} style={{ marginBottom: 8 }}>
                  {tag.name} ({tag.use_count})
                </Tag>
              ))}
            </div>

            <Title level={4}>
              <ClockCircleOutlined /> 最近使用
            </Title>
            <div>
              {recentTags.map(tag => (
                <Tag key={tag.id} color={tag.color} style={{ marginBottom: 8 }}>
                  {tag.name}
                </Tag>
              ))}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default TagManagementPage;