// API Configuration
const config = {
  // API Base URL - can be overridden by environment variables
  API_BASE_URL: process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000',
  
  // API Endpoints
  ENDPOINTS: {
    // User authentication
    USER_LOGIN: '/api/users/login/',
    USER_REGISTER: '/api/users/register/',
    USER_LOGOUT: '/api/users/logout/',
    USER_INFO: '/api/users/info/',
    USER_PROFILE: '/api/users/profile/',
    USER_CHANGE_PASSWORD: '/api/users/change-password/',
    USER_FORGOT_PASSWORD: '/api/users/forgot-password/',
    USER_DIRECT_PASSWORD_RESET: '/api/users/direct-password-reset/',
    USER_PERMISSIONS: '/api/users/permissions/',
    USER_LIST: '/api/users/list/',
    
    // Stock data
    STOCKS_LIST: '/api/stocks/',
    STOCK_DETAIL: '/api/stocks',  // append /{symbol}/
    STOCK_PRICES: '/api/stocks',  // append /{symbol}/prices/
    STOCK_TECHNICAL: '/api/stocks', // append /{symbol}/technical/
    STOCK_IMPORT_LOGS: '/api/stocks/import/logs/',
    
    // Favorites
    FAVORITE_ADD: '/api/stocks/favorite/add/',
    FAVORITE_REMOVE: '/api/stocks/favorite/remove/',
    FAVORITE_LIST: '/api/stocks/favorite/list/',
    
    // Roles and permissions
    ROLES_LIST: '/api/roles/',
    ROLES_CREATE: '/api/roles/create/',
    ROLES_DETAIL: '/api/roles', // append /{id}/
    ROLES_PERMISSIONS: '/api/roles/permissions/',
    
    // Dynamic Permission Configuration
    CONFIGURE_ROLE_PERMISSIONS: '/api/roles/configure-permissions/',
    ROLE_PERMISSIONS_DETAILED: '/api/roles', // append /{role_id}/permissions/detailed/
    AVAILABLE_PERMISSIONS: '/api/roles/permissions/available/',
    BATCH_UPDATE_PERMISSIONS: '/api/roles/permissions/batch-update/',
    CHECK_PERMISSION_CHANGES: '/api/roles/permissions/check-changes/',
    
    // ML Models
    ML_MODELS: '/api/ml-models/',
    ML_PREDICT: '/api/ml-models/predict/',
    ML_TRAIN: '/api/ml-models/train/',
  },
  
  // Request timeout in milliseconds
  TIMEOUT: 10000,
  
  // App configuration
  APP_NAME: process.env.REACT_APP_NAME || 'Stock Analysis Platform',
  APP_VERSION: process.env.REACT_APP_VERSION || '1.0.0',
  DEBUG: process.env.REACT_APP_DEBUG === 'true' || process.env.NODE_ENV === 'development',
};

export default config; 