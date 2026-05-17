const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const { fork } = require('child_process')
const setupUpdater = require('./updater')

let win

let storePromise = import('electron-store').then(m => new m.default())

ipcMain.handle('templates:getAll', async () => {
  const store = await storePromise
  return store.get('templates', [])
})

ipcMain.handle('templates:save', async (_, template) => {
  const store = await storePromise
  const current = store.get('templates', [])
  current.unshift(template)
  if (current.length > 50) current.length = 50
  store.set('templates', current)
  return current
})

ipcMain.handle('templates:delete', async (_, id) => {
  const store = await storePromise
  const current = store.get('templates', [])
  const updated = current.filter(t => t.id !== id)
  store.set('templates', updated)
  return updated
})

function startServer() {
  process.env.PORT = '3001'
  try {
    require('../server/server.cjs')
    console.log('✅ Server started in main process')
  } catch (err) {
    console.error('❌ Failed to start server:', err)
  }
}

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 640,
    frame: false,
    transparent: false,
    backgroundColor: '#FFFFFF',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webviewTag: false
    },
    icon: path.join(__dirname, '../assets/icon.png'),
    show: false
  })

  win.once('ready-to-show', () => {
    win.show()
    setupUpdater()
  })

  win.on('maximize', () => {
    win.webContents.send('maximize-change', true)
  })

  win.on('unmaximize', () => {
    win.webContents.send('maximize-change', false)
  })

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged
  if (isDev) {
    win.loadURL('http://localhost:5173')
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(() => {
  startServer()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

ipcMain.on('window-minimize', () => {
  if (win) win.minimize()
})

ipcMain.on('window-maximize', () => {
  if (win) {
    if (win.isMaximized()) {
      win.unmaximize()
    } else {
      win.maximize()
    }
  }
})

ipcMain.on('window-close', () => {
  if (win) win.close()
})
