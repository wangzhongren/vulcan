'use strict';

const path = require('path');
const os = require('os');
const fs = require('fs');

const BASE_DIR = path.join(os.homedir(), '.code-map');
const VIEWS_DIR = path.join(BASE_DIR, 'views');
const LIB_DIR = path.join(BASE_DIR, 'lib');
const DEFAULT_PORT = 3000;

function ensureDirs() {
  for (const dir of [BASE_DIR, VIEWS_DIR, LIB_DIR]) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

module.exports = {
  BASE_DIR,
  VIEWS_DIR,
  LIB_DIR,
  DEFAULT_PORT,
  ensureDirs,
};
