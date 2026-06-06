'use strict';

const { Router } = require('express');
const { exec: execShell } = require('child_process');

const router = Router();

/**
 * Command whitelist for /api/sys/exec.
 * Each rule has a regex pattern and description.
 */
const ALLOWED_COMMANDS = [
  // Git - read-only + safe operations
  { pattern: /^git\s+(status|diff|log|branch|show|stash\s+list|tag|remote|shortlog)(\s|$)/, description: 'git read-only commands' },
  { pattern: /^git\s+add\s+(\S+)/, description: 'git add' },
  { pattern: /^git\s+checkout\s+/, description: 'git checkout' },

  // npm / yarn / pnpm
  { pattern: /^npm\s+run\s+[\w-]+/, description: 'npm run <script>' },
  { pattern: /^npm\s+(test|lint|build|start|version|ls|outdated)/, description: 'npm safe commands' },
  { pattern: /^npx\s+/, description: 'npx' },
  { pattern: /^yarn\s+(run\s+)?[\w-]+/, description: 'yarn commands' },
  { pattern: /^pnpm\s+(run\s+)?[\w-]+/, description: 'pnpm commands' },

  // File inspection (read-only)
  { pattern: /^ls(\s|$)/, description: 'ls' },
  { pattern: /^cat\s+/, description: 'cat' },
  { pattern: /^head(\s|-)/, description: 'head' },
  { pattern: /^tail(\s|-)/, description: 'tail' },
  { pattern: /^wc\s+/, description: 'wc' },
  { pattern: /^find\s+/, description: 'find' },
  { pattern: /^grep\s+/, description: 'grep' },
  { pattern: /^tree(\s|$)/, description: 'tree' },
  { pattern: /^pwd(\s|$)/, description: 'pwd' },
  { pattern: /^file\s+/, description: 'file' },

  // Dev tools
  { pattern: /^node\s+/, description: 'node' },
  { pattern: /^python[23]?\s+/, description: 'python' },
  { pattern: /^echo\s+/, description: 'echo' },
  { pattern: /^date(\s|$)/, description: 'date' },
  { pattern: /^env(\s|$)/, description: 'env' },
  { pattern: /^which\s+/, description: 'which' },
  { pattern: /^type\s+/, description: 'type' },
  { pattern: /^curl\s+/, description: 'curl' },
];

function isCommandAllowed(fullCmd) {
  return ALLOWED_COMMANDS.some((rule) => rule.pattern.test(fullCmd));
}

function getAllowedList() {
  return ALLOWED_COMMANDS.map((r) => ({
    pattern: r.pattern.source,
    description: r.description,
  }));
}

/**
 * POST /api/sys/exec
 * Execute a whitelisted shell command.
 * Body: { cmd: string, args?: string[] }
 */
router.post('/sys/exec', (req, res) => {
  try {
    const { cmd, args } = req.body;

    if (!cmd) {
      return res.status(400).json({ error: 'Missing required field: cmd' });
    }

    const argsArr = Array.isArray(args) ? args : [];
    const fullCmd = [cmd, ...argsArr].join(' ').trim();

    if (!isCommandAllowed(fullCmd)) {
      console.warn(`  🚫 Command blocked: ${fullCmd}`);
      return res.status(403).json({
        error: `Command blocked by security whitelist: "${fullCmd}"`,
        hint: 'Only whitelisted commands are allowed. Call GET /api/sys/allowed to see the list.',
        allowedCommands: getAllowedList(),
      });
    }

    const cwd = process.env.VULCAN_CWD || process.cwd();
    console.log(`  ⚡ Executing: ${fullCmd}`);

    execShell(fullCmd, {
      cwd,
      timeout: 30000,
      maxBuffer: 1024 * 1024,
      shell: true,
    }, (error, stdout, stderr) => {
      if (error) {
        if (error.killed) {
          return res.status(408).json({
            error: 'Command timed out (30s limit)',
            cmd: fullCmd,
          });
        }
        return res.json({
          success: false,
          cmd: fullCmd,
          exitCode: error.code,
          stdout: stdout || '',
          stderr: stderr || error.message,
        });
      }

      console.log(`  ✅ Command completed: ${fullCmd}`);
      res.json({
        success: true,
        cmd: fullCmd,
        exitCode: 0,
        stdout: stdout || '',
        stderr: stderr || '',
      });
    });
  } catch (err) {
    console.error(`  ❌ sys/exec error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/sys/allowed
 * List all whitelisted command patterns.
 */
router.get('/sys/allowed', (req, res) => {
  res.json({
    commands: getAllowedList(),
    note: 'Commands are matched against these regex patterns. Only matching commands can be executed.',
  });
});

module.exports = router;
