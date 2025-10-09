import { useEffect, useState } from 'react';
import { Layout } from 'antd';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import ModernAppHeader from './ModernAppHeader';
import { BackendApiService } from '../../services/api/backendApi';

const { Content } = Layout;
const api = new BackendApiService();

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [user, setUser] = useState<{ id: string; email: string; role: string } | null>(null);
  const [, setLoading] = useState(true);
  // loading state is used for future enhancement - keeping for consistency
  const location = useLocation();

  // Pages that don't need authentication or layout
  const publicPages = ['/login', '/register', '/landing', '/'];
  const isPublicPage = publicPages.includes(location.pathname);

  useEffect(() => {
    if (!isPublicPage) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, [isPublicPage]);

  const loadUser = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setLoading(false);
        return;
      }

      const userData = await api.getMe();
      setUser(userData);
    } catch (error) {
      console.error('Failed to load user:', error);
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  };

  // For public pages, don't show sidebar/header
  if (isPublicPage) {
    return <>{children}</>;
  }

  // For authenticated pages, show full layout
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar userRole={user?.role} />
      <Layout>
        <ModernAppHeader 
          user={user} 
          onLogout={() => setUser(null)}
        />
        <Content style={{ 
          margin: 0,
          background: '#f5f5f5',
          minHeight: 'calc(100vh - 64px)'
        }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}