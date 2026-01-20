import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode`. 
  // Setting the third param to '' loads all variables from the system environment (Netlify).
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // Netlify often uses VITE_ prefix for Vite apps, but we check both for flexibility.
      'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || env.API_KEY || ""),
    },
    build: {
      outDir: 'dist',
      sourcemap: true
    }
  };
});