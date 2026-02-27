import { useState, useEffect } from 'react'
import {
  Camera,
  FolderOpen,
  X,
  Minus,
  Square,
  Image as ImageIcon,
  Zap,
  Bell,
  HardDrive,
  Info
} from 'lucide-react'

interface AppSettings {
  savePath: string
  activationMode: 'manual' | 'hotkey' | 'auto'
  autoSaveEnabled: boolean
  globalCtrlVEnabled: boolean
  saveToActiveExplorer: boolean
  compressionLevel: number
  format: 'png' | 'jpg' | 'webp'
}

interface SavedItem {
  name: string
  path: string
  time: string
}


function App(): React.JSX.Element {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [history, setHistory] = useState<SavedItem[]>([])
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async (): Promise<void> => {
    const s = await window.api.getSettings()
    setSettings(s)
  }

  const handleUpdateSetting = async <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ): Promise<void> => {
    const updated = await window.api.updateSetting(key, value)
    setSettings(updated)
  }

  const handleSaveCapture = async (): Promise<void> => {
    setIsSaving(true)
    try {
      const result = await window.api.saveClipboard()
      if (result.success && result.path) {
        const newItem: SavedItem = {
          name: result.path.split('\\').pop() || 'Untitled',
          path: result.path,
          time: new Date().toLocaleTimeString()
        }
        setHistory((prev) => [newItem, ...prev].slice(0, 10))
      }
    } finally {
      setTimeout(() => setIsSaving(false), 500)
    }
  }

  const handleSelectFolder = async (): Promise<void> => {
    const path = await window.api.selectFolder()
    if (path) {
      await loadSettings()
    }
  }

  if (!settings) return <div className="loading">Initializing...</div>

  return (
    <div className="app-container">
      {/* Title Bar */}
      <div className="title-bar">
        <div className="title-bar-info">
          <ImageIcon size={18} className="app-icon" style={{ color: '#6366f1' }} />
          <span className="app-title">CLIPBOARD TO PNG</span>
        </div>
        <div className="window-controls">
          <div className="control-btn" onClick={() => window.api.windowControl('minimize')}>
            <Minus size={16} />
          </div>
          <div className="control-btn" onClick={() => window.api.windowControl('maximize')}>
            <Square size={12} />
          </div>
          <div className="control-btn close" onClick={() => window.api.windowControl('close')}>
            <X size={16} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="main-content">
        {/* Left Panel */}
        <div className="control-panel">
          <div className="status-card">
            <button
              className="hero-btn"
              onClick={handleSaveCapture}
              disabled={isSaving}
              style={{ opacity: isSaving ? 0.7 : 1 }}
            >
              {isSaving ? <Zap className="animate-pulse" /> : <Camera size={24} />}
              {isSaving ? 'Đang lưu...' : 'Lưu từ Clipboard'}
            </button>

            <div className="settings-grid">
              <div className="setting-item">
                <div className="setting-label">
                  <span className="label-title">Tự động lưu</span>
                  <span className="label-desc">Tự động lưu khi nhận thấy clipboard thay đổi</span>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={settings.autoSaveEnabled}
                    onChange={(e) => handleUpdateSetting('autoSaveEnabled', e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-label">
                  <span className="label-title">Global Ctrl+V</span>
                  <span className="label-desc">Lưu ảnh bằng phím tắt dán tiêu chuẩn</span>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={settings.globalCtrlVEnabled}
                    onChange={(e) => handleUpdateSetting('globalCtrlVEnabled', e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-label">
                  <span className="label-title">Lưu vào Explorer đang mở</span>
                  <span className="label-desc">Lưu trực tiếp vào tab thư mục đang chọn</span>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={settings.saveToActiveExplorer}
                    onChange={(e) => handleUpdateSetting('saveToActiveExplorer', e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="setting-item" onClick={handleSelectFolder} style={{ cursor: 'pointer' }}>
                <div className="setting-label">
                  <span className="label-title">Thư mục mặc định</span>
                  <span className="label-desc" style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {settings.savePath}
                  </span>
                </div>
                <FolderOpen size={18} style={{ color: '#94a3b8' }} />
              </div>

              <div className="setting-item">
                <div className="setting-label">
                  <span className="label-title">Định dạng</span>
                  <span className="label-desc">Định dạng file ảnh đầu ra</span>
                </div>
                <select
                  value={settings.format}
                  onChange={(e) => handleUpdateSetting('format', e.target.value as AppSettings['format'])}
                  style={{ background: '#334155', color: 'white', border: 'none', borderRadius: '4px', padding: '4px' }}
                >
                  <option value="png">PNG</option>
                  <option value="jpg">JPG</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ padding: '0 8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '0.8rem' }}>
              <Info size={14} />
              <span>Nhấn <span className="key-tag">Ctrl</span> + <span className="key-tag">V</span> hoặc <span className="key-tag">Ctrl</span> + <span className="key-tag">Shift</span> + <span className="key-tag">V</span> để lưu nhanh</span>
            </div>
          </div>

        </div>

        {/* Right Panel */}
        <div className="preview-panel">
          <div className="panel-header">Lịch sử lưu ảnh</div>
          <div className="history-list">
            {history.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#475569', gap: '12px' }}>
                <ImageIcon size={48} strokeWidth={1} />
                <span style={{ fontSize: '0.9rem' }}>Chưa có ảnh nào được lưu</span>
              </div>
            ) : (
              history.map((item, idx) => (
                <div key={idx} className="history-item" onClick={() => window.electron.ipcRenderer.send('open-file', item.path)}>
                  <div className="item-info">
                    <span className="item-name">{item.name}</span>
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{item.time}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <HardDrive size={12} />
            <span>Sẵn sàng</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Bell size={12} />
            <span>Thông báo: Bật</span>
          </div>
        </div>
        <div className="version-info">v1.0.0</div>
      </footer>
    </div>
  )
}

export default App

