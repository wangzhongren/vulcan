/**
 * bridge.js — Vulcan Client Library
 *
 * Automatically injected into all AI-generated pages.
 * Exposes window.Vulcan for interacting with the local CLI server.
 *
 * Usage in your HTML:
 *   <script src="/bridge.js"></script>
 *   <script>
 *     const result = await Vulcan.readFile('./src/app.ts');
 *     await Vulcan.writeFile('./output.txt', 'Hello!');
 *     const output = await Vulcan.execute('git status');
 *   </script>
 */

(function () {
  'use strict';

  if (window.Vulcan) return;

  var API_BASE = '';

  function request(url, options) {
    if (!options) options = {};
    var config = {
      headers: { 'Content-Type': 'application/json' },
    };
    config.method = options.method || 'GET';

    if (options.body && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body);
    }

    return fetch(API_BASE + url, config).then(function (response) {
      return response.json();
    });
  }

  window.Vulcan = {

    // ── File System ───────────────────────────────────────

    readFile: function (path) {
      return request('/api/fs/read', { method: 'POST', body: { path: path } });
    },

    writeFile: function (path, content) {
      return request('/api/fs/write', { method: 'POST', body: { path: path, content: content } });
    },

    fileExists: function (path) {
      return request('/api/fs/exists', { method: 'POST', body: { path: path } });
    },

    // ── System Commands ───────────────────────────────────

    execute: function (cmd, args) {
      return request('/api/sys/exec', {
        method: 'POST',
        body: { cmd: cmd, args: args || [] },
      });
    },

    getAllowedCommands: function () {
      return request('/api/sys/allowed');
    },

    // ── View Management ───────────────────────────────────

    deployView: function (name, html) {
      return request('/api/view/deploy', {
        method: 'POST',
        body: { name: name, html: html },
      }).then(function (result) {
        // Notify parent window (shell) to refresh sidebar and switch to new view
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({
            type: 'vulcan:view-deployed',
            name: result.name,
            url: result.url
          }, '*');
        }
        return result;
      });
    },

    listViews: function () {
      return request('/api/view/list');
    },

    // ── Project Info ──────────────────────────────────────

    getProjectTree: function (depth) {
      return request('/api/project/tree?depth=' + (depth || 4));
    },

    getProjectInfo: function () {
      return request('/api/project/info');
    },

    // ── Utilities ─────────────────────────────────────────

    ping: function () {
      return request('/api/health');
    },

    toast: function (message, type) {
      if (!type) type = 'info';
      var colors = { success: '#10b981', error: '#ef4444', info: '#3b82f6' };
      var toast = document.createElement('div');
      toast.textContent = message;
      toast.style.cssText = 'position:fixed;bottom:24px;right:24px;background:' +
        (colors[type] || colors.info) +
        ';color:white;padding:12px 20px;border-radius:8px;font-size:14px;' +
        'font-family:system-ui,sans-serif;z-index:99999;' +
        'box-shadow:0 4px 12px rgba(0,0,0,0.3);transition:opacity 0.3s,transform 0.3s;';
      document.body.appendChild(toast);
      setTimeout(function () {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        setTimeout(function () { toast.remove(); }, 300);
      }, 3000);
    },

    version: '0.1.0',
  };

  console.log('%c🎨 Vulcan Bridge v0.1.0 ready', 'color: #3b82f6; font-weight: bold;');
  console.log('  Available: Vulcan.readFile(), writeFile(), execute(), deployView(), ...');
})();
