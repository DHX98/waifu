// main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { ollamaFetch } = require('./proxy'); // 我们的本地代理函数

function createWindow () {
  const win = new BrowserWindow({
    width: 1100,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    }
  });

  // 加载本地静态网页的 index.html
  win.loadFile(path.join(__dirname, 'app', 'index.html'));
}

app.whenReady().then(() => {
  // 处理渲染进程发来的代理请求
  ipcMain.handle('ollama:fetch', async (_event, req) => {
    // req: { url, method, headers, body } 由前端传入
    return ollamaFetch(req);
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  // Windows / Linux 关闭所有窗口后退出
  if (process.platform !== 'darwin') app.quit();
});
