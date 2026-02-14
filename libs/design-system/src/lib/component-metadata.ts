/**
 * Component metadata — pure data, NO Angular imports.
 *
 * This file is the canonical source for component names, categories,
 * descriptions and propsSchemas. It can be safely imported in Node.js
 * scripts (e.g. the manifest build script) without triggering Angular
 * decorator compilation.
 *
 * The companion `component-library.ts` re-exports this metadata *with*
 * the actual Angular component classes attached.
 */

export interface ComponentMetadata {
  name: string;
  category:
    | 'form'
    | 'layout'
    | 'data-display'
    | 'navigation'
    | 'typography'
    | 'error'
    | 'feedback';
  description: string;
  propsSchema: Record<string, any>;
}

export const COMPONENT_METADATA: ComponentMetadata[] = [
  // ── Form ───────────────────────────────────────────────────────────────
  {
    name: 'input',
    category: 'form',
    description: 'Text input field with label, placeholder, and validation',
    propsSchema: {
      id: { type: 'string', description: 'Unique identifier' },
      type: {
        type: 'string',
        enum: ['text', 'email', 'password', 'number', 'tel', 'url'],
        default: 'text',
      },
      label: { type: 'string', description: 'Field label' },
      placeholder: { type: 'string', description: 'Placeholder text' },
      value: { type: 'string', description: 'Current value' },
      disabled: { type: 'boolean', default: false },
      required: { type: 'boolean', default: false },
      pattern: { type: 'string', description: 'Regex pattern for validation' },
      error: { type: 'string', description: 'Error message' },
      filterTarget: { type: 'string', description: 'ID of the data component to filter' },
      filterField: { type: 'string', description: 'Data field to filter on' },
      filterOperator: { type: 'string', enum: ['contains', 'equals', 'gt', 'lt', 'gte', 'lte', 'in'], default: 'contains', description: 'Filter comparison operator' },
    },
  },
  {
    name: 'select',
    category: 'form',
    description: 'Dropdown select field with options',
    propsSchema: {
      id: { type: 'string', description: 'Unique identifier' },
      label: { type: 'string', description: 'Field label' },
      placeholder: { type: 'string', description: 'Placeholder text' },
      value: { type: 'any', description: 'Current value' },
      options: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            label: { type: 'string' },
            value: { type: 'any' },
          },
        },
        description: 'Array of options',
      },
      disabled: { type: 'boolean', default: false },
      required: { type: 'boolean', default: false },
      error: { type: 'string', description: 'Error message' },
      filterTarget: { type: 'string', description: 'ID of the data component to filter' },
      filterField: { type: 'string', description: 'Data field to filter on' },
      filterOperator: { type: 'string', enum: ['contains', 'equals', 'gt', 'lt', 'gte', 'lte', 'in'], default: 'equals', description: 'Filter comparison operator' },
    },
  },
  {
    name: 'checkbox',
    category: 'form',
    description: 'Checkbox input with label',
    propsSchema: {
      id: { type: 'string', description: 'Unique identifier' },
      label: { type: 'string', description: 'Field label' },
      checked: { type: 'boolean', default: false },
      disabled: { type: 'boolean', default: false },
      error: { type: 'string', description: 'Error message' },
      filterTarget: { type: 'string', description: 'ID of the data component to filter' },
      filterField: { type: 'string', description: 'Data field to filter on' },
      filterOperator: { type: 'string', enum: ['contains', 'equals', 'gt', 'lt', 'gte', 'lte', 'in'], default: 'equals', description: 'Filter comparison operator' },
    },
  },
  {
    name: 'radio',
    category: 'form',
    description: 'Radio button group with multiple options',
    propsSchema: {
      id: { type: 'string', description: 'Unique identifier' },
      groupLabel: { type: 'string', description: 'Group label' },
      value: { type: 'any', description: 'Currently selected value' },
      options: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            label: { type: 'string' },
            value: { type: 'any' },
          },
        },
        description: 'Array of radio options',
      },
      disabled: { type: 'boolean', default: false },
      error: { type: 'string', description: 'Error message' },
      filterTarget: { type: 'string', description: 'ID of the data component to filter' },
      filterField: { type: 'string', description: 'Data field to filter on' },
      filterOperator: { type: 'string', enum: ['contains', 'equals', 'gt', 'lt', 'gte', 'lte', 'in'], default: 'equals', description: 'Filter comparison operator' },
    },
  },
  {
    name: 'textarea',
    category: 'form',
    description: 'Multi-line text input field',
    propsSchema: {
      id: { type: 'string', description: 'Unique identifier' },
      label: { type: 'string', description: 'Field label' },
      placeholder: { type: 'string', description: 'Placeholder text' },
      value: { type: 'string', description: 'Current value' },
      rows: { type: 'number', default: 4 },
      cols: { type: 'number', default: 50 },
      maxLength: { type: 'number', description: 'Maximum character count' },
      disabled: { type: 'boolean', default: false },
      required: { type: 'boolean', default: false },
      error: { type: 'string', description: 'Error message' },
      filterTarget: { type: 'string', description: 'ID of the data component to filter' },
      filterField: { type: 'string', description: 'Data field to filter on' },
      filterOperator: { type: 'string', enum: ['contains', 'equals', 'gt', 'lt', 'gte', 'lte', 'in'], default: 'contains', description: 'Filter comparison operator' },
    },
  },
  {
    name: 'button',
    category: 'form',
    description: 'Interactive button with variants and states',
    propsSchema: {
      label: { type: 'string', description: 'Button text' },
      type: {
        type: 'string',
        enum: ['button', 'submit', 'reset'],
        default: 'button',
      },
      variant: {
        type: 'string',
        enum: ['primary', 'secondary', 'danger', 'success'],
        default: 'primary',
      },
      size: {
        type: 'string',
        enum: ['small', 'medium', 'large'],
        default: 'medium',
      },
      disabled: { type: 'boolean', default: false },
      loading: { type: 'boolean', default: false },
    },
  },

  // ── Layout ─────────────────────────────────────────────────────────────
  {
    name: 'container',
    category: 'layout',
    description: 'Container wrapper with max-width and variants',
    propsSchema: {
      maxWidth: { type: 'number', default: 1200, description: 'Max width in pixels' },
      variant: {
        type: 'string',
        enum: ['default', 'fluid', 'card'],
        default: 'default',
      },
    },
  },
  {
    name: 'grid',
    category: 'layout',
    description: 'CSS Grid layout component. Use minChildWidth for responsive auto-fit grids.',
    propsSchema: {
      columns: {
        type: ['number', 'string'],
        default: 1,
        description: 'Number of columns or grid template string',
      },
      gap: { type: 'number', default: 16, description: 'Gap in pixels' },
      padding: { type: 'number', default: 0, description: 'Padding in pixels' },
      minChildWidth: { type: 'number', description: 'Min child width for auto-fit responsive grid (px). Overrides columns.' },
    },
  },
  {
    name: 'card',
    category: 'layout',
    description: 'Card container with header, content, and footer',
    propsSchema: {
      title: { type: 'string', description: 'Card title' },
      padding: { type: 'number', default: 12, description: 'Padding in pixels' },
      elevated: { type: 'boolean', default: true, description: 'Add shadow' },
      footer: { type: 'boolean', default: false, description: 'Show footer' },
    },
  },
  {
    name: 'tabs',
    category: 'layout',
    description: 'Tabbed interface using Angular Aria headless directives',
    propsSchema: {
      tabs: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            label: { type: 'string' },
            value: { type: 'string' },
            disabled: { type: 'boolean' },
          },
        },
        description: 'Array of tab definitions',
      },
      defaultTab: { type: 'string', description: 'Default active tab' },
      selectionMode: {
        type: 'string',
        enum: ['follow', 'explicit'],
        default: 'follow',
        description: 'Tab activation mode',
      },
      orientation: {
        type: 'string',
        enum: ['horizontal', 'vertical'],
        default: 'horizontal',
      },
    },
  },
  {
    name: 'accordion',
    category: 'layout',
    description: 'Expandable/collapsible sections using Angular Aria accordion directives',
    propsSchema: {
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            content: { type: 'string' },
            disabled: { type: 'boolean' },
            expanded: { type: 'boolean' },
          },
        },
        description: 'Array of accordion items',
      },
      multiExpandable: { type: 'boolean', default: true, description: 'Allow multiple panels open' },
    },
  },
  {
    name: 'flexbox',
    category: 'layout',
    description: 'Flexbox layout component',
    propsSchema: {
      direction: {
        type: 'string',
        enum: ['row', 'column', 'row-reverse', 'column-reverse'],
        default: 'column',
      },
      alignItems: {
        type: 'string',
        enum: ['stretch', 'flex-start', 'center', 'flex-end', 'baseline'],
        default: 'stretch',
      },
      justifyContent: {
        type: 'string',
        enum: ['flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly'],
        default: 'flex-start',
      },
      wrap: {
        type: 'string',
        enum: ['nowrap', 'wrap', 'wrap-reverse'],
        default: 'nowrap',
      },
      gap: { type: ['number', 'string'], default: 12, description: 'Gap between children in px or CSS value' },
      padding: { type: ['number', 'string'], default: 0 },
    },
  },
  {
    name: 'split-layout',
    category: 'layout',
    description: 'Two-pane sidebar + main layout. Supply exactly 2 children: sidebar content and main content.',
    propsSchema: {
      sidebarWidth: { type: ['number', 'string'], default: 280, description: 'Sidebar width in px or CSS value' },
      position: { type: 'string', enum: ['left', 'right'], default: 'left', description: 'Sidebar position' },
      gap: { type: 'number', default: 16, description: 'Gap between panes in px' },
    },
  },

  // ── Data Display ───────────────────────────────────────────────────────
  {
    name: 'table',
    category: 'data-display',
    description: 'Data table with striping, borders, sorting, and pagination. Virtual scroll auto-enabled >100 rows.',
    propsSchema: {
      id: { type: 'string', description: 'Unique identifier (required for client-side filtering)' },
      columns: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            key: { type: 'string' },
            label: { type: 'string' },
            width: { type: 'string' },
            sortable: { type: 'boolean' },
          },
        },
        description: 'Column definitions',
      },
      data: {
        type: 'array',
        description: 'Table data rows',
      },
      striped: { type: 'boolean', default: true },
      bordered: { type: 'boolean', default: true },
      hoverable: { type: 'boolean', default: true },
      pageSize: { type: 'number', default: 0, description: 'Rows per page (0 = no pagination)' },
      rowHeight: { type: 'number', default: 36, description: 'Row height in px for virtual scroll' },
      maxVisibleRows: { type: 'number', default: 15, description: 'Max visible rows in virtual scroll viewport' },
    },
  },
  {
    name: 'list',
    category: 'data-display',
    description: 'List component with items and descriptions. Virtual scroll auto-enabled >100 items.',
    propsSchema: {
      id: { type: 'string', description: 'Unique identifier (required for client-side filtering)' },
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            label: { type: 'string' },
            description: { type: 'string' },
            icon: { type: 'string' },
          },
        },
        description: 'Array of list items',
      },
      styled: { type: 'boolean', default: true },
      itemHeight: { type: 'number', default: 48, description: 'Item height in px for virtual scroll' },
      maxVisibleItems: { type: 'number', default: 15, description: 'Max visible items in virtual scroll viewport' },
    },
  },
  {
    name: 'listbox',
    category: 'data-display',
    description: 'Accessible listbox using Angular Aria with keyboard navigation and selection',
    propsSchema: {
      options: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            value: { type: 'string' },
            label: { type: 'string' },
            description: { type: 'string' },
            icon: { type: 'string' },
            disabled: { type: 'boolean' },
          },
        },
        description: 'Array of listbox options',
      },
      label: { type: 'string', description: 'Listbox label' },
      multi: { type: 'boolean', default: false, description: 'Allow multiple selection' },
      orientation: {
        type: 'string',
        enum: ['vertical', 'horizontal'],
        default: 'vertical',
      },
      selectionMode: {
        type: 'string',
        enum: ['follow', 'explicit'],
        default: 'explicit',
      },
    },
  },

  // ── Typography ─────────────────────────────────────────────────────────
  {
    name: 'heading',
    category: 'typography',
    description: 'Heading text with configurable level',
    propsSchema: {
      text: { type: 'string', description: 'Heading text' },
      level: { type: 'number', default: 2, description: 'Heading level (1-6)' },
      ariaLabel: { type: 'string', description: 'Accessibility label' },
    },
  },
  {
    name: 'paragraph',
    category: 'typography',
    description: 'Paragraph text',
    propsSchema: {
      text: { type: 'string', description: 'Paragraph text' },
      ariaLabel: { type: 'string', description: 'Accessibility label' },
    },
  },
  {
    name: 'divider',
    category: 'typography',
    description: 'Horizontal divider line',
    propsSchema: {
      ariaLabel: { type: 'string', description: 'Accessibility label' },
    },
  },

  {
    name: 'basic-chart',
    category: 'data-display',
    description: 'Basic chart component with bar, line, and pie charts',
    propsSchema: {
      data: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            label: { type: 'string' },
            value: { type: 'number' },
          },
        },
        description: 'Chart data points',
      },
      title: { type: 'string', description: 'Chart title' },
      type: {
        type: 'string',
        enum: ['bar', 'line', 'pie'],
        default: 'bar',
      },
      width: { type: 'number', default: 400 },
      height: { type: 'number', default: 300 },
    },
  },

  // ── Navigation ─────────────────────────────────────────────────────────
  {
    name: 'wizard-stepper',
    category: 'navigation',
    description: 'Multi-step wizard with stepper UI',
    propsSchema: {
      steps: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            label: { type: 'string' },
            description: { type: 'string' },
            completed: { type: 'boolean' },
          },
        },
        description: 'Array of wizard steps',
      },
    },
  },
  {
    name: 'menu',
    category: 'navigation',
    description: 'Dropdown menu using Angular Aria with keyboard navigation and groups',
    propsSchema: {
      actions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            value: { type: 'string' },
            label: { type: 'string' },
            icon: { type: 'string' },
            disabled: { type: 'boolean' },
            group: { type: 'string' },
          },
        },
        description: 'Array of menu actions',
      },
      triggerLabel: { type: 'string', default: 'Menu', description: 'Trigger button text' },
    },
  },
  {
    name: 'toolbar',
    category: 'navigation',
    description: 'Accessible toolbar using Angular Aria with keyboard navigation',
    propsSchema: {
      orientation: {
        type: 'string',
        enum: ['horizontal', 'vertical'],
        default: 'horizontal',
      },
      ariaLabel: { type: 'string', default: 'Toolbar', description: 'Accessible label' },
    },
  },

  // ── Error ──────────────────────────────────────────────────────────────
  {
    name: 'error',
    category: 'error',
    description: 'Error display with retry and reporting options',
    propsSchema: {
      title: { type: 'string', description: 'Error title' },
      message: { type: 'string', description: 'Error message' },
      details: { type: 'string', description: 'Detailed error information' },
      dismissible: { type: 'boolean', default: true },
      visible: { type: 'boolean', default: true },
    },
  },

  // ── Additional Data Display ────────────────────────────────────────────
  {
    name: 'timeline',
    category: 'data-display',
    description: 'Timeline component showing chronological events with status indicators',
    propsSchema: {
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            timestamp: { type: 'string' },
            icon: { type: 'string' },
            status: { type: 'string', enum: ['completed', 'active', 'pending', 'error'] },
          },
        },
        description: 'Array of timeline items',
      },
      orientation: {
        type: 'string',
        enum: ['vertical', 'horizontal'],
        default: 'vertical',
      },
    },
  },
  {
    name: 'carousel',
    category: 'data-display',
    description: 'Carousel/slider component for displaying multiple items with navigation',
    propsSchema: {
      slides: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            image: { type: 'string' },
            content: { type: 'string' },
            icon: { type: 'string' },
          },
        },
        description: 'Array of carousel slides',
      },
      autoplay: { type: 'boolean', default: false },
      interval: { type: 'number', default: 5000 },
      loop: { type: 'boolean', default: true },
      showControls: { type: 'boolean', default: true },
      showIndicators: { type: 'boolean', default: true },
    },
  },
  {
    name: 'audio-player',
    category: 'data-display',
    description: 'Embedded audio player for music clips, podcasts, or previews',
    propsSchema: {
      src: { type: 'string', description: 'Audio URL (allowlisted domain or relative path)' },
      title: { type: 'string', description: 'Track or episode title' },
      subtitle: { type: 'string', description: 'Artist or supporting text' },
      controls: { type: 'boolean', default: true },
      autoplay: { type: 'boolean', default: false },
      loop: { type: 'boolean', default: false },
      muted: { type: 'boolean', default: false },
      preload: { type: 'string', enum: ['none', 'metadata', 'auto'], default: 'metadata' },
    },
  },
  {
    name: 'video-player',
    category: 'data-display',
    description: 'Embedded video player with poster and aspect-ratio controls',
    propsSchema: {
      src: { type: 'string', description: 'Video URL (allowlisted domain or relative path)' },
      title: { type: 'string', description: 'Video title' },
      poster: { type: 'string', description: 'Poster image URL (allowlisted domain or relative path)' },
      controls: { type: 'boolean', default: true },
      autoplay: { type: 'boolean', default: false },
      loop: { type: 'boolean', default: false },
      muted: { type: 'boolean', default: false },
      playsInline: { type: 'boolean', default: true },
      preload: { type: 'string', enum: ['none', 'metadata', 'auto'], default: 'metadata' },
      aspectRatio: { type: 'string', enum: ['16:9', '4:3', '1:1'], default: '16:9' },
    },
  },
  {
    name: 'stats-card',
    category: 'data-display',
    description: 'Statistics card displaying key metrics with change indicators',
    propsSchema: {
      label: { type: 'string', description: 'Metric label' },
      value: { type: ['string', 'number'], description: 'Metric value' },
      change: { type: 'number', description: 'Percentage change' },
      description: { type: 'string', description: 'Additional description' },
      icon: { type: 'string', description: 'Lucide icon name (kebab-case) or single emoji character' },
      elevated: { type: 'boolean', default: true },
    },
  },
  {
    name: 'progress-ring',
    category: 'data-display',
    description: 'Circular progress indicator with percentage display',
    propsSchema: {
      value: { type: 'number', default: 0, description: 'Progress value 0-100' },
      size: { type: 'number', default: 120, description: 'Size in pixels' },
      strokeWidth: { type: 'number', default: 8 },
      label: { type: 'string', description: 'Label text' },
      icon: { type: 'string', description: 'Lucide icon name (kebab-case) or single emoji character' },
      showValue: { type: 'boolean', default: true },
    },
  },
  {
    name: 'flow-diagram',
    category: 'data-display',
    description: 'Flow diagram showing process steps with connections',
    propsSchema: {
      nodes: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            label: { type: 'string' },
            icon: { type: 'string' },
            description: { type: 'string' },
            type: { type: 'string', enum: ['start', 'end', 'process', 'decision'] },
          },
        },
        description: 'Array of flow nodes',
      },
      connections: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            from: { type: 'string' },
            to: { type: 'string' },
            label: { type: 'string' },
          },
        },
        description: 'Array of connections between nodes',
      },
    },
  },
  {
    name: 'chart-bar',
    category: 'data-display',
    description: 'Modern bar chart for displaying metrics',
    propsSchema: {
      title: { type: 'string', description: 'Chart title' },
      data: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            label: { type: 'string' },
            value: { type: 'number' },
            color: { type: 'string' },
          },
        },
        description: 'Array of data points',
      },
    },
  },

  // ── Feedback ───────────────────────────────────────────────────────────
  {
    name: 'badge',
    category: 'feedback',
    description: 'Badge/tag component for labels and status indicators',
    propsSchema: {
      text: { type: 'string', description: 'Badge text' },
      icon: { type: 'string', description: 'Lucide icon name (kebab-case) or single emoji character' },
      variant: {
        type: 'string',
        enum: ['primary', 'secondary', 'success', 'warning', 'danger', 'info'],
        default: 'primary',
      },
      size: {
        type: 'string',
        enum: ['small', 'medium', 'large'],
        default: 'medium',
      },
      pill: { type: 'boolean', default: false },
      dismissible: { type: 'boolean', default: false },
    },
  },
  {
    name: 'alert',
    category: 'feedback',
    description: 'Alert notification with different severity levels',
    propsSchema: {
      title: { type: 'string', description: 'Alert title' },
      message: { type: 'string', description: 'Alert message' },
      description: { type: 'string', description: 'Additional description' },
      icon: { type: 'string', description: 'Lucide icon name (kebab-case) or single emoji character' },
      variant: {
        type: 'string',
        enum: ['success', 'warning', 'error', 'info'],
        default: 'info',
      },
      dismissible: { type: 'boolean', default: true },
      visible: { type: 'boolean', default: true },
    },
  },
  {
    name: 'progress-bar',
    category: 'feedback',
    description: 'Linear progress bar with variants',
    propsSchema: {
      value: { type: 'number', default: 0, description: 'Progress value 0-100' },
      label: { type: 'string', description: 'Label text' },
      variant: {
        type: 'string',
        enum: ['primary', 'success', 'warning', 'error'],
        default: 'primary',
      },
      showValue: { type: 'boolean', default: true },
      striped: { type: 'boolean', default: false },
      animated: { type: 'boolean', default: false },
    },
  },

  // ── Additional Navigation ──────────────────────────────────────────────
  {
    name: 'stepper',
    category: 'navigation',
    description: 'Step indicator showing progress through a multi-step process',
    propsSchema: {
      steps: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            icon: { type: 'string' },
            status: { type: 'string', enum: ['completed', 'active', 'pending', 'error'] },
          },
        },
        description: 'Array of steps',
      },
      currentStep: { type: 'number', default: 0 },
      orientation: {
        type: 'string',
        enum: ['vertical', 'horizontal'],
        default: 'vertical',
      },
      clickable: { type: 'boolean', default: false },
    },
  },
];
