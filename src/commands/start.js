'use strict';

const { startServer } = require('../server');
const { ensureDirs } = require('../config');

async function run(options) {
  if (!options) options = {};
  console.log('');
  console.log('  🚀 Starting Vulcan...');
  console.log('');

  ensureDirs();

  try {
    await startServer(options);
  } catch (err) {
    process.exit(1);
  }
}

module.exports = { run };
