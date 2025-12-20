import { defineConfig } from 'vite';
import { resolve } from 'path';

// This renderer config is used by Electron Forge Vite plugin
// In development, it sets up HMR for the renderer process
// In production, it builds the renderer bundle

export default defineConfig({
    root: resolve(__dirname, 'src/renderer'),
    base: './',
    build: {
        outDir: resolve(__dirname, '.vite/renderer/main_window'),
        emptyOutDir: true,
        rollupOptions: {
            input: resolve(__dirname, 'src/renderer/index.html'),
        },
    },
    // In dev mode, we actually use the web app on localhost:8080
    // This config is mainly for production builds
    server: {
        port: 5173,
    },
});
