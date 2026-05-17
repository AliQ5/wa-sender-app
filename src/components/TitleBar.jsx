import { useState, useEffect } from 'react'
import { MessageCircle, Minus, Maximize2, Minimize2, X } from 'lucide-react'

export default function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.onMaximizeChange((val) => {
        setIsMaximized(val)
      })
    }
  }, [])

  function handleMinimize() {
    if (window.electronAPI) window.electronAPI.minimize()
  }

  function handleMaximize() {
    if (window.electronAPI) window.electronAPI.maximize()
  }

  function handleClose() {
    if (window.electronAPI) window.electronAPI.close()
  }

  return (
    <div className="title-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 38, background: '#FFFFFF', borderBottom: '1px solid var(--border)', WebkitAppRegion: 'drag' }}>
      
      {/* Left side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 12 }}>
        <MessageCircle size={16} color="var(--accent)" fill="var(--accent)" />
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>WA-SENDER</span>
        <span style={{ fontSize: 12, color: 'var(--text-hint)' }}>v1.2.1</span>
      </div>

      {/* Right side controls */}
      <div style={{ display: 'flex', WebkitAppRegion: 'no-drag' }}>
        <button className="title-btn title-btn-hover" onClick={handleMinimize}>
          <Minus size={14} />
        </button>
        <button className="title-btn title-btn-hover" onClick={handleMaximize}>
          {isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>
        <button className="title-btn title-btn-close" onClick={handleClose}>
          <X size={14} />
        </button>
      </div>

    </div>
  )
}
