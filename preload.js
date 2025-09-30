// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('ollama', {
  fetch: async (req) => {
    // req: { url, method, headers, body }
    // 返回 { ok, status, headers, text/json任一 }，见 proxy.js
    return ipcRenderer.invoke('ollama:fetch', req);
  }
});
