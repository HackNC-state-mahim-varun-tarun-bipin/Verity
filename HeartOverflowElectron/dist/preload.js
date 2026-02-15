"use strict";
const { contextBridge, ipcRenderer } = require('electron');
const axios = require('axios');
contextBridge.exposeInMainWorld('api', {
    onClipboardUpdate: (callback) => {
        ipcRenderer.on('clipboard-update', (_event, text) => callback(text));
    },
    sendRequest: async (url, data) => {
        return await axios.post(url, data);
    }
});
