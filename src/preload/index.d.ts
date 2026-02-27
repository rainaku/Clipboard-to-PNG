import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      getSettings: () => Promise<any>
      updateSetting: (key: string, value: any) => Promise<any>
      saveClipboard: () => Promise<{ success: boolean; path?: string; error?: string }>
      selectFolder: () => Promise<string | null>
      windowControl: (action: 'minimize' | 'maximize' | 'close') => void
    }
  }
}
