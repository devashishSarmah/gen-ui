# @gen-ui/design-system

Dark glass design system built on **Angular Aria** headless directives for the Gen UI platform.

## Architecture

```
@angular/aria (headless directives)  →  Custom styled components  →  Design system tokens (CSS + TS)
```

### Angular Aria Components

| Component   | Angular Aria Directive                | Import Path              |
|-------------|---------------------------------------|--------------------------|
| Tabs        | `Tabs, TabList, Tab, TabPanel`        | `@angular/aria/tabs`     |
| Accordion   | `AccordionGroup, AccordionTrigger, AccordionPanel` | `@angular/aria/accordion` |
| Listbox     | `Listbox, Option`                     | `@angular/aria/listbox`  |
| Menu        | `Menu, MenuItem, MenuTrigger`         | `@angular/aria/menu`     |
| Toolbar     | `Toolbar, ToolbarWidget, ToolbarWidgetGroup` | `@angular/aria/toolbar` |

### What Angular Aria handles automatically:
- Keyboard navigation (Arrow keys, Home/End, Escape)
- ARIA attributes (`role`, `aria-selected`, `aria-expanded`, `aria-controls`)
- Focus management (roving tabindex, active descendant)
- Screen reader announcements
- RTL language support

## Package Structure

```
libs/design-system/
├── package.json            # @gen-ui/design-system
├── project.json            # Nx library config
├── tsconfig.lib.json       # Library TypeScript config
└── src/
    ├── index.ts            # TypeScript entry (design tokens)
    └── lib/
        ├── index.css       # CSS entry (imports all below)
        ├── tokens.css      # CSS custom properties & base theme
        ├── tokens.ts       # TypeScript design tokens
        ├── components.css  # Component class styles
        └── utilities.css   # Utility classes
```

## Usage

### Import CSS (in styles.css)
```css
@import 'libs/design-system/src/lib/index.css';
```

### Import TypeScript tokens
```typescript
import { DS_COLORS, DS_TYPOGRAPHY, DS_SHADOWS } from '@gen-ui/design-system';
```

## Design Tokens

| Token | Value | Use |
|-------|-------|-----|
| `--ds-accent-teal` | `#08fff3` | Primary accent, CTAs |
| `--ds-accent-indigo` | `#4d3aff` | Secondary accent, gradients |
| `--ds-bg` | `#0a0b0f` | Page background |
| `--ds-surface` | `#101219` | Card/panel surfaces |
| `--ds-surface-glass` | `rgba(255,255,255,0.04)` | Glassmorphism surfaces |
| `--ds-text-primary` | `#ffffff` | Primary text |
| `--ds-text-secondary` | `#9f9f9f` | Muted text |
| `--ds-border` | `rgba(255,255,255,0.08)` | Subtle borders |
| Font | Inter | Display & body |

