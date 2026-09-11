import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      // السماح بإنشاء الحزم وتجاوز الوحدات غير المتوافقة مع المتصفح
      external: [],
      onwarn(warning, warn) {
        // تجاهل تحذيرات الاستدعاءات التي قد تعطل البناء على Render
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
        warn(warning);
      },
    },
  },
  define: {
    // تعريف متغيرات البيئة الخاصة بـ Node للعمل داخل المتصفح بأمان
    'process.env': {},
  },
});
