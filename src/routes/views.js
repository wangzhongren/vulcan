'use strict';

const { Router } = require('express');
const fs = require('fs');
const path = require('path');
const { VIEWS_DIR } = require('../config');

const router = Router();

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
    console.log(`  📄 View deployed: ${fileName}`);

    res.json({
      success: true,
      url,
      fullUrl: `http://localhost:${req.socket.localPort}${url}`,
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
