import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('browserAPI', {
  navigate: (url: string) => ipcRenderer.send('navigate', url),
  newTab: () => ipcRenderer.send('new-tab'),
  switchTab: (index: number) => ipcRenderer.send('switch-tab', index),
  closeTab: (index: number) => ipcRenderer.send('close-tab', index),
  goBack: () => ipcRenderer.send('go-back'),
  goForward: () => ipcRenderer.send('go-forward'),
  reload: () => ipcRenderer.send('reload'),
  stopLoading: () => ipcRenderer.send('stop-loading'),
  getHistory: () => ipcRenderer.invoke('get-history'),
  onTabsUpdated: (callback: (tabs: any[]) => void) => {
    ipcRenderer.on('tabs-updated', (_event, tabs) => callback(tabs));
  },
  onHistoryUpdated: (callback: () => void) => {
    ipcRenderer.on('history-updated', () => callback());
  },
  onLoadingState: (callback: (loading: boolean) => void) => {
    ipcRenderer.on('loading-state', (_event, loading) => callback(loading));
  }
});