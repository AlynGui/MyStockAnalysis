import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Alert, Typography, Divider } from 'antd';
import { BugOutlined, ReloadOutlined } from '@ant-design/icons';
import apiService from '../services/apiService';

const { Title, Text, Paragraph } = Typography;

const PermissionDebugPanel = () => {
  const [debugInfo, setDebugInfo] = useState({});
  const [loading, setLoading] = useState(false);

  const runDebugTest = async () => {
    setLoading(true);
    const results = {};

    try {
      // Test 1: Get Roles
      
      const rolesResponse = await apiService.getRoles();
      results.roles = {
        status: 'success',
        data: rolesResponse.data,
        isArray: Array.isArray(rolesResponse.data),
        length: Array.isArray(rolesResponse.data) ? rolesResponse.data.length : 'N/A'
      };
    } catch (error) {
      results.roles = {
        status: 'error',
        error: error.message
      };
    }

    try {
      // Test 2: Get Available Permissions
      
      const permissionsResponse = await apiService.getAvailablePermissions();
      results.permissions = {
        status: 'success',
        data: permissionsResponse.data,
        hasGroupedPermissions: !!permissionsResponse.data.grouped_permissions,
        groupCount: permissionsResponse.data.grouped_permissions 
          ? Object.keys(permissionsResponse.data.grouped_permissions).length 
          : 0
      };
    } catch (error) {
      results.permissions = {
        status: 'error',
        error: error.message
      };
    }

    try {
      // Test 3: Check Permission Changes
      
      const changesResponse = await apiService.checkPermissionChanges();
      results.changes = {
        status: 'success',
        data: changesResponse.data
      };
    } catch (error) {
      results.changes = {
        status: 'error',
        error: error.message
      };
    }

    setDebugInfo(results);
    setLoading(false);
  };

  useEffect(() => {
    runDebugTest();
  }, []);

  const renderResult = (title, result) => {
    if (!result) return null;

    return (
      <Card size="small" title={title} style={{ marginBottom: 16 }}>
        {result.status === 'success' ? (
          <div>
            <Alert 
              type="success" 
              message="API Call Successful" 
              style={{ marginBottom: 8 }}
              showIcon 
            />
            <Paragraph>
              <Text strong>Data Type:</Text> {typeof result.data}<br/>
              {result.isArray !== undefined && (
                <>
                  <Text strong>Is Array:</Text> {result.isArray ? 'Yes' : 'No'}<br/>
                  <Text strong>Length:</Text> {result.length}<br/>
                </>
              )}
              {result.hasGroupedPermissions !== undefined && (
                <>
                  <Text strong>Has Grouped Permissions:</Text> {result.hasGroupedPermissions ? 'Yes' : 'No'}<br/>
                  <Text strong>Group Count:</Text> {result.groupCount}<br/>
                </>
              )}
            </Paragraph>
            <details style={{ marginTop: 8 }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                Show Raw Data
              </summary>
              <pre style={{ 
                background: '#f5f5f5', 
                padding: 8, 
                marginTop: 8, 
                fontSize: '12px',
                maxHeight: '200px',
                overflow: 'auto'
              }}>
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </details>
          </div>
        ) : (
          <Alert 
            type="error" 
            message="API Call Failed" 
            description={result.error}
            showIcon 
          />
        )}
      </Card>
    );
  };

  return (
    <div style={{ padding: 24 }}>
      <Title level={3}>
        <BugOutlined /> Permission Configuration Debug Panel
      </Title>
      
      <Alert
        message="Debug Information"
        description="This panel helps diagnose issues with the permission configuration system."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Space style={{ marginBottom: 16 }}>
        <Button 
          type="primary" 
          icon={<ReloadOutlined />} 
          onClick={runDebugTest}
          loading={loading}
        >
          Run Debug Test
        </Button>
      </Space>

      <Divider />

      {renderResult('Roles API Test', debugInfo.roles)}
      {renderResult('Available Permissions API Test', debugInfo.permissions)}
      {renderResult('Permission Changes API Test', debugInfo.changes)}

      {Object.keys(debugInfo).length > 0 && (
        <Card title="Debug Summary" style={{ marginTop: 16 }}>
          <Alert
            type={
              Object.values(debugInfo).every(r => r.status === 'success') 
                ? 'success' 
                : 'warning'
            }
            message={
              Object.values(debugInfo).every(r => r.status === 'success')
                ? 'All API tests passed! The permission system should work correctly.'
                : 'Some API tests failed. Check the details above to identify issues.'
            }
            showIcon
          />
        </Card>
      )}
    </div>
  );
};

export default PermissionDebugPanel;