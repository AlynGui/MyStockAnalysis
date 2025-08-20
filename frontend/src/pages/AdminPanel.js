import React, { useState, useEffect } from 'react';
import { 
  Layout, 
  Card, 
  Tabs, 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Select, 
  message,
  Statistic,
  Row,
  Col,
  Badge,
  Tag,
  Space,
  Popconfirm
} from 'antd';
import { 
  UserOutlined, 
  TeamOutlined, 
  DatabaseOutlined, 
  MonitorOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useStocks } from '../services/StockContext';
import apiService from '../services/apiService';
import PermissionConfigPanel from '../components/PermissionConfigPanel';
import PermissionDebugPanel from '../components/PermissionDebugPanel';

const { TabPane } = Tabs;
const { Option } = Select;

const AdminPanel = () => {
  const { getStatistics, getRecentViewedStocks } = useStocks();
  // State management
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState(''); // 'user' or 'role'
  const [editingRecord, setEditingRecord] = useState(null);
  const [form] = Form.useForm();

  // Friendly permission options for role management
  const friendlyPermissions = [
    { key: 'user_management', label: 'User Management', description: 'Create, edit, and delete users' },
    { key: 'role_management', label: 'Role Management', description: 'Create, edit, and delete roles' },
    { key: 'stock_management', label: 'Stock Management', description: 'Manage stock data and imports' },
    { key: 'data_import', label: 'Data Import', description: 'Import stock data from external sources' },
    { key: 'analytics', label: 'Analytics & Reports', description: 'Access analytics and generate reports' },
    { key: 'prediction_models', label: 'Prediction Models', description: 'Use ML models for stock prediction' },
    { key: 'system_settings', label: 'System Settings', description: 'Configure system-wide settings' },
    { key: 'view_all_stocks', label: 'View All Stocks', description: 'View all stock information' },
    { key: 'favorite_stocks', label: 'Favorite Stocks', description: 'Add and manage favorite stocks' }

  ];

  // Helper function to get friendly permission label
  const getFriendlyPermissionLabel = (permissionName) => {
    const mapping = {
      'Can add 用户': 'User Management',
      'Can change 用户': 'User Management',
      'Can delete 用户': 'User Management',
      'Can view 用户': 'User Management',
      'Can add 角色': 'Role Management',
      'Can change 角色': 'Role Management',
      'Can delete 角色': 'Role Management',
      'Can view 角色': 'Role Management',
      'Can add 股票': 'Stock Management',
      'Can change 股票': 'Stock Management',
      'Can delete 股票': 'Stock Management',
      'Can view 股票': 'View All Stocks',
      'Can add 股票数据导入日志': 'Data Import',
      'Can change 股票数据导入日志': 'Data Import',
      'Can view 股票数据导入日志': 'Data Import',
      'Can view 股票价格预测': 'Prediction Models',
      'Can add 股票价格预测': 'Prediction Models',
      'Can change 股票价格预测': 'Prediction Models',
      'Can view 股票价格': 'Analytics & Reports',
      'Can view 股票新闻': 'Analytics & Reports',
      'Can add 用户收藏股票': 'Favorite Stocks',
      'Can change 用户收藏股票': 'Favorite Stocks',
      'Can delete 用户收藏股票': 'Favorite Stocks',
      'Can view 用户收藏股票': 'Favorite Stocks',

      'Can add permission': 'System Settings',
      'Can change permission': 'System Settings',
      'Can view permission': 'System Settings'
    };
    return mapping[permissionName] || permissionName;
  };

  // Helper function to map system permissions to friendly keys
  const mapSystemPermissionsToKeys = (permissions) => {
    const permissionToKeyMap = {
      // User Management
      'Can add 用户': 'user_management',
      'Can change 用户': 'user_management',
      'Can delete 用户': 'user_management',
      'Can view 用户': 'user_management',
      
      // Role Management
      'Can add 角色': 'role_management',
      'Can change 角色': 'role_management',
      'Can delete 角色': 'role_management',
      'Can view 角色': 'role_management',
      
      // Stock Management
      'Can add 股票': 'stock_management',
      'Can change 股票': 'stock_management',
      'Can delete 股票': 'stock_management',
      'Can view 股票': 'view_all_stocks',
      
      // Data Import
      'Can add 股票数据导入日志': 'data_import',
      'Can change 股票数据导入日志': 'data_import',
      'Can view 股票数据导入日志': 'data_import',
      
      // Prediction Models
      'Can view 股票价格预测': 'prediction_models',
      'Can add 股票价格预测': 'prediction_models',
      'Can change 股票价格预测': 'prediction_models',
      
      // Analytics
      'Can view 股票价格': 'analytics',
      'Can view 股票新闻': 'analytics',
      
      // Favorite Stocks
      'Can add 用户收藏股票': 'favorite_stocks',
      'Can change 用户收藏股票': 'favorite_stocks',
      'Can delete 用户收藏股票': 'favorite_stocks',
      'Can view 用户收藏股票': 'favorite_stocks',

      
      // System Settings
      'Can add permission': 'system_settings',
      'Can change permission': 'system_settings',
      'Can view permission': 'system_settings'
    };
    
    const mappedKeys = permissions.map(permName => permissionToKeyMap[permName]).filter(key => key);
    // Remove duplicates
    return [...new Set(mappedKeys)];
  };

  // Get real statistics data
  const stockStatistics = getStatistics();
  const recentViewedStocks = getRecentViewedStocks();

  // Calculate real system statistics
  const systemStats = {
    totalUsers: Array.isArray(users) ? users.length : 0,
    activeUsers: Array.isArray(users) ? users.filter(user => user.status === 'active').length : 0,
    totalStocks: stockStatistics.totalStocks,
    todayImports: Math.floor(stockStatistics.totalStocks * 0.1) // Mock today's imports
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Use API service to fetch data
      const [usersResponse, rolesResponse] = await Promise.all([
        apiService.getUserList(),
        apiService.getRoles()
      ]);
      
      // Handle paginated response for users
      const userData = usersResponse.data.results || usersResponse.data;
      const roleData = rolesResponse.data.results || rolesResponse.data;
      
      setUsers(Array.isArray(userData) ? userData : []);
      setRoles(Array.isArray(roleData) ? roleData : []);
    } catch (error) {
      console.error('Failed to load data:', error);
      message.error('Failed to load data');
      // Fallback to empty data
      setUsers([]);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  // User management table column definitions
  const userColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <Tag color={role === 'admin' ? 'red' : 'blue'}>
          {role === 'admin' ? 'Administrator' : 'Regular User'}
        </Tag>
      ),
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
      ),
    },
    {
      title: 'Created Date',
      dataIndex: 'created_at',
      key: 'created_at',
    },
    {
      title: 'Actions',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit('user', record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure to delete this user?"
            onConfirm={() => handleDelete('user', record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Role management table column definitions
  const roleColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'Role Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Permissions',
      dataIndex: 'permissions',
      key: 'permissions',
      render: (permissions) => (
        <div>
          {permissions && [...new Set(permissions.map(permission => getFriendlyPermissionLabel(permission)))].map(friendlyLabel => (
            <Tag key={friendlyLabel} color="blue">
              {friendlyLabel}
            </Tag>
          ))}
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit('role', record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure to delete this role?"
            onConfirm={() => handleDelete('role', record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Handle add/edit
  const handleEdit = (type, record = null) => {
    setModalType(type);
    setEditingRecord(record);
    setModalVisible(true);
    
    if (record) {
      if (type === 'role') {
        // For role editing, convert system permissions to friendly keys
        const formData = {
          ...record,
          permissions: record.permissions ? mapSystemPermissionsToKeys(record.permissions) : []
        };
        form.setFieldsValue(formData);
      } else {
        form.setFieldsValue(record);
      }
    } else {
      form.resetFields();
    }
  };

  // Handle delete
  const handleDelete = async (type, id) => {
    try {
      // TODO: Replace with real API call
      // await fetch(`/api/${type}s/${id}/`, { method: 'DELETE' });
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (type === 'user') {
        setUsers(Array.isArray(users) ? users.filter(user => user.id !== id) : []);
      } else {
        setRoles(Array.isArray(roles) ? roles.filter(role => role.id !== id) : []);
      }
      
      message.success('Deleted successfully');
    } catch (error) {
      message.error('Failed to delete');
    }
  };

  // Handle form submission
  const handleSubmit = async (values) => {
    try {
      // Use API service for CRUD operations
      let response;
      if (modalType === 'user') {
        // Note: User creation/update APIs may need to be implemented in backend
        response = { data: values }; // Placeholder for now
      } else {
        // For role operations, handle permissions conversion
        const roleData = { ...values };
        
        // Use permission_keys for friendly permission handling
        if (values.permissions && values.permissions.length > 0) {
          roleData.permission_keys = values.permissions;
          delete roleData.permissions; // Remove permissions field
        }
        
        if (editingRecord) {
          response = await apiService.updateRole(editingRecord.id, roleData);
        } else {
          response = await apiService.createRole(roleData);
        }
      }
      
      const data = response.data;
      
      if (modalType === 'user') {
        if (editingRecord) {
          setUsers(Array.isArray(users) ? users.map(user => 
            user.id === editingRecord.id ? { ...user, ...values } : user
          ) : []);
        } else {
          setUsers([...(Array.isArray(users) ? users : []), { ...data, id: data.id || Date.now() }]);
        }
      } else {
        if (editingRecord) {
          setRoles(Array.isArray(roles) ? roles.map(role => 
            role.id === editingRecord.id ? { ...role, ...values } : role
          ) : []);
        } else {
          setRoles([...(Array.isArray(roles) ? roles : []), { ...data, id: data.id || Date.now() }]);
        }
      }
      
      setModalVisible(false);
      message.success(editingRecord ? 'Updated successfully' : 'Created successfully');
      
      // Reload data to get updated permissions
      await loadData();
    } catch (error) {
      console.error('Operation failed:', error);
      message.error('Operation failed');
    }
  };

  // Data import function
  const handleDataImport = () => {
    message.info('Data import feature is under development...');
  };

  return (
    <Layout style={{ padding: '24px' }}>
      <div style={{ background: '#fff', padding: '24px', minHeight: 280 }}>
        <h2 style={{ marginBottom: '24px' }}>
          <MonitorOutlined /> Admin Panel
        </h2>
        
        {/* System Overview */}
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Users"
                value={systemStats.totalUsers}
                prefix={<UserOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Active Users"
                value={systemStats.activeUsers}
                prefix={<TeamOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Stocks"
                value={systemStats.totalStocks}
                prefix={<DatabaseOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Today's Imports"
                value={systemStats.todayImports}
                prefix={<ReloadOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* Management Function Tabs */}
        <Tabs defaultActiveKey="users">
          <TabPane tab="User Management" key="users">
            <div style={{ marginBottom: '16px' }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => handleEdit('user')}
              >
                Add User
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={loadData}
                style={{ marginLeft: '8px' }}
              >
                Refresh
              </Button>
            </div>
            <Table
              columns={userColumns}
              dataSource={users}
              rowKey="id"
              loading={loading}
              pagination={{
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} items`,
              }}
            />
          </TabPane>

          <TabPane tab="Role Management" key="roles">
            <div style={{ marginBottom: '16px' }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => handleEdit('role')}
              >
                Add Role
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={loadData}
                style={{ marginLeft: '8px' }}
              >
                Refresh
              </Button>
            </div>
            <Table
              columns={roleColumns}
              dataSource={roles}
              rowKey="id"
              loading={loading}
              pagination={{
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} items`,
              }}
            />
          </TabPane>

          <TabPane tab="Permission Configuration" key="permissions">
            <PermissionConfigPanel />
          </TabPane>

          <TabPane tab="Debug Panel" key="debug">
            <PermissionDebugPanel />
          </TabPane>

          <TabPane tab="Data Management" key="data">
            <Card title="Data Import">
              <p>Manage stock data import and updates</p>
              <Button
                type="primary"
                icon={<DatabaseOutlined />}
                onClick={handleDataImport}
              >
                Import Stock Data
              </Button>
            </Card>
          </TabPane>
        </Tabs>

        {/* Add/Edit Modal */}
        <Modal
          title={`${editingRecord ? 'Edit' : 'Add'} ${modalType === 'user' ? 'User' : 'Role'}`}
          visible={modalVisible}
          onOk={() => form.submit()}
          onCancel={() => setModalVisible(false)}
          okText="OK"
          cancelText="Cancel"
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            {modalType === 'user' ? (
              <>
                <Form.Item
                  label="Username"
                  name="username"
                  rules={[{ required: true, message: 'Please enter username' }]}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  label="Email"
                  name="email"
                  rules={[
                    { required: true, message: 'Please enter email' },
                    { type: 'email', message: 'Please enter a valid email address' }
                  ]}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  label="Role"
                  name="role"
                  rules={[{ required: true, message: 'Please select role' }]}
                >
                  <Select>
                    <Option value="admin">Administrator</Option>
                    <Option value="user">Regular User</Option>
                  </Select>
                </Form.Item>
                <Form.Item
                  label="Status"
                  name="status"
                  rules={[{ required: true, message: 'Please select status' }]}
                >
                  <Select>
                    <Option value="active">Active</Option>
                    <Option value="inactive">Inactive</Option>
                  </Select>
                </Form.Item>
              </>
            ) : (
              <>
                <Form.Item
                  label="Role Name"
                  name="name"
                  rules={[{ required: true, message: 'Please enter role name' }]}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  label="Description"
                  name="description"
                  rules={[{ required: true, message: 'Please enter description' }]}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  label="Permissions"
                  name="permissions"
                  rules={[{ required: true, message: 'Please select permissions' }]}
                >
                  <Select 
                    mode="multiple" 
                    placeholder="Please select permissions"
                    optionLabelProp="label"
                  >
                    {friendlyPermissions.map(perm => (
                      <Option 
                        key={perm.key} 
                        value={perm.key}
                        label={perm.label}
                      >
                        <div>
                          <div>{perm.label}</div>
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            {perm.description}
                          </div>
                        </div>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </>
            )}
          </Form>
        </Modal>
      </div>
    </Layout>
  );
};

export default AdminPanel; 