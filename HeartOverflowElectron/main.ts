import { app, BrowserWindow, clipboard, Tray, Menu, globalShortcut, nativeImage } from 'electron';
import path from 'path';
import { exec } from 'child_process';

let mainWindow: BrowserWindow;
let tray: Tray;
let lastClipboardText = '';
let isQuitting = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    show: false,
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
    }
  }, 500);
}

app.whenReady().then(() => {
  createWindow();
  createTray();
  
  globalShortcut.register('CommandOrControl+F+L', () => {
    const copyCommand = process.platform === 'darwin' 
      ? 'osascript -e \'tell application "System Events" to keystroke "c" using command down\''
      : 'xdotool key ctrl+c';
    
    exec(copyCommand, (error) => {
      if (error) console.log('Copy error:', error);
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
