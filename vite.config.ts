import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { fileURLToPath, URL } from 'url';
import path from 'path-browserify';
import sass from 'sass';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
    css: {
        preprocessorOptions: {
            scss: {
                additionalData: '@use "sass:math";'
            }
        }
    },
    plugins: [
        dts({
            insertTypesEntry: true,
            exclude: ['src/**/*.test.ts', 'src/**/*.stories.ts'],
        }),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },

    build: {
        lib: {
            entry: path.resolve(__dirname, 'src/index.ts'),
            name: 'DBConnector',
            formats: ['es', 'cjs', 'umd'],
            fileName: (format) => `db-connector.${format}.js`,
        },
        rollupOptions: {
            external: ['lit', 'lit/decorators.js'],
            output: {
                globals: {
                    lit: 'Lit',
                    'lit/decorators.js': 'LitDecorators'
                },
                exports: 'named',
            }
        },
        sourcemap: true,
        minify: 'esbuild',
    },
})