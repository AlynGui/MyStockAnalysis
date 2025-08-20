import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Tree, 
  Button, 
  Select, 
  message, 
  Spin, 
  Alert, 
  Space,
  Modal,
  Checkbox,
  Divider,
  Tag,
  Typography,
  Row,
  Col
} from 'antd';
import { 
  SettingOutlined, 
  SaveOutlined, 
  ReloadOutlined,
  CheckOutlined,
  CloseOutlined,
  ExclamationCircleOutlined 
} from '@ant-design/icons';
import apiService from '../services/apiService';

const { Option } = Select;
const { Title, Text } = Typography;
const { confirm } = Modal;

const PermissionConfigPanel = () => {
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [availablePermissions, setAvailablePermissions] = useState({});
  const [currentPermissions, setCurrentPermissions] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [permissionChanges, setPermissionChanges] = useState({});

  useEffect(() => {
    loadRoles();
    loadAvailablePermissions();
  }, []);

  useEffect(() => {
    if (selectedRole) {
      loadRolePermissions(selectedRole);
    }
  }, [selectedRole]);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const response = await apiService.getRoles();
      // Handle both paginated and non-paginated responses
      const rolesData = response.data.results || response.data || [];
      
      
      // Ensure rolesData is an array
      if (Array.isArray(rolesData)) {
        setRoles(rolesData);
      } else {
        console.error('Roles data is not an array:', rolesData);
        setRoles([]);
        message.error('Invalid roles data format');
      }
    } catch (error) {
      message.error('Failed to load roles');
      console.error('Error loading roles:', error);
      setRoles([]); // Ensure roles is always an array
    } finally {
      setLoading(false);
    }
  };

  const loadAvailablePermissions = async () => {
    try {
      const response = await apiService.getAvailablePermissions();
      const permissionsData = response.data.grouped_permissions || {};
      
      
      setAvailablePermissions(permissionsData);
    } catch (error) {
      message.error('Failed to load available permissions');
      console.error('Error loading permissions:', error);
      setAvailablePermissions({}); // Ensure it's always an object
    }
  };

  const loadRolePermissions = async (roleId) => {
    try {
      setLoading(true);
      const response = await apiService.getRolePermissionsDetailed(roleId);
              const permissionsData = response.data.permissions || {};
      
      setCurrentPermissions(permissionsData);
      setPermissionChanges({}); // Reset changes when loading new role
    } catch (error) {
      message.error('Failed to load role permissions');
      console.error('Error loading role permissions:', error);
      setCurrentPermissions({}); // Ensure it's always an object
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = (appLabel, permissionCodename, checked) => {
    const changeKey = `${appLabel}.${permissionCodename}`;
    const isCurrentlyEnabled = currentPermissions[appLabel]?.some(
      p => p.codename === permissionCodename
    );

    if (checked === isCurrentlyEnabled) {
      // Remove from changes if back to original state
      const newChanges = { ...permissionChanges };
      delete newChanges[changeKey];
      setPermissionChanges(newChanges);
    } else {
      // Add to changes
      setPermissionChanges({
        ...permissionChanges,
        [changeKey]: {
          appLabel,
          codename: permissionCodename,
          action: checked ? 'add' : 'remove',
          name: availablePermissions[appLabel]?.permissions.find(
            p => p.codename === permissionCodename
          )?.name
        }
      });
    }
  };

  const applyPermissionChanges = async () => {
    if (Object.keys(permissionChanges).length === 0) {
      message.info('No changes to apply');
      return;
    }

    const selectedRoleData = roles.find(r => r.id === selectedRole);
    
    confirm({
      title: 'Apply Permission Changes',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>Are you sure you want to apply these changes to <strong>{selectedRoleData?.name}</strong>?</p>
          <div style={{ maxHeight: 200, overflowY: 'auto', marginTop: 16 }}>
            {Object.values(permissionChanges).map((change, index) => (
              <div key={index} style={{ marginBottom: 8 }}>
                <Tag color={change.action === 'add' ? 'green' : 'red'}>
                  {change.action === 'add' ? <CheckOutlined /> : <CloseOutlined />}
                  {change.action.toUpperCase()}
                </Tag>
                <Text>{change.name}</Text>
              </div>
            ))}
          </div>
        </div>
      ),
      onOk: async () => {
        await savePermissionChanges();
      }
    });
  };

  const savePermissionChanges = async () => {
    try {
      setSaving(true);
      
      // Group changes by action
      const addPermissions = [];
      const removePermissions = [];
      
      Object.values(permissionChanges).forEach(change => {
        if (change.action === 'add') {
          addPermissions.push(change.codename);
        } else {
          removePermissions.push(change.codename);
        }
      });

      // Apply add operations
      if (addPermissions.length > 0) {
        await apiService.configureRolePermissions(selectedRole, addPermissions, 'add');
      }

      // Apply remove operations
      if (removePermissions.length > 0) {
        await apiService.configureRolePermissions(selectedRole, removePermissions, 'remove');
      }

      message.success('Permissions updated successfully!');
      
      // Reload current permissions and clear changes
      await loadRolePermissions(selectedRole);
      setPermissionChanges({});
      
    } catch (error) {
      message.error('Failed to save permission changes');
      console.error('Error saving permissions:', error);
    } finally {
      setSaving(false);
    }
  };

  const resetChanges = () => {
    setPermissionChanges({});
    message.info('Changes reset');
  };

  const renderPermissionGroup = (appLabel, appData) => {
    const currentAppPermissions = currentPermissions[appLabel] || [];
    
    return (
      <Card 
        key={appLabel}
        title={
          <Space>
            <SettingOutlined />
            <Text strong>{appLabel.charAt(0).toUpperCase() + appLabel.slice(1)}</Text>
            <Tag>{appData.permissions.length} permissions</Tag>
          </Space>
        }
        size="small"
        style={{ marginBottom: 16 }}
      >
        <Row gutter={[16, 8]}>
          {appData.permissions.map(permission => {
            const isCurrentlyEnabled = currentAppPermissions.some(
              p => p.codename === permission.codename
            );
            const changeKey = `${appLabel}.${permission.codename}`;
            const hasChange = permissionChanges[changeKey];
            const finalState = hasChange ? 
              (permissionChanges[changeKey].action === 'add') : 
              isCurrentlyEnabled;

            return (
              <Col span={12} key={permission.codename}>
                <div style={{ 
                  padding: 8,
                  border: hasChange ? '2px solid #1890ff' : '1px solid #d9d9d9',
                  borderRadius: 4,
                  backgroundColor: hasChange ? '#f0f8ff' : 'transparent'
                }}>
                  <Checkbox
                    checked={finalState}
                    onChange={(e) => handlePermissionChange(
                      appLabel, 
                      permission.codename, 
                      e.target.checked
                    )}
                  >
                    <div>
                      <Text strong style={{ fontSize: 12 }}>
                        {permission.codename}
                      </Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        {permission.name}
                      </Text>
                    </div>
                  </Checkbox>
                  {hasChange && (
                    <Tag 
                      size="small" 
                      color={hasChange.action === 'add' ? 'green' : 'red'}
                      style={{ marginTop: 4 }}
                    >
                      {hasChange.action.toUpperCase()}
                    </Tag>
                  )}
                </div>
              </Col>
            );
          })}
        </Row>
      </Card>
    );
  };

  const hasChanges = Object.keys(permissionChanges).length > 0;

  return (
    <div style={{ padding: 24 }}>
      <Title level={3}>
        <SettingOutlined /> Dynamic Permission Configuration
      </Title>
      
      <Alert
        message="Real-time Permission Management"
        description="Configure role permissions dynamically. Changes will take effect immediately for all users with the selected role."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Card>
        <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <Text strong>Select Role:</Text>
            <Select
              style={{ width: 200 }}
              placeholder="Choose a role"
              value={selectedRole}
              onChange={setSelectedRole}
              loading={loading}
            >
              {Array.isArray(roles) ? roles.map(role => (
                <Option key={role.id} value={role.id}>
                  {role.name}
                </Option>
              )) : []}
            </Select>
            
            <Button 
              icon={<ReloadOutlined />} 
              onClick={() => selectedRole && loadRolePermissions(selectedRole)}
              loading={loading}
            >
              Refresh
            </Button>
          </Space>

          {hasChanges && (
            <Space>
              <Text type="warning">
                {Object.keys(permissionChanges).length} pending changes
              </Text>
              <Button onClick={resetChanges}>
                Reset
              </Button>
              <Button 
                type="primary" 
                icon={<SaveOutlined />}
                onClick={applyPermissionChanges}
                loading={saving}
              >
                Apply Changes
              </Button>
            </Space>
          )}
        </Space>

        <Divider />

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>
              <Text>Loading permissions...</Text>
            </div>
          </div>
        ) : selectedRole ? (
          <div>
            {availablePermissions && typeof availablePermissions === 'object' 
              ? Object.keys(availablePermissions).map(appLabel => 
                  renderPermissionGroup(appLabel, availablePermissions[appLabel])
                )
              : (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <Text type="secondary">No permissions available</Text>
                </div>
              )
            }
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Text type="secondary">Please select a role to configure permissions</Text>
          </div>
        )}
      </Card>
    </div>
  );
};

export default PermissionConfigPanel;