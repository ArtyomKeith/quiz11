import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Увеличиваем лимит предупреждения, чтобы Vercel не ругался в логах
    chunkSizeWarningLimit: 1600, 
    rollupOptions: {
      output: {
        // Убираем manualChunks, чтобы Vite сам решил, как лучше разбить файлы.
        // Это безопаснее и предотвращает ошибки "белого экрана" из-за порядка загрузки.
        manualChunks: undefined 
      }
    }
  }
});
