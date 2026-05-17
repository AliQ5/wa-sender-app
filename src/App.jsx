import { useState, useEffect } from 'react'
import { io } from 'socket.io-client'
import Sidebar from './components/Sidebar.jsx'
import TitleBar from './components/TitleBar.jsx'
import ConnectPage from './pages/ConnectPage.jsx'
import UploadPage from './pages/UploadPage.jsx'
import TemplatePage from './pages/TemplatePage.jsx'
import SendPage from './pages/SendPage.jsx'
import AboutPage from './pages/AboutPage.jsx'

const SOCKET_URL = 'http://localhost:3001'

export default function App() {
  const [page, setPage] = useState('connect')
  const [socket, setSocket] = useState(null)
  
  // Sessions
  const [sessions, setSessions] = useState({})
  const [activeSessionId, setActiveSessionId] = useState(null)

  // Excel data
  const [categories, setCategories] = useState({})
  const [headers, setHeaders] = useState(['1', '2', '3', '4', '5', '6'])
  const [templates, setTemplates] = useState(() => {
    try { return JSON.parse(localStorage.getItem('wa_category_templates')) || {} }
    catch { return {} }
  })

  // Sending progress
  const [sendProgress, setSendProgress] = useState(null)

  useEffect(() => {
    const sock = io(SOCKET_URL, { transports: ['websocket', 'polling'] })
    setSocket(sock)

    sock.on('connect', () => {
      fetch(`${SOCKET_URL}/api/sessions`)
        .then(r => r.json())
        .then(data => {
          setSessions(data)
        })
        .catch(() => {})
    })

    sock.on('all-sessions', (data) => {
      setSessions(data)
    })

    sock.on('session-update', (data) => {
      setSessions(prev => ({
        ...prev,
        [data.sessionId]: data
      }))
    })

    sock.on('session-removed', (sessionId) => {
      setSessions(prev => {
        const next = { ...prev }
        delete next[sessionId]
        return next
      })
      if (activeSessionId === sessionId) setActiveSessionId(null)
    })

    sock.on('send-progress', (data) => {
      if (data.sessionId === activeSessionId) {
        setSendProgress(data)
      }
    })

    return () => sock.disconnect()
  }, [activeSessionId])

  useEffect(() => {
    if (Object.keys(categories).length === 0) return
    setTemplates(prev => {
      const updated = { ...prev }
      let changed = false
      for (const cat of Object.keys(categories)) {
        if (!updated[cat]) {
          updated[cat] = `Assalamu Alaikum, Dear Parent of *{{4}} {{5}}*,\n\nRegarding attendance on {{2}} ({{3}}) - *${cat}*.\n\nJazakAllah Khair 🕌`
          changed = true
        }
      }
      return changed ? updated : prev
    })
  }, [categories])

  useEffect(() => {
    if (Object.keys(templates).length > 0) {
      const savedTemplates = JSON.parse(localStorage.getItem('wa_category_templates')) || {}
      const newSaved = { ...savedTemplates, ...templates }
      localStorage.setItem('wa_category_templates', JSON.stringify(newSaved))
    }
  }, [templates])

  const waStatus = activeSessionId && sessions[activeSessionId] 
    ? sessions[activeSessionId] 
    : { status: 'disconnected', message: 'Not connected' }

  return (
    <>
      <div className="screen-too-small">
        Please use a larger screen (min 1024px) for the best experience.
      </div>
      <div className="app-container">
        <TitleBar />
        <div className="app">
          <Sidebar page={page} setPage={setPage} waStatus={waStatus} />
          
          <main className="main-content">
            <div key={page} className="fade-in" style={{ height: '100%' }}>
              {page === 'connect' && (
                <ConnectPage
                  sessions={sessions}
                  activeSessionId={activeSessionId}
                  setActiveSessionId={setActiveSessionId}
                  onConnected={() => setPage('upload')}
                />
              )}
              {page === 'upload' && (
                <UploadPage
                  categories={categories}
                  setCategories={setCategories}
                  setHeaders={setHeaders}
                  onNext={() => setPage('templates')}
                />
              )}
              {page === 'templates' && (
                <TemplatePage
                  categories={categories}
                  templates={templates}
                  setTemplates={setTemplates}
                  headers={headers}
                  onNext={() => setPage('send')}
                  onBack={() => setPage('upload')}
                />
              )}
              {page === 'send' && (
                <SendPage
                  categories={categories}
                  templates={templates}
                  isConnected={waStatus.status === 'ready'}
                  sessionId={activeSessionId}
                  sendProgress={sendProgress}
                  setSendProgress={setSendProgress}
                  headers={headers}
                  onBack={() => setPage('templates')}
                />
              )}
              {page === 'about' && (
                <AboutPage />
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  )
}
