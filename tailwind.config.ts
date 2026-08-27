import type { Config } from 'tailwindcss';
export default { content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'], theme: { extend: { colors: { ink: '#111827', plum: '#6d28d9' }, boxShadow: { glow: '0 18px 50px rgba(109,40,217,.22)' } } }, plugins: [] } satisfies Config;
