import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'

export default function TemplatePage({ categories, templates, setTemplates, headers, onNext, onBack }) {
  const templateKeys = Object.keys(templates)
  const [activeTab, setActiveTab] = useState(templateKeys[0] || null)

  const currentCat = activeTab || templateKeys[0]
  const template = templates[currentCat] || ''
  const records = categories[currentCat] || []

  // Ensure there's a fallback if no templates exist
  const dynamicVars = (headers || ['1', '2', '3', '4', '5', '6']).map((h, i) => ({
    key: `{{${h}}}`,
    desc: `Column ${i + 1}`,
    index: i
  }))

  function updateTemplate(val) {
    setTemplates(prev => ({ ...prev, [currentCat]: val }))
  }

  function insertVar(v) {
    const textarea = document.getElementById('template-textarea')
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const current = template
    const newVal = current.slice(0, start) + v + current.slice(end)
    updateTemplate(newVal)
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + v.length, start + v.length)
    }, 10)
  }

  function renderPreview(text, record) {
    if (!record) return text
    let res = text
    dynamicVars.forEach(v => {
      const regex = new RegExp(`\\{\\{${v.key.replace(/[{}]/g, '')}\\}\\}`, 'g')
      res = res.replace(regex, record[`col_${v.index}`] || '')
    })
    return res
      .replace(/{{name}}/g, record.name || '')
      .replace(/{{surname}}/g, record.surname || '')
      .replace(/{{phone}}/g, record.phone || '')
  }

  function handleAddCategory() {
    const name = window.prompt('Enter new category name:')
    if (name && name.trim()) {
      const catName = name.trim()
      setTemplates(prev => ({ ...prev, [catName]: prev[catName] || '' }))
      setActiveTab(catName)
    }
  }

  function handleDeleteCategory() {
    if (window.confirm(`Are you sure you want to delete the template for "${currentCat}"?`)) {
      setTemplates(prev => {
        const next = { ...prev }
        delete next[currentCat]
        return next
      })
      const remaining = templateKeys.filter(k => k !== currentCat)
      setActiveTab(remaining.length > 0 ? remaining[0] : null)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1>Message Templates</h1>
          <div className="subtitle" style={{ marginBottom: 0 }}>Create templates that will automatically map to Excel categories.</div>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-ghost" onClick={onBack}>Back</button>
          <button className="btn btn-primary" onClick={onNext} disabled={!currentCat || Object.keys(categories).length === 0}>Next Step</button>
        </div>
      </div>

      <div className="cat-tabs" style={{ marginBottom: 24, alignItems: 'center' }}>
        {templateKeys.map(cat => {
          const count = (categories[cat] || []).length
          return (
            <button
              key={cat}
              className={`cat-tab ${currentCat === cat ? 'active' : ''}`}
              onClick={() => setActiveTab(cat)}
            >
              {cat} 
              {count > 0 && <span style={{ opacity: 0.7, fontSize: 11, marginLeft: 4 }}>({count})</span>}
            </button>
          )
        })}
        <button 
          className="btn btn-ghost btn-sm" 
          onClick={handleAddCategory}
          style={{ padding: '6px 12px', borderStyle: 'dashed' }}
        >
          <Plus size={14} /> Add Template
        </button>
      </div>

      {!currentCat ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-hint)' }}>
          <p style={{ marginBottom: 16 }}>No templates created yet.</p>
          <button className="btn btn-primary" onClick={handleAddCategory}>
            Create First Template
          </button>
        </div>
      ) : (
        <div className="grid-template" style={{ flex: 1, minHeight: 0 }}>
          {/* Left Column: Editor */}
          <div style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', paddingRight: 8 }}>
            <div className="flex justify-between items-center mb-2">
              <span className="label" style={{ margin: 0 }}>Template text for "{currentCat}"</span>
              <button 
                className="title-btn title-btn-hover" 
                style={{ width: 28, height: 28, borderRadius: 6, color: 'var(--danger)' }}
                onClick={handleDeleteCategory}
                title="Delete Template"
              >
                <Trash2 size={14} />
              </button>
            </div>
            
            <textarea
              id="template-textarea"
              className="form-textarea"
              value={template}
              onChange={e => updateTemplate(e.target.value)}
              placeholder="Type your message here. Use variables like {{1}}, {{2}} etc."
              style={{ flex: 1, minHeight: 240, marginBottom: 12 }}
            />
            
            <span className="label">Available Variables (Click to insert)</span>
            <div className="template-vars">
              {dynamicVars.map(v => (
                <button key={v.key} className="var-chip" onClick={() => insertVar(v.key)} title={v.desc}>
                  {v.key}
                </button>
              ))}
            </div>
            
            <div className="form-hint" style={{ marginTop: 16 }}>
              WhatsApp formatting: *bold*, _italic_, ~strikethrough~.
            </div>
          </div>

          {/* Vertical Divider */}
          <div className="v-divider" style={{ margin: 0 }} />

          {/* Right Column: Preview */}
          <div className="chat-bubble-container" style={{ margin: '-24px -40px', padding: '32px 40px', borderRadius: 0, borderLeft: '1px solid var(--border)' }}>
            <span className="label" style={{ marginBottom: 16 }}>Live Preview (First 3 contacts)</span>
            {records.slice(0, 3).map((r, i) => {
              const previewText = renderPreview(template, r)
              return (
                <div key={i} className="chat-bubble">
                  {previewText || <span style={{ color: 'var(--text-hint)' }}>Type a message to see preview...</span>}
                </div>
              )
            })}
            {records.length === 0 && (
              <div style={{ color: 'var(--text-hint)', fontSize: 13, background: 'var(--bg-primary)', padding: 16, borderRadius: 8, border: '1px dashed var(--border)' }}>
                No active records in the uploaded Excel for this category.<br /><br />
                However, this template is saved! When you upload an Excel file with the section "{currentCat}", this template will be assigned automatically.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
