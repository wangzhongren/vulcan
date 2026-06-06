'use strict';

const { Router } = require('express');

const router = Router();

/**
 * POST /api/proxy
 * Proxy an external HTTP request to bypass browser CORS.
 *
 * Body: {
 *   url: 'https://api.example.com/data',
 *   method: 'GET',        // default: GET
 *   headers: {},          // optional custom headers
 *   body: {},             // optional request body (for POST/PUT)
 * }
 *
 * Security: blocks requests to localhost / 127.0.0.1 / 0.0.0.0 / ::1 / 10.x / 172.16-31.x / 192.168.x
 */
router.post('/proxy', async (req, res) => {
  try {
    const { url, method, headers, body } = req.body;

    if (!url || !/^https?:\/\//i.test(url)) {
      return res.status(400).json({ error: 'Invalid url. Must be http:// or https://' });
    }

    // Block internal/local addresses
    const parsed = new URL(url);
    const blockedPatterns = [
      'localhost', '127.0.0.1', '0.0.0.0', '::1',
      /^10\./, /^172\.(1[6-9]|2\d|3[01])\./, /^192\.168\./,
    ];

    const isBlocked = blockedPatterns.some(pattern => {
      if (typeof pattern === 'string') return parsed.hostname === pattern;
      return pattern.test(parsed.hostname);
    });

    if (isBlocked) {
      return res.status(403).json({ error: 'Proxying to internal addresses is blocked.' });
    }

    const fetchMethod = method || 'GET';
    const fetchHeaders = { ...headers };
    if (body && typeof body === 'object') {
      fetchHeaders['Content-Type'] = 'application/json';
    }

    const fetchOptions = {
      method: fetchMethod,
      headers: fetchHeaders,
      signal: AbortSignal.timeout(15000), // 15s timeout
    };

    if (body && fetchMethod !== 'GET') {
      fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    console.log(`  🌐 Proxy: ${fetchMethod} ${url}`);

    const result = await fetch(url, fetchOptions);
    const contentType = result.headers.get('content-type') || '';

    let data;
    if (contentType.includes('application/json')) {
      data = await result.json();
    } else {
      data = await result.text();
    }

    console.log(`  ✅ Proxy response: ${result.status} (${Buffer.byteLength(typeof data === 'string' ? data : JSON.stringify(data), 'utf-8')} bytes)`);

    res.json({
      success: result.ok,
      status: result.status,
      headers: Object.fromEntries(result.headers.entries()),
      data,
    });
  } catch (err) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      return res.status(504).json({ error: 'Proxy request timed out (15s)' });
    }
    console.error(`  ❌ Proxy error: ${err.message}`);
    res.status(502).json({ error: err.message });
  }
});

module.exports = router;
