import { UploadCloud, FileText, Send, MessageCircle, Info, Link2 } from 'lucide-react'

export default function Sidebar({ page, setPage, waStatus }) {
  const isConnected = waStatus?.status === 'ready'
  
  const steps = [
    { id: 'connect', icon: Link2, label: 'Accounts' },
    { id: 'upload', icon: UploadCloud, label: 'Step 1: Upload File' },
    { id: 'templates', icon: FileText, label: 'Step 2: Template' },
    { id: 'send', icon: Send, label: 'Step 3: Preview & Send' }
  ]

  return (
    <div className="sidebar">
      {/* Top Section */}
      <div className="sidebar-logo">
        <MessageCircle size={20} color="var(--accent)" fill="var(--accent)" />
        <span className="sidebar-text">WA-SENDER</span>
      </div>
      
      <div className="sidebar-status" onClick={() => setPage('connect')} style={{ cursor: 'pointer' }}>
        <div className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`} />
        <span className="sidebar-text">{isConnected ? 'Connected' : 'Offline'}</span>
      </div>

      {/* Navigator */}
      <div className="step-nav">
        {steps.map((step) => {
          const isActive = page === step.id
          // We don't enforce strict linear status anymore visually, since users can jump around
          // But we can keep active state
          const status = isActive ? 'active' : 'idle'
          
          const Icon = step.icon

          return (
            <div 
              key={step.id} 
              className={`step-item ${status}`}
              onClick={() => setPage(step.id)}
              style={{ cursor: 'pointer' }}
            >
              <Icon size={18} />
              <span className="sidebar-text">{step.label}</span>
            </div>
          )
        })}
      </div>

      {/* Footer Nav */}
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div 
          className={`step-item ${page === 'about' ? 'active' : 'idle'}`}
          onClick={() => setPage('about')}
          style={{ cursor: 'pointer' }}
        >
          <Info size={18} />
          <span className="sidebar-text">About & Help</span>
        </div>
        
        <div className="sidebar-footer sidebar-text" style={{ marginTop: 16 }}>
          Messages are sent via WhatsApp Web. Please keep your phone connected to the internet.
        </div>
      </div>
    </div>
  )
}
