import React, { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Button, Badge, Space, Typography, Breadcrumb } from 'antd';
import {
  HomeOutlined,
  DashboardOutlined,
  FileSearchOutlined,
  BarChartOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  GlobalOutlined,
  ControlOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

const { Header, Sider, Content, Footer } = Layout;
const { Text } = Typography;

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Check if user is authenticated
  const isAuthenticated = !!localStorage.getItem('authToken');
  const userData = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null;
  const isAdmin = userData?.role === 'ADMIN';

  // Handle mobile responsiveness
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setCollapsed(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Navigation menu items
  const getMenuItems = () => {
    const publicItems = [
      {
        key: '/',
        icon: <HomeOutlined />,
        label: 'Home',
      },
    ];

    const privateItems = [
      {
        key: '/dashboard',
        icon: <DashboardOutlined />,
        label: 'Dashboard',
      },
      {
        key: '/extraction',
        icon: <FileSearchOutlined />,
        label: 'AI Extraction',
      },
      {
        key: '/analytics',
        icon: <BarChartOutlined />,
        label: 'Analytics',
      },
    ];

    const adminItems = [
      {
        key: '/admin',
        icon: <ControlOutlined />,
        label: 'Admin Panel',
      },
    ];

    if (!isAuthenticated) return publicItems;
    return [...privateItems, ...(isAdmin ? adminItems : [])];
  };

  // User dropdown menu
  const userMenu = {
    items: [
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: 'Profile',
        onClick: () => navigate('/profile'),
      },
      {
        key: 'divider',
        type: 'divider' as const,
      },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: 'Logout',
        onClick: () => {
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          navigate('/');
        },
      },
    ],
  };

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  // Don't show layout for auth pages
  const isAuthPage = ['/login', '/register'].includes(location.pathname);
  const isLandingPage = location.pathname === '/';

  if (isAuthPage) {
    return <div className="auth-layout">{children}</div>;
  }

  return (
    <Layout className="main-layout" style={{ minHeight: '100vh' }}>
      {isAuthenticated && (
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          breakpoint="lg"
          collapsedWidth={isMobile ? 0 : 80}
          style={{
            background: 'linear-gradient(180deg, #001529 0%, #002140 100%)',
            boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
          }}
        >
          <div 
            className="logo"
            style={{
              height: '64px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              padding: collapsed ? '0' : '0 24px',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              marginBottom: '16px',
            }}
          >
            <GlobalOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
            {!collapsed && (
              <span
                style={{
                  marginLeft: '12px',
                  color: '#fff',
                  fontSize: '18px',
                  fontWeight: 'bold',
                }}
              >
                AI Fashion
              </span>
            )}
          </div>

          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[location.pathname]}
            items={getMenuItems()}
            onClick={handleMenuClick}
          />

          {!collapsed && (
            <div
              style={{
                position: 'absolute',
                bottom: '16px',
                left: '16px',
                right: '16px',
                padding: '12px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '8px',
              }}
            >
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>
                © 2025 AI Fashion Extractor
              </Text>
            </div>
          )}
        </Sider>
      )}

      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {isAuthenticated && (
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                style={{ fontSize: '16px', width: 40, height: 40 }}
              />
            )}

            {!isLandingPage && (
              <Breadcrumb
                items={[
                  { title: 'Home' },
                  { title: location.pathname.slice(1).charAt(0).toUpperCase() + location.pathname.slice(2) },
                ]}
              />
            )}
          </div>

          <Space size="middle">
            {isAuthenticated ? (
              <>
                <Badge count={3} size="small">
                  <Button
                    type="text"
                    icon={<BellOutlined />}
                    shape="circle"
                    size="large"
                  />
                </Badge>

                <Dropdown menu={userMenu} placement="bottomRight" trigger={['click']}>
                  <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Avatar
                      size="large"
                      icon={<UserOutlined />}
                      style={{ background: 'linear-gradient(45deg, #1890ff, #36cfc9)' }}
                    />
                    {!isMobile && (
                      <div>
                        <Text strong>{userData?.name || 'User'}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {userData?.role || 'Member'}
                        </Text>
                      </div>
                    )}
                  </div>
                </Dropdown>
              </>
            ) : (
              <Space>
                <Button onClick={() => navigate('/login')}>Login</Button>
                <Button type="primary" onClick={() => navigate('/register')}>
                  Sign Up
                </Button>
              </Space>
            )}
          </Space>
        </Header>

        <Content
          style={{
            margin: isLandingPage ? 0 : '24px',
            padding: isLandingPage ? 0 : '24px',
            background: isLandingPage ? 'transparent' : '#f0f2f5',
            borderRadius: isLandingPage ? 0 : '8px',
            minHeight: 'calc(100vh - 112px)',
            overflow: 'auto',
          }}
        >
          {children}
        </Content>

        <Footer
          style={{
            textAlign: 'center',
            background: isLandingPage ? 'transparent' : '#001529',
            color: '#fff',
            padding: '24px 50px',
          }}
        >
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <Text style={{ color: isLandingPage ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)' }}>
              © 2025 AI Fashion Extractor. All rights reserved. Built with ❤️ for fashion industry.
            </Text>
          </div>
        </Footer>
      </Layout>
    </Layout>
  );
};

export default MainLayout;