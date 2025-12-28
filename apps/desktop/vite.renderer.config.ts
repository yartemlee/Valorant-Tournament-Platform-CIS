import { defineConfig, Plugin } from 'vite';
import { resolve } from 'path';
import react from '@vitejs/plugin-react-swc';

// This renderer config is used by Electron Forge Vite plugin
// In development, it sets up HMR for the renderer process
// In production, it builds the renderer bundle

// Custom plugin to remove crossorigin attribute from script/link tags
// This is required for Electron to load assets from file:// protocol
function removeCrossOrigin(): Plugin {
    return {
        name: 'remove-crossorigin',
        enforce: 'post',
        transformIndexHtml(html) {
            return html.replace(/ crossorigin(="")?/g, '');
        },
    };
}

export default defineConfig({
    plugins: [react(), removeCrossOrigin()],
    root: resolve(__dirname, '../web'),
    base: './',
    build: {
        outDir: resolve(__dirname, '.vite/renderer/main_window'),
        emptyOutDir: true,
        rollupOptions: {
            input: resolve(__dirname, '../web/index.html'),
        },
    },
    resolve: {
        alias: {
            "@": resolve(__dirname, "../web/src"),
            "@shared": resolve(__dirname, "../../packages/shared/src"),
        },
        // Dedupe ensures only one copy of these packages is used
        dedupe: ["react", "react-dom"],
    },
    define: {
        'import.meta.env.VITE_SUPABASE_URL': JSON.stringify("https://yblnsfkhqsfsnrevivpy.supabase.co"),
        'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlibG5zZmtocXNmc25yZXZpdnB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NDUwMjMsImV4cCI6MjA3OTEyMTAyM30.hV0Sgx0SE5isMUWZbb_onyrdtOruVCp3EdBunJ5HhKM"),
    },
    css: {
        postcss: {
            plugins: [
                require('tailwindcss')(require('./tailwind.config.cjs')),
                require('autoprefixer')
            ]
        }
    },
    // In dev mode, we actually use the web app on localhost:8080
    // This config is mainly for production builds
    server: {
        port: 5173,
    },
});
