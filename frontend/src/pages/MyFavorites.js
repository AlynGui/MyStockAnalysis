import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Typography, 
  Button, 
  Tag,
  Space,
  Statistic,
  Row,
  Col,
  Empty,
  Spin,
  message
} from 'antd';
import { 
  HeartFilled, 
  EyeOutlined, 
  DeleteOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  DollarOutlined,
  RiseOutlined,
  FallOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useStocks } from '../services/StockContext';

const { Title, Text } = Typography;

// My Favorites page component
const MyFavorites = () => {
  const { getFavoriteStocks, toggleFavorite, loading, refreshFavorites, getLoadingState, allStocks, favorites } = useStocks();
  const [favoriteStocks, setFavoriteStocks] = useState([]);

  const [statistics, setStatistics] = useState({
    totalValue: 0,
    totalGain: 0,
    totalLoss: 0,
    gainers: 0,
    losers: 0
  });
  const navigate = useNavigate();

  // Load and refresh favorites when data becomes available
  useEffect(() => {
    console.log('MyFavorites useEffect triggered, allStocks length:', allStocks.length, 'favorites size:', favorites.size);
    
    if (allStocks.length > 0) {
      console.log('AllStocks loaded, getting favorites...');
      const currentFavorites = getFavoriteStocks();
      console.log('Current favorites:', currentFavorites);
      
      setFavoriteStocks(currentFavorites);
      
      // Calculate statistics
      const totalValue = currentFavorites.reduce((sum, stock) => sum + stock.price, 0);
      const gainers = currentFavorites.filter(stock => stock.change > 0);
      const losers = currentFavorites.filter(stock => stock.change < 0);
      const totalGain = gainers.reduce((sum, stock) => sum + stock.change, 0);
      const totalLoss = losers.reduce((sum, stock) => sum + Math.abs(stock.change), 0);
      
      setStatistics({
        totalValue,
        totalGain,
        totalLoss,
        gainers: gainers.length,
        losers: losers.length
      });
    }
  }, [allStocks, favorites, getFavoriteStocks]);

  // Initial data refresh
  useEffect(() => {
    console.log('Initial refresh favorites...');
    refreshFavorites();
  }, [refreshFavorites]);

  // Handle remove from favorites
  const handleRemoveFavorite = async (symbol) => {
    try {
      await toggleFavorite(symbol);
      message.success('Removed from favorites');
      // Refresh favorites from server and update local state
      await refreshFavorites();
      const updatedFavorites = getFavoriteStocks();
      setFavoriteStocks(updatedFavorites);
    } catch (error) {
      message.error('Failed to remove from favorites');
    }
  };

  // Handle view stock details
  const handleViewStock = (symbol) => {
    navigate(`/stocks/${symbol}`);
  };

  // Table columns definition
  const columns = [
    {
      title: 'Symbol',
      dataIndex: 'symbol',
      key: 'symbol',
      width: 100,
      render: (symbol) => (
        <Text strong style={{ color: '#1890ff' }}>{symbol}</Text>
      )
    },
    {
      title: 'Company Name',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (name) => (
        <Text ellipsis={{ tooltip: name }}>{name}</Text>
      )
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      width: 100,
      render: (price) => (
        <Text strong>${price.toFixed(2)}</Text>
      )
    },
    {
      title: 'Change',
      dataIndex: 'change',
      key: 'change',
      width: 100,
      render: (change) => (
        <span style={{ color: change >= 0 ? '#52c41a' : '#f5222d' }}>
          {change >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
          {change >= 0 ? '+' : ''}{change.toFixed(2)}
        </span>
      )
    },
    {
      title: 'Change %',
      dataIndex: 'changePercent',
      key: 'changePercent',
      width: 100,
      render: (changePercent) => (
        <span style={{ color: changePercent >= 0 ? '#52c41a' : '#f5222d' }}>
          {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%
        </span>
      )
    },
    {
      title: 'Volume',
      dataIndex: 'volume',
      key: 'volume',
      width: 120,
      render: (volume) => volume.toLocaleString()
    },
    {
      title: 'Market Cap',
      dataIndex: 'marketCap',
      key: 'marketCap',
      width: 120,
      render: (marketCap) => (
        <Text>{marketCap}</Text>
      )
    },
    {
      title: 'Sector',
      dataIndex: 'sector',
      key: 'sector',
      width: 120,
      render: (sector) => (
        <Tag color="blue">{sector}</Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewStock(record.symbol)}
          >
            View
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleRemoveFavorite(record.symbol)}
          >
            Remove
          </Button>
        </Space>
      )
    }
  ];

  if (loading || allStocks.length === 0) {
    return (
      <div className="loading-container">
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text>Loading favorite stocks...</Text>
        </div>
      </div>
    );
  }

  return (
    <div className="my-favorites">
      <div className="favorites-header">
        <Title level={2}>
          <HeartFilled style={{ color: '#f5222d', marginRight: 8 }} />
          My Favorites
        </Title>
        <Text type="secondary">Manage your favorite stocks</Text>
      </div>

      {/* Statistics cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Favorites"
              value={favoriteStocks.length}
              prefix={<HeartFilled />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Value"
              value={statistics.totalValue}
              prefix={<DollarOutlined />}
              precision={2}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Gainers"
              value={statistics.gainers}
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Losers"
              value={statistics.losers}
              prefix={<FallOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Favorites table */}
      <Card>
        {favoriteStocks.length > 0 ? (
          <Table
            columns={columns}
            dataSource={favoriteStocks}
            rowKey="symbol"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} favorite stocks`
            }}
            scroll={{ x: 1200 }}
            size="middle"
          />
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div>
                <Text type="secondary">No favorite stocks yet</Text>
                <div style={{ marginTop: 8 }}>
                  <Button 
                    type="primary" 
                    onClick={() => navigate('/stocks')}
                  >
                    Browse Stocks
                  </Button>
                </div>
              </div>
            }
          />
        )}
      </Card>
    </div>
  );
};

export default MyFavorites; 