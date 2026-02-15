import { app, BrowserWindow, clipboard, Tray, Menu, globalShortcut, nativeImage, ipcMain } from 'electron';
import path from 'path';
import { exec } from 'child_process';
import https from 'https';

let mainWindow: BrowserWindow;
let tray: Tray;
let lastClipboardText = '';
let isQuitting = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    show: false,
    frame: false,
    transparent: true,
    hasShadow: true,
    roundedCorners: true,
    vibrancy: 'under-window',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile('index.html');
  startClipboardMonitor();

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

function createTray() {
  const iconPath = path.join(__dirname, '../eye.png');
  const icon = nativeImage.createFromPath(iconPath);
  tray = new Tray(icon.resize({ width: 24, height: 24 }));
  const contextMenu = Menu.buildFromTemplate([
    { 
      label: 'Factcheck', 
      click: () => {
        const copyCommand = process.platform === 'darwin' 
          ? 'osascript -e \'tell application "System Events" to keystroke "c" using command down\''
          : 'xdotool key ctrl+c';
        
        exec(copyCommand, () => {
          setTimeout(() => {
            mainWindow.show();
            mainWindow.focus();
          }, 200);
        });
      }
    },
    { label: 'Open Dashboard', click: () => mainWindow.show() },
    { label: 'Quit', click: () => {
      isQuitting = true;
      app.quit();
    }}
  ]);
  tray.setContextMenu(contextMenu);
  tray.setToolTip('HeartOverflow');
}

function startClipboardMonitor() {
  setInterval(() => {
    const currentText = clipboard.readText();
    if (currentText && currentText !== lastClipboardText) {
      lastClipboardText = currentText;
      mainWindow.webContents.send('clipboard-update', currentText);
      
      const sanitizedText = currentText.replace(/’/g, "\'").replace(/—/g, '-');
      const data = JSON.stringify({ text: sanitizedText });
      const options = {
        hostname: '3cdqdmy43d.execute-api.us-east-1.amazonaws.com',
        path: '/staging/check',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length
        }
      };
      
      const req = https.request(options, (res) => {
        let responseData = '';
        res.on('data', (chunk) => { responseData += chunk; });
        res.on('end', () => {
          const response = JSON.parse(responseData);
          console.log('API Response:', response);
          mainWindow.webContents.send('verification-result', response);
        });
      });
      
      req.on('error', () => {});
      
      req.write(data);
      req.end();
    }
  }, 500);
}

app.whenReady().then(() => {
  createWindow();
  createTray();
  
  ipcMain.on('hide-window', () => {
    mainWindow.hide();
  });
  
  globalShortcut.register('CommandOrControl+Alt+Shift+K', () => {
    const copyCommand = process.platform === 'darwin' 
      ? 'osascript -e \'tell application "System Events" to keystroke "c" using command down\''
      : 'xdotool key ctrl+c';
    
    exec(copyCommand, () => {
      setTimeout(() => {
        mainWindow.show();
        mainWindow.focus();
      }, 200);
    });
  });
});

app.on('window-all-closed', () => {
  // Keep app running in background
});

app.on('before-quit', () => {
  globalShortcut.unregisterAll();
});
