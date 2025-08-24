


import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: Number(env.VITE_APP_PORT) || 4173,
    },
    preview: {
      host: '0.0.0.0',
      port: Number(env.VITE_APP_PORT) || 4173,
    },
    build: {
      sourcemap: true,
    }
  };
});
