const { dialog } = require('electron')
const { autoUpdater } = require('electron-updater')

function setupUpdater() {
  autoUpdater.on('update-available', () => {
    // We could notify here, but update-downloaded is usually better.
  })

  autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox({
      type: 'info',
      title: 'Update Available',
      message: 'A new version of WA-SENDER is available. It will be installed on next launch.',
      buttons: ['OK']
    })
  })

  autoUpdater.on('error', (err) => {
    console.error('Auto-updater error:', err)
  })

  try {
    autoUpdater.checkForUpdatesAndNotify()
  } catch (err) {
    console.error('Failed to check for updates:', err)
  }
}

module.exports = setupUpdater
