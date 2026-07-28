import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('browserAPI', {
  navigate: (url: string) => ipcRenderer.send('navigate', url),
  newTab: () => ipcRenderer.send('new-tab'),
  switchTab: (index: number) => ipcRenderer.send('switch-tab', index),
  closeTab: (index: number) => ipcRenderer.send('close-tab', index),
  onTabsUpdated: (callback: (tabs: any[]) => void) => {
    ipcRenderer.on('tabs-updated', (_event, tabs) => callback(tabs));
  }
});