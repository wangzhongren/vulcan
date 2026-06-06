'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const SKILL_FILES = ['deploy-view.md', 'vulcan-inspect.md'];

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function installSkills(targetDir, force) {
  const assetsDir = path.join(__dirname, '..', '..', 'assets', 'skills');
  let installed = 0;
  let skipped = 0;

  ensureDir(targetDir);

  for (const file of SKILL_FILES) {
    const src = path.join(assetsDir, file);
    const dest = path.join(targetDir, file);

    if (!fs.existsSync(src)) {
      console.log('  ⚠️  Skill source not found: ' + file);
      continue;
    }

    if (fs.existsSync(dest) && !force) {
      console.log('  ⏭️  ' + file + ' (already exists, use --force to overwrite)');
      skipped++;
      continue;
    }

    fs.copyFileSync(src, dest);
    console.log('  ✅ ' + file + ' → ' + path.relative(process.cwd(), dest));
    installed++;
  }

  return { installed, skipped };
}

function installClaudeMd(cwd, force) {
  const targetPath = path.join(cwd, 'CLAUDE.md');
  const templatePath = path.join(__dirname, '..', '..', 'assets', 'CLAUDE.md.template');

  if (!fs.existsSync(templatePath)) {
    return;
  }

  const template = fs.readFileSync(templatePath, 'utf-8');

  if (fs.existsSync(targetPath)) {
    const existing = fs.readFileSync(targetPath, 'utf-8');

    if (existing.includes('Vulcan')) {
      if (!force) {
        console.log('  ⏭️  CLAUDE.md already has Vulcan info (use --force)');
        return;
      }
    } else if (!force) {
      fs.writeFileSync(targetPath, existing + '\n\n---\n\n' + template, 'utf-8');
      console.log('  ✅ Appended Vulcan section to CLAUDE.md');
      return;
    }
  }

  fs.writeFileSync(targetPath, template, 'utf-8');
  console.log('  ✅ CLAUDE.md created');
}

function run(options) {
  if (!options) options = {};
  const cwd = options.cwd || process.cwd();
  const force = options.force || false;
  const global = options.global || false;

  console.log('');
  console.log('  🔧 Vulcan — Install Skills');
  console.log('');

  if (global) {
    // Install globally to ~/.claude/commands/
    const globalDir = path.join(os.homedir(), '.claude', 'commands');
    console.log('  📂 Installing globally to: ~/.claude/commands/');
    console.log('');
    const result = installSkills(globalDir, force);
    console.log('');
    if (result.installed > 0) {
      console.log('  ✅ ' + result.installed + ' skill(s) installed globally!');
      console.log('');
      console.log('  These skills are now available in ALL projects:');
      console.log('    /deploy-view <description>   — Deploy an interactive page');
      console.log('    /vulcan-inspect <what>      — Inspect project structure');
    } else {
      console.log('  ℹ️  No new skills installed.');
    }
    console.log('');
    return;
  }

  // Install to current project
  const projectDir = path.join(cwd, '.claude', 'commands');
  console.log('  📂 Installing to project: .claude/commands/');
  console.log('');

  const result = installSkills(projectDir, force);

  // Also handle CLAUDE.md
  console.log('');
  installClaudeMd(cwd, force);

  console.log('');
  if (result.installed > 0) {
    console.log('  ✅ Done! ' + result.installed + ' skill(s) installed to this project.');
    console.log('');
    console.log('  Available slash commands in Claude Code:');
    console.log('    /deploy-view <description>   — Deploy an interactive page');
    console.log('    /vulcan-inspect <what>      — Inspect project structure');
    console.log('');
    console.log('  Make sure the Vulcan server is running:');
    console.log('    vulcan start');
  } else {
    console.log('  ℹ️  No new skills installed.');
  }
  console.log('');
}

module.exports = { run };
