import { app, BrowserWindow, BrowserView, ipcMain } from 'electron';

let mainWindow: BrowserWindow;
let views: BrowserView[] = [];
let activeViewIndex = 0;

const TOOLBAR_HEIGHT = 80;

function createTab(url: string = 'src/renderer/start.html') {
  const view = new BrowserView();
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
    sendTabsUpdate();
  });

  view.webContents.on('did-navigate-in-page', () => {
    sendTabsUpdate();
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
    return {
      index: i,
      url: isStartPage ? '' : rawUrl,
      title: isStartPage ? 'New Tab' : rawUrl,
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

  createTab();

  mainWindow.on('resize', () => {
    resizeActiveView();
  });

  ipcMain.on('navigate', (_event, url: string) => {
    views[activeViewIndex].webContents.loadURL(url);
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
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});