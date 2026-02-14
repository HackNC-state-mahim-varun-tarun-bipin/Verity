"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
let mainWindow;
let tray;
let lastClipboardText = '';
let isQuitting = false;
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
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
    const iconPath = path_1.default.join(__dirname, '../eye.png');
    const icon = electron_1.nativeImage.createFromPath(iconPath);
    tray = new electron_1.Tray(icon.resize({ width: 24, height: 24 }));
    const contextMenu = electron_1.Menu.buildFromTemplate([
        { label: 'Open Dashboard', click: () => mainWindow.show() },
        { label: 'Quit', click: () => {
                isQuitting = true;
                electron_1.app.quit();
            } }
    ]);
    tray.setContextMenu(contextMenu);
    tray.setToolTip('HeartOverflow');
}
function startClipboardMonitor() {
    setInterval(() => {
        const currentText = electron_1.clipboard.readText();
        if (currentText && currentText !== lastClipboardText) {
            lastClipboardText = currentText;
            mainWindow.webContents.send('clipboard-update', currentText);
        }
    }, 500);
}
electron_1.app.whenReady().then(() => {
    createWindow();
    createTray();
    electron_1.globalShortcut.register('CommandOrControl+F+L', () => {
        const copyCommand = process.platform === 'darwin'
            ? 'osascript -e \'tell application "System Events" to keystroke "c" using command down\''
            : 'xdotool key ctrl+c';
        (0, child_process_1.exec)(copyCommand, (error) => {
            if (error)
                console.log('Copy error:', error);
            setTimeout(() => {
                mainWindow.show();
                mainWindow.focus();
            }, 200);
        });
    });
});
electron_1.app.on('window-all-closed', () => {
    // Keep app running in background
});
electron_1.app.on('before-quit', () => {
    electron_1.globalShortcut.unregisterAll();
});
