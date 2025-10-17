/**
 * Ant Design Theme Configuration
 * Central theme tokens for the entire application
 */

import type { ThemeConfig } from 'antd';

export const antdTheme: ThemeConfig = {
  token: {
    // Primary Colors
    colorPrimary: '#1890ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#1890ff',
    
    // Text Colors
    colorTextBase: '#262626',
    colorTextSecondary: '#8c8c8c',
    colorTextTertiary: '#bfbfbf',
    colorTextQuaternary: '#d9d9d9',
    
    // Background Colors
    colorBgBase: '#ffffff',
    colorBgContainer: '#ffffff',
    colorBgElevated: '#ffffff',
    colorBgLayout: '#f0f2f5',
    colorBgSpotlight: '#fafafa',
    
    // Border
    colorBorder: '#d9d9d9',
    colorBorderSecondary: '#f0f0f0',
    borderRadius: 6,
    borderRadiusLG: 8,
    borderRadiusSM: 4,
    
    // Typography
    fontSize: 14,
    fontSizeHeading1: 38,
    fontSizeHeading2: 30,
    fontSizeHeading3: 24,
    fontSizeHeading4: 20,
    fontSizeHeading5: 16,
    fontSizeLG: 16,
    fontSizeSM: 12,
    fontSizeXL: 20,
    lineHeight: 1.5715,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
    
    // Spacing
    padding: 16,
    paddingLG: 24,
    paddingMD: 16,
    paddingSM: 12,
    paddingXS: 8,
    paddingXXS: 4,
    margin: 16,
    marginLG: 24,
    marginMD: 16,
    marginSM: 12,
    marginXS: 8,
    marginXXS: 4,
    
    // Control
    controlHeight: 32,
    controlHeightLG: 40,
    controlHeightSM: 24,
    
    // Shadow
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
    boxShadowSecondary: '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
    
    // Z-Index
    zIndexBase: 0,
    zIndexPopupBase: 1000,
  },
  
  components: {
    Layout: {
      siderBg: '#001529',
      triggerBg: '#002140',
      triggerColor: '#fff',
      headerBg: '#ffffff',
      headerHeight: 64,
      headerPadding: '0 24px',
      footerBg: '#fafafa',
      bodyBg: '#f0f2f5',
    },
    
    Menu: {
      darkItemBg: '#001529',
      darkItemSelectedBg: '#1890ff',
      darkItemHoverBg: 'rgba(255, 255, 255, 0.08)',
      itemMarginInline: 4,
      itemBorderRadius: 6,
    },
    
    Button: {
      primaryShadow: '0 2px 0 rgba(0, 0, 0, 0.045)',
      defaultShadow: '0 2px 0 rgba(0, 0, 0, 0.015)',
      dangerShadow: '0 2px 0 rgba(0, 0, 0, 0.045)',
      controlHeight: 32,
      controlHeightLG: 40,
      controlHeightSM: 24,
      paddingContentHorizontal: 15,
    },
    
    Card: {
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
      borderRadius: 8,
      headerHeight: 56,
    },
    
    Table: {
      headerBg: '#fafafa',
      headerColor: '#262626',
      borderColor: '#f0f0f0',
      rowHoverBg: '#fafafa',
      headerSortActiveBg: '#f0f0f0',
      headerFilterHoverBg: '#f0f0f0',
    },
    
    Statistic: {
      titleFontSize: 14,
      contentFontSize: 24,
    },
    
    Typography: {
      titleMarginTop: 0,
      titleMarginBottom: '0.5em',
    },
    
    Input: {
      controlHeight: 32,
      controlHeightLG: 40,
      controlHeightSM: 24,
      paddingBlock: 4,
      paddingInline: 11,
    },
    
    Select: {
      controlHeight: 32,
      controlHeightLG: 40,
      controlHeightSM: 24,
    },
    
    Drawer: {
      zIndexPopup: 1000,
    },
    
    Modal: {
    },
    
    Notification: {
      zIndexPopup: 1010,
    },
    
    Message: {
      zIndexPopup: 1010,
    },
  },
};

export default antdTheme;
