/**
 * Color Palette System
 * Centralized color definitions for the application
 */

export const colors = {
  // Primary Colors
  primary: {
    50: '#e6f7ff',
    100: '#bae7ff',
    200: '#91d5ff',
    300: '#69c0ff',
    400: '#40a9ff',
    500: '#1890ff', // Main primary
    600: '#096dd9',
    700: '#0050b3',
    800: '#003a8c',
    900: '#002766',
  },
  
  // Success Colors
  success: {
    50: '#f6ffed',
    100: '#d9f7be',
    200: '#b7eb8f',
    300: '#95de64',
    400: '#73d13d',
    500: '#52c41a', // Main success
    600: '#389e0d',
    700: '#237804',
    800: '#135200',
    900: '#092b00',
  },
  
  // Warning Colors
  warning: {
    50: '#fffbe6',
    100: '#fff1b8',
    200: '#ffe58f',
    300: '#ffd666',
    400: '#ffc53d',
    500: '#faad14', // Main warning
    600: '#d48806',
    700: '#ad6800',
    800: '#874d00',
    900: '#613400',
  },
  
  // Error Colors
  error: {
    50: '#fff1f0',
    100: '#ffccc7',
    200: '#ffa39e',
    300: '#ff7875',
    400: '#ff4d4f', // Main error
    500: '#ff4d4f',
    600: '#cf1322',
    700: '#a8071a',
    800: '#820014',
    900: '#5c0011',
  },
  
  // Info Colors
  info: {
    50: '#e6f7ff',
    100: '#bae7ff',
    200: '#91d5ff',
    300: '#69c0ff',
    400: '#40a9ff',
    500: '#1890ff', // Main info
    600: '#096dd9',
    700: '#0050b3',
    800: '#003a8c',
    900: '#002766',
  },
  
  // Neutral Colors (Gray Scale)
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#f0f0f0',
    300: '#d9d9d9',
    400: '#bfbfbf',
    500: '#8c8c8c',
    600: '#595959',
    700: '#434343',
    800: '#262626',
    900: '#1f1f1f',
    950: '#141414',
  },
  
  // Text Colors
  text: {
    primary: '#262626',
    secondary: '#8c8c8c',
    tertiary: '#bfbfbf',
    quaternary: '#d9d9d9',
    disabled: '#bfbfbf',
    inverse: '#ffffff',
  },
  
  // Background Colors
  background: {
    base: '#ffffff',
    container: '#ffffff',
    elevated: '#ffffff',
    layout: '#f0f2f5',
    spotlight: '#fafafa',
    mask: 'rgba(0, 0, 0, 0.45)',
  },
  
  // Border Colors
  border: {
    base: '#d9d9d9',
    secondary: '#f0f0f0',
    light: '#fafafa',
  },
  
  // Functional Colors
  functional: {
    link: '#1890ff',
    linkHover: '#40a9ff',
    linkActive: '#096dd9',
    linkVisited: '#531dab',
  },
  
  // Chart Colors (for analytics)
  chart: {
    blue: '#1890ff',
    green: '#52c41a',
    cyan: '#13c2c2',
    purple: '#722ed1',
    magenta: '#eb2f96',
    red: '#ff4d4f',
    orange: '#fa8c16',
    yellow: '#fadb14',
    volcano: '#fa541c',
    geekblue: '#2f54eb',
    lime: '#a0d911',
    gold: '#faad14',
  },
  
  // Status Colors
  status: {
    processing: '#1890ff',
    success: '#52c41a',
    error: '#ff4d4f',
    warning: '#faad14',
    default: '#d9d9d9',
  },
  
  // Semantic Colors (for specific use cases)
  semantic: {
    // Dashboard
    dashboardBg: '#f0f2f5',
    cardBg: '#ffffff',
    cardBorder: '#f0f0f0',
    
    // Sidebar
    sidebarBg: '#001529',
    sidebarText: 'rgba(255, 255, 255, 0.65)',
    sidebarTextActive: '#ffffff',
    sidebarItemHover: 'rgba(255, 255, 255, 0.08)',
    sidebarItemActive: '#1890ff',
    
    // Header
    headerBg: '#ffffff',
    headerBorder: '#f0f0f0',
    headerText: '#262626',
    
    // Footer
    footerBg: '#fafafa',
    footerText: '#8c8c8c',
    
    // Table
    tableHeaderBg: '#fafafa',
    tableRowHover: '#fafafa',
    tableBorder: '#f0f0f0',
    
    // Form
    inputBg: '#ffffff',
    inputBorder: '#d9d9d9',
    inputBorderHover: '#40a9ff',
    inputBorderFocus: '#1890ff',
  },
} as const;

// Export individual color groups for convenience
export const {
  primary,
  success,
  warning,
  error,
  info,
  neutral,
  text,
  background,
  border,
  functional,
  chart,
  status,
  semantic,
} = colors;

// Type for color palette
export type ColorPalette = typeof colors;
export type PrimaryColor = keyof typeof colors.primary;
export type SuccessColor = keyof typeof colors.success;
export type WarningColor = keyof typeof colors.warning;
export type ErrorColor = keyof typeof colors.error;
export type NeutralColor = keyof typeof colors.neutral;
export type ChartColor = keyof typeof colors.chart;

export default colors;
