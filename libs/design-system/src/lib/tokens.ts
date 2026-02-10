/**
 * TypeScript design tokens mirroring CSS custom properties.
 * Use these for dynamic styling, Canvas rendering, or programmatic access.
 */

// ─── Color Tokens ────────────────────────────────────────────────────────────

export interface ColorScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
}

export const DS_COLORS = {
  /** Primary accent – vibrant teal/cyan */
  accentTeal: '#08fff3',
  /** Secondary accent – deep indigo/purple */
  accentIndigo: '#4d3aff',

  /** Background surface (darkest) */
  bg: '#0a0b0f',
  /** Primary surface */
  surface: '#101219',
  /** Glassmorphism surface */
  surfaceGlass: 'rgba(255, 255, 255, 0.04)',

  /** Primary text */
  textPrimary: '#ffffff',
  /** Secondary/muted text */
  textSecondary: '#9f9f9f',

  /** Borders */
  border: 'rgba(255, 255, 255, 0.08)',
  borderStrong: 'rgba(255, 255, 255, 0.16)',

  /** Status colors */
  success: '#34d399',
  warning: '#fbbf24',
  error: '#ff7485',
  info: '#60a5fa',
} as const;

// ─── Spacing Tokens ──────────────────────────────────────────────────────────

export interface SpacingScale {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
}

export const DS_SPACING: SpacingScale = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
  '3xl': '4rem',
} as const;

// ─── Border Radius Tokens ────────────────────────────────────────────────────

export const DS_RADII = {
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  pill: '999px',
} as const;

// ─── Typography Tokens ───────────────────────────────────────────────────────

export const DS_TYPOGRAPHY = {
  fontFamily: {
    display: "'Inter', system-ui, -apple-system, sans-serif",
    body: "'Inter', system-ui, -apple-system, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace",
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '2rem',
    '4xl': '2.5rem',
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  },
} as const;

// ─── Shadow Tokens ───────────────────────────────────────────────────────────

export const DS_SHADOWS = {
  /** Subtle elevation */
  sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
  /** Card elevation */
  md: '0 4px 16px rgba(0, 0, 0, 0.3)',
  /** Modal/popup elevation */
  lg: '0 8px 32px rgba(0, 0, 0, 0.4)',
  /** Teal glow effect */
  glowTeal: '0 0 20px rgba(8, 255, 243, 0.15), 0 0 40px rgba(8, 255, 243, 0.05)',
  /** Indigo glow effect */
  glowIndigo: '0 0 20px rgba(77, 58, 255, 0.15), 0 0 40px rgba(77, 58, 255, 0.05)',
} as const;

// ─── Master Token Interface ──────────────────────────────────────────────────

export interface DesignTokens {
  colors: typeof DS_COLORS;
  spacing: typeof DS_SPACING;
  radii: typeof DS_RADII;
  typography: typeof DS_TYPOGRAPHY;
  shadows: typeof DS_SHADOWS;
}
