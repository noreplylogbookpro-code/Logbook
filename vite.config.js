import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

// Plugin: after every build, copy public/index.html → public/master/index.html
// so the master.* subdomain always has the correct asset hashes.
function copyMasterHtml() {
  return {
    name: 'copy-master-html',
    closeBundle() {
      const src = path.resolve('public', 'index.html');
      const dest = path.resolve('public', 'master', 'index.html');
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      let html = fs.readFileSync(src, 'utf8');
      // Update title for master console
      html = html.replace(
        '<title>Logbook Plus | Modern Expense Intelligence</title>',
        '<title>Logbook Plus | Master Console</title>'
      );
      fs.writeFileSync(dest, html);
      console.log('[copy-master-html] public/master/index.html updated');
    }
  };
}

export default defineConfig({
  plugins: [react(), copyMasterHtml()],
  server: {
    port: 3000,
    watch: {
      ignored: ['**/server_logs.db*', '**/server_users.db*', '**/*.db*']
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'public',
    emptyOutDir: false, // Do not wipe out static about, pricing, careers, etc. folders in public
    assetsDir: 'dist-assets', // Save CSS and JS bundles here
  },
});
