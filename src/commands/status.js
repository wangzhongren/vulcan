'use strict';

const http = require('http');
const { DEFAULT_PORT } = require('../config');

function run() {
  const port = process.env.VULCAN_PORT || DEFAULT_PORT;

  const req = http.get('http://localhost:' + port + '/api/health', (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      try {
        const info = JSON.parse(data);
        console.log('');
        console.log('  ✅ Vulcan is running!');
        console.log('  📡 URL:       http://localhost:' + info.port);
        console.log('  📁 Views dir: ' + info.viewsDir);
        console.log('  ⏱️  Uptime:    ' + Math.round(info.uptime) + 's');
        console.log('');
      } catch {
        console.log('  ❓ Server responded but health check failed.');
      }
    });
  });

  req.on('error', () => {
    console.log('');
    console.log('  ❌ Vulcan is not running.');
    console.log('  Start it with: vulcan start');
    console.log('');
  });

  req.setTimeout(3000, () => {
    req.destroy();
    console.log('  ❌ Connection timed out. Server may not be running.');
  });
}

module.exports = { run };
