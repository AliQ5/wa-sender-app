const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  onMaximizeChange: (cb) => ipcRenderer.on('maximize-change', (_, val) => cb(val)),
  templates: {
    getAll: () => ipcRenderer.invoke('templates:getAll'),
    save: (template) => ipcRenderer.invoke('templates:save', template),
    delete: (id) => ipcRenderer.invoke('templates:delete', id),
  }
})
