import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Typography, 
  Input, 
  Button, 
  Tag,
  Space,
  Spin,
  message
} from 'antd';
import { 
  SearchOutlined, 
  HeartOutlined, 
  HeartFilled,
  EyeOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  StarOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useStocks } from '../services/StockContext';

const { Title, Text } = Typography;
const { Search } = Input;

// Stock list page component
const StockList = () => {
  const { allStocks, favorites, loading, toggleFavorite, searchStocks } = useStocks();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredStocks, setFilteredStocks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  // Update filtered stocks when search term or all stocks change
  useEffect(() => {
    const results = searchStocks(searchTerm);
    setFilteredStocks(results);
  }, [searchTerm, allStocks, searchStocks]);

  // Handle favorite toggle
  const handleToggleFavorite = async (symbol) => {
    try {
      const newFavoriteState = await toggleFavorite(symbol);
      message.success(newFavoriteState ? 'Added to favorites' : 'Removed from favorites');
    } catch (error) {
      message.error('Failed to update favorites');
    }
  };

  // Handle view stock details
  const handleViewStock = (symbol) => {
    navigate(`/stocks/${symbol}`);
  };

  // Handle search
  const handleSearch = (value) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
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
            icon={favorites.has(record.symbol) ? <HeartFilled /> : <HeartOutlined />}
            onClick={() => handleToggleFavorite(record.symbol)}
            style={{ color: favorites.has(record.symbol) ? '#f5222d' : '#666' }}
          >
            {favorites.has(record.symbol) ? 'Favorited' : 'Favorite'}
          </Button>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewStock(record.symbol)}
          >
            View
          </Button>
        </Space>
      )
    }
  ];

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text>Loading stock data...</Text>
        </div>
      </div>
    );
  }

  return (
    <div className="stock-list">
      <div className="stock-list-header">
        <div>
          <Title level={2}>Stock List</Title>
          <Text type="secondary">Browse and search stocks</Text>
        </div>
        <div>
          <Button
            type="primary"
            icon={<StarOutlined />}
            onClick={() => navigate('/favorites')}
          >
            My Favorites
          </Button>
        </div>
      </div>

      <Card>
        <div className="search-controls">
          <Search
            placeholder="Search stocks by symbol, name, or sector..."
            allowClear
            size="large"
            onSearch={handleSearch}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', marginBottom: 16 }}
          />
        </div>

        <Table
          columns={columns}
          dataSource={filteredStocks}
          rowKey="symbol"
          pagination={{
            current: currentPage,
            pageSize: 10,
            total: filteredStocks.length,
            onChange: (page) => setCurrentPage(page),
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} stocks`
          }}
          scroll={{ x: 1200 }}
          loading={loading}
          size="middle"
          rowClassName={(record) => 
            favorites.has(record.symbol) ? 'favorite-row' : ''
          }
        />
      </Card>
    </div>
  );
};

export default StockList; 