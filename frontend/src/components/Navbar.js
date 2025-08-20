import React from 'react';
import { Menu, Button, Avatar, Dropdown, message } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  DashboardOutlined, 
  StockOutlined, 
  UserOutlined, 
  SettingOutlined,
  LogoutOutlined,
  HeartOutlined,
  DatabaseOutlined,
  RocketOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useAuth } from '../services/AuthContext';

// Navigation bar component
const Navbar = ({ onLogout, user, userPermissions }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshPermissions } = useAuth();

  // Handle permission refresh
  const handleRefreshPermissions = async () => {
    message.loading('Refreshing permissions...', 0);
    const success = await refreshPermissions();
    message.destroy();
    
    if (success) {
      message.success('Permissions refreshed successfully!');
      // Force re-render of all components that depend on permissions
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      message.error('Failed to refresh permissions');
    }
  };

  // Helper function to check if user has specific permission
  const hasPermission = (permissionCodename) => {
    if (!userPermissions?.permissions) return false;
    return userPermissions.permissions.some(perm => 
      perm.codename === permissionCodename ||
      perm.codename.includes(permissionCodename)
    );
  };

  // Helper function to check menu permissions using new system
  const hasMenuPermission = (menuName) => {
    if (!userPermissions?.menu_permissions) return false;
    return userPermissions.menu_permissions[menuName] === true;
  };

  // Helper function to check prediction model permissions
  const hasPredictionPermission = () => {
    // First check new menu permissions system
    if (userPermissions?.menu_permissions?.predictions) {
      return true;
    }
    
    // Fallback to old permission check
    const hasAdmin = userPermissions?.has_admin_access;
    const hasAnalystRole = userPermissions?.roles?.includes('analyst');
    const hasAddPerm = hasPermission('add_stockprediction');
    const hasViewPerm = hasPermission('view_stockprediction');
    const hasChangePerm = hasPermission('change_stockprediction');
    
    // 只有管理员、分析师或有具体权限的用户才能访问预测功能
    return hasAdmin || hasAnalystRole || hasAddPerm || hasViewPerm || hasChangePerm;
  };

  // User dropdown menu items
  const userMenuItems = [
    {
      key: 'profile',
      label: 'Profile',
      icon: <UserOutlined />,
      onClick: () => navigate('/profile')
    },
    // Only show Admin Panel if user has admin access
    ...(userPermissions?.has_admin_access ? [{
      key: 'admin',
      label: 'Admin Panel',
      icon: <SettingOutlined />,
      onClick: () => navigate('/admin')
    }] : []),
    {
      key: 'refresh-permissions',
      label: 'Refresh Permissions',
      icon: <ReloadOutlined />,
      onClick: handleRefreshPermissions
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      label: 'Logout',
      icon: <LogoutOutlined />,
      onClick: onLogout
    }
  ];

  // Main navigation menu items using new menu permissions system
  const menuItems = [
    // Dashboard - always available for authenticated users
    {
      key: '/dashboard',
      label: 'Dashboard',
      icon: <DashboardOutlined />
    },
    // Stock List - check menu permissions
    ...(hasMenuPermission('stocks') || userPermissions?.has_admin_access ? [{
      key: '/stocks',
      label: 'Stock List',
      icon: <StockOutlined />
    }] : []),
    // My Favorites - check menu permissions
    ...(hasMenuPermission('favorites') || userPermissions?.has_admin_access ? [{
      key: '/favorites',
      label: 'My Favorites',
      icon: <HeartOutlined />
    }] : []),
    // RNN Prediction - check menu permissions or prediction permissions
    ...(hasMenuPermission('predictions') || hasPredictionPermission() ? [{
      key: '/rnn-prediction',
      label: 'RNN Price Prediction',
      icon: <RocketOutlined />
    }] : []),
    // Data Import Details - admin only
    ...(userPermissions?.has_admin_access ? [{
      key: '/data-details',
      label: 'Import Data Details',
      icon: <DatabaseOutlined />
    }] : [])
  ];

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  return (
    <div className="navbar">
      <div className="navbar-brand">
        <h2>Stock Analysis Platform</h2>
      </div>
      
      <Menu
        theme="dark"
        mode="horizontal"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={handleMenuClick}
        className="navbar-menu"
      />
      
      <div className="navbar-user">
        <Dropdown
          menu={{ items: userMenuItems }}
          placement="bottomRight"
          trigger={['click']}
        >
          <Button type="text" className="user-button">
            <Avatar icon={<UserOutlined />} />
            <span className="username">
              {user?.username || 'User'}
            </span>
          </Button>
        </Dropdown>
      </div>
    </div>
  );
};

export default Navbar; 