import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import react from '@vitejs/plugin-react-swc';
import mkcert from 'vite-plugin-mkcert';
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  base: '/tma-dns/',
  plugins: [
    react(),
    tsconfigPaths(),
    process.env.HTTPS && mkcert(),
    nodePolyfills(),
  ],
  publicDir: './public',
  server: {
    host: true,
    allowedHosts: true,
  },
});
