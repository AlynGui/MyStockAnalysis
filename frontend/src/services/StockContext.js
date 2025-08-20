import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import apiService from './apiService';

// Create stock context
const StockContext = createContext();

// Helper function to format stock data from backend API
const formatStockData = (stockData) => {
  console.log('formatStockData input:', stockData);
  if (!Array.isArray(stockData)) {
    console.error('formatStockData received non-array input:', stockData);
    return [];
  }
  
  const formatted = stockData.map(stock => {
    const formattedStock = {
      symbol: stock.symbol,
      name: stock.name,
      price: stock.latest_price ? parseFloat(stock.latest_price.close_price) : 0,
      change: stock.price_change || 0,
      changePercent: stock.price_change_percent || 0,
      volume: stock.latest_price ? parseInt(stock.latest_price.volume) : 0,
      marketCap: stock.market_cap || 'N/A',
      sector: stock.sector || 'Unknown',
      peRatio: stock.pe_ratio || 0,
      dividendYield: stock.dividend_yield || 0,
      beta: stock.beta || 1.0,
      exchange: stock.exchange || 'N/A',
      industry: stock.industry || 'N/A',
      lastUpdate: stock.latest_price ? stock.latest_price.date : null
    };
    console.log(`Formatted stock ${stock.symbol}:`, formattedStock);
    return formattedStock;
  });
  
  console.log('formatStockData output:', formatted);
  return formatted;
};

// Stock Context Provider
export const StockProvider = ({ children }) => {
  const [allStocks, setAllStocks] = useState([]);
  const [favorites, setFavorites] = useState(new Set());
  const [recentViewed, setRecentViewed] = useState([]);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, loading: authLoading } = useAuth();

  // Monitor allStocks changes
  useEffect(() => {
    console.log('allStocks changed, length:', allStocks.length);
  }, [allStocks]);

  // Initialize stock data
  useEffect(() => {
    console.log('StockProvider mounting, loading stock data...');
    loadStockData();
  }, []);

  // Initialize favorites from localStorage on app start (before authentication)
  useEffect(() => {
    loadFavoritesFromStorage();
  }, []);

  // Load favorites when authentication status changes (only after auth loading is complete)
  useEffect(() => {
    if (!authLoading) {  // Only process when auth loading is complete
      if (isAuthenticated) {
        // Load from API to ensure sync with server
        loadFavorites();
      } else {
        setFavorites(new Set());
        localStorage.removeItem('favoriteStocks');
      }
    }
  }, [isAuthenticated, authLoading]);

  // Ensure favorites are loaded when allStocks becomes available
  useEffect(() => {
    if (allStocks.length > 0 && isAuthenticated && !authLoading) {
      const storedFavorites = localStorage.getItem('favoriteStocks');
      if (storedFavorites && favorites.size === 0) {
        console.log('Syncing favorites after allStocks loaded');
        loadFavoritesFromStorage();
      }
    }
  }, [allStocks.length, isAuthenticated, authLoading, favorites.size]);

  // Load stock data
  const loadStockData = async () => {
    setLoading(true);
    try {
      console.log('Loading stock data from API...');
      // Use API service to get stock data
      const response = await apiService.getStocks();
      console.log('API response:', response);
      
      // Extract results from paginated response
      const stockData = response.data.results || response.data;
      console.log('Stock data extracted:', stockData);
      
      if (Array.isArray(stockData) && stockData.length > 0) {
        const formattedData = formatStockData(stockData);
        console.log('Formatted stock data:', formattedData.length, 'stocks');
        setAllStocks(formattedData);
        console.log('setAllStocks called with', formattedData.length, 'stocks');
      } else {
        console.warn('No stock data received or invalid format');
        setAllStocks([]);
      }
      
      // Load recent viewed from localStorage
      const savedRecentViewed = localStorage.getItem('recentViewedStocks');
      if (savedRecentViewed) {
        setRecentViewed(JSON.parse(savedRecentViewed));
      }
    } catch (error) {
      console.error('Failed to load stock data:', error);
      // Fallback: create basic stock data for testing
      const fallbackStocks = [
        { symbol: 'AAPL', name: 'Apple Inc.', price: 225.50, change: 5.20, changePercent: 2.36, volume: 12583424, sector: 'Technology', exchange: 'NASDAQ' },
        { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 178.30, change: -2.10, changePercent: -1.16, volume: 10542737, sector: 'Technology', exchange: 'NASDAQ' },
        { symbol: 'MSFT', name: 'Microsoft Corporation', price: 465.20, change: 8.90, changePercent: 1.95, volume: 69851464, sector: 'Technology', exchange: 'NASDAQ' },
        { symbol: 'TSLA', name: 'Tesla Inc.', price: 415.80, change: -12.40, changePercent: -2.90, volume: 12831514, sector: 'Automotive', exchange: 'NASDAQ' },
        { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 206.90, change: 3.75, changePercent: 1.85, volume: 96354935, sector: 'E-commerce', exchange: 'NASDAQ' }
      ];
      console.log('Using fallback stock data:', fallbackStocks);
      setAllStocks(fallbackStocks);
    } finally {
      setLoading(false);
    }
  };

  // Load favorites from localStorage
  const loadFavoritesFromStorage = () => {
    try {
      const storedFavorites = localStorage.getItem('favoriteStocks');
      console.log('Loading favorites from localStorage:', storedFavorites);
      if (storedFavorites) {
        const favoritesArray = JSON.parse(storedFavorites);
        console.log('Parsed favorites array:', favoritesArray);
        if (Array.isArray(favoritesArray)) {
          const uniqueFavorites = [...new Set(favoritesArray)]; // Remove duplicates
          console.log('Setting favorites to:', uniqueFavorites);
          setFavorites(new Set(uniqueFavorites));
          return true;
        }
      }
    } catch (error) {
      console.error('Failed to load favorites from localStorage:', error);
    }
    return false;
  };

  // Save favorites to localStorage
  const saveFavoritesToStorage = (favoritesSet) => {
    try {
      const favoritesArray = Array.from(favoritesSet);
      localStorage.setItem('favoriteStocks', JSON.stringify(favoritesArray));
    } catch (error) {
      console.error('Failed to save favorites to localStorage:', error);
    }
  };

  // Load favorites from API
  const loadFavorites = async () => {
    try {
      const favoritesResponse = await apiService.getFavoriteStocks();
      console.log('Favorites API Response:', favoritesResponse);
      
      // Handle both paginated and non-paginated responses
      const favoritesList = favoritesResponse.data.results || favoritesResponse.data;
      
      console.log('Favorites list:', favoritesList);
      
      if (Array.isArray(favoritesList)) {
        const favoriteSymbols = favoritesList.map(fav => fav.stock.symbol);
        const newFavorites = new Set(favoriteSymbols);
        console.log('Setting favorites from API:', Array.from(newFavorites));
        setFavorites(newFavorites);
        saveFavoritesToStorage(newFavorites);
      } else {
        console.error('Unexpected API response format:', favoritesResponse.data);
        throw new Error('Invalid API response format');
      }
    } catch (error) {
      console.error('Failed to load favorites from API:', error);
      // Try to load from localStorage as backup
      const loadedFromStorage = loadFavoritesFromStorage();
      if (!loadedFromStorage) {
        // If both API and localStorage fail, keep current state or set empty
        console.log('Using existing favorites state or empty set');
      }
    }
  };

  // Toggle favorite status
  const toggleFavorite = async (symbol) => {
    const newFavorites = new Set(favorites);
    const isFavorite = newFavorites.has(symbol);
    
    try {
      if (isFavorite) {
        // Remove from favorites
        await apiService.removeFavoriteStock(symbol);
        newFavorites.delete(symbol);
      } else {
        // Add to favorites
        await apiService.addFavoriteStock(symbol);
        newFavorites.add(symbol);
      }
      
      setFavorites(newFavorites);
      saveFavoritesToStorage(newFavorites);
      return !isFavorite;
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      // Return current state if API call fails
      return isFavorite;
    }
  };

  // Add to recent viewed
  const addToRecentViewed = (stock) => {
    const newRecentViewed = recentViewed.filter(item => item.symbol !== stock.symbol);
    newRecentViewed.unshift(stock);
    
    // Keep only the last 10 items
    if (newRecentViewed.length > 10) {
      newRecentViewed.pop();
    }
    
    setRecentViewed(newRecentViewed);
    localStorage.setItem('recentViewedStocks', JSON.stringify(newRecentViewed));
  };

  // Get favorite stocks
  const getFavoriteStocks = useCallback(() => {
    console.log('getFavoriteStocks called - favorites:', Array.from(favorites), 'allStocks length:', allStocks.length);
    
    if (allStocks.length === 0) {
      console.log('allStocks not loaded yet, returning empty array');
      return [];
    }
    
    const favoriteStocks = allStocks.filter(stock => favorites.has(stock.symbol));
    console.log('Filtered favorite stocks:', favoriteStocks.map(s => s.symbol));
    return favoriteStocks;
  }, [favorites, allStocks]);

  // Get recent viewed stocks
  const getRecentViewedStocks = useCallback(() => {
    return recentViewed.slice(0, 5); // Return only the last 5 items
  }, [recentViewed]);

  // Get statistics
  const getStatistics = useCallback(() => {
    const favoriteStocks = allStocks.filter(stock => favorites.has(stock.symbol));
    const recentViewedStocks = recentViewed.slice(0, 5);
    
    return {
      totalStocks: allStocks.length,
      favoriteCount: favoriteStocks.length,
      recentViewedCount: recentViewedStocks.length,
      gainers: allStocks.filter(stock => stock.change > 0).length,
      losers: allStocks.filter(stock => stock.change < 0).length,
      totalValue: favoriteStocks.reduce((sum, stock) => sum + stock.price, 0),
      totalVolume: allStocks.reduce((sum, stock) => sum + stock.volume, 0)
    };
  }, [favorites, allStocks, recentViewed]);

  // Search stocks
  const searchStocks = useCallback((searchTerm) => {
    if (!searchTerm) {
      return allStocks;
    }
    
    const term = searchTerm.toLowerCase();
    return allStocks.filter(stock => 
      stock.symbol.toLowerCase().includes(term) ||
      stock.name.toLowerCase().includes(term) ||
      stock.sector.toLowerCase().includes(term)
    );
  }, [allStocks]);

  // Refresh favorites data
  const refreshFavorites = useCallback(async () => {
    if (isAuthenticated) {
      // Load from localStorage first for immediate UI update
      loadFavoritesFromStorage();
      // Then sync with API
      await loadFavorites();
    }
  }, [isAuthenticated]);

  // Get loading state info
  const getLoadingState = useCallback(() => {
    const state = {
      stocksLoaded: allStocks.length > 0,
      favoritesLoaded: favorites.size > 0 || !isAuthenticated,
      allDataLoaded: allStocks.length > 0 && (!isAuthenticated || !authLoading),
      isLoading: loading || authLoading
    };
    console.log('getLoadingState called:', {
      ...state,
      allStocksLength: allStocks.length,
      favoritesSize: favorites.size,
      isAuthenticated,
      authLoading,
      loading
    });
    return state;
  }, [allStocks.length, favorites.size, isAuthenticated, authLoading, loading]);

  // Context value
  const value = {
    allStocks,
    favorites,
    recentViewed,
    loading,
    toggleFavorite,
    addToRecentViewed,
    getFavoriteStocks,
    getRecentViewedStocks,
    getStatistics,
    searchStocks,
    loadStockData,
    refreshFavorites,
    getLoadingState
  };

  return (
    <StockContext.Provider value={value}>
      {children}
    </StockContext.Provider>
  );
};

// Custom hook to use stock context
export const useStocks = () => {
  const context = useContext(StockContext);
  if (!context) {
    throw new Error('useStocks must be used within a StockProvider');
  }
  return context;
}; 