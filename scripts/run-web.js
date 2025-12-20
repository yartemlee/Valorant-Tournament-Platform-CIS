/**
 * Wrapper script to run vite from the correct directory (apps/web)
 * This ensures Tailwind and other configs are found correctly
 */

import { spawn } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const webDir = resolve(rootDir, 'apps/web');
const vitePath = resolve(rootDir, 'node_modules/vite/bin/vite.js');

// Get command from args (default: dev with port 8080)
const command = process.argv[2] || '';
const args = command ? [vitePath, command] : [vitePath, '--port', '8080'];

console.log(`Running vite ${command || 'dev'} from ${webDir}`);

// Spawn vite with cwd set to web directory
const child = spawn('node', args, {
    cwd: webDir,
    stdio: 'inherit',
    shell: true,
    env: {
        ...process.env,
        NODE_PATH: resolve(rootDir, 'node_modules')
    }
});

child.on('close', (code) => {
    process.exit(code || 0);
});

child.on('error', (err) => {
    console.error('Failed to start vite:', err);
    process.exit(1);
});
