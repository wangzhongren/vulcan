#!/usr/bin/env node

'use strict';

var http = require('http');
var PORT = 13579;
var server;

function request(method, urlPath, body) {
  return new Promise(function (resolve, reject) {
    var options = {
      hostname: '127.0.0.1',
      port: PORT,
      path: urlPath,
      method: method,
      headers: { 'Content-Type': 'application/json' },
    };

    var req = http.request(options, function (res) {
      var data = '';
      res.on('data', function (chunk) { data += chunk; });
      res.on('end', function () {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, data: data }); }
      });
    });

    req.on('error', reject);
    req.setTimeout(5000, function () { req.destroy(); reject(new Error('Timeout')); });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

var passed = 0;
var failed = 0;

function assert(label, condition, detail) {
  if (condition) {
    console.log('  ✅ ' + label);
    passed++;
  } else {
    console.log('  ❌ ' + label + (detail ? ' — ' + detail : ''));
    failed++;
  }
}

async function runTests() {
  console.log('\n  🧪 Vulcan Smoke Tests\n');

  // 1. Health check
  var health = await request('GET', '/api/health');
  assert('Health check returns 200', health.status === 200);
  assert('Health has status=ok', health.data.status === 'ok');
  assert('Health has port', health.data.port === PORT);

  // 2. Deploy a view
  var deploy = await request('POST', '/api/view/deploy', {
    name: 'test_page',
    html: '<html><head></head><body><h1>Test</h1></body></html>',
  });
  assert('Deploy view returns 200', deploy.status === 200);
  assert('Deploy returns success', deploy.data.success === true);
  assert('Deploy returns URL', deploy.data.url === '/view/test_page.html');

  // 3. Bridge.js injected
  assert('Bridge.js was auto-injected', deploy.data.file !== undefined);

  // 4. List views
  var views = await request('GET', '/api/view/list');
  assert('List views returns 200', views.status === 200);
  assert('List includes test_page', views.data.views.some(function(v) { return v.name === 'test_page'; }));

  // 5. Write a file
  var write = await request('POST', '/api/fs/write', {
    path: '/tmp/vulcan-test.txt',
    content: 'Hello from smoke test!',
  });
  assert('Write file returns 200', write.status === 200);
  assert('Write returns success', write.data.success === true);

  // 6. Read the file
  var read = await request('POST', '/api/fs/read', {
    path: '/tmp/vulcan-test.txt',
  });
  assert('Read file returns 200', read.status === 200);
  assert('Read content matches', read.data.content === 'Hello from smoke test!');

  // 7. Execute whitelisted command
  var exec = await request('POST', '/api/sys/exec', {
    cmd: 'echo', args: ['hello', 'world'],
  });
  assert('Exec whitelisted cmd returns 200', exec.status === 200);
  assert('Exec returns success', exec.data.success === true);
  assert('Exec stdout has output', exec.data.stdout.indexOf('hello world') !== -1);

  // 8. Block dangerous command
  var blocked = await request('POST', '/api/sys/exec', {
    cmd: 'rm', args: ['-rf', '/'],
  });
  assert('Dangerous command is blocked (403)', blocked.status === 403);

  // 9. Get allowed commands
  var allowed = await request('GET', '/api/sys/allowed');
  assert('Allowed list returns 200', allowed.status === 200);
  assert('Allowed list is non-empty', allowed.data.commands.length > 0);

  // 10. Project tree
  var tree = await request('GET', '/api/project/tree');
  assert('Project tree returns 200', tree.status === 200);
  assert('Tree has root node', tree.data.tree !== undefined);

  // 11. Project info
  var info = await request('GET', '/api/project/info');
  assert('Project info returns 200', info.status === 200);
  assert('Info has cwd', info.data.cwd !== undefined);

  // 12. Bridge.js is served
  var bridge = await new Promise(function (resolve, reject) {
    http.get('http://127.0.0.1:' + PORT + '/bridge.js', function (res) {
      var data = '';
      res.on('data', function (chunk) { data += chunk; });
      res.on('end', function () { resolve({ status: res.statusCode, data: data }); });
    }).on('error', reject);
  });
  assert('Bridge.js is served (200)', bridge.status === 200);
  assert('Bridge.js contains Vulcan', bridge.data.indexOf('Vulcan') !== -1);

  // 13. Delete test view
  var del = await request('DELETE', '/api/view/test_page');
  assert('Delete view returns 200', del.status === 200);
  assert('Delete returns success', del.data.success === true);

  // Cleanup
  var fs = require('fs');
  try { fs.unlinkSync('/tmp/vulcan-test.txt'); } catch {}
}

async function main() {
  process.env.VULCAN_PORT = PORT;
  var serverModule = require('../src/server');

  try {
    var result = await serverModule.startServer({ port: PORT, open: false });
    server = result.server;
    await runTests();
  } catch (err) {
    console.error('  ❌ Setup failed: ' + err.message);
    failed++;
  }

  console.log('\n  Results: ' + passed + ' passed, ' + failed + ' failed\n');

  if (server) {
    server.close(function () { process.exit(failed > 0 ? 1 : 0); });
  } else {
    process.exit(failed > 0 ? 1 : 0);
  }
}

main();
