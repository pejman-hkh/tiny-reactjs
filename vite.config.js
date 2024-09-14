import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [],
  esbuild: {
    jsxFactory: 'h',    // استفاده از تابع h به جای React.createElement
    jsxFragment: 'Fragment', // اگر از Fragment استفاده می‌کنید
  },
});
