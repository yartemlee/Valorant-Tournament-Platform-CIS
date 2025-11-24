import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify("https://yblnsfkhqsfsnrevivpy.supabase.co"),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlibG5zZmtocXNmc25yZXZpdnB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NDUwMjMsImV4cCI6MjA3OTEyMTAyM30.hV0Sgx0SE5isMUWZbb_onyrdtOruVCp3EdBunJ5HhKM"),
    }
  };
});
