/**
 * Theme Configuration for goma-connect
 * Ensures consistent UI/UX across all pages and components
 */

export const themeConfig = {
  colors: {
    // Primary gradient (used for buttons, CTAs)
    primary: {
      light: '#FF6B35',
      main: '#FF5722',
      dark: '#E64A19',
      gradient: 'linear-gradient(135deg, #FF6B35 0%, #FF5722 100%)',
    },
    
    // Secondary colors
    secondary: {
      light: '#4ECDC4',
      main: '#45B7AA',
      dark: '#3A9B8F',
    },

    // Status colors
    status: {
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6',
    },

    // Neutral colors
    neutral: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827',
    },

    // Background
    background: '#FFFFFF',
    surface: '#F9FAFB',
    border: '#E5E7EB',
  },

  typography: {
    fontFamily: {
      display: '"Poppins", sans-serif',
      body: '"Inter", sans-serif',
      mono: '"Fira Code", monospace',
    },
    
    sizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
    },

    weights: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
  },

  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
  },

  borderRadius: {
    none: '0',
    sm: '0.25rem',
    base: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.5rem',
    full: '9999px',
  },

  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },

  transitions: {
    fast: '150ms ease-in-out',
    base: '200ms ease-in-out',
    slow: '300ms ease-in-out',
  },

  breakpoints: {
    xs: '320px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
};

// CSS variables for Tailwind integration
export const generateCSSVariables = () => {
  return `
    :root {
      --color-primary-light: ${themeConfig.colors.primary.light};
      --color-primary-main: ${themeConfig.colors.primary.main};
      --color-primary-dark: ${themeConfig.colors.primary.dark};
      
      --color-secondary-light: ${themeConfig.colors.secondary.light};
      --color-secondary-main: ${themeConfig.colors.secondary.main};
      --color-secondary-dark: ${themeConfig.colors.secondary.dark};
      
      --font-display: ${themeConfig.typography.fontFamily.display};
      --font-body: ${themeConfig.typography.fontFamily.body};
      --font-mono: ${themeConfig.typography.fontFamily.mono};
    }
  `;
};
