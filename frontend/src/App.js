import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout, message } from 'antd';
import { AuthProvider } from './services/AuthContext';
import { StockProvider } from './services/StockContext';
import { tokenService } from './services/tokenService';
import apiService from './services/apiService';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import StockList from './pages/StockList';
import StockDetail from './pages/StockDetail';
import Profile from './pages/Profile';
import AdminPanel from './pages/AdminPanel';
import MyFavorites from './pages/MyFavorites';
import StockDataDetails from './pages/StockDataDetails';
import RNNPrediction from './pages/RNNPrediction';
import './styles/App.css';

const { Header, Content } = Layout;

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userPermissions, setUserPermissions] = useState(null);

  // Helper function to check if user has specific permission
  const hasPermission = (permissionCodename) => {
    if (!userPermissions?.permissions) return false;
    return userPermissions.permissions.some(perm => 
      perm.codename === permissionCodename ||
      perm.codename.includes(permissionCodename)
    );
  };

  // Helper function to check prediction model permissions
  const hasPredictionPermission = () => {
    return userPermissions?.has_admin_access || 
           userPermissions?.roles?.includes('analyst') ||
           hasPermission('add_stockprediction') ||
           hasPermission('view_stockprediction') ||
           hasPermission('change_stockprediction');
  };

  // Protected Route Component
  const ProtectedRoute = ({ element, permissionCheck }) => {
    if (!permissionCheck || permissionCheck()) {
      return element;
    }
    return <Navigate to="/dashboard" replace />;
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = tokenService.getToken();
      if (token) {
              // Use API service to validate token and get user information
      const [userResponse, permissionsResponse] = await Promise.all([
        apiService.getUserInfo(),
        apiService.getUserPermissions()
      ]);
      
      setIsAuthenticated(true);
      setUser(userResponse.data);
      setUserPermissions(permissionsResponse.data);
    } else {
      // No token, user is not authenticated
        setIsAuthenticated(false);
        setUser(null);
        setUserPermissions(null);
      }
    } catch (error) {
      console.error('❌ Authentication check failed:', error);
      tokenService.removeToken();
      setIsAuthenticated(false);
      setUser(null);
      setUserPermissions(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
    
    // Force fresh permissions load from database after login
    try {
      const permissionsResponse = await apiService.getUserPermissions();
      setUserPermissions(permissionsResponse.data);
    } catch (error) {
      console.error('Failed to fetch user permissions on login:', error);
    }
    
    message.success('Login successful!');
  };

  const handleLogout = () => {
    tokenService.removeToken();
    setIsAuthenticated(false);
    setUser(null);
    setUserPermissions(null);
    message.success('Logout successful!');
  };

  // Refresh user permissions without full re-authentication
  const refreshPermissions = async () => {
    try {
      if (isAuthenticated) {
        const permissionsResponse = await apiService.getUserPermissions();
        setUserPermissions(permissionsResponse.data);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to refresh permissions:', error);
      return false;
    }
  };

  // Check for permission changes periodically
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkPermissionChanges = async () => {
      try {
        const response = await apiService.checkPermissionChanges();
        
        if (response.data.has_changes) {
          // Show notification if available
          if (response.data.notification) {
            message.info(response.data.notification.message);
          } else {
            message.info('Your permissions have been updated');
          }
          
          await refreshPermissions();
        }
      } catch (error) {
        console.error('Failed to check permission changes:', error);
      }
    };

    // Initial check immediately
    checkPermissionChanges();

          // Check every 5 seconds for faster testing (can be changed back to 30)
      const interval = setInterval(checkPermissionChanges, 5000);
      
      return () => {
        clearInterval(interval);
      };
  }, [isAuthenticated, refreshPermissions]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <AuthProvider value={{ 
      isAuthenticated, 
      user, 
      userPermissions,
      loading, 
      authLoading: loading, 
      login: handleLogin, 
      logout: handleLogout,
      hasPermission,
      hasPredictionPermission,
      refreshPermissions
    }}>
      <StockProvider>
        <Layout className="app-layout">
          {isAuthenticated && (
            <Header className="app-header">
              <Navbar onLogout={handleLogout} user={user} userPermissions={userPermissions} />
            </Header>
          )}
          <Content className="app-content">
            <Routes>
              {/* Default route - redirect to login page */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              
              {/* Public routes */}
              <Route 
                path="/login" 
                element={
                  !isAuthenticated ? (
                    <Login onLogin={handleLogin} />
                  ) : (
                    <Navigate to="/dashboard" replace />
                  )
                } 
              />
              <Route 
                path="/register" 
                element={
                  !isAuthenticated ? (
                    <Register />
                  ) : (
                    <Navigate to="/dashboard" replace />
                  )
                } 
              />
              <Route 
                path="/forgot-password" 
                element={
                  !isAuthenticated ? (
                    <ForgotPassword />
                  ) : (
                    <Navigate to="/dashboard" replace />
                  )
                } 
              />
              
              {/* Protected routes */}
              {isAuthenticated ? (
                <>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/stocks" element={<StockList />} />
                  <Route path="/stocks/:symbol" element={<StockDetail />} />
                  <Route path="/favorites" element={<MyFavorites />} />
                  <Route path="/rnn-prediction" element={
                    <ProtectedRoute 
                      element={<RNNPrediction />} 
                      permissionCheck={hasPredictionPermission}
                    />
                  } />
                  <Route path="/data-details" element={
                    <ProtectedRoute 
                      element={<StockDataDetails />} 
                      permissionCheck={() => userPermissions?.has_admin_access}
                    />
                  } />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/admin" element={
                    <ProtectedRoute 
                      element={<AdminPanel />} 
                      permissionCheck={() => userPermissions?.has_admin_access}
                    />
                  } />
                </>
              ) : (
                <Route path="*" element={<Navigate to="/login" replace />} />
              )}
            </Routes>
          </Content>
        </Layout>
      </StockProvider>
    </AuthProvider>
  );
}

export default App; 