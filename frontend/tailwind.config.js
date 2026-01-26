module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        'primary-dark': 'var(--color-primary-dark)',
        secondary: 'var(--color-secondary)',
        accent: 'var(--color-accent)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        danger: 'var(--color-danger)',
        info: 'var(--color-info)',
        muted: 'var(--color-muted)',
        surface: 'var(--color-surface)',
        'surface-strong': 'var(--color-surface-strong)',
        border: 'var(--color-border)',
        text: 'var(--color-text)',
        'text-muted': 'var(--color-text-muted)',
        light: 'var(--color-light)',
        dark: 'var(--color-dark)',
      },
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: 'var(--shadow-soft)',
        card: 'var(--shadow-card)',
      },
    },
  },
  plugins: [],
}
