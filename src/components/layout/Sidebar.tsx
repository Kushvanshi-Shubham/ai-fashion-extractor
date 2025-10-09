import { useState } from 'react';
import { Menu, Layout } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  UploadOutlined,
  BarChartOutlined,
  SettingOutlined,
  HomeOutlined,
  UserOutlined,
} from '@ant-design/icons';

const { Sider } = Layout;

interface SidebarProps {
  collapsed?: boolean;
  userRole?: string;
}

export default function Sidebar({ collapsed = false, userRole }: SidebarProps) {
  const location = useLocation();
  const [selectedKey, setSelectedKey] = useState(location.pathname);

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: <Link to="/">Home</Link>,
    },
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: <Link to="/dashboard">Dashboard</Link>,
    },
    {
      key: '/extraction',
      icon: <UploadOutlined />,
      label: <Link to="/extraction">Extraction</Link>,
    },
    {
      key: '/uploads',
      icon: <UploadOutlined />,
      label: <Link to="/uploads">Uploads</Link>,
    },
    {
      key: '/analytics',
      icon: <BarChartOutlined />,
      label: <Link to="/analytics">Analytics</Link>,
    },
    ...(userRole === 'ADMIN' ? [{
      key: '/admin',
      icon: <SettingOutlined />,
      label: <Link to="/admin">Admin</Link>,
    }] : []),
    {
      key: '/profile',
      icon: <UserOutlined />,
      label: <Link to="/profile">Profile</Link>,
    },
  ];

  return (
    <Sider trigger={null} collapsible collapsed={collapsed}>
      <div style={{ height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.2)' }} />
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[selectedKey]}
        items={menuItems}
        onClick={({ key }) => setSelectedKey(key)}
      />
    </Sider>
  );
}