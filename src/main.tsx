import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConfigProvider } from 'antd'
import App from './AppModern.tsx'
import { QueryProvider } from './app/providers/QueryProvider'
import { antdTheme } from './theme'
import './styles/index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryProvider>
      <ConfigProvider theme={antdTheme}>
        <App />
      </ConfigProvider>
    </QueryProvider>
  </React.StrictMode>,
)
