// src/utils/theme.ts

export const theme = {
  colors: {
    primary: '#1e3a5f',        // Deep blue
    primaryLight: '#2d5a8f',   // Lighter blue
    primaryDark: '#0f1f3d',    // Darker blue
    
    accent: '#f4e8d8',         // Cream
    accentDark: '#e8d5ba',     // Darker cream
    
    background: '#faf8f5',     // Off-white/cream background
    surface: '#ffffff',        // Pure white for cards
    
    text: '#1a1a1a',           // Almost black
    textLight: '#6b7280',      // Gray
    textSecondary: '#9ca3af',  // Lighter gray
    textOnPrimary: '#ffffff',  // White text on blue
    
    success: '#10b981',        // Green for completions
    info: '#3b82f6',           // Blue for info
    warning: '#f59e0b',        // Amber for streaks
    error: '#ef4444',          // Red for destructive
    
    border: '#e5e7eb',         // Light gray border
    borderLight: '#f3f4f6',    // Very light gray
    shadow: 'rgba(30, 58, 95, 0.1)', // Blue-tinted shadow
  },
  
  gradients: {
    primary: ['#1e3a5f', '#2d5a8f'],
    accent: ['#f4e8d8', '#e8d5ba'],
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