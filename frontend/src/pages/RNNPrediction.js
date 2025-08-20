import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Select, 
  Button, 
  Form, 
  InputNumber, 
  DatePicker, 
  Row, 
  Col, 
  Statistic,
  Table,
  Typography,
  Spin,
  message,
  Alert,
  Tabs,
  Progress
} from 'antd';
import { 
  LineChartOutlined, 
  RocketOutlined, 
  BulbOutlined,
  LineChartOutlined as TrendingUpOutlined,
  ExperimentOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Bar
} from 'recharts';
import { useStocks } from '../services/StockContext';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

// RNN Stock Price Prediction page component
const RNNPrediction = () => {
  const { allStocks } = useStocks();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [predictionData, setPredictionData] = useState(null);
  const [modelMetrics, setModelMetrics] = useState(null);
  const [progress, setProgress] = useState(0);

  // Prediction parameters
  const [predictionParams, setPredictionParams] = useState({
    lookBackDays: 30,
    predictDays: 7,
    epochs: 50,
    batchSize: 32,
    learningRate: 0.001
  });

  // Handle stock selection
  const handleStockChange = (symbol) => {
    const stock = allStocks.find(s => s.symbol === symbol);
    setSelectedStock(stock);
    setPredictionData(null);
    setModelMetrics(null);
  };

  // Start prediction
  const handleStartPrediction = async (values) => {
    if (!selectedStock) {
      message.error('Please select a stock first');
      return;
    }

    setPredicting(true);
    setProgress(0);
    
    try {
      // Simulate training progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 10;
        });
      }, 500);

      // Simulate RNN prediction API call
      const result = await simulateRNNPrediction(selectedStock, values);
      
      clearInterval(progressInterval);
      setProgress(100);
      setPredictionData(result.predictions);
      setModelMetrics(result.metrics);
      setPredictionParams(values);
      
      message.success('Prediction completed!');
    } catch (error) {
      message.error('Prediction failed, please try again');
    } finally {
      setPredicting(false);
      setTimeout(() => setProgress(0), 2000);
    }
  };

  // Simulate RNN prediction API
  const simulateRNNPrediction = async (stock, params) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const predictions = [];
        const historicalData = [];
        
        // Generate historical data
        for (let i = params.lookBackDays; i >= 0; i--) {
          const date = dayjs().subtract(i, 'day');
          const price = stock.price * (0.95 + Math.random() * 0.1);
          historicalData.push({
            date: date.format('YYYY-MM-DD'),
            actualPrice: price,
            predictedPrice: null,
            type: 'historical'
          });
        }
        
        // Generate prediction data
        let lastPrice = stock.price;
        for (let i = 1; i <= params.predictDays; i++) {
          const date = dayjs().add(i, 'day');
          const trend = (Math.random() - 0.5) * 0.05; // -2.5% to +2.5%
          const predictedPrice = lastPrice * (1 + trend);
          const confidence = 0.8 + Math.random() * 0.15; // 80-95% confidence
          
          predictions.push({
            date: date.format('YYYY-MM-DD'),
            actualPrice: null,
            predictedPrice: predictedPrice,
            confidence: confidence,
            type: 'prediction',
            trend: trend > 0 ? 'up' : 'down'
          });
          
          lastPrice = predictedPrice;
        }
        
        // Merge historical and prediction data
        const allData = [...historicalData, ...predictions];
        
        // Simulate model performance metrics
        const metrics = {
          accuracy: 0.85 + Math.random() * 0.10,
          mse: Math.random() * 0.02,
          mae: Math.random() * 0.015,
          r2Score: 0.80 + Math.random() * 0.15,
          epochs: params.epochs,
          trainingTime: Math.floor(Math.random() * 120) + 30, // 30-150 seconds
          dataPoints: 1000 + Math.floor(Math.random() * 500)
        };
        
        resolve({
          predictions: allData,
          metrics: metrics
        });
      }, 3000 + Math.random() * 2000); // 3-5 seconds
    });
  };

  // Render prediction chart
  const renderPredictionChart = () => {
    if (!predictionData) return null;

    return (
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={predictionData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip 
            formatter={(value, name) => [
              `$${value ? value.toFixed(2) : 'N/A'}`,
              name === 'actualPrice' ? 'Historical Price' : 'Predicted Price'
            ]}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="actualPrice"
            stroke="#1890ff"
            name="Historical Price"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="predictedPrice"
            stroke="#f5222d"
            name="Predicted Price"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ r: 4 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    );
  };

  // Prediction results table columns
  const predictionColumns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date'
    },
    {
      title: 'Predicted Price',
      dataIndex: 'predictedPrice',
      key: 'predictedPrice',
      render: (price) => price ? `$${price.toFixed(2)}` : 'N/A'
    },
    {
      title: 'Confidence',
      dataIndex: 'confidence',
      key: 'confidence',
      render: (confidence) => confidence ? `${(confidence * 100).toFixed(1)}%` : 'N/A'
    },
    {
      title: 'Trend',
      dataIndex: 'trend',
      key: 'trend',
      render: (trend) => {
        if (!trend) return 'N/A';
        return trend === 'up' ? 
          <span style={{ color: '#52c41a' }}>↗ Rising</span> : 
          <span style={{ color: '#f5222d' }}>↘ Falling</span>;
      }
    }
  ];

  return (
    <div className="rnn-prediction">
      <div className="prediction-header">
        <Title level={2}>
          <RocketOutlined /> RNN Stock Price Prediction
        </Title>
        <Paragraph>
          Use Recurrent Neural Network (RNN) model to predict stock price trends, train the model based on historical data and generate future price predictions.
        </Paragraph>
      </div>

      <Row gutter={[16, 16]}>
        {/* Prediction configuration */}
        <Col xs={24} lg={8}>
          <Card title="Prediction Configuration" icon={<ExperimentOutlined />}>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleStartPrediction}
              initialValues={predictionParams}
            >
              <Form.Item
                label="Select Stock"
                name="symbol"
                rules={[{ required: true, message: 'Please select a stock' }]}
              >
                <Select
                  placeholder="Please select a stock"
                  showSearch
                  filterOption={(input, option) =>
                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                  onChange={handleStockChange}
                >
                  {allStocks.map(stock => (
                    <Option key={stock.symbol} value={stock.symbol}>
                      {stock.symbol} - {stock.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                label="Historical Data Days"
                name="lookBackDays"
                rules={[{ required: true, message: 'Please enter historical data days' }]}
              >
                <InputNumber min={7} max={365} style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item
                label="Prediction Days"
                name="predictDays"
                rules={[{ required: true, message: 'Please enter prediction days' }]}
              >
                <InputNumber min={1} max={30} style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item
                label="Training Epochs"
                name="epochs"
                rules={[{ required: true, message: 'Please enter training epochs' }]}
              >
                <InputNumber min={10} max={200} style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item
                label="Batch Size"
                name="batchSize"
                rules={[{ required: true, message: 'Please enter batch size' }]}
              >
                <InputNumber min={16} max={128} style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item
                label="Learning Rate"
                name="learningRate"
                rules={[{ required: true, message: 'Please enter learning rate' }]}
              >
                <InputNumber min={0.0001} max={0.1} step={0.0001} style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit"
                  loading={predicting}
                  block
                  icon={<BulbOutlined />}
                >
                  {predicting ? 'Predicting...' : 'Start Prediction'}
                </Button>
              </Form.Item>
            </Form>

            {predicting && (
              <div style={{ marginTop: 16 }}>
                <Text>Model training progress:</Text>
                <Progress percent={Math.floor(progress)} size="small" />
              </div>
            )}
          </Card>
        </Col>

        {/* Prediction results */}
        <Col xs={24} lg={16}>
          {selectedStock ? (
            <Card
              title={
                <span>
                  <TrendingUpOutlined /> {selectedStock.symbol} - {selectedStock.name}
                </span>
              }
              extra={
                <Statistic
                  title="Current Price"
                  value={selectedStock.price}
                  prefix="$"
                  precision={2}
                />
              }
            >
              <Tabs defaultActiveKey="chart">
                <TabPane tab="Prediction Chart" key="chart">
                  {predictionData ? (
                    <div>
                      <Alert
                        message="Prediction Results"
                        description={`Based on RNN model, ${predictionParams.predictDays} days price prediction for ${selectedStock.symbol}`}
                        type="info"
                        showIcon
                        style={{ marginBottom: 16 }}
                      />
                      {renderPredictionChart()}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '60px 0' }}>
                      <LineChartOutlined style={{ fontSize: 48, color: '#ccc' }} />
                      <div style={{ marginTop: 16 }}>
                        <Text type="secondary">Please configure prediction parameters and start prediction</Text>
                      </div>
                    </div>
                  )}
                </TabPane>

                <TabPane tab="Prediction Data" key="data">
                  {predictionData ? (
                    <Table
                      columns={predictionColumns}
                      dataSource={predictionData.filter(item => item.type === 'prediction')}
                      rowKey="date"
                      pagination={false}
                    />
                  ) : (
                    <div style={{ textAlign: 'center', padding: '60px 0' }}>
                      <BarChartOutlined style={{ fontSize: 48, color: '#ccc' }} />
                      <div style={{ marginTop: 16 }}>
                        <Text type="secondary">No prediction data available</Text>
                      </div>
                    </div>
                  )}
                </TabPane>

                <TabPane tab="Model Performance" key="metrics">
                  {modelMetrics ? (
                    <Row gutter={[16, 16]}>
                      <Col xs={12} sm={8} md={6}>
                        <Card>
                          <Statistic
                            title="Accuracy"
                            value={modelMetrics.accuracy * 100}
                            precision={2}
                            suffix="%"
                            valueStyle={{ color: '#52c41a' }}
                          />
                        </Card>
                      </Col>
                      <Col xs={12} sm={8} md={6}>
                        <Card>
                          <Statistic
                            title="Mean Squared Error"
                            value={modelMetrics.mse}
                            precision={4}
                            valueStyle={{ color: '#1890ff' }}
                          />
                        </Card>
                      </Col>
                      <Col xs={12} sm={8} md={6}>
                        <Card>
                          <Statistic
                            title="Mean Absolute Error"
                            value={modelMetrics.mae}
                            precision={4}
                            valueStyle={{ color: '#722ed1' }}
                          />
                        </Card>
                      </Col>
                      <Col xs={12} sm={8} md={6}>
                        <Card>
                          <Statistic
                            title="R² Score"
                            value={modelMetrics.r2Score}
                            precision={3}
                            valueStyle={{ color: '#fa8c16' }}
                          />
                        </Card>
                      </Col>
                      <Col xs={12} sm={8} md={6}>
                        <Card>
                          <Statistic
                            title="Training Epochs"
                            value={modelMetrics.epochs}
                            valueStyle={{ color: '#13c2c2' }}
                          />
                        </Card>
                      </Col>
                      <Col xs={12} sm={8} md={6}>
                        <Card>
                          <Statistic
                            title="Training Time"
                            value={modelMetrics.trainingTime}
                            suffix="s"
                            valueStyle={{ color: '#eb2f96' }}
                          />
                        </Card>
                      </Col>
                    </Row>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '60px 0' }}>
                      <ExperimentOutlined style={{ fontSize: 48, color: '#ccc' }} />
                      <div style={{ marginTop: 16 }}>
                        <Text type="secondary">No model performance data available</Text>
                      </div>
                    </div>
                  )}
                </TabPane>
              </Tabs>
            </Card>
          ) : (
            <Card>
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <RocketOutlined style={{ fontSize: 48, color: '#ccc' }} />
                <div style={{ marginTop: 16 }}>
                  <Text type="secondary">Please select a stock first to start prediction</Text>
                </div>
              </div>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default RNNPrediction; 