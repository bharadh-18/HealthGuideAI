
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // The third parameter '' allows loading all environment variables, not just those prefixed with VITE_
  // Fix: Property 'cwd' does not exist on type 'Process'. Using '.' which refers to the project root.
  const env = loadEnv(mode, '.', '');
  
  return {
    plugins: [react()],
    define: {
      // This ensures that process.env.API_KEY is available in the browser during runtime
      'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || env.API_KEY || ""),
    }
  };
});
