// src/utils/theme.ts

export const theme = {
  colors: {
    // Modern gradient-based primary colors
    primary: '#6366f1',        // Indigo
    primaryLight: '#818cf8',   // Lighter indigo
    primaryDark: '#4f46e5',    // Darker indigo
    primaryGradient: ['#6366f1', '#8b5cf6'], // Indigo to purple gradient
    
    // Accent colors with modern palette
    accent: '#f1f5f9',         // Slate 50
    accentDark: '#e2e8f0',     // Slate 200
    accentGradient: ['#f1f5f9', '#e2e8f0'], // Subtle gradient
    
    // Background with modern neutral tones
    background: '#fafbfc',     // Almost white with subtle blue tint
    backgroundSecondary: '#f8fafc', // Slightly darker background
    surface: '#ffffff',        // Pure white for cards
    surfaceElevated: '#ffffff', // Elevated surfaces
    
    // Text with better contrast
    text: '#0f172a',           // Slate 900 - better contrast
    textSecondary: '#475569',  // Slate 600
    textLight: '#64748b',      // Slate 500
    textOnPrimary: '#ffffff',  // White text on primary
    
    // Status colors with modern palette
    success: '#10b981',        // Emerald 500
    successLight: '#34d399',   // Emerald 400
    warning: '#f59e0b',        // Amber 500
    warningLight: '#fbbf24',   // Amber 400
    error: '#ef4444',          // Red 500
    errorLight: '#f87171',     // Red 400
    info: '#3b82f6',           // Blue 500
    
    // Borders and shadows
    border: '#e2e8f0',         // Slate 200
    borderLight: '#f1f5f9',    // Slate 100
    shadow: 'rgba(15, 23, 42, 0.08)', // Slate 900 with opacity
    shadowColored: 'rgba(99, 102, 241, 0.12)', // Indigo shadow
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
      shadowColor: '#0f172a',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
    },
    md: {
      shadowColor: '#0f172a',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
    lg: {
      shadowColor: '#0f172a',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
      elevation: 8,
    },
    xl: {
      shadowColor: '#0f172a',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.15,
      shadowRadius: 32,
      elevation: 12,
    },
    colored: {
      shadowColor: '#6366f1',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 6,
    },
  },
  
  // Modern gradient definitions
  gradients: {
    primary: ['#6366f1', '#8b5cf6'],
    success: ['#10b981', '#34d399'],
    warning: ['#f59e0b', '#fbbf24'],
    error: ['#ef4444', '#f87171'],
    subtle: ['#f8fafc', '#f1f5f9'],
  },
};