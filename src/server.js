'use strict';

const express = require('express');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { VIEWS_DIR, LIB_DIR, DEFAULT_PORT, ensureDirs } = require('./config');
const viewRoutes = require('./routes/views');
const fsRoutes = require('./routes/fs');
const sysRoutes = require('./routes/sys');
const projectRoutes = require('./routes/project');

function openBrowser(url) {
  const platform = process.platform;
  try {
    if (platform === 'darwin') {
      spawn('open', [url], { stdio: 'ignore', detached: true }).unref();
    } else if (platform === 'win32') {
      spawn('cmd', ['/c', 'start', '', url], {
        stdio: 'ignore', detached: true, windowsVerbatimArguments: true,
      }).unref();
    } else {
      spawn('xdg-open', [url], { stdio: 'ignore', detached: true }).unref();
    }
  } catch {
    // Silently ignore - user can open manually
  }
}

async function startServer(options = {}) {
  const port = options.port || process.env.VULCAN_PORT || DEFAULT_PORT;
  const shouldOpen = options.open !== false;

  ensureDirs();

  // Create welcome page if it doesn't exist
  const welcomePath = path.join(VIEWS_DIR, 'index.html');
  if (!fs.existsSync(welcomePath)) {
    const welcomeSource = path.join(__dirname, '..', 'assets', 'welcome.html');
    if (fs.existsSync(welcomeSource)) {
      fs.copyFileSync(welcomeSource, welcomePath);
    }
  }

  const app = express();

  // Middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // CORS
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
  });

  // Request logging
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      if (req.path.startsWith('/api/')) {
        console.log(`  ${req.method} ${req.path} → ${res.statusCode} (${duration}ms)`);
      }
    });
    next();
  });

  // API routes
  app.use('/api', viewRoutes);
  app.use('/api', fsRoutes);
  app.use('/api', sysRoutes);
  app.use('/api', projectRoutes);

  // Serve bridge.js
  app.get('/bridge.js', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'assets', 'bridge.js'));
  });

  // Serve built-in libraries at /lib/*
  app.use('/lib', express.static(LIB_DIR));

  // Serve views
  app.use('/view', express.static(VIEWS_DIR));

  // Root redirect
  app.get('/', (req, res) => {
    res.redirect('/view/index.html');
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      viewsDir: VIEWS_DIR,
      port: port,
    });
  });

  // Error handler
  app.use((err, req, res, _next) => {
    console.error(`  ❌ Error: ${err.message}`);
    res.status(500).json({ error: err.message });
  });

  return new Promise((resolve, reject) => {
    const server = app.listen(port, '127.0.0.1', () => {
      const baseUrl = `http://localhost:${port}`;

      console.log(`  ✅ Server running at ${baseUrl}`);
      console.log(`  📁 Serving views from: ${VIEWS_DIR}`);
      console.log(`  📚 Libraries at: ${LIB_DIR}`);
      console.log('');
      console.log('  API Endpoints:');
      console.log(`    POST /api/view/deploy    - Deploy an HTML page`);
      console.log(`    GET  /api/view/list      - List deployed pages`);
      console.log(`    POST /api/fs/read        - Read a local file`);
      console.log(`    POST /api/fs/write       - Write a local file`);
      console.log(`    POST /api/sys/exec       - Execute a command (whitelisted)`);
      console.log(`    GET  /api/project/tree   - Project directory tree`);
      console.log(`    GET  /api/health         - Health check`);
      console.log('');
      console.log('  Press Ctrl+C to stop.\n');

      if (shouldOpen) {
        openBrowser(baseUrl);
      }

      resolve({ server, app, baseUrl, port });
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`  ❌ Port ${port} is already in use.`);
        console.error(`     Try: vulcan start --port ${port + 1}`);
      } else {
        console.error(`  ❌ Server error: ${err.message}`);
      }
      reject(err);
    });

    // Graceful shutdown
    const shutdown = () => {
      console.log('\n  👋 Shutting down...');
      server.close(() => {
        console.log('  ✅ Server stopped.');
        process.exit(0);
      });
      setTimeout(() => process.exit(0), 3000);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  });
}

module.exports = { startServer };
