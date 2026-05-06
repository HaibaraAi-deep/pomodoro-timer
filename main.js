const { app, BrowserWindow, protocol } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    center: true,
    resizable: true,
    minimizable: true,
    maximizable: true,
    closable: true,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      allowRunningInsecureContent: false,
      webSecurity: true
    }
  });

  mainWindow.loadURL('pomodoro://app/index.html');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(function () {
  protocol.registerFileProtocol('pomodoro', function (request, callback) {
    const url = request.url.slice('pomodoro://app/'.length);
    const filePath = path.join(__dirname, 'src', url);
    const resolved = path.resolve(filePath);
    const srcDir = path.resolve(__dirname, 'src');
    if (!resolved.startsWith(srcDir)) {
      callback({ error: -3 }); // ABORTED
      return;
    }
    callback({ path: resolved });
  });

  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
