// proxy.js
const http = require('http');
const https = require('https');
const { URL } = require('url');

// 你的本地 Ollama 端点（建议 127.0.0.1 避免某些策略问题）
const OLLAMA_BASE = 'http://127.0.0.1:11434';

function doRequest(urlStr, { method = 'GET', headers = {}, body } = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const isHttps = u.protocol === 'https:';
    const lib = isHttps ? https : http;

    const req = lib.request(
      {
        hostname: u.hostname,
        port: u.port || (isHttps ? 443 : 80),
        path: u.pathname + (u.search || ''),
        method,
        headers,
      },
      (res) => {
        let chunks = [];
        res.on('data', (d) => chunks.push(d));
        res.on('end', () => {
          const buf = Buffer.concat(chunks);
          const text = buf.toString('utf8');

          // 简单尝试 JSON 解析（Ollama 大多返回 JSON 流或 JSON）
          let json;
          try { json = JSON.parse(text); } catch (_) {}

          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            headers: Object.fromEntries(Object.entries(res.headers)),
            text,
            json
          });
        });
      }
    );

    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function ollamaFetch(req) {
  // 只允许访问 /api/*，避免误配到其他域名（安全起见）
  let targetUrl;
  try {
    // 如果前端传的是相对路径，如 /api/generate
    if (req.url.startsWith('/')) targetUrl = OLLAMA_BASE + req.url;
    else if (req.url.startsWith('http')) targetUrl = req.url;
    else targetUrl = `${OLLAMA_BASE}/${req.url.replace(/^\/+/, '')}`;
  } catch (e) {
    return { ok: false, status: 400, text: 'Bad request url' };
  }

  // 附加/覆盖必要的请求头
  const headers = Object.assign(
    {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    req.headers || {}
  );

  // body 可以是对象或字符串
  let body = req.body;
  if (body && typeof body === 'object') body = JSON.stringify(body);

  // 发起请求
  try {
    return await doRequest(targetUrl, {
      method: req.method || 'POST',
      headers,
      body
    });
  } catch (err) {
    return { ok: false, status: 500, text: String(err) };
  }
}

module.exports = { ollamaFetch };
