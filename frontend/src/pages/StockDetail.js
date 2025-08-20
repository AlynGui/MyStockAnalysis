import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Typography, 
  Tabs, 
  Spin, 
  Button,
  message
} from 'antd';
import { 
  ArrowUpOutlined, 
  ArrowDownOutlined,
  HeartOutlined,
  HeartFilled
} from '@ant-design/icons';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { useStocks } from '../services/StockContext';
import apiService from '../services/apiService';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

// Stock Detail Page Component
const StockDetail = () => {
  const { symbol } = useParams();
  const { allStocks, favorites, toggleFavorite, addToRecentViewed } = useStocks();
  const [loading, setLoading] = useState(true);
  const [stockData, setStockData] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [activeIndicator, setActiveIndicator] = useState('price');

  // Check if stock is favorited
  const isFavorite = favorites.has(symbol);

  useEffect(() => {
    if (symbol) {
      loadStockDetail(symbol);
    }
  }, [symbol]);

  // Load stock detail data
  const loadStockDetail = async (symbol) => {
    setLoading(true);
    try {
      // Find corresponding stock data from allStocks
      const stock = allStocks.find(s => s.symbol === symbol);
      if (stock) {
        setStockData(stock);
        // Add to recent viewed
        addToRecentViewed(stock);
        // Generate chart data
        const data = await generateChartData(stock);
        setChartData(data);
      } else {
        message.error('Stock not found');
      }
    } catch (error) {
      console.error('Failed to load stock details:', error);
      message.error('Failed to load stock details');
    } finally {
      setLoading(false);
    }
  };

  // Generate chart data
  const generateChartData = async (stock) => {
    try {
      // Use API service to get historical price data
      const response = await apiService.getStockPrices(stock.symbol);
      const priceData = response.data;
      
      // Format the data for charts
      const chartData = priceData.map(price => ({
        date: new Date(price.date).toLocaleDateString(),
        price: price.close_price.toFixed(2),
        ma5: price.ma_5 ? price.ma_5.toFixed(2) : null,
        ma20: price.ma_20 ? price.ma_20.toFixed(2) : null,
        volume: price.volume,
        rsi: 50 + Math.random() * 40, // Placeholder for RSI
        macd: price.macd_histogram || 0
      }));
      
      return chartData;
    } catch (error) {
      console.error('Failed to fetch price data:', error);
      
      // Fallback to mock data if API fails
      const basePrice = stock.price;
      const chartData = [];
      
      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        const price = basePrice + (Math.random() - 0.5) * 20;
        
        chartData.push({
          date: date.toLocaleDateString(),
          price: price.toFixed(2),
          ma5: (price * 0.98).toFixed(2),
          ma20: (price * 0.95).toFixed(2),
          volume: Math.floor(Math.random() * 10000000),
          rsi: Math.floor(Math.random() * 100),
          macd: (Math.random() - 0.5) * 5
        });
      }
      
      return chartData;
    }
  };

  // Toggle favorite status
  const handleToggleFavorite = async () => {
    try {
      const newFavoriteState = await toggleFavorite(symbol);
      message.success(newFavoriteState ? 'Added to favorites' : 'Removed from favorites');
    } catch (error) {
      message.error('Failed to update favorites');
    }
  };

  // Render technical indicator charts
  const renderChart = () => {
    if (!chartData.length) return null;

    const chartConfigs = {
      price: {
        title: 'Price Trend',
        dataKey: 'price',
        color: '#1890ff'
      },
      ma: {
        title: 'MA Lines',
        lines: [
          { dataKey: 'price', color: '#1890ff', name: 'Price' },
          { dataKey: 'ma5', color: '#52c41a', name: 'MA5' },
          { dataKey: 'ma20', color: '#faad14', name: 'MA20' }
        ]
      },
      rsi: {
        title: 'RSI Indicator',
        dataKey: 'rsi',
        color: '#722ed1'
      },
      macd: {
        title: 'MACD Indicator',
        dataKey: 'macd',
        color: '#eb2f96'
      }
    };

    const config = chartConfigs[activeIndicator];

    return (
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          {config.lines ? (
            config.lines.map((line, index) => (
              <Line
                key={index}
                type="monotone"
                dataKey={line.dataKey}
                stroke={line.color}
                name={line.name}
                strokeWidth={2}
                dot={false}
              />
            ))
          ) : (
            <Line
              type="monotone"
              dataKey={config.dataKey}
              stroke={config.color}
              strokeWidth={2}
              dot={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text>Loading stock details...</Text>
        </div>
      </div>
    );
  }

  if (!stockData) {
    return <div>Stock data not found</div>;
  }

  return (
    <div className="stock-detail">
      {/* Stock Basic Information */}
      <Card>
        <Row gutter={[16, 16]} align="middle">
          <Col flex="auto">
            <div className="stock-header">
              <Title level={2}>
                {stockData.symbol} - {stockData.name}
              </Title>
              <div className="price-info">
                <span className="current-price">${stockData.price}</span>
                <span 
                  className={`price-change ${stockData.change >= 0 ? 'positive' : 'negative'}`}
                >
                  {stockData.change >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                  {stockData.change >= 0 ? '+' : ''}{stockData.change.toFixed(2)} 
                  ({stockData.changePercent.toFixed(2)}%)
                </span>
              </div>
            </div>
          </Col>
          <Col>
            <Button
              type={isFavorite ? "primary" : "default"}
              icon={isFavorite ? <HeartFilled /> : <HeartOutlined />}
              onClick={handleToggleFavorite}
            >
              {isFavorite ? 'Favorited' : 'Add to Favorites'}
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Statistics */}
      <Card style={{ marginTop: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={8} md={6}>
            <Statistic title="Volume" value={stockData.volume} />
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Statistic title="Market Cap" value={stockData.marketCap} />
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Statistic title="P/E Ratio" value={stockData.peRatio} />
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Statistic title="Dividend Yield" value={stockData.dividendYield} suffix="%" />
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Statistic title="Beta" value={stockData.beta} />
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Statistic title="Sector" value={stockData.sector} />
          </Col>
        </Row>
      </Card>

      {/* Technical Indicator Charts */}
      <Card style={{ marginTop: 16 }}>
        <Tabs 
          defaultActiveKey="price"
          onChange={setActiveIndicator}
          tabBarExtraContent={
            <Button 
              type="link" 
              onClick={() => loadStockDetail(symbol)}
              loading={loading}
            >
              Refresh Data
            </Button>
          }
        >
          <TabPane tab="Price Trend" key="price">
            {renderChart()}
          </TabPane>
          <TabPane tab="MA Lines" key="ma">
            {renderChart()}
          </TabPane>
          <TabPane tab="RSI Indicator" key="rsi">
            {renderChart()}
          </TabPane>
          <TabPane tab="MACD Indicator" key="macd">
            {renderChart()}
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default StockDetail; 