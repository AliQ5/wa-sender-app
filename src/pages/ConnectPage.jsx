import { useState } from 'react'
import { Smartphone, CheckCircle2, ShieldCheck, LogOut, Plus, Trash2, Power, X } from 'lucide-react'

const API = 'http://localhost:3001'

export default function ConnectPage({ sessions, activeSessionId, setActiveSessionId, onConnected }) {
  const [loadingNew, setLoadingNew] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)
  const [newName, setNewName] = useState('')
  
  // Extract all sessions into an array
  const sessionList = Object.keys(sessions).map(id => ({ id, ...sessions[id] }))
  
  const activeSession = activeSessionId ? sessions[activeSessionId] : null
  const isConnected = activeSession?.status === 'ready'
  const isQR = activeSession?.status === 'qr'
  const qrCode = activeSession?.qr
  const isConnecting = activeSession?.status === 'starting' || activeSession?.status === 'authenticated'

  async function submitNewAccount() {
    let name = newName.trim().replace(/[^a-zA-Z0-9 -]/g, '')
    if (!name) {
      let idx = 1
      while (sessionList.some(s => s.id === `D${idx}`)) {
        idx++
      }
      name = `D${idx}`
    }

    const newId = name
    if (sessionList.some(s => s.id === newId)) {
      alert('An account with this name already exists!')
      return
    }

    setShowPrompt(false)
    setNewName('')
    setLoadingNew(true)
    setActiveSessionId(newId)
    
    try {
      await fetch(`${API}/api/connect`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: newId })
      })
    } catch (e) {
      console.error(e)
    }
    setLoadingNew(false)
  }

  async function handleDelete(id) {
    if (!window.confirm(`Are you sure you want to completely remove account "${id}"? You will need to scan the QR code again if you want to use it later.`)) {
      return
    }
    try {
      await fetch(`${API}/api/disconnect`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: id, deleteFolder: true })
      })
    } catch (e) {}
  }

  async function handleStop(id) {
    try {
      await fetch(`${API}/api/disconnect`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: id, deleteFolder: false })
      })
    } catch (e) {}
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '80vh', padding: 24, position: 'relative' }}>
      
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1>Connect WhatsApp Accounts</h1>
        <div className="subtitle">Manage and link your WhatsApp accounts for broadcasting</div>
      </div>

      <div style={{ display: 'flex', gap: 24, width: '100%', maxWidth: 860, alignItems: 'flex-start' }}>
        
        {/* Left side: Account list */}
        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <h3 style={{ fontSize: 16, fontWeight: 500 }}>Saved Accounts</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowPrompt(true)} disabled={loadingNew}>
              <Plus size={14} /> New
            </button>
          </div>

          {sessionList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-secondary)', fontSize: 13 }}>
              No accounts added yet. Click New to add one.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 360, overflowY: 'auto' }}>
              {sessionList.map(s => (
                <div 
                  key={s.id} 
                  onClick={() => setActiveSessionId(s.id)}
                  style={{ 
                    padding: '12px 16px', 
                    border: `1px solid ${activeSessionId === s.id ? 'var(--accent)' : 'var(--border)'}`, 
                    borderRadius: 8, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    background: activeSessionId === s.id ? '#F0FDF4' : 'var(--bg-primary)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ 
                      width: 10, height: 10, borderRadius: '50%', 
                      background: s.status === 'ready' ? 'var(--accent)' : s.status === 'qr' || s.status === 'starting' ? '#F59E0B' : 'var(--text-hint)' 
                    }} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{s.id}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{s.message || s.status}</div>
                    </div>
                  </div>
                  <button 
                    className="title-btn title-btn-hover" 
                    style={{ borderRadius: 6, width: 32, height: 32 }}
                    onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }}
                    title="Delete Account"
                  >
                    <Trash2 size={14} color="var(--danger)" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right side: Active Account Status */}
        <div className="card" style={{ flex: 1, padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          
          {!activeSessionId ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-secondary)' }}>
              <Smartphone size={32} color="var(--border)" style={{ margin: '0 auto 16px' }} />
              <p>Select an account from the list or add a new one.</p>
            </div>
          ) : isConnected ? (
            <>
              <div style={{ width: 64, height: 64, background: '#F0FDF4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                <CheckCircle2 size={32} color="var(--accent)" />
              </div>
              <h2 style={{ marginBottom: 8 }}>Device Linked</h2>
              <div className="subtitle" style={{ textAlign: 'center', marginBottom: 24 }}>This WhatsApp account is ready to broadcast messages.</div>
              
              <button className="btn btn-primary w-full" onClick={onConnected}>
                Continue to Upload
              </button>

              <button className="btn btn-ghost w-full" style={{ marginTop: 8 }} onClick={() => handleStop(activeSessionId)}>
                <Power size={16} /> Stop Session (Idle)
              </button>
            </>
          ) : isQR && qrCode ? (
            <>
              <div style={{ padding: 16, background: '#FFFFFF', borderRadius: 12, border: '1px solid var(--border)', marginBottom: 24, display: 'inline-block' }}>
                <img src={qrCode} alt="WhatsApp QR Code" width={200} height={200} style={{ display: 'block' }} />
              </div>
              <h2 style={{ marginBottom: 8 }}>Scan QR Code</h2>
              <div className="subtitle" style={{ textAlign: 'center', marginBottom: 24 }}>Open WhatsApp on your phone, go to Linked Devices, and scan this code.</div>
            </>
          ) : (
            <>
              <div style={{ width: 64, height: 64, background: 'var(--bg-secondary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                <Smartphone size={28} color="var(--text-secondary)" />
              </div>
              <h2 style={{ marginBottom: 8 }}>Link Device</h2>
              <div className="subtitle" style={{ textAlign: 'center', marginBottom: 24 }}>
                Start this session to connect to WhatsApp. If you haven't linked it yet, a QR code will be generated.
              </div>
              
              <button
                className="btn btn-primary w-full"
                onClick={() => {
                  fetch(`${API}/api/connect`, { 
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: activeSessionId }) 
                  })
                }}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <><div className="spinner" /> Starting Client...</>
                ) : (
                  'Start Session'
                )}
              </button>
            </>
          )}

        </div>
      </div>

      <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-hint)', fontSize: 12 }}>
        <ShieldCheck size={14} /> End-to-end encrypted sessions. Working independently from your phone.
      </div>

      {showPrompt && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
          <div className="card" style={{ width: 400, padding: 24, position: 'relative' }}>
            <button 
              style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-hint)' }}
              onClick={() => { setShowPrompt(false); setNewName(''); }}
            >
              <X size={20} />
            </button>
            <h2 style={{ marginBottom: 8, fontSize: 18 }}>New Account</h2>
            <p className="subtitle" style={{ marginBottom: 16 }}>Enter a name to identify this WhatsApp account (e.g. Personal, Business).</p>
            <input 
              autoFocus
              type="text" 
              className="form-input" 
              placeholder="Account Name (leave blank for D1, D2...)"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') submitNewAccount() }}
              style={{ marginBottom: 16 }}
            />
            <button className="btn btn-primary w-full" onClick={submitNewAccount}>
              Create Account
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
