import { app, BrowserWindow, BrowserView, ipcMain } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

const historyPath = path.join(app.getPath('userData'), 'history.json');
let history: { url: string; title: string; timestamp: number }[] = [];

function loadHistory() {
  if (fs.existsSync(historyPath)) {
    history = JSON.parse(fs.readFileSync(historyPath, 'utf-8'));
  }
}

function saveHistory() {
  fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
}

function addHistoryEntry(url: string, title: string) {
  if (url.includes('start.html') || url.includes('history.html')) return;
  history.unshift({ url, title, timestamp: Date.now() });
  saveHistory();
}

function broadcastHistoryUpdate() {
  views.forEach(v => v.webContents.send('history-updated'));
}

let mainWindow: BrowserWindow;
let views: BrowserView[] = [];
let activeViewIndex = 0;

const TOOLBAR_HEIGHT = 80;

function createTab(url: string = 'src/renderer/start.html') {
  const view = new BrowserView({
    webPreferences: {
      preload: __dirname + '/../preload/preload.js'
    }
  });
  views.push(view);
  activeViewIndex = views.length - 1;

  if (url.endsWith('.html')) {
    view.webContents.loadFile(url);
  } else {
    view.webContents.loadURL(url);
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
    let title = v.webContents.getTitle() || rawUrl;
    let url = rawUrl;

    if (isStartPage) {
      title = 'New Tab';
      url = '';
    } else if (isHistoryPage) {
      title = 'History';
      url = '';
    }

    return {
      index: i,
      url,
      title,
      active: i === activeViewIndex
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

  loadHistory();
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
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});