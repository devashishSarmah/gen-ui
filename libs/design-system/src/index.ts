/**
 * @gen-ui/design-system
 *
 * Dark glass design system built on Angular Aria headless directives.
 * Provides CSS tokens, component styles, and TypeScript design tokens.
 */

// ─── Design Tokens (TypeScript) ──────────────────────────────────────────────
export { DS_COLORS, DS_SPACING, DS_RADII, DS_TYPOGRAPHY, DS_SHADOWS } from './lib/tokens';

// ─── Design Token Types ──────────────────────────────────────────────────────
export type { DesignTokens, ColorScale, SpacingScale } from './lib/tokens';

// ─── Component Exports ──────────────────────────────────────────────────────
export * from './lib/components';
export * from './lib/component-library';
export * from './lib/services/wizard-flow.service';

// ─── Showcase / Documentation ────────────────────────────────────────────────
export * from './lib/showcase';
