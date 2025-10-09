import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import MainLayout from './components/layout/MainLayout';
import { Landing, Login, Register, Dashboard, Admin, Analytics, Profile } from './pages';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import ExtractionPage from './pages/ExtractionPage';

// Import the existing extraction functionality


function App() {
  return (
    <ConfigProvider>
      <ErrorBoundary>
        <Router>
          <MainLayout>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/landing" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected Routes */}
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/extraction" element={<ProtectedRoute><ExtractionPage /></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              
              {/* Admin Routes */}
              <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
              
              {/* Fallback */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </MainLayout>
        </Router>
      </ErrorBoundary>
    </ConfigProvider>
  );
}

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('authToken');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

// Admin Route Component
function AdminRoute({ children }: { children: React.ReactNode }) {
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
}

export default App;