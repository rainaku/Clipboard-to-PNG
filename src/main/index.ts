import { app, shell, BrowserWindow, ipcMain, globalShortcut, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { clipboardService } from './clipboard-service'
import { createTray } from './tray'
import { store } from './store'
import * as os from 'os'
import * as fs from 'fs'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

let mainWindow: BrowserWindow | null = null
let isAppQuiting = false // Local variable to track quitting state

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    show: false,
    autoHideMenuBar: true,
    transparent: true,
    frame: false,
    resizable: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Handle window close - hide instead of quit
  mainWindow.on('close', (event) => {
    if (!isAppQuiting) {
      event.preventDefault()
      mainWindow?.hide()
    }
  })

}

// Local variable to track quitting state is defined at top-level

app.whenReady().then(() => {
  try {
    console.log('App is ready, initializing...')
    let isPassthrough = false
    let isReRegistering = false

    const doPassthrough = async (): Promise<void> => {
      if (isPassthrough) return
      isPassthrough = true
      globalShortcut.unregister('CommandOrControl+V')

      const vbsPath = join(os.tmpdir(), 'send_ctrl_v.vbs')
      try {
        fs.writeFileSync(vbsPath, 'WScript.Sleep 50\nCreateObject("WScript.Shell").SendKeys "^v"')
        await execAsync(`cscript //nologo "${vbsPath}"`)
      } catch (e) {
        console.error('Passthrough error:', e)
      } finally {
        if (!isReRegistering) {
          isReRegistering = true
          setTimeout(() => {
            isPassthrough = false
            isReRegistering = false
            if (store.get('globalCtrlVEnabled')) {
              globalShortcut.register('CommandOrControl+V', ctrlVHandler)
            }
          }, 100)
        }
      }
    }

    const ctrlVHandler = async (): Promise<void> => {
      if (isPassthrough) return
      const result = await clipboardService.saveImageFromClipboard(false)
      if (!result.success && (result.reason === 'no_image' || result.reason === 'not_explorer')) {
        await doPassthrough()
      }
    }

    // Set app user model id for windows
    electronApp.setAppUserModelId('com.rainaku.clipboardpng')

    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })

    const registerShortcuts = (): void => {
      globalShortcut.unregisterAll()

      // Always register the safe hotkey
      globalShortcut.register('CommandOrControl+Shift+V', () => {
        void clipboardService.saveImageFromClipboard(true)
      })

      // Register Ctrl+V if enabled
      if (store.get('globalCtrlVEnabled')) {
        globalShortcut.register('CommandOrControl+V', ctrlVHandler)
      }
    }

    // IPC Handlers
    ipcMain.handle('get-settings', () => {
      try {
        return store.store
      } catch (e) {
        console.error('Error in get-settings handler:', e)
        throw e
      }
    })

    ipcMain.handle('update-setting', <K extends keyof import('./store').Settings>(_: unknown, key: K, value: import('./store').Settings[K]) => {
      try {
        store.set(key, value)

        // Side effects of setting changes
        if (key === 'autoSaveEnabled') {
          if (value) clipboardService.startWatching()
          else clipboardService.stopWatching()
        }

        if (key === 'globalCtrlVEnabled') {
          registerShortcuts()
        }

        return store.store
      } catch (e) {
        console.error('Error in update-setting handler:', e)
        throw e
      }
    })

    ipcMain.handle('save-clipboard', () => clipboardService.saveImageFromClipboard(true))
    ipcMain.handle('select-folder', async () => {
      const result = await dialog.showOpenDialog(mainWindow!, {
        properties: ['openDirectory']
      })
      if (!result.canceled && result.filePaths.length > 0) {
        store.set('savePath', result.filePaths[0])
        return result.filePaths[0]
      }
      return null
    })

    ipcMain.on('open-file', (_, filePath: string) => {
      shell.showItemInFolder(filePath)
    })

    ipcMain.on('window-control', (_, action: 'minimize' | 'maximize' | 'close') => {
      if (!mainWindow) return
      if (action === 'minimize') mainWindow.minimize()
      else if (action === 'maximize') {
        if (mainWindow.isMaximized()) mainWindow.unmaximize()
        else mainWindow.maximize()
      }
      else if (action === 'close') mainWindow.hide()
    })

    // Create window and other UI elements
    createWindow()

    if (mainWindow) {
      createTray(mainWindow)
    }

    // Register Initial Shortcuts
    registerShortcuts()

    // Initialize Clipboard Watching if enabled
    if (store.get('autoSaveEnabled')) {
      clipboardService.startWatching()
    }

    app.on('activate', function () {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
      else mainWindow?.show()
    })
  } catch (err) {
    console.error('CRITICAL ERROR DURING INITIALIZATION:', err)
  }
})

app.on('before-quit', () => {
  isAppQuiting = true
  clipboardService.stopWatching()
})


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})


// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
