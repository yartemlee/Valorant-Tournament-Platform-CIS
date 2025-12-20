/**
 * Wrapper script to run electron-forge from the correct directory
 * This is needed because electron-forge must be run from the package directory
 * but npm workspaces installs dependencies in the root node_modules
 */

import { spawn } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const desktopDir = resolve(rootDir, 'apps/desktop');
const forgePath = resolve(rootDir, 'node_modules/@electron-forge/cli/dist/electron-forge.js');

// Get command from args (default: start)
const command = process.argv[2] || 'start';

console.log(`Running electron-forge ${command} from ${desktopDir}`);

// Spawn electron-forge with cwd set to desktop directory
const child = spawn('node', [forgePath, command], {
    cwd: desktopDir,
    stdio: 'inherit',
    shell: true,
    env: {
        ...process.env,
        // Ensure node can find modules in root node_modules
        NODE_PATH: resolve(rootDir, 'node_modules')
    }
});

child.on('close', (code) => {
    process.exit(code || 0);
});

child.on('error', (err) => {
    console.error('Failed to start electron-forge:', err);
    process.exit(1);
});
