import config from '../config/api';
import { tokenService } from './tokenService';

// Base API service class
class ApiService {
  constructor() {
    this.baseURL = config.API_BASE_URL;
    this.timeout = config.TIMEOUT;
  }

  // Helper method to build full URL
  buildURL(endpoint, params = {}) {
    let url = `${this.baseURL}${endpoint}`;
    
    // Replace path parameters
    Object.keys(params).forEach(key => {
      url = url.replace(`{${key}}`, params[key]);
    });
    
    return url;
  }

  // Helper method to get headers with authentication
  getHeaders(includeAuth = true, customHeaders = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...customHeaders
    };

    if (includeAuth) {
      const token = tokenService.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const {
      method = 'GET',
      data = null,
      includeAuth = true,
      customHeaders = {},
      pathParams = {}
    } = options;

    const url = this.buildURL(endpoint, pathParams);
    const headers = this.getHeaders(includeAuth, customHeaders);

    const requestOptions = {
      method,
      headers,
      ...(data && { body: JSON.stringify(data) })
    };

    if (config.DEBUG) {
      console.log(`API Request: ${method} ${url}`, requestOptions);
    }

    try {
      const response = await fetch(url, requestOptions);
      
      if (config.DEBUG) {
        console.log(`API Response: ${response.status}`, response);
      }

      // Handle different response types
      const contentType = response.headers.get('content-type');
      let responseData;
      
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      if (!response.ok) {
        // Handle Django REST Framework validation errors
        if (response.status === 400 && typeof responseData === 'object' && responseData !== null) {
          // Create a user-friendly error message for validation errors
          const errorMessages = [];
          for (const [field, messages] of Object.entries(responseData)) {
            if (Array.isArray(messages)) {
              errorMessages.push(`${field}: ${messages[0]}`);
            } else {
              errorMessages.push(`${field}: ${messages}`);
            }
          }
          const error = new Error(errorMessages.join(', '));
          error.validationErrors = responseData;
          throw error;
        }
        
        throw new Error(responseData.message || responseData.error || `HTTP error! status: ${response.status}`);
      }

      return { data: responseData, status: response.status, ok: response.ok };
    } catch (error) {
      if (config.DEBUG) {
        console.error('API Error:', error);
      }
      throw error;
    }
  }

  // User Authentication APIs
  async login(credentials) {
    return this.request(config.ENDPOINTS.USER_LOGIN, {
      method: 'POST',
      data: credentials,
      includeAuth: false
    });
  }

  async register(userData) {
    return this.request(config.ENDPOINTS.USER_REGISTER, {
      method: 'POST',
      data: userData,
      includeAuth: false
    });
  }

  async getUserInfo() {
    return this.request(config.ENDPOINTS.USER_INFO);
  }

  async getUserPermissions() {
    return this.request(config.ENDPOINTS.USER_PERMISSIONS);
  }

  async getUserProfile() {
    return this.request(config.ENDPOINTS.USER_PROFILE);
  }

  async updateUserProfile(profileData) {
    return this.request(config.ENDPOINTS.USER_PROFILE, {
      method: 'PUT',
      data: profileData
    });
  }

  async changePassword(passwordData) {
    return this.request(config.ENDPOINTS.USER_CHANGE_PASSWORD, {
      method: 'POST',
      data: passwordData
    });
  }

  async forgotPassword(email) {
    return this.request(config.ENDPOINTS.USER_FORGOT_PASSWORD, {
      method: 'POST',
      data: { email },
      includeAuth: false  // No auth needed for forgot password
    });
  }

  async directPasswordReset(resetData) {
    return this.request(config.ENDPOINTS.USER_DIRECT_PASSWORD_RESET, {
      method: 'POST',
      data: resetData,
      includeAuth: false  // No auth needed for direct password reset
    });
  }

  async getUserList() {
    return this.request(config.ENDPOINTS.USER_LIST);
  }

  // Stock APIs
  async getStocks() {
    return this.request(config.ENDPOINTS.STOCKS_LIST, {
      includeAuth: false  // Stock list is public, no auth required
    });
  }

  async getStockDetail(symbol) {
    return this.request(`${config.ENDPOINTS.STOCK_DETAIL}/${symbol}/`);
  }

  async getFavoriteStocks() {
    return this.request(config.ENDPOINTS.FAVORITE_LIST);
  }

  async addFavoriteStock(symbol) {
    return this.request(config.ENDPOINTS.FAVORITE_ADD, {
      method: 'POST',
      data: { symbol }
    });
  }

  async removeFavoriteStock(symbol) {
    return this.request(config.ENDPOINTS.FAVORITE_REMOVE, {
      method: 'POST',
      data: { symbol }
    });
  }

  async getStockPrices(symbol) {
    return this.request(`${config.ENDPOINTS.STOCK_PRICES}/${symbol}/prices/`);
  }

  async getStockTechnical(symbol) {
    return this.request(`${config.ENDPOINTS.STOCK_TECHNICAL}/${symbol}/technical/`);
  }

  async getImportLogs() {
    return this.request(config.ENDPOINTS.STOCK_IMPORT_LOGS);
  }

  // Favorites APIs
  async addFavorite(stockData) {
    return this.request(config.ENDPOINTS.FAVORITE_ADD, {
      method: 'POST',
      data: stockData
    });
  }

  async removeFavorite(stockData) {
    return this.request(config.ENDPOINTS.FAVORITE_REMOVE, {
      method: 'POST',
      data: stockData
    });
  }

  async getFavorites() {
    return this.request(config.ENDPOINTS.FAVORITE_LIST);
  }

  // Roles APIs
  async getRoles() {
    return this.request(config.ENDPOINTS.ROLES_LIST);
  }

  async getPermissions() {
    return this.request(config.ENDPOINTS.ROLES_PERMISSIONS);
  }

  async createRole(roleData) {
    return this.request(config.ENDPOINTS.ROLES_CREATE, {
      method: 'POST',
      data: roleData
    });
  }

  async updateRole(roleId, roleData) {
    return this.request(`${config.ENDPOINTS.ROLES_DETAIL}/${roleId}/`, {
      method: 'PUT',
      data: roleData
    });
  }

  async deleteRole(roleId) {
    return this.request(`${config.ENDPOINTS.ROLES_DETAIL}/${roleId}/`, {
      method: 'DELETE'
    });
  }

  // ===== Dynamic Permission Configuration APIs =====
  
  async configureRolePermissions(roleId, permissions, action = 'set') {
    return this.request(config.ENDPOINTS.CONFIGURE_ROLE_PERMISSIONS, {
      method: 'POST',
      data: {
        role_id: roleId,
        permissions: permissions,
        action: action
      }
    });
  }

  async getRolePermissionsDetailed(roleId) {
    return this.request(`${config.ENDPOINTS.ROLE_PERMISSIONS_DETAILED}/${roleId}/permissions/detailed/`);
  }

  async getAvailablePermissions() {
    return this.request(config.ENDPOINTS.AVAILABLE_PERMISSIONS);
  }

  async batchUpdatePermissions(updates) {
    return this.request(config.ENDPOINTS.BATCH_UPDATE_PERMISSIONS, {
      method: 'POST',
      data: { updates: updates }
    });
  }

  async checkPermissionChanges() {
    return this.request(config.ENDPOINTS.CHECK_PERMISSION_CHANGES);
  }

  // ML Models APIs
  async getMLModels() {
    return this.request(config.ENDPOINTS.ML_MODELS);
  }

  async predictStock(predictionData) {
    return this.request(config.ENDPOINTS.ML_PREDICT, {
      method: 'POST',
      data: predictionData
    });
  }

  async trainModel(trainingData) {
    return this.request(config.ENDPOINTS.ML_TRAIN, {
      method: 'POST',
      data: trainingData
    });
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService; 