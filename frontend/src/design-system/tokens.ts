// Design Tokens - Theme configuration for BribeCafe
export const theme = {
  colors: {
    // Primary palette
    primary: {
      50: '#fef7ee',
      100: '#fde9d4',
      200: '#fad3a9',
      300: '#f6b57a',
      400: '#f19043',
      500: '#e97318', // Main brand color
      600: '#d45b0f',
      700: '#b1440e',
      800: '#8f3711',
      900: '#742c10',
    },
    // Neutral palette
    neutral: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
    },
    // Semantic colors
    success: {
      light: '#dcfce7',
      main: '#22c55e',
      dark: '#166534',
    },
    warning: {
      light: '#fef9c3',
      main: '#eab308',
      dark: '#854d0e',
    },
    error: {
      light: '#fee2e2',
      main: '#ef4444',
      dark: '#991b1b',
    },
    info: {
      light: '#dbeafe',
      main: '#3b82f6',
      dark: '#1e40af',
    },
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },
  typography: {
    fontFamily: {
      sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
    },
    fontSize: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '30px',
      '4xl': '36px',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  transitions: {
    fast: '150ms ease',
    normal: '250ms ease',
    slow: '350ms ease',
  },
} as const;

export type Theme = typeof theme;
