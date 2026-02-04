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
import { TableComponent } from './data-display/table.component';
import { ListComponent } from './data-display/list.component';
import { BasicChartComponent } from './data-display/basic-chart.component';
import { WizardStepperComponent } from './navigation/wizard-stepper.component';
import { ErrorComponent } from './error/error.component';

export interface ComponentLibrary {
  name: string;
  component: Type<any>;
  category: 'form' | 'layout' | 'data-display' | 'navigation' | 'error';
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
    description: 'Tabbed interface component',
    propsSchema: {
      tabs: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            label: { type: 'string' },
            value: { type: 'string' },
            completed: { type: 'boolean' },
          },
        },
        description: 'Array of tab definitions',
      },
      defaultTab: { type: 'string', description: 'Default active tab' },
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
