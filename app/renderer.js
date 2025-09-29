// app/renderer.js
import { Avatar } from './avatar.js';
import { ChatUI } from './chat.js';
import { EXP_DURATION_MS } from './config.js';

// 小工具：抓 DOM 没找到就抛错，方便排查
function $id(id) {
  const el = document.getElementById(id);
  if (!el) throw new Error(`[renderer] element #${id} not found`);
  return el;
}

window.addEventListener('DOMContentLoaded', () => {
  const avatar = new Avatar($id('avatar'));

  const chat = new ChatUI({
    messagesEl: $id('messages'),
    inputEl: $id('input'),
    sendBtn: $id('send'),

    // 打字/表情回调保持不变
    onTyping: (isTyping) => {
      avatar.setTalking(isTyping);
      if (isTyping) avatar.boostDuring(1400, 8);
    },
    onExpression: (name) => {
      avatar.setExpression(name, EXP_DURATION_MS);
    },

    /**
     * 关键：提供一个 request 函数，优先走 Electron 代理
     * ChatUI 里调用 opts.request('/api/generate', { body: {...} })
     */
    request: async (url, options = {}) => {
      const method = options.method || 'POST';
      const headers = options.headers || { 'Content-Type': 'application/json', 'Accept': 'application/json' };
      const body = options.body;

      // 优先使用 Electron 里 preload 暴露的 window.ollama.fetch
      if (window.ollama && typeof window.ollama.fetch === 'function') {
        return window.ollama.fetch({ url, method, headers, body });
      }

      // 兜底：纯浏览器环境（可能会遇到 CORS，但方便本地直接双击打开调试）
      const resp = await fetch(url.startsWith('http') ? url : `http://127.0.0.1:11434${url}`, {
        method,
        headers,
        body: body && typeof body === 'object' ? JSON.stringify(body) : body
      });

      const text = await resp.text();
      let json; try { json = JSON.parse(text); } catch (_) {}
      return { ok: resp.ok, status: resp.status, text, json };
    }
  });

  // 方便调试
  window.__app = { avatar, chat };
});
