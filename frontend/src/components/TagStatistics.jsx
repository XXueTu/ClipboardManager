import {
    BarChartOutlined,
    BulbOutlined,
    ClockCircleOutlined,
    FireOutlined,
    FolderOutlined,
    SettingOutlined,
    SyncOutlined,
    TagOutlined,
    WarningOutlined
} from '@ant-design/icons';
import {
    Badge,
    Button,
    Card,
    Col,
    Empty,
    Progress,
    Row,
    Space,
    Spin,
    Statistic,
    Table,
    Tag,
    Typography
} from 'antd';
import React, { useEffect, useState } from 'react';
import {
    GetMostUsedTags,
    GetRecentTags,
    GetTagGroups,
    GetTagStatistics
} from '../../wailsjs/go/main/App';

const { Title, Text } = Typography;

const TagStatistics = ({ 
  showHeader = true,
  showDetails = true,
  compactMode = false,
  refreshInterval = 0, // 自动刷新间隔（毫秒），0表示不自动刷新
  style = {}
}) => {
  const [statistics, setStatistics] = useState(null);
  const [mostUsedTags, setMostUsedTags] = useState([]);
  const [recentTags, setRecentTags] = useState([]);
  const [tagGroups, setTagGroups] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAllData();
    
    // 设置自动刷新
    if (refreshInterval > 0) {
      const interval = setInterval(loadAllData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadStatistics(),
        loadMostUsedTags(),
        loadRecentTags(),
        loadTagGroups()
      ]);
    } catch (error) {
      console.error('加载统计数据失败:', error);
    } finally {
      setLoading(false);
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
      const result = await GetMostUsedTags(compactMode ? 5 : 15);
      setMostUsedTags(result || []);
    } catch (error) {
      console.error('加载热门标签失败:', error);
    }
  };

  const loadRecentTags = async () => {
    try {
      const result = await GetRecentTags(compactMode ? 5 : 10);
      setRecentTags(result || []);
    } catch (error) {
      console.error('加载最近标签失败:', error);
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

  const getUsagePercentage = (count, maxCount) => {
    if (maxCount === 0) return 0;
    return Math.round((count / maxCount) * 100);
  };

  const getGroupStatistics = () => {
    if (!tagGroups.length) return [];
    
    return tagGroups.map(group => {
      const groupTags = mostUsedTags.filter(tag => tag.group_id === group.id);
      const totalUsage = groupTags.reduce((sum, tag) => sum + tag.use_count, 0);
      
      return {
        ...group,
        tag_count: groupTags.length,
        total_usage: totalUsage
      };
    }).sort((a, b) => b.total_usage - a.total_usage);
  };

  const mostUsedTagColumns = [
    {
      title: '排名',
      key: 'rank',
      width: 60,
      render: (_, __, index) => (
        <Badge count={index + 1} style={{ 
          backgroundColor: index < 3 ? '#faad14' : '#d9d9d9',
          color: index < 3 ? '#fff' : '#666'
        }} />
      ),
    },
    {
      title: '标签',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Tag color={record.color} style={{ margin: 0 }}>
          {text}
        </Tag>
      ),
    },
    {
      title: '使用次数',
      dataIndex: 'use_count',
      key: 'use_count',
      width: 120,
      render: (count) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>{count}</span>
          <Progress 
            percent={getUsagePercentage(count, mostUsedTags[0]?.use_count || 1)} 
            size="small" 
            showInfo={false}
            style={{ flex: 1, minWidth: 60 }}
          />
        </div>
      ),
      sorter: (a, b) => a.use_count - b.use_count,
    },
    {
      title: '条目数',
      dataIndex: 'item_count',
      key: 'item_count',
      width: 80,
      render: (count) => (
        <Badge count={count} style={{ backgroundColor: '#52c41a' }} />
      ),
    },
  ];

  if (loading && !statistics) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!statistics) {
    return (
      <Card style={style}>
        <Empty description="暂无统计数据" />
      </Card>
    );
  }

  const groupStats = getGroupStatistics();

  return (
    <div style={style}>
      {showHeader && (
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={compactMode ? 4 : 3}>
            <BarChartOutlined /> 标签统计
          </Title>
          <Button 
            icon={<SyncOutlined />} 
            onClick={loadAllData}
            loading={loading}
            size={compactMode ? 'small' : 'default'}
          >
            刷新
          </Button>
        </div>
      )}

      <Spin spinning={loading}>
        {/* 基础统计 */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={compactMode ? 8 : 6}>
            <Card>
              <Statistic
                title="总标签数"
                value={statistics.total_tags}
                prefix={<TagOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={compactMode ? 8 : 6}>
            <Card>
              <Statistic
                title="系统标签"
                value={statistics.system_tags}
                prefix={<SettingOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={compactMode ? 8 : 6}>
            <Card>
              <Statistic
                title="用户标签"
                value={statistics.user_tags}
                prefix={<BulbOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          {!compactMode && (
            <Col span={6}>
              <Card>
                <Statistic
                  title="未使用标签"
                  value={statistics.unused_tags?.length || 0}
                  prefix={<WarningOutlined />}
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Card>
            </Col>
          )}
        </Row>

        {showDetails && (
          <Row gutter={16}>
            {/* 热门标签 */}
            <Col span={compactMode ? 24 : 12}>
              <Card 
                title={
                  <span>
                    <FireOutlined style={{ color: '#fa541c' }} /> 热门标签
                  </span>
                }
                size={compactMode ? 'small' : 'default'}
              >
                {mostUsedTags.length === 0 ? (
                  <Empty description="暂无数据" />
                ) : (
                  <Table
                    columns={mostUsedTagColumns}
                    dataSource={mostUsedTags}
                    rowKey="id"
                    pagination={compactMode ? false : { pageSize: 5, size: 'small' }}
                    size="small"
                    showHeader={!compactMode}
                  />
                )}
              </Card>
            </Col>

            {/* 最近使用 */}
            <Col span={compactMode ? 24 : 12}>
              <Card 
                title={
                  <span>
                    <ClockCircleOutlined style={{ color: '#1890ff' }} /> 最近使用
                  </span>
                }
                size={compactMode ? 'small' : 'default'}
                style={{ marginTop: compactMode ? 16 : 0 }}
              >
                {recentTags.length === 0 ? (
                  <Empty description="暂无数据" />
                ) : (
                  <div>
                    {recentTags.map((tag, index) => (
                      <div key={tag.id} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        padding: '8px 0',
                        borderBottom: index < recentTags.length - 1 ? '1px solid #f0f0f0' : 'none'
                      }}>
                        <Tag color={tag.color}>
                          {tag.name}
                        </Tag>
                        <div style={{ fontSize: '12px', color: '#999' }}>
                          <Space>
                            <span>使用 {tag.use_count} 次</span>
                            <Badge count={tag.item_count} style={{ backgroundColor: '#52c41a' }} />
                          </Space>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </Col>
          </Row>
        )}

        {/* 分组统计 */}
        {showDetails && !compactMode && groupStats.length > 0 && (
          <Card 
            title={
              <span>
                <FolderOutlined style={{ color: '#52c41a' }} /> 分组统计
              </span>
            }
            style={{ marginTop: 16 }}
          >
            <Row gutter={16}>
              {groupStats.map(group => (
                <Col key={group.id} span={6} style={{ marginBottom: 16 }}>
                  <Card size="small">
                    <div style={{ textAlign: 'center' }}>
                      <Tag color={group.color} style={{ marginBottom: 8 }}>
                        <FolderOutlined /> {group.name}
                      </Tag>
                      <div>
                        <Statistic
                          title="标签数"
                          value={group.tag_count}
                          suffix="个"
                          valueStyle={{ fontSize: '16px' }}
                        />
                      </div>
                      <div style={{ marginTop: 8 }}>
                        <Text type="secondary">
                          总使用: {group.total_usage} 次
                        </Text>
                      </div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        )}

        {/* 未使用标签警告 */}
        {showDetails && statistics.unused_tags && statistics.unused_tags.length > 0 && (
          <Card 
            title={
              <span>
                <WarningOutlined style={{ color: '#fa8c16' }} /> 未使用标签
              </span>
            }
            style={{ marginTop: 16 }}
          >
            <div style={{ marginBottom: 12 }}>
              <Text type="secondary">
                发现 {statistics.unused_tags.length} 个未使用的标签，建议清理以保持标签库整洁。
              </Text>
            </div>
            <div>
              {statistics.unused_tags.slice(0, compactMode ? 5 : 10).map(tag => (
                <Tag key={tag.id} color={tag.color} style={{ marginBottom: 4 }}>
                  {tag.name}
                </Tag>
              ))}
              {statistics.unused_tags.length > (compactMode ? 5 : 10) && (
                <Tag>
                  +{statistics.unused_tags.length - (compactMode ? 5 : 10)} 更多...
                </Tag>
              )}
            </div>
          </Card>
        )}
      </Spin>
    </div>
  );
};

export default TagStatistics;