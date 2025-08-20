// Token management service
// responsible for storing and managing user authentication tokens

const TOKEN_KEY = 'stock_analysis_token';

export const tokenService = {
  // get stored token
  getToken: () => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch (error) {
      console.error('get token failed:', error);
      return null;
    }
  },

  // store token
  setToken: (token) => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
      return true;
    } catch (error) {
      console.error('store token failed:', error);
      return false;
    }
  },

  // remove token
  removeToken: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      return true;
    } catch (error) {
      console.error('remove token failed:', error);
      return false;
    }
  },

  // check if token exists
  hasToken: () => {
    return !!tokenService.getToken();
  }
}; 