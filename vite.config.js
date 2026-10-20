import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import https from 'node:https';

const agent = new https.Agent({ rejectUnauthorized: false });

function ttsProxyPlugin() {
  return {
    name: 'tts-proxy-plugin',
    configureServer(server) {
      server.middlewares.use('/api/tts', (req, res) => {
        try {
          const urlObj = new URL(req.url, 'http://localhost');
          const tl = urlObj.searchParams.get('tl') || 'en';
          const q = urlObj.searchParams.get('q') || '';
          
          if (!q) {
            res.statusCode = 400;
            res.end('Missing text query q');
            return;
          }

          const targetUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(tl)}&client=tw-ob&q=${encodeURIComponent(q.slice(0, 180))}`;

          const request = https.get(targetUrl, {
            agent,
            headers: {
              'Referer': 'https://translate.google.com/',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          }, (proxyRes) => {
            if (proxyRes.statusCode !== 200) {
              res.statusCode = proxyRes.statusCode;
              res.end('TTS Upstream Error');
              return;
            }
            res.setHeader('Content-Type', 'audio/mpeg');
            res.setHeader('Cache-Control', 'public, max-age=86400');
            res.setHeader('Access-Control-Allow-Origin', '*');
            proxyRes.pipe(res);
          });

          request.on('error', (err) => {
            console.error('[TTS Proxy Error]:', err.message);
            res.statusCode = 502;
            res.end('TTS Connection Error');
          });
        } catch (e) {
          res.statusCode = 500;
          res.end('Server Exception: ' + e.message);
        }
      });

      // Real-Time IP Geolocation Proxy
      server.middlewares.use('/api/location', (req, res) => {
        https.get('https://ipwho.is/', { agent }, (proxyRes) => {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          proxyRes.pipe(res);
        }).on('error', (err) => {
          res.statusCode = 500;
          res.end(JSON.stringify({ success: false, error: err.message }));
        });
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), ttsProxyPlugin()],
  css: {
    postcss: {
      plugins: [
        tailwindcss,
        autoprefixer,
      ],
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});
