/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './apps/frontend/src/**/*.{html,ts}',
    './libs/**/*.{html,ts}',
    './libs/design-system/src/lib/**/*.css'
  ],
  theme: {
    extend: {
      colors: {
        ds: {
          bg: 'var(--ds-bg)',
          surface: 'var(--ds-surface)',
          elevated: 'var(--ds-surface-elevated)',
          text: {
            primary: 'var(--ds-text-primary)',
            secondary: 'var(--ds-text-secondary)'
          },
          border: 'var(--ds-border)'
        },
        accent: {
          teal: 'var(--ds-accent-teal)',
          indigo: 'var(--ds-accent-indigo)',
          violet: 'var(--ds-accent-violet)',
          lime: 'var(--ds-accent-lime)'
        }
      },
      fontFamily: {
        display: ['var(--ds-font-display)'],
        body: ['var(--ds-font-body)']
      },
      borderRadius: {
        sm: 'var(--ds-radius-sm)',
        md: 'var(--ds-radius-md)',
        lg: 'var(--ds-radius-lg)'
      },
      boxShadow: {
        soft: 'var(--ds-shadow-soft)',
        glow: 'var(--ds-shadow-glow)'
      }
    }
  },
  plugins: []
};
