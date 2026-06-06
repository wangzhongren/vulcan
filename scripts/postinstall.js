#!/usr/bin/env node

'use strict';

var fs = require('fs');
var path = require('path');
var os = require('os');
var execSync = require('child_process').execSync;

var LIB_DIR = path.join(os.homedir(), '.code-map', 'lib');

var LIBRARIES = [
  {
    name: 'Tailwind CSS (Play CDN)',
    file: 'tailwind.min.js',
    url: 'https://cdn.tailwindcss.com/3.4.1',
  },
  {
    name: 'ECharts',
    file: 'echarts.min.js',
    url: 'https://cdn.jsdelivr.net/npm/echarts@5.5.0/dist/echarts.min.js',
  },
  {
    name: 'AntV G6',
    file: 'g6.min.js',
    url: 'https://cdn.jsdelivr.net/npm/@antv/g6@4.8.24/dist/g6.min.js',
  },
];

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function downloadWithCurl(url, dest) {
  execSync('curl -fSL --max-time 30 -o "' + dest + '" "' + url + '"', {
    stdio: 'pipe',
  });
}

function downloadWithHttps(url, dest) {
  return new Promise(function (resolve, reject) {
    var https = require('https');
    var file = fs.createWriteStream(dest);

    function doGet(requestUrl, redirectCount) {
      if (!redirectCount) redirectCount = 0;
      if (redirectCount > 5) {
        reject(new Error('Too many redirects'));
        return;
      }

      https.get(requestUrl, function (res) {
        if ([301, 302, 307, 308].indexOf(res.statusCode) !== -1 && res.headers.location) {
          res.resume();
          doGet(res.headers.location, redirectCount + 1);
          return;
        }

        if (res.statusCode !== 200) {
          res.resume();
          reject(new Error('HTTP ' + res.statusCode + ' for ' + requestUrl));
          return;
        }

        res.pipe(file);
        file.on('finish', function () {
          file.close();
          resolve();
        });
      }).on('error', function (err) {
        try { fs.unlinkSync(dest); } catch {}
        reject(err);
      });
    }

    doGet(url);
  });
}

async function downloadLib(lib) {
  var dest = path.join(LIB_DIR, lib.file);

  if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
    var size = (fs.statSync(dest).size / 1024).toFixed(0);
    console.log('  ✓ ' + lib.name + ' — already present (' + size + 'KB)');
    return true;
  }

  console.log('  ⬇ Downloading ' + lib.name + '...');

  try {
    downloadWithCurl(lib.url, dest);
    var sz = (fs.statSync(dest).size / 1024).toFixed(0);
    console.log('  ✓ ' + lib.name + ' — saved (' + sz + 'KB)');
    return true;
  } catch {
    try {
      await downloadWithHttps(lib.url, dest);
      var sz2 = (fs.statSync(dest).size / 1024).toFixed(0);
      console.log('  ✓ ' + lib.name + ' — saved (' + sz2 + 'KB)');
      return true;
    } catch (err) {
      console.warn('  ⚠ Failed to download ' + lib.name + ': ' + err.message);
      console.warn('    You can manually download from: ' + lib.url);
      console.warn('    and save to: ' + dest);
      return false;
    }
  }
}

async function main() {
  console.log('');
  console.log('  📚 Vulcan — Setting up bundled libraries...');
  console.log('  📂 Target: ' + LIB_DIR);
  console.log('');

  ensureDir(LIB_DIR);

  var success = 0;
  var failed = 0;

  for (var i = 0; i < LIBRARIES.length; i++) {
    var ok = await downloadLib(LIBRARIES[i]);
    if (ok) success++;
    else failed++;
  }

  console.log('');
  if (failed === 0) {
    console.log('  ✅ All ' + success + ' libraries ready!');
  } else {
    console.log('  ⚠ ' + success + ' libraries downloaded, ' + failed + ' failed.');
  }
  console.log('');
}

main().catch(function (err) {
  console.error('  ❌ postinstall error:', err.message);
});
