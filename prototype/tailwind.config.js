/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'sb-brand':       '#0746CA',
        'sb-brand-hover': '#0C3698',
        'sb-brand-heavy': '#122666',
        'sb-blue-100':    '#F2F6FF',
        'sb-blue-150':    '#DEEAFF',
        'sb-n50':  '#F8FAFC',
        'sb-n100': '#F1F5F9',
        'sb-n150': '#EAEFF5',
        'sb-n200': '#E2E8F0',
        'sb-n300': '#CBD5E1',
        'sb-n400': '#94A3B8',
        'sb-n500': '#64748B',
        'sb-n600': '#334155',
        'sb-n700': '#293548',
        'sb-n800': '#1E293B',
        'sb-n900': '#0F172A',
        'sb-positive': '#00C592',
        'sb-warning':  '#FF6200',
        'sb-negative': '#F91C1C',
        'sb-negative-light': '#FFEFEF',
      },
      fontFamily: {
        sans: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'Apple SD Gothic Neo', 'Malgun Gothic', 'sans-serif'],
      },
      boxShadow: {
        'sb-100': '0 2px 8px 0 rgba(15,23,42,0.08)',
        'sb-200': '0 2px 16px 0 rgba(15,23,42,0.10)',
        'sb-300': '0 0 1px 0 rgba(15,23,42,0.08), 0 4px 20px 2px rgba(15,23,42,0.12)',
        'sb-400': '0 0 1px 0 rgba(15,23,42,0.08), 0 6px 24px 6px rgba(15,23,42,0.16)',
      },
      borderRadius: {
        'sb-sm': '4px',
        'sb-md': '8px',
        'sb-lg': '12px',
        'sb-xl': '16px',
      },
    },
  },
  plugins: [],
}
