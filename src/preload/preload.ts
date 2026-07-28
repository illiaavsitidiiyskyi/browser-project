import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('browserAPI', {
  navigate: (url: string) => ipcRenderer.send('navigate', url)
});