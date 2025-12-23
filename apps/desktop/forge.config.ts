import type { ForgeConfig } from '@electron-forge/shared-types';
import { VitePlugin } from '@electron-forge/plugin-vite';

const config: ForgeConfig = {
    packagerConfig: {
        name: 'ValoHub',
        executableName: 'ValoHub',
        asar: true,
        // icon: './resources/icon', // .ico will be appended on Windows
    },
    rebuildConfig: {},
    makers: [
        {
            name: '@electron-forge/maker-squirrel',
            config: {
                name: 'ValoHub',
                // setupIcon: './resources/icon.ico',
            },
        },
        {
            name: '@electron-forge/maker-zip',
            platforms: ['darwin', 'linux', 'win32'],
            config: {},
        },
    ],
    plugins: [
        new VitePlugin({
            // The build array specifies the main and preload builds
            build: [
                {
                    // Main process entry
                    entry: 'src/main/index.ts',
                    config: 'vite.main.config.ts',
                    target: 'main',
                },
                {
                    // Preload script entry
                    entry: 'src/preload/index.ts',
                    config: 'vite.preload.config.ts',
                    target: 'preload',
                },
            ],
            renderer: [
                {
                    name: 'main_window',
                    config: 'vite.renderer.config.ts',
                },
            ],
        }),
    ],
};

export default config;
