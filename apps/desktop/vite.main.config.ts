import { defineConfig } from 'vite';
import { resolve, dirname } from 'path';
import { builtinModules } from 'module';
import { fileURLToPath } from 'url';

// ESM polyfill for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirnameConfig = dirname(__filename);

// https://vitejs.dev/config
export default defineConfig({
    resolve: {
        alias: {
            '@shared': resolve(__dirnameConfig, '../../packages/shared/src'),
            '@main': resolve(__dirnameConfig, 'src/main'),
        },
    },
    // Define __dirname and __filename for the built code
    define: {
        '__dirname': 'import.meta.dirname',
        '__filename': 'import.meta.filename',
        'import.meta.env.VITE_SUPABASE_URL': JSON.stringify("https://yblnsfkhqsfsnrevivpy.supabase.co"),
        'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlibG5zZmtocXNmc25yZXZpdnB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NDUwMjMsImV4cCI6MjA3OTEyMTAyM30.hV0Sgx0SE5isMUWZbb_onyrdtOruVCp3EdBunJ5HhKM"),
    },
    build: {
        // Electron main process runs in Node.js environment
        target: 'node20',
        outDir: '.vite/build',
        lib: {
            entry: 'src/main/index.ts',
            formats: ['es'],
            fileName: () => 'main.mjs',
        },
        rollupOptions: {
            external: [
                'electron',
                ...builtinModules,
                ...builtinModules.map((m) => `node:${m}`),
            ],
        },
        minify: false,
        sourcemap: true,
    },
});
