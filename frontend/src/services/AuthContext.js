import React, { createContext, useContext, useState } from 'react';

// Create authentication context
const AuthContext = createContext();

// AuthProvider component: provides authentication state management for the entire app
export const AuthProvider = ({ children, value }) => {
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom Hook: convenient for components to get authentication state
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default AuthContext; 