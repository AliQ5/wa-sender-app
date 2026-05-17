const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const { fork } = require('child_process')

let mainWindow
let serverProcess

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

function startServer() {
  const serverPath = isDev
    ? path.join(__dirname, '../server/server.cjs')
    : path.join(process.resourcesPath, 'server/server.cjs')

  serverProcess = fork(serverPath, [], {
    env: { ...process.env, PORT: '3001' },
    silent: false
  })

  serverProcess.on('error', (err) => {
    console.error('Server process error:', err)
  })
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    },
    frame: false,
    titleBarStyle: 'hidden',
    icon: path.join(__dirname, '../public/icon.ico'),
    backgroundColor: '#0f0f1a'
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  startServer()
  // Give server a moment to start
  setTimeout(createWindow, 1500)
})

app.on('window-all-closed', () => {
  if (serverProcess) serverProcess.kill()
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// Window controls
ipcMain.on('minimize-window', () => mainWindow?.minimize())
ipcMain.on('maximize-window', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize()
  else mainWindow?.maximize()
})
ipcMain.on('close-window', () => mainWindow?.close())
