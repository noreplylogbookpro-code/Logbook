import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

// Plugin: after every build, copy public/index.html → public/master/index.html & helpdesk/index.html
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

function serveAssetsPlugin() {
  return {
    name: 'serve-assets',
    configureServer(server) {
      server.middlewares.use('/assets', (req, res, next) => {
        const reqPath = (req.url || '').split('?')[0].replace(/^\//, '');
        const filePath = path.resolve('assets', reqPath);
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          const ext = path.extname(filePath).toLowerCase();
          const mimeTypes = {
            '.webp': 'image/webp',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.svg': 'image/svg+xml',
            '.gif': 'image/gif'
          };
          res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
          return fs.createReadStream(filePath).pipe(res);
        }
        next();
      });
    }
  };
}

export default defineConfig({
  publicDir: false,
  plugins: [react(), copyMasterHtml(), serveAssetsPlugin()],
  server: {
    port: 3000,
    watch: {
      ignored: ['**/server_users.json*', '**/server_2fa.json*', '**/server_changelog.json*', '**/server_licenses.json*', '**/server_logs.json*', '**/*.db*']
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'public',
    emptyOutDir: false,
    assetsDir: 'dist-assets',
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
