import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Typography, Button, List, Spin } from 'antd';
import { 
  StockOutlined, 
  RiseOutlined, 
  FallOutlined, 
  EyeOutlined,
  LineChartOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useStocks } from '../services/StockContext';

const { Title, Text } = Typography;

// Dashboard page component
const Dashboard = () => {
  const { allStocks, favorites, loading, getStatistics, getFavoriteStocks, getRecentViewedStocks } = useStocks();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    statistics: { favoriteCount: 0, totalStocks: 0, gainers: 0, losers: 0 },
    favoriteStocks: [],
    recentViewedStocks: []
  });

  // Update dashboard data when context data changes
  useEffect(() => {
    const statistics = getStatistics();
    const favoriteStocks = getFavoriteStocks();
    const recentViewedStocks = getRecentViewedStocks();
    
    setDashboardData({
      statistics,
      favoriteStocks,
      recentViewedStocks
    });
  }, [allStocks, favorites]); // 只依赖数据，不依赖函数

  const handleViewStock = (symbol) => {
    navigate(`/stocks/${symbol}`);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text>Loading dashboard data...</Text>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <Title level={2}>Dashboard</Title>
        <Text type="secondary">Stock Analysis Platform Overview</Text>
      </div>

      {/* Statistics cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Stocks"
              value={dashboardData.statistics.totalStocks}
              prefix={<StockOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Favorite Stocks"
              value={dashboardData.statistics.favoriteCount}
              prefix={<EyeOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Gainers"
              value={dashboardData.statistics.gainers}
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Losers"
              value={dashboardData.statistics.losers}
              prefix={<FallOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* Recently viewed stocks */}
        <Col xs={24} lg={12}>
          <Card 
            title="Recently Viewed" 
            extra={
              <Button type="link" onClick={() => navigate('/stocks')}>
                View All
              </Button>
            }
          >
            {dashboardData.recentViewedStocks.length > 0 ? (
              <List
                dataSource={dashboardData.recentViewedStocks.slice(0, 5)} // Show only the last 5
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Button 
                        type="link" 
                        size="small"
                        onClick={() => handleViewStock(item.symbol)}
                      >
                        View Details
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <span>
                          {item.symbol} - {item.name}
                        </span>
                      }
                      description={
                        <span>
                          ${item.price.toFixed(2)}
                          <span 
                            style={{ 
                              color: item.change >= 0 ? '#52c41a' : '#f5222d',
                              marginLeft: 8
                            }}
                          >
                            {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}
                          </span>
                        </span>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                <Text type="secondary">No recently viewed stocks</Text>
                <div style={{ marginTop: 16 }}>
                  <Button type="primary" onClick={() => navigate('/stocks')}>
                    Browse Stocks
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </Col>

        {/* Quick actions */}
        <Col xs={24} lg={12}>
          <Card title="Quick Actions">
            <div className="quick-actions">
              <Button 
                type="primary" 
                size="large" 
                block 
                style={{ marginBottom: 16 }}
                onClick={() => navigate('/stocks')}
              >
                Browse Stock List
              </Button>
              <Button 
                size="large" 
                block 
                style={{ marginBottom: 16 }}
                onClick={() => navigate('/favorites')}
              >
                My Favorites ({dashboardData.statistics.favoriteCount})
              </Button>
              <Button 
                size="large" 
                block
                onClick={() => navigate('/profile')}
              >
                Profile Settings
              </Button>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard; 