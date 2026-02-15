/**
 * Golden seed conversations that showcase correct UI schema patterns.
 * Used to populate a demo user's conversations for:
 *  1. Few-shot reference — the agent can see known-good examples in history
 *  2. Renderer smoke-testing — every component type gets exercised
 *
 * Each entry = one conversation with a user prompt and an assistant reply
 * containing a validated uiSchema.
 */

export interface SeedConversation {
  title: string;
  prompt: string;
  schema: Record<string, any>;
}

export const SEED_CONVERSATIONS: SeedConversation[] = [
  // ───────────────────── 1. Dashboard ─────────────────────
  {
    title: 'Sales Dashboard',
    prompt: 'Create a sales dashboard with KPI cards, a revenue bar chart, and a conversion progress ring.',
    schema: {
      type: 'container',
      props: { maxWidth: 1200, padding: 16 },
      children: [
        { type: 'heading', props: { text: 'Sales Dashboard', level: 2 } },
        {
          type: 'grid',
          props: { columns: 4, gap: 12 },
          children: [
            { type: 'stats-card', props: { label: 'Total Revenue', value: '$128,450', trend: 12.5, icon: 'dollar-sign' } },
            { type: 'stats-card', props: { label: 'Active Customers', value: '3,241', trend: 8.2, icon: 'users' } },
            { type: 'stats-card', props: { label: 'Orders Today', value: '184', trend: -2.1, icon: 'shopping-cart' } },
            { type: 'stats-card', props: { label: 'Avg Order Value', value: '$67.30', trend: 5.4, icon: 'trending-up' } },
          ],
        },
        {
          type: 'grid',
          props: { columns: 3, gap: 12 },
          children: [
            {
              type: 'card',
              props: { title: 'Monthly Revenue', padding: 12, elevated: true },
              children: [
                {
                  type: 'chart-bar',
                  props: {
                    title: 'Revenue by Month',
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [
                      { label: 'Revenue ($K)', data: [82, 95, 88, 102, 115, 128] },
                    ],
                  },
                },
              ],
            },
            {
              type: 'card',
              props: { title: 'Conversion Rate', padding: 12, elevated: true },
              children: [
                { type: 'progress-ring', props: { value: 73, max: 100, label: 'Conversion', size: 140 } },
              ],
            },
            {
              type: 'card',
              props: { title: 'Sales Pipeline', padding: 12, elevated: true },
              children: [
                { type: 'progress-bar', props: { value: 65, max: 100, label: 'Q2 Target', variant: 'info' } },
                { type: 'progress-bar', props: { value: 42, max: 100, label: 'Enterprise Deals', variant: 'success' } },
                { type: 'progress-bar', props: { value: 88, max: 100, label: 'SMB Deals', variant: 'warning' } },
              ],
            },
          ],
        },
      ],
      manifestVersion: '1.0.0-0e52acecde36',
      rendererVersion: '1.0.0',
    },
  },

  // ───────────────────── 2. Form Wizard ─────────────────────
  {
    title: 'User Registration Form',
    prompt: 'Build a multi-step registration form with personal info, preferences, and a review step.',
    schema: {
      type: 'container',
      props: { maxWidth: 800, padding: 16 },
      children: [
        { type: 'heading', props: { text: 'Create Your Account', level: 2 } },
        {
          type: 'stepper',
          props: {
            steps: [
              { label: 'Personal Info', description: 'Name and email' },
              { label: 'Preferences', description: 'Customize experience' },
              { label: 'Review', description: 'Confirm details' },
            ],
            activeStep: 0,
            orientation: 'horizontal',
          },
        },
        {
          type: 'card',
          props: { title: 'Personal Information', padding: 16, elevated: true },
          children: [
            {
              type: 'grid',
              props: { columns: 2, gap: 12 },
              children: [
                { type: 'input', props: { label: 'First Name', placeholder: 'John', type: 'text' } },
                { type: 'input', props: { label: 'Last Name', placeholder: 'Doe', type: 'text' } },
                { type: 'input', props: { label: 'Email', placeholder: 'john@example.com', type: 'email' } },
                { type: 'input', props: { label: 'Phone', placeholder: '+1 (555) 000-0000', type: 'tel' } },
              ],
            },
            {
              type: 'select',
              props: {
                label: 'Country',
                options: [
                  { label: 'United States', value: 'us' },
                  { label: 'United Kingdom', value: 'uk' },
                  { label: 'Canada', value: 'ca' },
                  { label: 'India', value: 'in' },
                ],
                placeholder: 'Select your country',
              },
            },
            {
              type: 'textarea',
              props: { label: 'Bio', placeholder: 'Tell us about yourself...', rows: 3 },
            },
            {
              type: 'flexbox',
              props: { gap: 8, direction: 'row', justifyContent: 'flex-end' },
              children: [
                { type: 'button', props: { label: 'Next Step', variant: 'primary' } },
              ],
            },
          ],
        },
      ],
      manifestVersion: '1.0.0-0e52acecde36',
      rendererVersion: '1.0.0',
    },
  },

  // ───────────────────── 3. Data Explorer ─────────────────────
  {
    title: 'Employee Directory',
    prompt: 'Create an employee directory with a data table, search filter, and department breakdown.',
    schema: {
      type: 'split-layout',
      props: { gap: 12, position: 'left', sidebarWidth: '30%' },
      children: [
        {
          type: 'flexbox',
          props: { gap: 12, direction: 'column', padding: 12 },
          children: [
            { type: 'heading', props: { text: 'Filters', level: 4 } },
            { type: 'input', props: { label: 'Search', placeholder: 'Search employees...', type: 'search' } },
            {
              type: 'select',
              props: {
                label: 'Department',
                options: [
                  { label: 'All Departments', value: 'all' },
                  { label: 'Engineering', value: 'eng' },
                  { label: 'Design', value: 'design' },
                  { label: 'Marketing', value: 'marketing' },
                  { label: 'Sales', value: 'sales' },
                ],
              },
            },
            {
              type: 'checkbox',
              props: { label: 'Remote only', checked: false },
            },
            {
              type: 'radio',
              props: {
                label: 'Status',
                options: [
                  { label: 'All', value: 'all' },
                  { label: 'Active', value: 'active' },
                  { label: 'On Leave', value: 'leave' },
                ],
                value: 'all',
              },
            },
            {
              type: 'list',
              props: {
                items: [
                  { label: 'Engineering', description: '42 members' },
                  { label: 'Design', description: '18 members' },
                  { label: 'Marketing', description: '24 members' },
                  { label: 'Sales', description: '31 members' },
                ],
                styled: true,
              },
            },
          ],
        },
        {
          type: 'flexbox',
          props: { gap: 12, direction: 'column', padding: 12 },
          children: [
            { type: 'heading', props: { text: 'Employee Directory', level: 3 } },
            {
              type: 'table',
              props: {
                columns: [
                  { key: 'name', label: 'Name' },
                  { key: 'department', label: 'Department' },
                  { key: 'role', label: 'Role' },
                  { key: 'location', label: 'Location' },
                  { key: 'status', label: 'Status' },
                ],
                rows: [
                  { name: 'Alice Chen', department: 'Engineering', role: 'Staff Engineer', location: 'San Francisco', status: 'Active' },
                  { name: 'Bob Williams', department: 'Design', role: 'Senior Designer', location: 'Remote', status: 'Active' },
                  { name: 'Carol Davis', department: 'Marketing', role: 'Marketing Lead', location: 'New York', status: 'Active' },
                  { name: 'Dan Kumar', department: 'Engineering', role: 'Tech Lead', location: 'Bangalore', status: 'Active' },
                  { name: 'Eve Martinez', department: 'Sales', role: 'Account Executive', location: 'Remote', status: 'On Leave' },
                ],
                striped: true,
              },
            },
          ],
        },
      ],
      manifestVersion: '1.0.0-0e52acecde36',
      rendererVersion: '1.0.0',
    },
  },

  // ───────────────────── 4. Content Page ─────────────────────
  {
    title: 'Project Timeline & Status',
    prompt: 'Show me a project overview with a timeline, task list, team status accordion, and alerts.',
    schema: {
      type: 'container',
      props: { maxWidth: 1000, padding: 16 },
      children: [
        { type: 'heading', props: { text: 'Project Mercury — Status Report', level: 2 } },
        { type: 'alert', props: { message: 'Sprint 14 ends in 3 days. 2 blockers remain.', variant: 'warning' } },
        {
          type: 'grid',
          props: { columns: 2, gap: 12 },
          children: [
            {
              type: 'card',
              props: { title: 'Sprint Timeline', padding: 12, elevated: true },
              children: [
                {
                  type: 'timeline',
                  props: {
                    events: [
                      { title: 'Sprint Planning', date: '2026-02-01', description: 'Defined scope with 24 story points', status: 'completed' },
                      { title: 'Backend API Complete', date: '2026-02-05', description: 'REST endpoints deployed to staging', status: 'completed' },
                      { title: 'Frontend Integration', date: '2026-02-10', description: 'UI components connected to API', status: 'active' },
                      { title: 'QA Testing', date: '2026-02-13', description: 'Automated + manual test passes', status: 'upcoming' },
                      { title: 'Production Release', date: '2026-02-15', description: 'Deploy to production', status: 'upcoming' },
                    ],
                  },
                },
              ],
            },
            {
              type: 'flexbox',
              props: { gap: 12, direction: 'column' },
              children: [
                {
                  type: 'card',
                  props: { title: 'Sprint Progress', padding: 12, elevated: true },
                  children: [
                    { type: 'progress-bar', props: { value: 68, max: 100, label: 'Overall Progress', variant: 'info' } },
                    { type: 'progress-bar', props: { value: 92, max: 100, label: 'Backend Tasks', variant: 'success' } },
                    { type: 'progress-bar', props: { value: 45, max: 100, label: 'Frontend Tasks', variant: 'warning' } },
                  ],
                },
                {
                  type: 'accordion',
                  props: {
                    items: [
                      { title: 'Engineering Team', content: 'Alice (Tech Lead), Bob (Backend), Carol (Frontend), Dan (DevOps) — All active, no blockers on backend.', expanded: true },
                      { title: 'Design Team', content: 'Eve (UX Lead), Frank (Visual) — Design review complete. Handoff done for all remaining screens.' },
                      { title: 'QA Team', content: 'Grace (QA Lead) — Test plan written. Waiting for frontend integration to begin E2E testing.' },
                    ],
                  },
                },
              ],
            },
          ],
        },
        { type: 'divider', props: {} },
        {
          type: 'card',
          props: { title: 'Blockers', padding: 12, elevated: true },
          children: [
            {
              type: 'list',
              props: {
                items: [
                  { label: 'MERC-142: OAuth token refresh fails on expired sessions', description: 'Priority: High — Assigned to Bob' },
                  { label: 'MERC-158: Chart rendering lag on large datasets (>10K rows)', description: 'Priority: Medium — Assigned to Carol' },
                ],
                styled: true,
              },
            },
          ],
        },
      ],
      manifestVersion: '1.0.0-0e52acecde36',
      rendererVersion: '1.0.0',
    },
  },

  // ───────────────────── 5. Flow Visualization with Tabs ─────────────────────
  {
    title: 'CI/CD Pipeline Architecture',
    prompt: 'Show a CI/CD pipeline flow diagram with tabs for Build, Test, and Deploy stages.',
    schema: {
      type: 'container',
      props: { maxWidth: 1100, padding: 16 },
      children: [
        { type: 'heading', props: { text: 'CI/CD Pipeline Architecture', level: 2 } },
        {
          type: 'tabs',
          props: {
            tabs: [
              { label: 'Full Pipeline', value: 'pipeline' },
              { label: 'Build Stage', value: 'build' },
              { label: 'Deploy Stage', value: 'deploy' },
            ],
            defaultTab: 'pipeline',
          },
          children: [
            // Tab 1: Full pipeline flow
            {
              type: 'flexbox',
              props: { gap: 12, direction: 'column', padding: 8 },
              children: [
                {
                  type: 'flow-diagram',
                  props: {
                    nodes: [
                      { id: 'commit', label: 'Git Commit', type: 'process', icon: 'git-commit' },
                      { id: 'lint', label: 'Lint & Format', type: 'process', icon: 'check-circle' },
                      { id: 'build', label: 'Build', type: 'process', icon: 'package' },
                      { id: 'test', label: 'Test Suite', type: 'decision', icon: 'flask-conical' },
                      { id: 'staging', label: 'Deploy Staging', type: 'process', icon: 'server' },
                      { id: 'approval', label: 'Manual Approval', type: 'decision', icon: 'shield-check' },
                      { id: 'production', label: 'Deploy Prod', type: 'process', icon: 'rocket' },
                    ],
                    connections: [
                      { from: 'commit', to: 'lint', label: 'trigger' },
                      { from: 'lint', to: 'build', label: 'pass' },
                      { from: 'build', to: 'test', label: 'artifacts' },
                      { from: 'test', to: 'staging', label: 'all pass' },
                      { from: 'staging', to: 'approval', label: 'smoke tests' },
                      { from: 'approval', to: 'production', label: 'approved' },
                    ],
                  },
                },
                { type: 'paragraph', props: { text: 'End-to-end pipeline from commit to production. All stages run on GitHub Actions with Docker-based builds.' } },
              ],
            },
            // Tab 2: Build details
            {
              type: 'split-layout',
              props: { gap: 12, position: 'left', sidebarWidth: '40%' },
              children: [
                {
                  type: 'list',
                  props: {
                    items: [
                      { label: 'Install Dependencies', description: 'npm ci --legacy-peer-deps (~45s)' },
                      { label: 'Generate Schema', description: 'npm run generate:schema (~5s)' },
                      { label: 'Build Backend', description: 'nx build backend --prod (~30s)' },
                      { label: 'Build Frontend', description: 'nx build frontend --prod (~60s)' },
                      { label: 'Docker Image', description: 'Multi-stage build + push to GHCR (~90s)' },
                    ],
                    styled: true,
                  },
                },
                {
                  type: 'card',
                  props: { title: 'Build Metrics', padding: 12, elevated: true },
                  children: [
                    { type: 'stats-card', props: { label: 'Avg Build Time', value: '3m 48s', trend: -12, icon: 'clock' } },
                    { type: 'progress-ring', props: { value: 96, max: 100, label: 'Success Rate', size: 120 } },
                  ],
                },
              ],
            },
            // Tab 3: Deploy details
            {
              type: 'flexbox',
              props: { gap: 12, direction: 'column', padding: 8 },
              children: [
                { type: 'alert', props: { message: 'Production deploys require manual approval from a maintainer.', variant: 'info' } },
                {
                  type: 'table',
                  props: {
                    columns: [
                      { key: 'env', label: 'Environment' },
                      { key: 'version', label: 'Version' },
                      { key: 'status', label: 'Status' },
                      { key: 'deployed', label: 'Last Deployed' },
                    ],
                    rows: [
                      { env: 'Staging', version: 'v2.4.1-rc.3', status: 'Running', deployed: '10 min ago' },
                      { env: 'Production', version: 'v2.4.0', status: 'Running', deployed: '3 days ago' },
                      { env: 'Preview (PR #42)', version: 'feat/tabs-fix', status: 'Building', deployed: 'In progress' },
                    ],
                    striped: true,
                  },
                },
              ],
            },
          ],
        },
      ],
      manifestVersion: '1.0.0-0e52acecde36',
      rendererVersion: '1.0.0',
    },
  },

  // ───────────────────── 6. Media Gallery ─────────────────────
  {
    title: 'Podcast & Media Library',
    prompt: 'Build a media library page with a featured video, audio playlist, and image carousel.',
    schema: {
      type: 'container',
      props: { maxWidth: 1000, padding: 16 },
      children: [
        { type: 'heading', props: { text: 'Media Library', level: 2 } },
        { type: 'paragraph', props: { text: 'Browse our curated collection of tech talks, podcasts, and visual content.' } },
        {
          type: 'grid',
          props: { columns: 2, gap: 12 },
          children: [
            {
              type: 'card',
              props: { title: 'Featured Talk', padding: 12, elevated: true },
              children: [
                {
                  type: 'video-player',
                  props: {
                    src: 'https://www.w3schools.com/html/mov_bbb.mp4',
                    title: 'Building Scalable UIs with Angular Signals',
                    autoplay: false,
                  },
                },
              ],
            },
            {
              type: 'card',
              props: { title: 'Podcast Episodes', padding: 12, elevated: true },
              children: [
                {
                  type: 'audio-player',
                  props: {
                    src: 'https://www.w3schools.com/html/horse.mp3',
                    title: 'Episode 42: The Future of AI-Generated UIs',
                  },
                },
                { type: 'divider', props: {} },
                {
                  type: 'audio-player',
                  props: {
                    src: 'https://www.w3schools.com/html/horse.mp3',
                    title: 'Episode 41: NestJS Performance Deep-Dive',
                  },
                },
              ],
            },
          ],
        },
        {
          type: 'card',
          props: { title: 'Design Showcase', padding: 12, elevated: true },
          children: [
            {
              type: 'carousel',
              props: {
                items: [
                  { title: 'Dashboard V2', description: 'Glassmorphic dark theme redesign', imageUrl: 'https://placehold.co/800x400/1a1a2e/00fff5?text=Dashboard+V2' },
                  { title: 'Mobile App', description: 'Cross-platform Flutter prototype', imageUrl: 'https://placehold.co/800x400/1a1a2e/5b4aff?text=Mobile+App' },
                  { title: 'Component Library', description: '35 production-ready components', imageUrl: 'https://placehold.co/800x400/1a1a2e/ff6b6b?text=Component+Library' },
                ],
                autoplay: true,
                interval: 5000,
              },
            },
          ],
        },
        {
          type: 'flexbox',
          props: { gap: 8, direction: 'row', justifyContent: 'center' },
          children: [
            { type: 'badge', props: { text: 'Videos: 12', variant: 'info' } },
            { type: 'badge', props: { text: 'Podcasts: 42', variant: 'success' } },
            { type: 'badge', props: { text: 'Images: 86', variant: 'default' } },
          ],
        },
      ],
      manifestVersion: '1.0.0-0e52acecde36',
      rendererVersion: '1.0.0',
    },
  },
];
