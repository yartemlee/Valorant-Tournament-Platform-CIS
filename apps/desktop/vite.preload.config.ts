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
        },
    },
    // Define __dirname and __filename for the built code
    define: {
        '__dirname': 'import.meta.dirname',
        '__filename': 'import.meta.filename',
    },
    build: {
        // Preload scripts run in a sandboxed renderer environment
        target: 'node20',
        outDir: '.vite/build',
        lib: {
            entry: 'src/preload/index.ts',
            formats: ['cjs'],
            fileName: () => 'index.js',
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
