import { Type } from '@angular/core';
import { InputComponent } from './form/input.component';
import { SelectComponent } from './form/select.component';
import { CheckboxComponent } from './form/checkbox.component';
import { RadioComponent } from './form/radio.component';
import { TextareaComponent } from './form/textarea.component';
import { ButtonComponent } from './form/button.component';
import { ContainerComponent } from './layout/container.component';
import { GridComponent } from './layout/grid.component';
import { CardComponent } from './layout/card.component';
import { TabsComponent } from './layout/tabs.component';
import { FlexboxComponent } from './layout/flexbox.component';
import { AccordionComponent } from './layout/accordion.component';
import { TableComponent } from './data-display/table.component';
import { ListComponent } from './data-display/list.component';
import { ListboxComponent } from './data-display/listbox.component';
import { BasicChartComponent } from './data-display/basic-chart.component';
import { WizardStepperComponent } from './navigation/wizard-stepper.component';
import { MenuComponent } from './navigation/menu.component';
import { ToolbarComponent } from './navigation/toolbar.component';
import { ErrorComponent } from './error/error.component';
import { HeadingComponent } from './typography/heading.component';
import { ParagraphComponent } from './typography/paragraph.component';
import { DividerComponent } from './typography/divider.component';

export interface ComponentLibrary {
  name: string;
  component: Type<any>;
  category: 'form' | 'layout' | 'data-display' | 'navigation' | 'typography' | 'error';
  description: string;
  propsSchema: Record<string, any>;
}

export const COMPONENT_LIBRARY: ComponentLibrary[] = [
  // Form Components
  {
    name: 'input',
    component: InputComponent,
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
    },
  },
  {
    name: 'select',
    component: SelectComponent,
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
    },
  },
  {
    name: 'checkbox',
    component: CheckboxComponent,
    category: 'form',
    description: 'Checkbox input with label',
    propsSchema: {
      id: { type: 'string', description: 'Unique identifier' },
      label: { type: 'string', description: 'Field label' },
      checked: { type: 'boolean', default: false },
      disabled: { type: 'boolean', default: false },
      error: { type: 'string', description: 'Error message' },
    },
  },
  {
    name: 'radio',
    component: RadioComponent,
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
    },
  },
  {
    name: 'textarea',
    component: TextareaComponent,
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
    },
  },
  {
    name: 'button',
    component: ButtonComponent,
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

  // Layout Components
  {
    name: 'container',
    component: ContainerComponent,
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
    component: GridComponent,
    category: 'layout',
    description: 'CSS Grid layout component',
    propsSchema: {
      columns: {
        type: ['number', 'string'],
        default: 1,
        description: 'Number of columns or grid template string',
      },
      gap: { type: 'number', default: 16, description: 'Gap in pixels' },
    },
  },
  {
    name: 'card',
    component: CardComponent,
    category: 'layout',
    description: 'Card container with header, content, and footer',
    propsSchema: {
      title: { type: 'string', description: 'Card title' },
      padding: { type: 'number', default: 1, description: 'Padding in rem' },
      elevated: { type: 'boolean', default: true, description: 'Add shadow' },
      footer: { type: 'boolean', default: false, description: 'Show footer' },
    },
  },
  {
    name: 'tabs',
    component: TabsComponent,
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
    component: AccordionComponent,
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
    component: FlexboxComponent,
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
      gap: { type: ['number', 'string'], default: 0 },
      padding: { type: ['number', 'string'], default: 0 },
    },
  },

  // Data Display Components
  {
    name: 'table',
    component: TableComponent,
    category: 'data-display',
    description: 'Data table with striping and borders',
    propsSchema: {
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
    },
  },
  {
    name: 'list',
    component: ListComponent,
    category: 'data-display',
    description: 'List component with items and descriptions',
    propsSchema: {
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
    },
  },
  {
    name: 'listbox',
    component: ListboxComponent,
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
  // Typography Components
  {
    name: 'heading',
    component: HeadingComponent,
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
    component: ParagraphComponent,
    category: 'typography',
    description: 'Paragraph text',
    propsSchema: {
      text: { type: 'string', description: 'Paragraph text' },
      ariaLabel: { type: 'string', description: 'Accessibility label' },
    },
  },
  {
    name: 'divider',
    component: DividerComponent,
    category: 'typography',
    description: 'Horizontal divider line',
    propsSchema: {
      ariaLabel: { type: 'string', description: 'Accessibility label' },
    },
  },
  {
    name: 'basic-chart',
    component: BasicChartComponent,
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

  // Navigation Components
  {
    name: 'wizard-stepper',
    component: WizardStepperComponent,
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
    component: MenuComponent,
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
    component: ToolbarComponent,
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

  // Error Component
  {
    name: 'error',
    component: ErrorComponent,
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
];

export function getComponentLibrary(): ComponentLibrary[] {
  return COMPONENT_LIBRARY;
}
