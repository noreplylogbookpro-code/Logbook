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
      const masterDest = path.resolve('public', 'master', 'index.html');
      const helpdeskDest = path.resolve('public', 'helpdesk', 'index.html');

      fs.mkdirSync(path.dirname(masterDest), { recursive: true });
      fs.mkdirSync(path.dirname(helpdeskDest), { recursive: true });

      const defaultTitle = '<title>Logbook Plus | Modern Expense Intelligence</title>';
      let html = fs.readFileSync(src, 'utf8');

      // Update title for master console
      let masterHtml = html.replace(defaultTitle, '<title>Logbook Plus | Master Console</title>');
      fs.writeFileSync(masterDest, masterHtml);
      console.log('[copy-master-html] public/master/index.html updated');

      // Update title for helpdesk console
      let helpdeskHtml = html.replace(defaultTitle, '<title>Logbook Plus | IT Helpdesk</title>');
      fs.writeFileSync(helpdeskDest, helpdeskHtml);
      console.log('[copy-master-html] public/helpdesk/index.html updated');
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
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('framer-motion')) {
              return 'vendor-motion';
            }
          }
        },
      },
    },
  },
});
