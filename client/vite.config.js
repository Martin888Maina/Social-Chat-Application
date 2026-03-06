import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        port: 3000,
    },
    esbuild: {
        // all .js files in this project contain JSX — tell esbuild to handle them
        loader: 'jsx',
        include: /src\/.*\.js$/,
    },
    optimizeDeps: {
        esbuildOptions: {
            loader: {
                '.js': 'jsx',
            },
        },
    },
});
