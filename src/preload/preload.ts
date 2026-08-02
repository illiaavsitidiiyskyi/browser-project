import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('browserAPI', {
  navigate: (url: string) => ipcRenderer.send('navigate', url),
  newTab: () => ipcRenderer.send('new-tab'),
  newPrivateTab: () => ipcRenderer.send('new-private-tab'),
  switchTab: (index: number) => ipcRenderer.send('switch-tab', index),
  closeTab: (index: number) => ipcRenderer.send('close-tab', index),
  reorderTabs: (fromIndex: number, toIndex: number) => ipcRenderer.send('reorder-tabs', fromIndex, toIndex),
  goBack: () => ipcRenderer.send('go-back'),
  goForward: () => ipcRenderer.send('go-forward'),
  reload: () => ipcRenderer.send('reload'),
  stopLoading: () => ipcRenderer.send('stop-loading'),
  getHistory: () => ipcRenderer.invoke('get-history'),
  getBookmarks: () => ipcRenderer.invoke('get-bookmarks'),
  toggleBookmark: () => ipcRenderer.send('toggle-bookmark'),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings: { homepage: string | null }) => ipcRenderer.send('save-settings', settings),
  toggleTheme: () => ipcRenderer.send('toggle-theme'),
  onTabsUpdated: (callback: (tabs: any[]) => void) => {
    ipcRenderer.on('tabs-updated', (_event, tabs) => callback(tabs));
  },
  onHistoryUpdated: (callback: () => void) => {
    ipcRenderer.on('history-updated', () => callback());
  },
  onBookmarksUpdated: (callback: () => void) => {
    ipcRenderer.on('bookmarks-updated', () => callback());
  },
  onLoadingState: (callback: (loading: boolean) => void) => {
    ipcRenderer.on('loading-state', (_event, loading) => callback(loading));
  },
  onFocusAddressBar: (callback: () => void) => {
    ipcRenderer.on('focus-address-bar', () => callback());
  },
  onThemeUpdated: (callback: (theme: 'light' | 'dark') => void) => {
    ipcRenderer.on('theme-updated', (_event, theme) => callback(theme));
  }
});