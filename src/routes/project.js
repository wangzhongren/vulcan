'use strict';

const { Router } = require('express');
const fs = require('fs');
const path = require('path');

const router = Router();

const SKIP_DIRS = new Set([
  'node_modules', '.git', '.next', 'dist', 'build',
  'coverage', '.cache', '__pycache__', '.venv', 'venv',
  '.idea', '.vscode', '.DS_Store',
]);

function buildTree(dirPath, maxDepth, currentDepth) {
  if (maxDepth === undefined) maxDepth = 4;
  if (currentDepth === undefined) currentDepth = 0;
  const name = path.basename(dirPath);
  const node = { name, type: 'directory', children: [] };

  if (currentDepth >= maxDepth) {
    node.truncated = true;
    return node;
  }

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    entries.sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });

    for (const entry of entries) {
      if (SKIP_DIRS.has(entry.name)) continue;
      if (entry.name.startsWith('.') && entry.name !== '.env') continue;

      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        node.children.push(buildTree(fullPath, maxDepth, currentDepth + 1));
      } else {
        try {
          const stat = fs.statSync(fullPath);
          node.children.push({ name: entry.name, type: 'file', size: stat.size });
        } catch {
          node.children.push({ name: entry.name, type: 'file', size: 0 });
        }
      }
    }
  } catch (err) {
    node.error = err.message;
  }

  return node;
}

function formatTree(node, prefix, isLast) {
  if (prefix === undefined) prefix = '';
  if (isLast === undefined) isLast = true;
  const connector = isLast ? '└── ' : '├── ';
  let result = prefix + connector + node.name + (node.type === 'directory' ? '/' : '') + '\n';

  if (node.children) {
    const childPrefix = prefix + (isLast ? '    ' : '│   ');
    for (let i = 0; i < node.children.length; i++) {
      result += formatTree(node.children[i], childPrefix, i === node.children.length - 1);
    }
  }
  return result;
}

/**
 * GET /api/project/tree
 * Get the directory tree of the current project.
 * Query: ?depth=4&format=json|text
 */
router.get('/project/tree', (req, res) => {
  try {
    const cwd = process.env.VULCAN_CWD || process.cwd();
    const depth = Math.min(parseInt(req.query.depth) || 4, 8);
    const format = req.query.format || 'json';

    const tree = buildTree(cwd, depth);

    if (format === 'text') {
      const text = tree.name + '/\n' + tree.children
        .map((child, i) => formatTree(child, '', i === tree.children.length - 1))
        .join('');
      res.type('text/plain').send(text);
    } else {
      res.json({ success: true, root: cwd, tree });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/project/info
 * Get basic info about the current project.
 */
router.get('/project/info', (req, res) => {
  try {
    const cwd = process.env.VULCAN_CWD || process.cwd();
    const pkgPath = path.join(cwd, 'package.json');

    let packageJson = null;
    if (fs.existsSync(pkgPath)) {
      try {
        packageJson = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      } catch {}
    }

    const indicators = {
      hasPackageJson: fs.existsSync(path.join(cwd, 'package.json')),
      hasTsConfig: fs.existsSync(path.join(cwd, 'tsconfig.json')),
      hasGitignore: fs.existsSync(path.join(cwd, '.gitignore')),
      hasReadme: fs.existsSync(path.join(cwd, 'README.md')),
      hasDockerfile: fs.existsSync(path.join(cwd, 'Dockerfile')),
      hasMakefile: fs.existsSync(path.join(cwd, 'Makefile')),
      hasCargo: fs.existsSync(path.join(cwd, 'Cargo.toml')),
      hasGoMod: fs.existsSync(path.join(cwd, 'go.mod')),
    };

    res.json({
      success: true,
      cwd,
      projectName: (packageJson && packageJson.name) || path.basename(cwd),
      packageJson,
      indicators,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
