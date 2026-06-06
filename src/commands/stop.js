'use strict';

const { DEFAULT_PORT } = require('../config');

function run() {
  const port = process.env.VULCAN_PORT || DEFAULT_PORT;
  console.log('');
  console.log('  ℹ️  To stop Vulcan, press Ctrl+C in the terminal where it is running.');
  console.log('  Or kill the process: lsof -ti:' + port + ' | xargs kill');
  console.log('');
}

module.exports = { run };
