import { app, BrowserWindow, BrowserView, ipcMain } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

const historyPath = path.join(app.getPath('userData'), 'history.json');
let history: { url: string; title: string; timestamp: number }[] = [];

const bookmarksPath = path.join(app.getPath('userData'), 'bookmarks.json');
let bookmarks: { url: string; title: string; timestamp: number }[] = [];

const settingsPath = path.join(app.getPath('userData'), 'settings.json');
let settings: { homepage: string | null } = { homepage: null };

function loadSettings() {
  if (fs.existsSync(settingsPath)) {
    settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
  }
}

function saveSettings() {
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
}

function loadHistory() {
  if (fs.existsSync(historyPath)) {
    history = JSON.parse(fs.readFileSync(historyPath, 'utf-8'));
  }
}

function saveHistory() {
  fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
}

function addHistoryEntry(url: string, title: string) {
  if (url.includes('start.html') || url.includes('history.html') || url.includes('bookmarks.html') || url.includes('settings.html')) return;

  const last = history[0];
  const DEDUPE_WINDOW_MS = 60 * 1000;
  if (last && last.url === url && Date.now() - last.timestamp < DEDUPE_WINDOW_MS) {
    last.timestamp = Date.now();
    last.title = title;
    saveHistory();
    return;
  }

  history.unshift({ url, title, timestamp: Date.now() });
  saveHistory();
}

function broadcastHistoryUpdate() {
  views.forEach(v => v.webContents.send('history-updated'));
}

function loadBookmarks() {
  if (fs.existsSync(bookmarksPath)) {
    bookmarks = JSON.parse(fs.readFileSync(bookmarksPath, 'utf-8'));
  }
}

function saveBookmarks() {
  fs.writeFileSync(bookmarksPath, JSON.stringify(bookmarks, null, 2));
}

function toggleBookmark(url: string, title: string) {
  const existingIndex = bookmarks.findIndex(b => b.url === url);
  if (existingIndex >= 0) {
    bookmarks.splice(existingIndex, 1);
  } else {
    bookmarks.unshift({ url, title, timestamp: Date.now() });
  }
  saveBookmarks();
  broadcastBookmarksUpdate();
}

function broadcastBookmarksUpdate() {
  views.forEach(v => v.webContents.send('bookmarks-updated'));
}

let mainWindow: BrowserWindow;
let views: BrowserView[] = [];
let activeViewIndex = 0;

const TOOLBAR_HEIGHT = 80;

function getDefaultUrl(): string {
  if (!settings.homepage || settings.homepage.trim() === '') {
    return 'src/renderer/start.html';
  }
  let url = settings.homepage.trim();
  if (!url.startsWith('http')) {
    url = 'https://' + url;
  }
  return url;
}

function createTab(url?: string) {
  const targetUrl = url || getDefaultUrl();

  const view = new BrowserView({
    webPreferences: {
      preload: __dirname + '/../preload/preload.js'
    }
  });
  views.push(view);
  activeViewIndex = views.length - 1;

  if (targetUrl.endsWith('.html')) {
    view.webContents.loadFile(targetUrl);
  } else {
    view.webContents.loadURL(targetUrl);
  }

  mainWindow.setBrowserView(view);
  resizeActiveView();

  view.webContents.on('did-navigate', () => {
    addHistoryEntry(view.webContents.getURL(), view.webContents.getTitle());
    sendTabsUpdate();
    broadcastHistoryUpdate();
  });

  view.webContents.on('did-navigate-in-page', () => {
    sendTabsUpdate();
  });

  view.webContents.on('page-title-updated', () => {
    sendTabsUpdate();
  });

  view.webContents.on('did-start-loading', () => {
    if (views[activeViewIndex] === view) {
      mainWindow.webContents.send('loading-state', true);
    }
  });

  view.webContents.on('did-stop-loading', () => {
    if (views[activeViewIndex] === view) {
      mainWindow.webContents.send('loading-state', false);
    }
  });

  sendTabsUpdate();
}

function resizeActiveView() {
  const bounds = mainWindow.getBounds();
  views[activeViewIndex].setBounds({
    x: 0,
    y: TOOLBAR_HEIGHT,
    width: bounds.width,
    height: bounds.height - TOOLBAR_HEIGHT
  });
}

function switchTab(index: number) {
  activeViewIndex = index;
  mainWindow.setBrowserView(views[index]);
  resizeActiveView();
  sendTabsUpdate();
  mainWindow.webContents.send('loading-state', views[index].webContents.isLoading());
}

function closeTab(index: number) {
  views[index].webContents.close();
  views.splice(index, 1);

  if (views.length === 0) {
    createTab();
    return;
  }

  activeViewIndex = Math.min(index, views.length - 1);
  switchTab(activeViewIndex);
}

function sendTabsUpdate() {
  const tabs = views.map((v, i) => {
    const rawUrl = v.webContents.getURL();
    const isStartPage = rawUrl.includes('start.html');
    const isHistoryPage = rawUrl.includes('history.html');
    const isBookmarksPage = rawUrl.includes('bookmarks.html');
    const isSettingsPage = rawUrl.includes('settings.html');
    let title = v.webContents.getTitle() || rawUrl;
    let url = rawUrl;

    if (isStartPage) {
      title = 'New Tab';
      url = '';
    } else if (isHistoryPage) {
      title = 'History';
      url = '';
    } else if (isBookmarksPage) {
      title = 'Bookmarks';
      url = '';
    } else if (isSettingsPage) {
      title = 'Settings';
      url = '';
    }

    return {
      index: i,
      url,
      title,
      active: i === activeViewIndex,
      isBookmarked: bookmarks.some(b => b.url === rawUrl)
    };
  });
  mainWindow.webContents.send('tabs-updated', tabs);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: __dirname + '/../preload/preload.js'
    }
  });

  mainWindow.loadFile('src/renderer/index.html');

  loadSettings();
  loadHistory();
  loadBookmarks();
  createTab();

  mainWindow.on('resize', () => {
    resizeActiveView();
  });

  ipcMain.on('navigate', (_event, url: string) => {
    const wc = views[activeViewIndex].webContents;
    if (url.endsWith('.html')) {
      wc.loadFile(url);
    } else {
      wc.loadURL(url);
    }
  });

  ipcMain.on('new-tab', () => {
    createTab();
  });

  ipcMain.on('switch-tab', (_event, index: number) => {
    switchTab(index);
  });

  ipcMain.on('close-tab', (_event, index: number) => {
    closeTab(index);
  });

  ipcMain.on('go-back', () => {
    const wc = views[activeViewIndex].webContents;
    if (wc.canGoBack()) wc.goBack();
  });

  ipcMain.on('go-forward', () => {
    const wc = views[activeViewIndex].webContents;
    if (wc.canGoForward()) wc.goForward();
  });

  ipcMain.on('reload', () => {
    views[activeViewIndex].webContents.reload();
  });

  ipcMain.on('stop-loading', () => {
    views[activeViewIndex].webContents.stop();
  });

  ipcMain.handle('get-history', () => {
    return history;
  });

  ipcMain.handle('get-bookmarks', () => {
    return bookmarks;
  });

  ipcMain.on('toggle-bookmark', () => {
    const wc = views[activeViewIndex].webContents;
    toggleBookmark(wc.getURL(), wc.getTitle());
    sendTabsUpdate();
  });

  ipcMain.handle('get-settings', () => {
    return settings;
  });

  ipcMain.on('save-settings', (_event, newSettings: { homepage: string | null }) => {
    settings = newSettings;
    saveSettings();
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});