'use strict';

const { Router } = require('express');
const fs = require('fs');
const path = require('path');

const router = Router();

/**
 * Resolve a user-provided path to an absolute path.
 * If relative, resolves from VULCAN_CWD or process.cwd().
 */
function resolveSafePath(inputPath) {
  if (path.isAbsolute(inputPath)) {
    return path.normalize(inputPath);
  }
  const cwd = process.env.VULCAN_CWD || process.cwd();
  return path.resolve(cwd, inputPath);
}

/**
 * POST /api/fs/read
 * Read a local file.
 * Body: { path: string }
 */
router.post('/fs/read', (req, res) => {
  try {
    const { path: filePath } = req.body;
    if (!filePath) {
      return res.status(400).json({ error: 'Missing required field: path' });
    }

    const resolvedPath = resolveSafePath(filePath);

    if (!fs.existsSync(resolvedPath)) {
      return res.status(404).json({ error: `File not found: ${resolvedPath}` });
    }

    const stat = fs.statSync(resolvedPath);
    if (stat.isDirectory()) {
      const entries = fs.readdirSync(resolvedPath).map((entry) => {
        const entryPath = path.join(resolvedPath, entry);
        const entryStat = fs.statSync(entryPath);
        return {
          name: entry,
          type: entryStat.isDirectory() ? 'directory' : 'file',
          size: entryStat.size,
        };
      });
      return res.json({
        success: true,
        path: resolvedPath,
        type: 'directory',
        entries,
      });
    }

    // Cap file read at 5MB
    if (stat.size > 5 * 1024 * 1024) {
      return res.status(413).json({
        error: `File too large (${(stat.size / 1024 / 1024).toFixed(1)}MB). Max: 5MB.`,
      });
    }

    const content = fs.readFileSync(resolvedPath, 'utf-8');
    res.json({
      success: true,
      path: resolvedPath,
      type: 'file',
      content,
      size: stat.size,
    });
  } catch (err) {
    console.error(`  ❌ fs/read error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/fs/write
 * Write content to a local file.
 * Body: { path: string, content: string }
 */
router.post('/fs/write', (req, res) => {
  try {
    const { path: filePath, content } = req.body;

    if (!filePath) {
      return res.status(400).json({ error: 'Missing required field: path' });
    }
    if (content === undefined || content === null) {
      return res.status(400).json({ error: 'Missing required field: content' });
    }

    const resolvedPath = resolveSafePath(filePath);

    // Ensure parent directory exists
    const dir = path.dirname(resolvedPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(resolvedPath, content, 'utf-8');
    console.log(`  📝 File written: ${resolvedPath}`);

    res.json({
      success: true,
      path: resolvedPath,
      size: Buffer.byteLength(content, 'utf-8'),
    });
  } catch (err) {
    console.error(`  ❌ fs/write error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/fs/exists
 * Check if a file or directory exists.
 * Body: { path: string }
 */
router.post('/fs/exists', (req, res) => {
  try {
    const { path: filePath } = req.body;
    if (!filePath) {
      return res.status(400).json({ error: 'Missing required field: path' });
    }

    const resolvedPath = resolveSafePath(filePath);
    const exists = fs.existsSync(resolvedPath);

    let type = null;
    let size = null;
    if (exists) {
      const stat = fs.statSync(resolvedPath);
      type = stat.isDirectory() ? 'directory' : 'file';
      size = stat.size;
    }

    res.json({ exists, path: resolvedPath, type, size });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
