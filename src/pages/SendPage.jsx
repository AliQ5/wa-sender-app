import { useState, useRef, useEffect } from 'react'
import { AlertCircle, Pause, Play, Square, RefreshCw, Download } from 'lucide-react'

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

  const [minDelay, setMinDelay] = useState(3)
  const [maxDelay, setMaxDelay] = useState(5)
  const [sending, setSending] = useState(false)
  const [sendStatus, setSendStatus] = useState("idle") // idle | sending | paused | stopped | done
  const [error, setError] = useState(null)
  
  // Retry Logic
  const [failedContacts, setFailedContacts] = useState([])
  const [retryCount, setRetryCount] = useState({}) // { phoneNumber: attemptCount }
  const [sessionSummary, setSessionSummary] = useState(null)
  const [isRetrying, setIsRetrying] = useState(false)
  const [deliveryLog, setDeliveryLog] = useState([])

  const isPausedRef = useRef(false)
  const isStoppedRef = useRef(false)
  
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
          label: cat,
          isDuplicateRemoved: record.isDuplicateRemoved || false
        })
      }
    }
    return msgs
  }

  const baseMessages = buildMessages()
  const cleanMessages = baseMessages.filter(m => !m.isDuplicateRemoved)
  const duplicateRemovedMessages = baseMessages.filter(m => m.isDuplicateRemoved)
  const listToProcess = isRetrying ? failedContacts : cleanMessages
  const totalSelected = listToProcess.length

  async function handleSend() {
    if (!isConnected) { setError('WhatsApp is not connected. Please connect first.'); return }
    if (totalSelected === 0) { setError('No recipients found.'); return }
    if (minDelay > maxDelay) {
      setError('Minimum delay cannot be greater than maximum delay.')
      return
    }
    setError(null)
    setSending(true)
    setSendStatus("sending")
    isPausedRef.current = false
    isStoppedRef.current = false
    setSendProgress(null)
    setSessionSummary(null)

    try {
      const messagesToSend = listToProcess.map(m => ({ ...m, attempt: (retryCount[m.phone] || 0) + 1 }))
      
      const res = await fetch(`${API}/api/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, messages: messagesToSend, minDelay, maxDelay })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
    } catch (err) {
      setError(err.message)
      setSending(false)
      setSendStatus("idle")
    }
  }

  function handleRetry() {
    setIsRetrying(true)
    setSendProgress(null)
    setSessionSummary(null)
    setSendStatus("idle")
  }

  function handleExport() {
    const rows = deliveryLog.map(r => {
      let finalStatus = r.status
      if (r.status === 'failed' && (retryCount[r.phone] || 0) >= 3) finalStatus = 'permanently_failed'
      return [
        `"${r.name.replace(/"/g, '""')}"`,
        `"${r.phone}"`,
        `"${r.label}"`,
        r.attempt || 1,
        finalStatus,
        `"${(r.error || '').replace(/"/g, '""')}"`,
        r.isDuplicateRemoved ? 'true' : 'false'
      ].join(',')
    })
    const csv = "Name,Phone,Category,Attempt Number,Final Status,Error,Duplicate Removed\n" + rows.join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'delivery_log.csv'
    a.click()
  }

  async function handlePause() {
    try {
      await fetch(`${API}/api/pause`, { method: 'POST' })
      setSendStatus("paused")
      isPausedRef.current = true
    } catch (err) {
      console.error(err)
    }
  }

  async function handleResume() {
    try {
      await fetch(`${API}/api/resume`, { method: 'POST' })
      setSendStatus("sending")
      isPausedRef.current = false
    } catch (err) {
      console.error(err)
    }
  }

  async function handleStop() {
    try {
      await fetch(`${API}/api/abort`, { method: 'POST' })
      setSendStatus("stopped")
      isStoppedRef.current = true
      isPausedRef.current = false
    } catch (err) {
      console.error(err)
    }
  }

  const sent = sendProgress?.sent || 0
  const failed = sendProgress?.failed || 0
  const total = sendProgress?.total || totalSelected
  const progress = total > 0 ? Math.round(((sent + failed) / total) * 100) : 0
  const isDone = sendProgress?.status === 'done' || sendProgress?.status === 'aborted'

  useEffect(() => {
    if (sendProgress?.status === 'done') {
      setSendStatus('done')
      
      if (sendProgress.results) {
        const dedupeLogEntries = duplicateRemovedMessages.map(m => ({
          name: m.name,
          phone: m.phone,
          label: m.label,
          attempt: 1,
          status: 'skipped',
          error: 'Duplicate removed',
          isDuplicateRemoved: true
        }))

        const fullResults = [...sendProgress.results, ...dedupeLogEntries]
        setDeliveryLog(prev => [...prev, ...fullResults])
        
        const newRetries = { ...retryCount }
        fullResults.forEach(r => {
          if (r.status === 'failed') {
            newRetries[r.phone] = (newRetries[r.phone] || 0) + 1
          }
        })
        setRetryCount(newRetries)
        
        const stillFailed = fullResults.filter(r => r.status === 'failed' && (newRetries[r.phone] || 0) < 3)
        setFailedContacts(stillFailed)
        
        setSessionSummary({
          sent: sendProgress.sent,
          failed: sendProgress.failed,
          skipped: totalSelected - sendProgress.sent - sendProgress.failed + duplicateRemovedMessages.length
        })
      }
    } else if (sendProgress?.status === 'aborted' && sendStatus !== 'stopped') {
      setSendStatus('stopped')
    }
  }, [sendProgress?.status])

  if (isDone && sending) {
    setSending(false)
  }

  const listToShow = sendProgress && sendStatus !== 'idle' ? listToProcess : listToProcess.slice(0, 100)

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
            let dotClass = 'pending'

            if (sendProgress) {
              if (i < sent + failed) {
                statusClass = 'skipped'
                dotClass = 'sent'
              } else if (i === sent + failed && (sendStatus === 'sending' || sendStatus === 'paused')) {
                dotClass = 'sending'
              }
            }

            return (
              <div key={i} className={`contact-row ${statusClass === 'skipped' ? 'skipped' : ''}`}>
                <div className="avatar">
                  {m.name ? m.name.charAt(0).toUpperCase() : '#'}
                </div>
                <div className="contact-info">
                  <div className="flex items-center justify-between mb-2">
                    <div className="contact-name flex items-center gap-2">
                      <div className={`status-dot ${dotClass}`}></div>
                      {m.name}
                    </div>
                    <div className="contact-phone">{m.phone} · {m.label}</div>
                  </div>
                  <div className="contact-msg">{m.message}</div>
                </div>
              </div>
            )
          })}
          {!sendProgress && listToProcess.length > 100 && (
            <div style={{ textAlign: 'center', padding: 12, color: 'var(--text-hint)' }}>
              ...and {listToProcess.length - 100} more
            </div>
          )}
        </div>

        {/* Right Column: Sticky Panel */}
        <div className="sticky-panel">
          <span className="label" style={{ marginBottom: 0 }}>Send Configuration</span>
          
          <div className="card">
            <span className="label">Smart Delay Randomizer</span>
            
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-hint)', display: 'block', marginBottom: 4 }}>Min (s)</label>
                <input
                  type="number"
                  min={1} max={15}
                  value={minDelay}
                  onChange={e => setMinDelay(Number(e.target.value))}
                  disabled={sending}
                  style={{ border: '1px solid #E5E7EB', borderRadius: 8, width: 80, textAlign: 'center', padding: '8px', outline: 'none', background: 'white' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-hint)', display: 'block', marginBottom: 4 }}>Max (s)</label>
                <input
                  type="number"
                  min={1} max={15}
                  value={maxDelay}
                  onChange={e => setMaxDelay(Number(e.target.value))}
                  disabled={sending}
                  style={{ border: '1px solid #E5E7EB', borderRadius: 8, width: 80, textAlign: 'center', padding: '8px', outline: 'none', background: 'white' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <button
                className="btn"
                disabled={sending}
                style={{ flex: 1, padding: '6px', fontSize: 13, background: minDelay === 5 && maxDelay === 8 ? 'var(--accent)' : 'transparent', color: minDelay === 5 && maxDelay === 8 ? 'white' : 'var(--text)', border: minDelay === 5 && maxDelay === 8 ? '1px solid var(--accent)' : '1px solid #E5E7EB' }}
                onClick={() => { setMinDelay(5); setMaxDelay(8); }}
              >
                Safe
              </button>
              <button
                className="btn"
                disabled={sending}
                style={{ flex: 1, padding: '6px', fontSize: 13, background: minDelay === 3 && maxDelay === 5 ? 'var(--accent)' : 'transparent', color: minDelay === 3 && maxDelay === 5 ? 'white' : 'var(--text)', border: minDelay === 3 && maxDelay === 5 ? '1px solid var(--accent)' : '1px solid #E5E7EB' }}
                onClick={() => { setMinDelay(3); setMaxDelay(5); }}
              >
                Normal
              </button>
              <button
                className="btn"
                disabled={sending}
                style={{ flex: 1, padding: '6px', fontSize: 13, background: minDelay === 1 && maxDelay === 3 ? 'var(--accent)' : 'transparent', color: minDelay === 1 && maxDelay === 3 ? 'white' : 'var(--text)', border: minDelay === 1 && maxDelay === 3 ? '1px solid var(--accent)' : '1px solid #E5E7EB' }}
                onClick={() => { setMinDelay(1); setMaxDelay(3); }}
              >
                Fast
              </button>
            </div>

            {minDelay === 1 && maxDelay === 3 && (
              <div style={{ padding: '8px 12px', background: '#FFF5F2', border: '1px solid #FCD4C6', borderRadius: 8, display: 'flex', alignItems: 'flex-start', gap: 8, color: '#D85A30', fontSize: 12, marginBottom: 12 }}>
                <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 2 }} />
                <span>Fast mode may get flagged by WhatsApp. Use with caution.</span>
              </div>
            )}

            {minDelay > maxDelay ? (
              <div style={{ color: 'var(--danger)', fontSize: 12, marginTop: 8 }}>Error: Min cannot be greater than Max</div>
            ) : (
              <div className="form-hint" style={{ marginTop: 8, fontWeight: 500 }}>Each message will wait between {minDelay}s and {maxDelay}s.</div>
            )}
          </div>

          <div className="metric-card">
            <div className="metric-label">Total Recipients</div>
            <div className="metric-value">{totalSelected}</div>
          </div>
          
          <div className="metric-card">
            <div className="metric-label">Est. Time</div>
            <div className="metric-value">~{Math.ceil(totalSelected * ((minDelay + maxDelay) / 2) / 60)} min</div>
          </div>

          {sessionSummary ? (
            <div className="card" style={{ background: '#FFFFFF', borderRadius: 10, padding: '16px 20px', border: '1px solid #E5E7EB' }}>
              <span className="label" style={{ marginBottom: 12 }}>Session Summary</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14, fontWeight: 500 }}>
                <div style={{ color: '#0F6E56' }}>✓ {sessionSummary.sent} sent successfully</div>
                <div style={{ color: '#D85A30' }}>✗ {sessionSummary.failed} failed</div>
                <div style={{ color: '#6B7280' }}>— {sessionSummary.skipped} skipped (missing data)</div>
              </div>
              
              {failedContacts.length > 0 ? (
                <button 
                  onClick={handleRetry}
                  style={{ width: '100%', marginTop: 16, padding: '9px 22px', background: '#FEF2F0', color: '#D85A30', border: '1px solid #FDDDD6', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font)' }}
                >
                  <RefreshCw size={16} /> Retry Failed ({failedContacts.length})
                </button>
              ) : (
                <div style={{ marginTop: 16, padding: 12, background: '#F0FDF4', borderRadius: 8, color: '#166534', textAlign: 'center', fontSize: 13, fontWeight: 500 }}>
                  All contacts reached successfully
                </div>
              )}
              
              {deliveryLog.length > 0 && (
                <button 
                  className="btn btn-ghost" 
                  style={{ width: '100%', marginTop: 8 }} 
                  onClick={handleExport}
                >
                  <Download size={16} /> Export Delivery Log (CSV)
                </button>
              )}
            </div>
          ) : sendProgress && (
            <div className="card">
              <span className="label">Progress</span>
              <div className="progress-wrap">
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${progress}%`, background: sendProgress?.status === 'aborted' ? 'var(--danger)' : 'var(--accent)' }} />
                </div>
                <div className="flex justify-between" style={{ marginTop: 8 }}>
                  <span className="label" style={{ margin: 0, color: 'var(--accent)' }}>{sent} Sent</span>
                  <span className="label" style={{ margin: 0, color: 'var(--danger)' }}>{failed} Failed</span>
                </div>
                {sendStatus === 'sending' && <div className="progress-label">Sending... {sent + failed} of {total}</div>}
                {sendStatus === 'paused' && <div className="progress-label" style={{ color: '#D85A30', fontWeight: 500 }}>Paused at {sent + failed} of {total} — press Resume to continue</div>}
                {sendStatus === 'stopped' && <div className="progress-label" style={{ color: '#D85A30', fontWeight: 500 }}>Stopped at {sent + failed} of {total}. {sent} messages were sent.</div>}
              </div>
            </div>
          )}

          <div style={{ marginTop: 'auto', paddingTop: 16 }}>
            {sendStatus === 'idle' && !sessionSummary && (
              <button
                className="btn btn-primary w-full"
                onClick={handleSend}
                disabled={!isConnected || totalSelected === 0 || minDelay > maxDelay}
              >
                {isRetrying ? 'Start Retry' : 'Start Broadcast'}
              </button>
            )}

            {(sendStatus === 'sending' || sendStatus === 'paused') && (
              <div style={{ display: 'flex', gap: 8 }}>
                {sendStatus === 'sending' ? (
                  <button className="btn btn-ghost" style={{ flex: 1 }} onClick={handlePause}>
                    <Pause size={16} fill="currentColor" /> Pause
                  </button>
                ) : (
                  <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleResume}>
                    <Play size={16} fill="currentColor" /> Resume
                  </button>
                )}
                <button 
                  className="btn" 
                  style={{ flex: 1, background: '#FEF2F0', color: '#D85A30', border: '1px solid #FDDDD6' }} 
                  onClick={handleStop}
                >
                  <Square size={16} fill="currentColor" /> Stop
                </button>
              </div>
            )}

            {(sendStatus === 'done' || sendStatus === 'stopped') && (
              <div style={{ padding: 12, background: sendStatus === 'done' ? '#F0FDF4' : '#FEF2F0', borderRadius: 8, color: sendStatus === 'done' ? '#166534' : '#D85A30', textAlign: 'center', fontSize: 13, fontWeight: 500 }}>
                {sendStatus === 'done' ? 'Broadcast Finished' : 'Broadcast Stopped'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
