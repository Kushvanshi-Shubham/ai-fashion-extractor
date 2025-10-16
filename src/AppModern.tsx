// Modern App Root with Clean Architecture
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';

// App Configuration
import { AppProviders } from './app/providers/AppProviders';

// Layout
import MainLayout from './shared/components/layout/MainLayout';

// Feature Pages
import { LoginPage, RegisterPage } from './features/auth';
import { ExtractionPage } from './features/extraction';
import { DashboardPage, ProfilePage, LandingPage } from './features/dashboard';
import { AdminPage, HierarchyManagement } from './features/admin';
import { AnalyticsPage } from './features/analytics';

// Shared Components
import { ErrorBoundary } from './shared/components/ErrorBoundary';

// Global Styles
import './styles/App.css';
import './styles/index.css';

// Route Guards
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('authToken');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('authToken');
  const user = localStorage.getItem('user');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  if (user) {
    const userData = JSON.parse(user);
    if (userData.role !== 'ADMIN') {
      return <Navigate to="/dashboard" replace />;
    }
  }
  
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 6,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        },
        components: {
          Button: {
            borderRadius: 6,
            controlHeight: 36,
          },
          Card: {
            borderRadius: 8,
          },
        },
      }}
    >
      <AppProviders>
        <ErrorBoundary>
          <Router>
            <MainLayout>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                
                {/* Protected Routes */}
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/extraction" 
                  element={
                    <ProtectedRoute>
                      <ExtractionPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/analytics" 
                  element={
                    <ProtectedRoute>
                      <AnalyticsPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/profile" 
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Admin Routes */}
                <Route 
                  path="/admin" 
                  element={
                    <AdminRoute>
                      <AdminPage />
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/admin/hierarchy" 
                  element={
                    <AdminRoute>
                      <HierarchyManagement />
                    </AdminRoute>
                  } 
                />
                
                {/* Fallback */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </MainLayout>
          </Router>
        </ErrorBoundary>
      </AppProviders>
    </ConfigProvider>
  );
};

export default App;