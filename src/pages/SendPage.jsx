import { useState } from 'react'
import { AlertCircle } from 'lucide-react'

const API = 'http://localhost:3001'

export default function SendPage({ categories, templates, isConnected, sessionId, sendProgress, setSendProgress, headers, onBack }) {
  function fillTemplate(template, record) {
    let res = template
    if (headers && headers.length > 0) {
      headers.forEach((h, i) => {
        const regex = new RegExp(`\\{\\{${h.replace(/[{}]/g, '')}\\}\\}`, 'g')
        res = res.replace(regex, record[`col_${i}`] || '')
      })
    }
    return res
      .replace(/{{name}}/g, record.name || '')
      .replace(/{{surname}}/g, record.surname || '')
      .replace(/{{phone}}/g, record.phone || '')
  }

  const [delay, setDelay] = useState(4)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  
  const catKeys = Object.keys(categories)

  function buildMessages() {
    const msgs = []
    for (const cat of catKeys) {
      const tpl = templates[cat]
      if (!tpl) continue
      for (const record of (categories[cat] || [])) {
        msgs.push({
          name: record.name ? `${record.name} ${record.surname || ''}` : `col_0: ${record.col_0}`,
          phone: record.phone || record.col_5,
          message: fillTemplate(tpl, record),
          label: cat
        })
      }
    }
    return msgs
  }

  const messages = buildMessages()
  const totalSelected = messages.length

  async function handleSend() {
    if (!isConnected) { setError('WhatsApp is not connected. Please connect first.'); return }
    if (totalSelected === 0) { setError('No recipients found.'); return }
    setError(null)
    setSending(true)
    setSendProgress(null)

    try {
      const res = await fetch(`${API}/api/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, messages, delay })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
    } catch (err) {
      setError(err.message)
      setSending(false)
    }
  }

  async function handleAbort() {
    try {
      await fetch(`${API}/api/abort`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      })
    } catch (err) {
      console.error(err)
    }
  }

  const sent = sendProgress?.sent || 0
  const failed = sendProgress?.failed || 0
  const total = sendProgress?.total || totalSelected
  const progress = total > 0 ? Math.round(((sent + failed) / total) * 100) : 0
  const isDone = sendProgress?.status === 'done' || sendProgress?.status === 'aborted'

  if (isDone && sending) {
    setSending(false)
  }

  const listToShow = sendProgress ? messages : messages.slice(0, 100)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1>Preview & Send</h1>
          <div className="subtitle" style={{ marginBottom: 0 }}>Review the recipient list and begin your broadcast.</div>
        </div>
        {!sending && !isDone && (
          <button className="btn btn-ghost" onClick={onBack}>Back to Templates</button>
        )}
      </div>

      {!isConnected && (
        <div style={{ padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--danger)', fontSize: 13, marginBottom: 16 }}>
          <AlertCircle size={16} />
          WhatsApp is not connected. Connect your phone first.
        </div>
      )}

      {error && (
        <div style={{ padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--danger)', fontSize: 13, marginBottom: 16 }}>
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div className="grid-send" style={{ flex: 1, minHeight: 0 }}>
        {/* Left Column: Contact List */}
        <div className="contact-list">
          <span className="label" style={{ marginBottom: 12 }}>Recipient List {sendProgress ? `(${sent + failed}/${total})` : `(${totalSelected})`}</span>
          
          {listToShow.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-hint)' }}>No recipients found.</div>
          ) : listToShow.map((m, i) => {
            let statusClass = 'ready'
            if (sendProgress) {
              if (i >= sent + failed) statusClass = 'skipped'
            }

            return (
              <div key={i} className={`contact-row ${statusClass === 'skipped' ? 'skipped' : ''}`}>
                <div className="avatar">{m.name ? m.name.charAt(0).toUpperCase() : '#'}</div>
                <div className="contact-info">
                  <div className="flex items-center justify-between mb-2">
                    <div className="contact-name">{m.name}</div>
                    <div className="contact-phone">{m.phone} · {m.label}</div>
                  </div>
                  <div className="contact-msg">{m.message}</div>
                </div>
              </div>
            )
          })}
          {!sendProgress && messages.length > 100 && (
            <div style={{ textAlign: 'center', padding: 12, color: 'var(--text-hint)' }}>
              ...and {messages.length - 100} more
            </div>
          )}
        </div>

        {/* Right Column: Sticky Panel */}
        <div className="sticky-panel">
          <span className="label" style={{ marginBottom: 0 }}>Send Configuration</span>
          
          <div className="card">
            <span className="label">Delay (seconds)</span>
            <input
              type="number"
              className="form-input mb-2"
              min={1} max={60}
              value={delay}
              onChange={e => setDelay(Number(e.target.value))}
              disabled={sending}
            />
            <div className="form-hint">3–5s recommended to prevent blocks.</div>
          </div>

          <div className="metric-card">
            <div className="metric-label">Total Recipients</div>
            <div className="metric-value">{totalSelected}</div>
          </div>
          
          <div className="metric-card">
            <div className="metric-label">Est. Time</div>
            <div className="metric-value">~{Math.ceil(totalSelected * delay / 60)} min</div>
          </div>

          {sendProgress && (
            <div className="card">
              <span className="label">Progress</span>
              <div className="progress-wrap">
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${progress}%`, background: sendProgress.status === 'aborted' ? 'var(--danger)' : 'var(--accent)' }} />
                </div>
                <div className="flex justify-between" style={{ marginTop: 8 }}>
                  <span className="label" style={{ margin: 0, color: 'var(--accent)' }}>{sent} Sent</span>
                  <span className="label" style={{ margin: 0, color: 'var(--danger)' }}>{failed} Failed</span>
                </div>
              </div>
            </div>
          )}

          <div style={{ marginTop: 'auto', paddingTop: 16 }}>
            {!sending && !isDone ? (
              <button
                className="btn btn-primary w-full"
                onClick={handleSend}
                disabled={!isConnected || totalSelected === 0}
              >
                Start Broadcast
              </button>
            ) : !isDone ? (
              <button
                className="btn btn-danger w-full"
                onClick={handleAbort}
              >
                Stop Sending
              </button>
            ) : (
              <div style={{ padding: 12, background: '#F0FDF4', borderRadius: 8, color: '#166534', textAlign: 'center', fontSize: 13, fontWeight: 500 }}>
                Broadcast Finished
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
