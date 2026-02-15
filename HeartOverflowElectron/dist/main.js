"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
const https_1 = __importDefault(require("https"));
let dashboardWindow;
let notificationWindow;
let tray;
let lastClipboardText = '';
let isQuitting = false;
let notificationTimeout = null;
function createDashboardWindow() {
    dashboardWindow = new electron_1.BrowserWindow({
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
    dashboardWindow.loadFile('index.html');
    dashboardWindow.on('close', (event) => {
        if (!isQuitting) {
            event.preventDefault();
            dashboardWindow.hide();
        }
    });
}
function createNotificationWindow() {
    const { screen } = require('electron');
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;
    notificationWindow = new electron_1.BrowserWindow({
        width: 300,
        height: 100,
        x: width - 320,
        y: 20,
        show: false,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        skipTaskbar: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });
    notificationWindow.loadFile('notification.html');
}
function showNotification() {
    notificationWindow.webContents.send('truth-label', 'Checking...');
    notificationWindow.show();
    if (notificationTimeout) {
        clearTimeout(notificationTimeout);
        notificationTimeout = null;
    }
}
function createTray() {
    const iconPath = path_1.default.join(__dirname, '../eye.png');
    const icon = electron_1.nativeImage.createFromPath(iconPath);
    tray = new electron_1.Tray(icon.resize({ width: 24, height: 24 }));
    const contextMenu = electron_1.Menu.buildFromTemplate([
        {
            label: 'Factcheck',
            click: () => {
                const copyCommand = process.platform === 'darwin'
                    ? 'osascript -e \'tell application "System Events" to keystroke "c" using command down\''
                    : 'xdotool key ctrl+c';
                (0, child_process_1.exec)(copyCommand, () => {
                    setTimeout(() => {
                        showNotification();
                        checkClipboard();
                    }, 200);
                });
            }
        },
        { label: 'Open Dashboard', click: () => dashboardWindow.show() },
        { label: 'Settings', click: () => {
                dashboardWindow.show();
                dashboardWindow.focus();
                dashboardWindow.webContents.send('open-settings');
            } },
        { label: 'Quit', click: () => {
                isQuitting = true;
                electron_1.app.quit();
            } }
    ]);
    tray.setContextMenu(contextMenu);
    tray.setToolTip('Verity');
}
function checkClipboard() {
    const currentText = electron_1.clipboard.readText();
    if (currentText) {
        lastClipboardText = currentText;
        const sanitizedText = currentText.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x00-\x7F]/g, '').replace(/'/g, "\\'");
        dashboardWindow.webContents.send('clipboard-update', currentText);
        dashboardWindow.webContents.executeJavaScript('localStorage.getItem("affiliation")')
            .then((affiliation) => {
            const payload = { text: sanitizedText, affiliation: affiliation || '' };
            const data = JSON.stringify(payload);
            const options = {
                hostname: '3cdqdmy43d.execute-api.us-east-1.amazonaws.com',
                path: '/staging/check',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': data.length
                }
            };
            const req = https_1.default.request(options, (res) => {
                let responseData = '';
                res.on('data', (chunk) => { responseData += chunk; });
                res.on('end', () => {
                    const response = JSON.parse(responseData);
                    console.log('API Response:', response);
                    dashboardWindow.webContents.send('verification-result', response);
                    notificationWindow.webContents.send('truth-label', response.verdict);
                    notificationWindow.webContents.send('confidence', response.confidence);
                    if (notificationTimeout) {
                        clearTimeout(notificationTimeout);
                    }
                    notificationTimeout = setTimeout(() => {
                        if (notificationWindow && !notificationWindow.isDestroyed()) {
                            notificationWindow.hide();
                        }
                    }, 30000);
                });
            });
            req.on('error', () => { });
            req.write(data);
            req.end();
        });
    }
}
electron_1.app.whenReady().then(() => {
    createDashboardWindow();
    createNotificationWindow();
    createTray();
    electron_1.ipcMain.on('hide-window', () => {
        dashboardWindow.hide();
    });
    electron_1.ipcMain.on('open-dashboard', () => {
        notificationWindow.hide();
        dashboardWindow.show();
        dashboardWindow.focus();
    });
    electron_1.globalShortcut.register('CommandOrControl+Alt+Shift+K', () => {
        const copyCommand = process.platform === 'darwin'
            ? 'osascript -e \'tell application "System Events" to keystroke "c" using command down\''
            : 'xdotool key ctrl+c';
        (0, child_process_1.exec)(copyCommand, () => {
            setTimeout(() => {
                showNotification();
                checkClipboard();
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
