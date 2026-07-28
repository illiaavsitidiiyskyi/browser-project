import { app, BrowserWindow, BrowserView, ipcMain } from 'electron';

let mainWindow: BrowserWindow;
let views: BrowserView[] = [];
let activeViewIndex = 0;

const TOOLBAR_HEIGHT = 80;

function createTab(url: string = 'https://www.google.com') {
  const view = new BrowserView();
  views.push(view);
  activeViewIndex = views.length - 1;

  view.webContents.loadURL(url);
  mainWindow.setBrowserView(view);
  resizeActiveView();

  view.webContents.on('did-navigate', () => {
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
  const tabs = views.map((v, i) => ({
    index: i,
    url: v.webContents.getURL(),
    active: i === activeViewIndex
  }));
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
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});