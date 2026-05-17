import { useState, useRef } from 'react'
import { FileSpreadsheet, AlertCircle } from 'lucide-react'

const API = 'http://localhost:3001'

export default function UploadPage({ categories, setCategories, setHeaders, onNext }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [dragover, setDragover] = useState(false)
  const fileRef = useRef()

  const catKeys = Object.keys(categories)
  const totalRecords = Object.values(categories).reduce((s, r) => s + r.length, 0)

  async function handleFile(file) {
    if (!file) return
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      setError('Please upload an Excel file (.xlsx, .xls) or CSV')
      return
    }
    setLoading(true)
    setError(null)

    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64 = e.target.result.split(',')[1]
        const res = await fetch(`${API}/api/parse-excel`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileData: base64, fileName: file.name })
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Parse failed')
        
        setCategories(data.categories)
        if (setHeaders && data.headers) setHeaders(data.headers)
        setLoading(false)
        onNext() // Automatically go to next step
      }
      reader.readAsDataURL(file)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  function onDrop(e) {
    e.preventDefault()
    setDragover(false)
    const file = e.dataTransfer.files[0]
    handleFile(file)
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', maxWidth: 800, margin: '0 auto' }}>
      
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1>Import Excel Data</h1>
        <div className="subtitle">Upload your attendance Excel file to extract student records automatically.</div>
      </div>

      <div
        className={`upload-zone ${dragover ? 'dragover' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragover(true) }}
        onDragLeave={() => setDragover(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          style={{ display: 'none' }}
          onChange={e => handleFile(e.target.files[0])}
        />
        {loading ? (
          <>
            <div className="spinner" style={{ width: 40, height: 40, marginBottom: 12 }} />
            <div className="upload-title">Parsing Excel...</div>
          </>
        ) : (
          <>
            <FileSpreadsheet size={40} color="var(--text-hint)" style={{ marginBottom: 12 }} />
            <div className="upload-title">Click or drag Excel file here</div>
            <div className="upload-sub">.xlsx, .xls formats supported</div>
          </>
        )}
      </div>

      {error && (
        <div style={{ marginTop: 24, width: '100%', maxWidth: 520, padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--danger)', fontSize: 13 }}>
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Just keeping a dummy table or state text if there is data already loaded */}
      {catKeys.length > 0 && !error && (
        <div style={{ marginTop: 32, width: '100%', maxWidth: 520 }}>
          <div className="label">Current Data</div>
          <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <FileSpreadsheet size={16} color="var(--text-secondary)" />
              <span style={{ fontSize: 14, fontWeight: 500 }}>Previously uploaded file</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {totalRecords} rows · {catKeys.length} categories
            </div>
          </div>
          <div className="flex justify-between" style={{ marginTop: 16 }}>
            <span />
            <button className="btn btn-primary" onClick={onNext}>Continue with this data</button>
          </div>
        </div>
      )}

    </div>
  )
}
