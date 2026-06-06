'use strict';

const { Router } = require('express');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { VIEWS_DIR } = require('../config');

const router = Router();

/**
 * Open a URL in the default browser.
 */
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
    // Silently ignore
  }
}

/**
 * POST /api/view/deploy
 * Deploy (create/update) an HTML page.
 * Body: { name: string, html: string }
 */
router.post('/view/deploy', (req, res) => {
  try {
    const { name, html } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Missing required field: name' });
    }
    if (!html) {
      return res.status(400).json({ error: 'Missing required field: html' });
    }

    // Sanitize the view name
    const safeName = String(name).replace(/[^a-zA-Z0-9_\-.]/g, '_');
    const fileName = safeName.endsWith('.html') ? safeName : `${safeName}.html`;
    const filePath = path.join(VIEWS_DIR, fileName);

    // Auto-inject bridge.js if not already included
    let content = html;
    if (!content.includes('/bridge.js')) {
      content = content.replace(
        '<head>',
        '<head>\n<script src="/bridge.js"></script>'
      );
    }

    fs.writeFileSync(filePath, content, 'utf-8');

    const url = `/view/${fileName}`;
    const fullUrl = `http://localhost:${req.socket.localPort}${url}`;
    console.log(`  📄 View deployed: ${fileName}`);

    // Auto-open in browser (can be disabled with open=false in request)
    if (req.body.open !== false) {
      openBrowser(fullUrl);
      console.log(`  🌐 Opened in browser: ${fullUrl}`);
    }

    res.json({
      success: true,
      url,
      fullUrl,
      name: safeName,
      file: filePath,
    });
  } catch (err) {
    console.error(`  ❌ Deploy error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/view/list
 * List all deployed views.
 */
router.get('/view/list', (req, res) => {
  try {
    const files = fs.readdirSync(VIEWS_DIR)
      .filter((f) => f.endsWith('.html'))
      .map((f) => ({
        name: f.replace('.html', ''),
        file: f,
        url: `/view/${f}`,
        size: fs.statSync(path.join(VIEWS_DIR, f)).size,
        modified: fs.statSync(path.join(VIEWS_DIR, f)).mtime.toISOString(),
      }));

    res.json({ views: files });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/view/:name
 * Delete a deployed view.
 */
router.delete('/view/:name', (req, res) => {
  try {
    const safeName = req.params.name.replace(/[^a-zA-Z0-9_\-.]/g, '_');
    const fileName = safeName.endsWith('.html') ? safeName : `${safeName}.html`;
    const filePath = path.join(VIEWS_DIR, fileName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: `View not found: ${safeName}` });
    }

    fs.unlinkSync(filePath);
    console.log(`  🗑️  View deleted: ${fileName}`);

    res.json({ success: true, deleted: safeName });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
