/**
 * Auto-generates sample prop values from a component's propsSchema.
 * This keeps the showcase self-maintaining – when propsSchema changes,
 * the demo values update automatically.
 */

export function generateSampleProps(
  propsSchema: Record<string, any>
): Record<string, any> {
  const sample: Record<string, any> = {};

  for (const [key, schema] of Object.entries(propsSchema)) {
    sample[key] = deriveSampleValue(key, schema);
  }

  return sample;
}

function deriveSampleValue(key: string, schema: any): any {
  // Use default if available
  if (schema.default !== undefined) {
    return schema.default;
  }

  // Use first enum value
  if (schema.enum && schema.enum.length > 0) {
    return schema.enum[0];
  }

  // Type-based inference
  const type = Array.isArray(schema.type) ? schema.type[0] : schema.type;

  switch (type) {
    case 'string':
      return inferStringValue(key, schema);
    case 'number':
      return inferNumberValue(key);
    case 'boolean':
      return false;
    case 'array':
      return inferArrayValue(key, schema);
    case 'object':
      return {};
    case 'any':
      return 'sample';
    default:
      return undefined;
  }
}

function inferStringValue(key: string, _schema: any): string {
  const keyLower = key.toLowerCase();
  if (keyLower.includes('label') || keyLower.includes('title')) return 'Sample Label';
  if (keyLower.includes('text') || keyLower.includes('message')) return 'Sample text content';
  if (keyLower.includes('description')) return 'A brief description of this item';
  if (keyLower.includes('placeholder')) return 'Enter value...';
  if (keyLower.includes('icon')) return 'sparkles';
  if (keyLower.includes('id')) return 'sample-1';
  if (keyLower.includes('value')) return 'sample';
  if (keyLower.includes('arialabel') || keyLower.includes('aria')) return 'Accessible label';
  return 'sample';
}

function inferNumberValue(key: string): number {
  const keyLower = key.toLowerCase();
  if (keyLower.includes('max') || keyLower.includes('width')) return 800;
  if (keyLower.includes('column')) return 2;
  if (keyLower.includes('gap')) return 16;
  if (keyLower.includes('row')) return 4;
  if (keyLower.includes('value') || keyLower.includes('progress')) return 65;
  if (keyLower.includes('size')) return 100;
  if (keyLower.includes('level')) return 2;
  if (keyLower.includes('padding')) return 16;
  return 0;
}

function inferArrayValue(key: string, schema: any): any[] {
  const keyLower = key.toLowerCase();

  if (keyLower.includes('option')) {
    return [
      { label: 'Option A', value: 'a' },
      { label: 'Option B', value: 'b' },
      { label: 'Option C', value: 'c' },
    ];
  }

  if (keyLower.includes('column')) {
    return [
      { key: 'name', header: 'Name' },
      { key: 'value', header: 'Value' },
    ];
  }

  if (keyLower.includes('item')) {
    return [
      { id: '1', label: 'First item', description: 'Description for first item', icon: 'map-pin' },
      { id: '2', label: 'Second item', description: 'Description for second item', icon: 'link' },
      { id: '3', label: 'Third item', description: 'Description for third item', icon: 'bookmark' },
    ];
  }

  if (keyLower.includes('tab')) {
    return [
      { label: 'Tab 1', value: 'tab1' },
      { label: 'Tab 2', value: 'tab2' },
    ];
  }

  if (keyLower.includes('step')) {
    return [
      { id: '1', title: 'Step 1', description: 'First step', icon: 'check-circle', status: 'completed' },
      { id: '2', title: 'Step 2', description: 'Second step', icon: 'loader', status: 'active' },
      { id: '3', title: 'Step 3', description: 'Third step', icon: 'clock', status: 'pending' },
    ];
  }

  if (keyLower.includes('data')) {
    return [
      { label: 'Jan', value: 120 },
      { label: 'Feb', value: 180 },
      { label: 'Mar', value: 90 },
      { label: 'Apr', value: 210 },
    ];
  }

  if (keyLower.includes('slide')) {
    return [
      { id: '1', title: 'Slide 1', description: 'First slide', icon: 'star' },
      { id: '2', title: 'Slide 2', description: 'Second slide', icon: 'palette' },
      { id: '3', title: 'Slide 3', description: 'Third slide', icon: 'target' },
    ];
  }

  if (keyLower.includes('node')) {
    return [
      { id: '1', label: 'Start', icon: 'play', type: 'start' },
      { id: '2', label: 'Process', icon: 'settings', type: 'process' },
      { id: '3', label: 'End', icon: 'flag', type: 'end' },
    ];
  }

  if (keyLower.includes('connection')) {
    return [
      { from: '1', to: '2' },
      { from: '2', to: '3' },
    ];
  }

  return [];
}

/** Hard-coded sample overrides for components that need richer demos */
export const SAMPLE_OVERRIDES: Record<string, Record<string, any>> = {
  table: {
    columns: [
      { key: 'name', header: 'Name' },
      { key: 'role', header: 'Role' },
      { key: 'status', header: 'Status' },
    ],
    data: [
      { name: 'Alice', role: 'Developer', status: 'Active' },
      { name: 'Bob', role: 'Designer', status: 'Active' },
      { name: 'Charlie', role: 'PM', status: 'Away' },
    ],
    striped: true,
    hoverable: true,
  },
  'basic-chart': {
    data: [
      { x: 'Q1', y: 42 },
      { x: 'Q2', y: 58 },
      { x: 'Q3', y: 35 },
      { x: 'Q4', y: 71 },
    ],
    type: 'bar',
    title: 'Quarterly Revenue',
    xLabel: 'Quarter',
    yLabel: 'Revenue ($K)',
  },
  'stats-card': {
    label: 'Active Users',
    value: '8,234',
    change: 12.5,
    icon: 'users',
    description: 'Compared to last month',
    elevated: true,
  },
  'flow-diagram': {
    nodes: [
      { id: '1', label: 'Request', icon: 'send', description: 'Client request', type: 'start' },
      { id: '2', label: 'Authenticate', icon: 'lock', description: 'Verify token', type: 'decision' },
      { id: '3', label: 'Response', icon: 'check-circle', description: 'Send data', type: 'end' },
    ],
    connections: [
      { from: '1', to: '2', label: 'HTTP' },
      { from: '2', to: '3', label: 'Authorized' },
    ],
  },
  error: {
    title: 'Something went wrong',
    message: 'Unable to load the requested resource.',
    details: 'Error code: 500 – Internal Server Error',
    dismissible: true,
    visible: true,
  },
  heading: { text: 'Design System Heading', level: 2, ariaLabel: 'Heading' },
  paragraph: { text: 'This is a paragraph component from the Gen UI design system. It renders accessible, styled text blocks.', ariaLabel: 'Paragraph' },
  divider: { ariaLabel: 'Section divider' },
  alert: {
    title: 'Success!',
    message: 'Operation completed.',
    icon: 'check-circle',
    variant: 'success',
    visible: true,
    dismissible: true,
  },
  badge: { text: 'NEW', icon: 'sparkles', variant: 'primary', pill: true, size: 'medium' },
  'progress-ring': { value: 72, label: 'Complete', icon: 'check', size: 120 },
  'progress-bar': { value: 65, label: 'Uploading...', variant: 'primary', striped: true, animated: true, showValue: true },
};
