import { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, Bookmark, X, Download, AlertTriangle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function TemplatePage({ categories, templates, setTemplates, headers, onNext, onBack }) {
  const templateKeys = Object.keys(templates)
  const [activeTab, setActiveTab] = useState(templateKeys[0] || null)

  const currentCat = activeTab || templateKeys[0]
  const template = templates[currentCat] || ''
  const records = categories[currentCat] || []

  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [savedTemplates, setSavedTemplates] = useState([])
  const [isSavingTemplate, setIsSavingTemplate] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState('')
  const [toastMessage, setToastMessage] = useState(null)

  const [duplicates, setDuplicates] = useState([])
  const [showDuplicateList, setShowDuplicateList] = useState(false)
  const [dedupeAction, setDedupeAction] = useState(null) // null | "keepFirst" | "skipAll"
  const [resolvedCount, setResolvedCount] = useState(0)
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (window.electronAPI?.templates) {
      window.electronAPI.templates.getAll().then(setSavedTemplates)
    }
  }, [])

  useEffect(() => {
    if (!categories || Object.keys(categories).length === 0) return
    if (dedupeAction) return // don't recalculate if already resolved

    let dups = []
    let seen = {}
    
    const allContacts = []
    Object.keys(categories).forEach(cat => {
      categories[cat].forEach((row, idx) => {
        allContacts.push({ cat, idx, phone: row.phone || row.col_5 })
      })
    })

    allContacts.forEach((row, index) => {
      const phone = String(row.phone || '').trim().replace(/\s+/g, '').replace(/^[\+0]+/, '')
      if (!phone) return
      
      if (seen[phone] !== undefined) {
        let existingGroup = dups.find(g => g.phone === phone)
        if (!existingGroup) {
          existingGroup = { phone, rows: [seen[phone].globalIndex + 2], instances: [seen[phone]] }
          dups.push(existingGroup)
        }
        existingGroup.rows.push(index + 2)
        existingGroup.instances.push(row)
      } else {
        seen[phone] = { ...row, globalIndex: index }
      }
    })

    setDuplicates(dups)
    setShowDuplicateList(false)
    setResolvedCount(0)
  }, [categories])

  function handleDedupe(action) {
    const updatedCategories = JSON.parse(JSON.stringify(categories))
    let removed = 0

    duplicates.forEach(group => {
      if (action === 'keepFirst') {
        for (let i = 1; i < group.instances.length; i++) {
          const inst = group.instances[i]
          updatedCategories[inst.cat][inst.idx].isDuplicateRemoved = true
          removed++
        }
      } else if (action === 'skipAll') {
        for (let i = 0; i < group.instances.length; i++) {
          const inst = group.instances[i]
          updatedCategories[inst.cat][inst.idx].isDuplicateRemoved = true
          removed++
        }
      }
    })

    setCategories(updatedCategories)
    setDedupeAction(action)
    setResolvedCount(removed)
    setShowDuplicateList(false)
  }

  // Ensure there's a fallback if no templates exist
  const dynamicVars = (headers || ['1', '2', '3', '4', '5', '6']).map((h, i) => ({
    key: `{{${h}}}`,
    desc: `Column ${i + 1}`,
    index: i
  }))

  function updateTemplate(val) {
    setTemplates(prev => ({ ...prev, [currentCat]: val }))
  }

  function showToast(msg) {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 2500)
  }

  async function handleSaveTemplate() {
    if (!newTemplateName.trim() || !template.trim()) return
    
    const newTpl = {
      id: crypto.randomUUID(),
      name: newTemplateName.trim(),
      content: template.trim(),
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString()
    }
    
    if (window.electronAPI?.templates) {
      const updated = await window.electronAPI.templates.save(newTpl)
      setSavedTemplates(updated)
    } else {
      const next = [newTpl, ...savedTemplates].slice(0, 50)
      setSavedTemplates(next)
    }
    setIsSavingTemplate(false)
    setNewTemplateName('')
    showToast('Template saved')
  }

  async function handleDeleteSavedTemplate(id) {
    if (window.electronAPI?.templates) {
      const updated = await window.electronAPI.templates.delete(id)
      setSavedTemplates(updated)
    } else {
      setSavedTemplates(savedTemplates.filter(t => t.id !== id))
    }
    showToast('Template deleted')
  }

  function handleLoadTemplate(tpl) {
    updateTemplate(tpl.content)
    setIsDrawerOpen(false)
    showToast('Template loaded')
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

      {/* Duplicate Banner Area */}
      {duplicates.length > 0 && !dedupeAction && (
        <div style={{ marginBottom: 24, background: '#FEF2F0', border: '1px solid #FDDDD6', borderRadius: 8, padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#D85A30', fontWeight: 500, fontSize: 13 }}>
              <AlertTriangle size={16} />
              {duplicates.length} duplicate phone numbers found across {duplicates.reduce((s, g) => s + g.rows.length, 0)} rows
            </div>
            <button 
              onClick={() => setShowDuplicateList(!showDuplicateList)}
              style={{ background: 'transparent', border: 'none', color: '#D85A30', cursor: 'pointer', fontSize: 13, textDecoration: 'underline' }}
            >
              {showDuplicateList ? 'Hide duplicates' : 'View duplicates'}
            </button>
          </div>
          
          <AnimatePresence>
            {showDuplicateList && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ marginTop: 12, background: 'var(--color-background-secondary, #F9FAFB)', borderRadius: 8, padding: 12, fontSize: 12, color: '#6B7280' }}>
                  <div style={{ maxHeight: 150, overflowY: 'auto', marginBottom: 12 }}>
                    {duplicates.map((g, i) => (
                      <div key={i} style={{ marginBottom: 6 }}>
                        <strong style={{ color: '#374151' }}>{g.phone}</strong> appears in rows: {g.rows.join(', ')}
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8, paddingTop: 12, borderTop: '1px solid #E5E7EB' }}>
                    <button className="btn btn-ghost" style={{ flex: 1, padding: 6 }} onClick={() => handleDedupe('keepFirst')}>
                      Keep first occurrence only
                    </button>
                    <button className="btn btn-ghost" style={{ flex: 1, padding: 6, color: '#D85A30' }} onClick={() => handleDedupe('skipAll')}>
                      Skip all duplicates
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {dedupeAction && (
        <div style={{ marginBottom: 24, background: '#E8FBF0', border: '1px solid #9FE1CB', borderRadius: 8, padding: '12px 14px', color: '#0F6E56', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
          ✓ Duplicates resolved — {resolvedCount} contacts removed
        </div>
      )}

      {!currentCat ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-hint)' }}>
          <p style={{ marginBottom: 16 }}>No templates created yet.</p>
          <button className="btn btn-primary" onClick={handleAddCategory}>
            Create First Template
          </button>
        </div>
      ) : (
        <div className="grid-template" style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden' }}>
          {/* Left Column: Editor */}
          <div style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', paddingRight: 8 }}>
            <div className="flex justify-between items-center mb-2">
              <span className="label" style={{ margin: 0 }}>Template text for "{currentCat}"</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button 
                  className="title-btn title-btn-hover" 
                  style={{ height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', gap: 6, padding: '0 8px', fontSize: 13, fontWeight: 500 }}
                  onClick={() => setIsDrawerOpen(true)}
                  title="Saved Templates"
                >
                  <Bookmark size={14} /> Library
                </button>
                <button 
                  className="title-btn title-btn-hover" 
                  style={{ width: 28, height: 28, borderRadius: 6, color: 'var(--danger)' }}
                  onClick={handleDeleteCategory}
                  title="Delete Template"
                >
                  <Trash2 size={14} />
                </button>
              </div>
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

          <AnimatePresence>
            {isDrawerOpen && (
              <motion.div
                initial={{ x: 280, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 280, opacity: 0 }}
                transition={{ duration: 0.25 }}
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  bottom: 0,
                  width: 280,
                  background: '#FFFFFF',
                  borderLeft: '1px solid #E5E7EB',
                  zIndex: 10,
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E5E7EB' }}>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Template Library</h3>
                  <button onClick={() => setIsDrawerOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#6B7280', padding: 0, display: 'flex', alignItems: 'center' }}>
                    <X size={18} />
                  </button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
                  {savedTemplates.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#6B7280', marginTop: 40 }}>
                      <div style={{ width: 64, height: 64, background: '#F3F4F6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                        <Bookmark size={24} color="#9CA3AF" />
                      </div>
                      <p style={{ fontSize: 13, lineHeight: 1.5, margin: 0 }}>No saved templates yet.<br/>Save your first one below.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {savedTemplates.map(tpl => (
                        <div key={tpl.id} style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, padding: '12px 14px' }}>
                          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{tpl.name}</div>
                          <div style={{ fontSize: 12, color: '#6B7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 12 }}>
                            {tpl.content.substring(0, 60)}
                          </div>
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => {
                                if (window.confirm("Delete this template?")) {
                                  handleDeleteSavedTemplate(tpl.id);
                                }
                              }}
                              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#6B7280', padding: 4, display: 'flex', alignItems: 'center' }}
                              title="Delete template"
                              onMouseOver={e => e.currentTarget.style.color = '#D85A30'}
                              onMouseOut={e => e.currentTarget.style.color = '#6B7280'}
                            >
                              <Trash2 size={16} />
                            </button>
                            <button
                              onClick={() => handleLoadTemplate(tpl)}
                              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#6B7280', padding: 4, display: 'flex', alignItems: 'center' }}
                              title="Load template"
                              onMouseOver={e => e.currentTarget.style.color = '#0F6E56'}
                              onMouseOut={e => e.currentTarget.style.color = '#6B7280'}
                            >
                              <Download size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ padding: 16, borderTop: '1px solid #E5E7EB' }}>
                  {isSavingTemplate ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <input 
                        type="text" 
                        placeholder="Template name"
                        value={newTemplateName}
                        onChange={e => setNewTemplateName(e.target.value)}
                        style={{ padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 13, outline: 'none' }}
                        autoFocus
                      />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button 
                          className="btn btn-ghost" 
                          style={{ flex: 1, padding: 6, fontSize: 13 }}
                          onClick={() => { setIsSavingTemplate(false); setNewTemplateName(''); }}
                        >
                          Cancel
                        </button>
                        <button 
                          className="btn btn-primary" 
                          style={{ flex: 1, padding: 6, fontSize: 13 }}
                          onClick={handleSaveTemplate}
                          disabled={!newTemplateName.trim() || !template.trim()}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      className="btn" 
                      style={{ width: '100%', background: '#F3F4F6', color: '#374151', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 0', fontSize: 13 }}
                      onClick={() => setIsSavingTemplate(true)}
                    >
                      <Plus size={16} /> Save current template
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: '-50%' }}
            animate={{ opacity: 1, scale: 1, x: '-50%' }}
            exit={{ opacity: 0, scale: 0.9, x: '-50%' }}
            style={{
              position: 'fixed',
              bottom: 24,
              left: '50%',
              background: '#0D0D0D',
              color: 'white',
              padding: '10px 20px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              zIndex: 9999,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
