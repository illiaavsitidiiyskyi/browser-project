import { app, BrowserWindow, BrowserView, ipcMain } from 'electron';

let mainWindow: BrowserWindow;
let view: BrowserView;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: __dirname + '/../preload/preload.js'
    }
  });

  mainWindow.loadFile('src/renderer/index.html');

  view = new BrowserView();
  mainWindow.setBrowserView(view);
  view.setBounds({ x: 0, y: 80, width: 1200, height: 720 });
  view.webContents.loadURL('https://www.google.com');

  mainWindow.on('resize', () => {
    const bounds = mainWindow.getBounds();
    view.setBounds({ x: 0, y: 80, width: bounds.width, height: bounds.height - 80 });
  });

  ipcMain.on('navigate', (_event, url: string) => {
    view.webContents.loadURL(url);
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});