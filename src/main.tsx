import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConfigProvider } from 'antd'
import App from './AppModern.tsx'
import { QueryProvider } from './app/providers/QueryProvider'
import './styles/index.css'

// Ant Design theme configuration
const theme = {
  token: {
    colorPrimary: '#667eea',
    borderRadius: 6,
    wireframe: false,
  },
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryProvider>
      <ConfigProvider theme={theme}>
        <App />
      </ConfigProvider>
    </QueryProvider>
  </React.StrictMode>,
)
