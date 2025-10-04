// src/utils/theme.ts

export const theme = {
  colors: {
    // Dark mode primary colors
    primary: '#6b5ce7',        // Vibrant purple
    primaryLight: '#8b7ef8',   // Lighter purple
    primaryDark: '#5347c4',    // Deeper purple
    
    accent: '#f5e6d3',         // Warm cream
    accentDark: '#e8d4b8',     // Darker cream
    
    background: '#0a0e1a',     // Very dark blue-black
    backgroundLight: '#141824', // Slightly lighter dark
    surface: '#1a1f2e',        // Dark surface for cards
    surfaceLight: '#242938',   // Lighter surface
    
    text: '#f5f5f7',           // Off-white text
    textLight: '#9ca3af',      // Gray text
    textSecondary: '#6b7280',  // Darker gray
    textOnPrimary: '#ffffff',  // White text on purple
    textOnAccent: '#0a0e1a',   // Dark text on cream
    
    success: '#10b981',        // Green for completions
    info: '#3b82f6',           // Blue for info
    warning: '#f59e0b',        // Amber for streaks
    error: '#ef4444',          // Red for destructive
    
    border: '#2d3748',         // Dark border
    borderLight: '#374151',    // Slightly lighter border
    shadow: 'rgba(0, 0, 0, 0.3)', // Dark shadow
  },
  
  gradients: {
    primary: ['#6b5ce7', '#8b7ef8'],
    accent: ['#f5e6d3', '#e8d4b8'],
    background: ['#0a0e1a', '#141824', '#1a1f2e'],
    purple: ['#5347c4', '#6b5ce7', '#8b7ef8'],
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    display: 40,
  },
  
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  
  shadows: {
    sm: {
      shadowColor: '#1e3a5f',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#1e3a5f',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: '#1e3a5f',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 8,
    },
  },
};