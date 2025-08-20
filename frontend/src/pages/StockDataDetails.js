import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Typography, 
  Row, 
  Col, 
  Statistic,
  Tag,
  Space,
  Button,
  Descriptions,
  Spin,
  message,
  Tabs,
  Badge,
  Select
} from 'antd';
import { 
  DatabaseOutlined, 
  FileTextOutlined, 
  CalendarOutlined,
  ReloadOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useStocks } from '../services/StockContext';
import apiService from '../services/apiService';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

// Stock Data Details Page Component
const StockDataDetails = () => {
  const { allStocks, getStatistics } = useStocks();
  const [loading, setLoading] = useState(false);
  const [dataFields, setDataFields] = useState([]);
  const [allDataFields, setAllDataFields] = useState([]);
  const [importStats, setImportStats] = useState({});
  const [dataSources, setDataSources] = useState([]);
  const [importHistory, setImportHistory] = useState([]);
  const [selectedDataSource, setSelectedDataSource] = useState('all');

  const statistics = getStatistics();

  useEffect(() => {
    loadDataDetails();
  }, []);

  useEffect(() => {
    filterDataFields();
  }, [selectedDataSource, allDataFields]);

  // Load data details
  const loadDataDetails = async () => {
    setLoading(true);
    try {
      // Use API service to get data details
      const [stocksResponse, importLogsResponse] = await Promise.all([
        apiService.getStocks(),
        apiService.getImportLogs()
      ]);
      
      const stocksData = stocksResponse.data;
      const importLogs = importLogsResponse.data;
      
      // Generate field definitions based on stock model
      const fields = [
        {
          fieldName: 'symbol',
          fieldType: 'varchar(10)',
          description: 'Stock Symbol',
          nullable: false,
          primaryKey: true,
          example: 'AAPL',
          source: 'Basic API',
          apiInterface: 'Stock API'
        },
        {
          fieldName: 'name',
          fieldType: 'varchar(255)',
          description: 'Company Name',
          nullable: false,
          primaryKey: false,
          example: 'Apple Inc.',
          source: 'Basic API',
          apiInterface: 'Stock API'
        },
        {
          fieldName: 'price',
          fieldType: 'decimal(10,2)',
          description: 'Current Price',
          nullable: false,
          primaryKey: false,
          example: '175.20',
          source: 'Real-time API',
          apiInterface: 'Stock API'
        },
        {
          fieldName: 'volume',
          fieldType: 'bigint',
          description: 'Trading Volume',
          nullable: true,
          primaryKey: false,
          example: '52430000',
          source: 'Real-time API',
          apiInterface: 'Stock API'
        },
        {
          fieldName: 'market_cap',
          fieldType: 'varchar(50)',
          description: 'Market Cap',
          nullable: true,
          primaryKey: false,
          example: '2.85T',
          source: 'Basic API',
          apiInterface: 'Stock API'
        },
        {
          fieldName: 'sector',
          fieldType: 'varchar(100)',
          description: 'Industry Sector',
          nullable: true,
          primaryKey: false,
          example: 'Technology',
          source: 'Basic API',
          apiInterface: 'Stock API'
        },
        {
          fieldName: 'pe_ratio',
          fieldType: 'decimal(8,2)',
          description: 'P/E Ratio',
          nullable: true,
          primaryKey: false,
          example: '28.50',
          source: 'Financial API',
          apiInterface: 'Stock API'
        },
        {
          fieldName: 'dividend_yield',
          fieldType: 'decimal(5,2)',
          description: 'Dividend Yield',
          nullable: true,
          primaryKey: false,
          example: '0.52',
          source: 'Financial API',
          apiInterface: 'Stock API'
        },
        {
          fieldName: 'created_at',
          fieldType: 'timestamp',
          description: 'Created At',
          nullable: false,
          primaryKey: false,
          example: '2024-01-15 10:30:00',
          source: 'System',
          apiInterface: 'System Generated'
        },
        {
          fieldName: 'updated_at',
          fieldType: 'timestamp',
          description: 'Updated At',
          nullable: false,
          primaryKey: false,
          example: '2024-01-15 15:45:00',
          source: 'System',
          apiInterface: 'System Generated'
        }
      ];
      
      setAllDataFields(fields);
      setDataFields(fields);
      setImportStats({
        totalStocks: stocksData.length,
        totalFields: fields.length,
        lastUpdate: new Date().toISOString().slice(0, 19).replace('T', ' '),
        dataSize: '156.8MB',
        successRate: 98.5
      });
      
      setDataSources([
        {
          name: 'Stock API',
          type: 'Real-time',
          status: 'active',
          fields: ['price', 'volume', 'market_cap'],
          updateFrequency: 'Real-time'
        },
        {
          name: 'Financial API',
          type: 'Financial',
          status: 'active',
          fields: ['pe_ratio', 'dividend_yield'],
          updateFrequency: 'Daily'
        },
        {
          name: 'Manual Import',
          type: 'Excel',
          status: 'inactive',
          fields: ['symbol', 'name', 'price'],
          updateFrequency: 'Manual'
        }
      ]);
      
      // Format import history
      const formattedHistory = importLogs.map(log => ({
        date: new Date(log.created_at).toISOString().split('T')[0],
        action: log.import_type || 'Data Import',
        status: log.status,
        records: log.success_records || 0,
        duration: '5 minutes',
        source: 'API Auto Import'
      }));
      
      setImportHistory(formattedHistory);
    } catch (error) {
      console.error('Failed to load data details:', error);
      message.error('Failed to load data details');
    } finally {
      setLoading(false);
    }
  };

  // Filter data fields by data source
  const filterDataFields = () => {
    if (selectedDataSource === 'all') {
      setDataFields(allDataFields);
    } else {
      const filtered = allDataFields.filter(field => field.source === selectedDataSource);
      setDataFields(filtered);
    }
  };

  // Handle data source filter change
  const handleDataSourceChange = (value) => {
    setSelectedDataSource(value);
  };



  // Field table column definitions
  const fieldColumns = [
    {
      title: 'Field Name',
      dataIndex: 'fieldName',
      key: 'fieldName',
      render: (text, record) => (
        <Space>
          <Text code>{text}</Text>
          {record.primaryKey && <Tag color="red">Primary Key</Tag>}
        </Space>
      )
    },
    {
      title: 'Data Type',
      dataIndex: 'fieldType',
      key: 'fieldType',
      render: (type) => <Tag color="blue">{type}</Tag>
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description'
    },
    {
      title: 'Nullable',
      dataIndex: 'nullable',
      key: 'nullable',
      render: (nullable) => (
        <Tag color={nullable ? 'orange' : 'green'}>
          {nullable ? 'Yes' : 'No'}
        </Tag>
      )
    },
    {
      title: 'Example',
      dataIndex: 'example',
      key: 'example',
      render: (example) => <Text type="secondary">{example}</Text>
    },
    {
      title: 'API Interface',
      dataIndex: 'apiInterface',
      key: 'apiInterface',
      render: (apiInterface) => <Tag color="purple">{apiInterface}</Tag>
    }
  ];

  // Data source table column definitions
  const sourceColumns = [
    {
      title: 'Data Source',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => <Tag color="purple">{type}</Tag>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Badge 
          status={status === 'active' ? 'success' : 'default'} 
          text={status === 'active' ? 'Active' : 'Inactive'} 
        />
      )
    },
    {
      title: 'Fields',
      dataIndex: 'fields',
      key: 'fields',
      render: (fields) => (
        <div>
          {fields.map(field => (
            <Tag key={field} size="small">{field}</Tag>
          ))}
        </div>
      )
    },
    {
      title: 'Update Frequency',
      dataIndex: 'updateFrequency',
      key: 'updateFrequency'
    }
  ];

  // Import history table column definitions
  const historyColumns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date'
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      render: (action) => <Tag color="cyan">{action}</Tag>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusConfig = {
          success: { color: 'green', icon: <CheckCircleOutlined />, text: 'Success' },
          partial: { color: 'orange', icon: <ExclamationCircleOutlined />, text: 'Partial Success' },
          failed: { color: 'red', icon: <ExclamationCircleOutlined />, text: 'Failed' }
        };
        const config = statusConfig[status];
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.text}
          </Tag>
        );
      }
    },
    {
      title: 'Records',
      dataIndex: 'records',
      key: 'records',
      render: (records) => records.toLocaleString()
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration'
    },
    {
      title: 'Data Source',
      dataIndex: 'source',
      key: 'source',
      render: (source) => <Tag color="geekblue">{source}</Tag>
    }
  ];

  return (
    <div className="stock-data-details">
      <div className="data-details-header">
        <Title level={2}>Import Data Details</Title>
        <Text type="secondary">View imported stock data field information and statistics</Text>
      </div>

      {/* Statistics Overview */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Stocks"
              value={importStats.totalStocks}
              prefix={<DatabaseOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Data Fields"
              value={importStats.totalFields}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Data Size"
              value={importStats.dataSize}
              prefix={<DownloadOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Success Rate"
              value={importStats.successRate}
              precision={1}
              suffix="%"
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Last Update Time */}
      <Card style={{ marginBottom: 24 }}>
        <Descriptions title="Data Overview" bordered>
          <Descriptions.Item label="Last Update">
            <Space>
              <CalendarOutlined />
              {importStats.lastUpdate}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Data Source">
            API Auto Import + Manual Import
          </Descriptions.Item>
          <Descriptions.Item label="Update Frequency">
            Real-time price updates, daily financial data updates
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Detail Information Tabs */}
      <Tabs defaultActiveKey="fields">
        <TabPane tab="Data Fields" key="fields">
          <Card>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ marginRight: 8 }}>Data Source Filter:</span>
                <Select
                  value={selectedDataSource}
                  onChange={handleDataSourceChange}
                  style={{ width: 200 }}
                >
                  <Option value="all">All Sources</Option>
                  <Option value="Basic API">Basic API</Option>
                  <Option value="Real-time API">Real-time API</Option>
                  <Option value="Financial API">Financial API</Option>
                  <Option value="System">System</Option>
                </Select>
              </div>
              <Button
                icon={<ReloadOutlined />}
                onClick={loadDataDetails}
                loading={loading}
              >
                Refresh
              </Button>
            </div>
            
            {loading ? (
              <div style={{ textAlign: 'center', padding: '50px 0' }}>
                <Spin size="large" />
                <div style={{ marginTop: 16 }}>
                  <Text>Loading data fields...</Text>
                </div>
              </div>
            ) : (
              <Table
                columns={fieldColumns}
                dataSource={dataFields}
                rowKey="fieldName"
                pagination={{
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} of ${total} items`
                }}
              />
            )}
          </Card>
        </TabPane>

        <TabPane tab="Data Sources" key="sources">
          <Card>
            <div style={{ marginBottom: 16 }}>
              <Button
                icon={<ReloadOutlined />}
                onClick={loadDataDetails}
                loading={loading}
              >
                Refresh
              </Button>
            </div>
            
            {loading ? (
              <div style={{ textAlign: 'center', padding: '50px 0' }}>
                <Spin size="large" />
                <div style={{ marginTop: 16 }}>
                  <Text>Loading data sources...</Text>
                </div>
              </div>
            ) : (
              <Table
                columns={sourceColumns}
                dataSource={dataSources}
                rowKey="name"
                pagination={false}
              />
            )}
          </Card>
        </TabPane>

        <TabPane tab="Import History" key="history">
          <Card>
            <div style={{ marginBottom: 16 }}>
              <Button
                icon={<ReloadOutlined />}
                onClick={loadDataDetails}
                loading={loading}
              >
                Refresh
              </Button>
            </div>
            
            {loading ? (
              <div style={{ textAlign: 'center', padding: '50px 0' }}>
                <Spin size="large" />
                <div style={{ marginTop: 16 }}>
                  <Text>Loading import history...</Text>
                </div>
              </div>
            ) : (
              <Table
                columns={historyColumns}
                dataSource={importHistory}
                rowKey="date"
                pagination={{
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} of ${total} items`
                }}
              />
            )}
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default StockDataDetails; 