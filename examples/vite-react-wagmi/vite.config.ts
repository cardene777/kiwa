import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  preview: {
    port: 5180,
    strictPort: true,
  },
  server: {
    port: 5180,
    strictPort: true,
  },
  build: {
    rollupOptions: {
      external: ['@react-native-async-storage/async-storage'],
    },
  },
  optimizeDeps: {
    exclude: ['@react-native-async-storage/async-storage'],
  },
});
