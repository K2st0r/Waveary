const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("wavearyDesktop", {
  notifications: {
    getState: () => ipcRenderer.invoke("waveary:notifications:get-state"),
    requestPermission: () => ipcRenderer.invoke("waveary:notifications:request-permission"),
    show: (payload) => ipcRenderer.invoke("waveary:notifications:show", payload)
  }
});
