import type { Config } from 'tailwindcss';
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {
    colors: { ios: { background: '#F2F2F7', card: '#FFFFFF', text: '#000000', secondary: '#8E8E93', blue: '#007AFF', green: '#34C759', orange: '#FF9500', red: '#FF3B30' } },
    borderRadius: { card: '16px', button: '10px', input: '12px' },
    fontFamily: { sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"SF Pro Text"', '"PingFang SC"', '"Microsoft YaHei"', 'sans-serif'] },
    fontSize: { largeTitle: ['34px', { fontWeight: '700' }], title2: ['22px', { fontWeight: '700' }], body: '17px', footnote: '13px' }
  } }, plugins: []
} satisfies Config;
