const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
const { Client, LocalAuth } = require('whatsapp-web.js')
const qrcode = require('qrcode')
const XLSX = require('xlsx')
const path = require('path')
const fs = require('fs')

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
})

app.use(cors())
app.use(express.json({ limit: '50mb' }))

// ─── State ──────────────────────────────────────────────────────────────────
const clients = new Map() // sessionId -> waClient
const statuses = new Map() // sessionId -> { status, message, qr, ready }
let isSending = false
let sendingAborted = false

// Browser path fallback for packaged Electron apps
function getBrowserPath() {
  const paths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome'
  ]
  for (const p of paths) {
    if (fs.existsSync(p)) return p
  }
  try { return require('puppeteer').executablePath() } catch (e) { return undefined }
}

// ─── WhatsApp Client ─────────────────────────────────────────────────────────
function initWAClient(sessionId) {
  if (clients.has(sessionId)) {
    return
  }

  const authPath = path.join(process.env.APPDATA || '.', 'wa-sender', 'auth')
  fs.mkdirSync(authPath, { recursive: true })

  statuses.set(sessionId, { status: 'starting', message: 'Starting client...', qr: null, ready: false })

  const waClient = new Client({
    authStrategy: new LocalAuth({ clientId: sessionId, dataPath: authPath }),
    puppeteer: {
      headless: true,
      executablePath: getBrowserPath(),
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-breakpad',
        '--disable-component-extensions-with-background-pages',
        '--disable-extensions',
        '--disable-features=TranslateUI,BlinkGenPropertyTrees',
        '--disable-ipc-flooding-protection',
        '--disable-renderer-backgrounding',
        '--enable-features=NetworkService,NetworkServiceInProcess',
        '--force-color-profile=srgb',
        '--metrics-recording-only',
        '--mute-audio'
      ]
    }
  })

  clients.set(sessionId, waClient)

  waClient.on('qr', async (qr) => {
    try {
      const qrData = await qrcode.toDataURL(qr)
      statuses.set(sessionId, { status: 'qr', message: 'Scan the QR code with WhatsApp', qr: qrData, ready: false })
      io.emit('session-update', { sessionId, ...statuses.get(sessionId) })
    } catch (err) {
      console.error(`QR error for ${sessionId}:`, err)
    }
  })

  waClient.on('ready', () => {
    statuses.set(sessionId, { status: 'ready', message: 'WhatsApp connected!', qr: null, ready: true })
    io.emit('session-update', { sessionId, ...statuses.get(sessionId) })
    console.log(`✅ WhatsApp Client Ready [${sessionId}]`)
  })

  waClient.on('authenticated', () => {
    statuses.set(sessionId, { status: 'authenticated', message: 'Authenticated successfully', qr: null, ready: false })
    io.emit('session-update', { sessionId, ...statuses.get(sessionId) })
  })

  waClient.on('auth_failure', (msg) => {
    statuses.set(sessionId, { status: 'error', message: `Auth failed: ${msg}`, qr: null, ready: false })
    io.emit('session-update', { sessionId, ...statuses.get(sessionId) })
  })

  waClient.on('disconnected', (reason) => {
    statuses.set(sessionId, { status: 'disconnected', message: `Disconnected: ${reason}`, qr: null, ready: false })
    io.emit('session-update', { sessionId, ...statuses.get(sessionId) })
    waClient.destroy().catch(()=>{}).finally(() => {
      clients.delete(sessionId)
    })
  })

  waClient.initialize().catch(err => {
    statuses.set(sessionId, { status: 'error', message: `Init error: ${err.message}`, qr: null, ready: false })
    io.emit('session-update', { sessionId, ...statuses.get(sessionId) })
    console.error(`WA Init error [${sessionId}]:`, err)
    clients.delete(sessionId)
  })
}

// ─── Routes ──────────────────────────────────────────────────────────────────

app.get('/api/sessions', (req, res) => {
  // Load saved sessions from auth dir if they exist
  const authPath = path.join(process.env.APPDATA || '.', 'wa-sender', 'auth')
  if (fs.existsSync(authPath)) {
    const dirs = fs.readdirSync(authPath)
    dirs.forEach(dir => {
      if (dir.startsWith('session-')) {
        const sessionId = dir.replace('session-', '')
        if (!statuses.has(sessionId)) {
          // Only load if it has an actual browser profile (was started at least once)
          if (fs.existsSync(path.join(authPath, dir, 'Default'))) {
            statuses.set(sessionId, { status: 'disconnected', message: 'Saved session (idle)', qr: null, ready: false })
          }
        }
      }
    })
  }

  const result = {}
  statuses.forEach((val, key) => { result[key] = val })
  res.json(result)
})

app.post('/api/connect', (req, res) => {
  const { sessionId } = req.body
  if (!sessionId) return res.status(400).json({ error: 'sessionId required' })
  initWAClient(sessionId)
  res.json({ message: 'Connecting...', sessionId })
})

app.post('/api/disconnect', async (req, res) => {
  const { sessionId, deleteFolder = true } = req.body
  if (!sessionId) return res.status(400).json({ error: 'sessionId required' })

  const waClient = clients.get(sessionId)
  try {
    if (waClient) {
      if (deleteFolder) {
        await waClient.logout().catch(() => {})
      }
      await waClient.destroy().catch(() => {})
      clients.delete(sessionId)
    }
    
    if (deleteFolder) {
      // Remove auth folder (LocalAuth prepends 'session-' to the clientId)
      const authDir = path.join(process.env.APPDATA || '.', 'wa-sender', 'auth', `session-${sessionId}`)
      if (fs.existsSync(authDir)) {
        fs.rmSync(authDir, { recursive: true, force: true })
      }
      statuses.delete(sessionId)
      io.emit('session-removed', sessionId)
    } else {
      // Just stop the instance
      statuses.set(sessionId, { status: 'disconnected', message: 'Saved session (idle)', qr: null, ready: false })
      io.emit('session-update', { sessionId, ...statuses.get(sessionId) })
    }
    
    res.json({ message: deleteFolder ? 'Deleted' : 'Stopped' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Parse Excel file
app.post('/api/parse-excel', (req, res) => {
  try {
    const { fileData, fileName } = req.body
    if (!fileData) return res.status(400).json({ error: 'No file data' })

    const buffer = Buffer.from(fileData, 'base64')
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const raw = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })

    if (!raw || raw.length < 2) {
      return res.status(400).json({ error: 'Excel file appears empty' })
    }

    // Detect category blocks by scanning header row(s)
    // Format: columns repeat as [Roll, Date, Day, Name, Surname, Phone] per category
    // Category name is in the header row above or as a merged cell label

    const result = parseExcelSections(raw)
    res.json(result)
  } catch (err) {
    console.error('Parse error:', err)
    res.status(500).json({ error: err.message })
  }
})

function parseExcelSections(rows) {
  const categories = {}
  
  let headerRow = -1
  let sectionRow = -1
  let sections = []

  // Find section names
  for (let i = 0; i < Math.min(5, rows.length); i++) {
    const row = rows[i]
    let tempSections = []
    for (let c = 0; c < row.length; c++) {
      const val = String(row[c] || '').trim()
      if (!val) continue
      
      const lower = val.toLowerCase()
      // Skip numeric headers and standard data headers
      if (!isNaN(Number(val))) continue
      if (['roll', 'date', 'day', 'name', 'surname', 'phone'].includes(lower)) continue
      
      tempSections.push({ label: val, colIndex: c })
    }
    
    if (tempSections.length > 0) {
      sectionRow = i
      sections = tempSections
      break
    }
  }

  // Find numeric header row (if any)
  for (let i = 0; i < Math.min(5, rows.length); i++) {
    const row = rows[i]
    const nums = row.filter(c => c !== '' && !isNaN(Number(c)) && Number(c) >= 1 && Number(c) <= 10)
    if (nums.length >= 4) {
      headerRow = i
      break
    }
  }

  // Determine bounds for each section
  if (sections.length > 0) {
    for (let i = 0; i < sections.length; i++) {
      const sec = sections[i]
      let isAtEnd = false
      
      if (sec.colIndex >= 6) {
         const colBefore = String(rows[sectionRow][sec.colIndex - 1] || '').trim()
         if (colBefore === '6' || colBefore.toLowerCase() === 'phone') {
            isAtEnd = true
         }
      }
      
      if (isAtEnd) {
         sec.startCol = sec.colIndex - 6
         sec.endCol = sec.colIndex - 1
      } else {
         sec.startCol = sec.colIndex
         const nextSec = sections[i+1]
         if (nextSec && nextSec.colIndex > sec.colIndex) {
            sec.endCol = Math.min(nextSec.colIndex - 1, sec.startCol + 5)
         } else {
            sec.endCol = sec.startCol + 5
         }
      }
    }
  } else {
    // Fallback: chunk by 6
    const totalCols = rows[0] ? rows[0].length : 0
    const sectionNames = ['Section 1', 'Section 2', 'Section 3', 'Section 4', 'Section 5']
    for (let i = 0; i * 6 < totalCols; i++) {
      sections.push({ label: sectionNames[i] || `Section ${i + 1}`, startCol: i * 6, endCol: i * 6 + 5 })
    }
  }

  let headers = ['Col 1', 'Col 2', 'Col 3', 'Col 4', 'Col 5', 'Col 6']
  if (headerRow >= 0 && sections.length > 0) {
    headers = []
    const start = sections[0].startCol
    for (let c = 0; c < 6; c++) {
      headers.push(String(rows[headerRow][start + c] || `Col ${c + 1}`).trim())
    }
  } else if (sectionRow >= 0 && headerRow === -1 && sections.length > 0) {
    // If no numeric row, try to grab headers from the row below the section label
    const maybeHeaderRow = rows[sectionRow + 1]
    if (maybeHeaderRow) {
      headers = []
      const start = sections[0].startCol
      for (let c = 0; c < 6; c++) {
        headers.push(String(maybeHeaderRow[start + c] || `Col ${c + 1}`).trim())
      }
    }
  }

  // Ensure unique non-empty headers
  headers = headers.map((h, i) => h ? h : `Col ${i + 1}`)

  const dataStart = Math.max(sectionRow, headerRow) + 1

  for (const section of sections) {
    const records = []
    for (let r = dataStart; r < rows.length; r++) {
      const row = rows[r]
      const cols = []
      for (let c = section.startCol; c <= section.endCol; c++) {
        cols.push(row[c])
      }
      
      if (cols.every(c => c === '' || c === null || c === undefined)) continue

      const phone = String(cols[5] || '').replace(/\D/g, '')
      if (!phone || phone.length < 7) continue

      // Map dynamic headers to the record object
      const record = { phone } // always keep raw phone
      for (let i = 0; i < 6; i++) {
        let val = cols[i]
        // Try to format if it's a date object
        if (val instanceof Date) val = formatDate(val)
        else val = String(val || '').trim()
        
        record[`col_${i}`] = val
        // Add legacy names for fallback
        if (i===0) record.roll = val
        if (i===1) record.date = val
        if (i===2) record.day = val
        if (i===3) record.name = val
        if (i===4) record.surname = val
      }
      records.push(record)
    }
    if (records.length > 0) {
      categories[section.label] = records
    }
  }

  return { categories, headers, totalRecords: Object.values(categories).reduce((s, r) => s + r.length, 0) }
}

function formatDate(val) {
  if (!val) return ''
  if (val instanceof Date) {
    return val.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
  }
  return String(val).trim()
}

// Send messages
app.post('/api/send', async (req, res) => {
  const { sessionId, messages, delay = 3 } = req.body
  if (!sessionId) return res.status(400).json({ error: 'sessionId required' })

  const statusObj = statuses.get(sessionId)
  if (!statusObj || !statusObj.ready) return res.status(400).json({ error: 'WhatsApp not connected for this session' })
  if (isSending) return res.status(400).json({ error: 'Already sending a broadcast' }) // Optional: allow parallel broadcasts if we separate isSending by sessionId

  const waClient = clients.get(sessionId)
  if (!waClient) return res.status(400).json({ error: 'Client not found' })

  if (!messages || messages.length === 0) {
    return res.status(400).json({ error: 'No messages to send' })
  }

  isSending = true
  sendingAborted = false
  res.json({ message: 'Sending started', total: messages.length, sessionId })

  let sent = 0
  let failed = 0

  for (const item of messages) {
    if (sendingAborted) {
      io.emit('send-progress', { status: 'aborted', sent, failed, total: messages.length, sessionId })
      break
    }

    try {
      const phone = item.phone.replace(/\D/g, '')
      const chatId = `${phone}@c.us`
      await waClient.sendMessage(chatId, item.message)
      sent++
      io.emit('send-progress', {
        status: 'sending',
        sent, failed,
        total: messages.length,
        current: item.phone,
        label: item.label,
        sessionId
      })
    } catch (err) {
      failed++
      io.emit('send-progress', {
        status: 'sending',
        sent, failed,
        total: messages.length,
        current: item.phone,
        error: err.message,
        label: item.label,
        sessionId
      })
    }

    if (delay > 0) {
      await new Promise(r => setTimeout(r, delay * 1000))
    }
  }

  isSending = false
  io.emit('send-progress', { status: sendingAborted ? 'aborted' : 'done', sent, failed, total: messages.length, sessionId })
})

app.post('/api/abort', (req, res) => {
  sendingAborted = true
  isSending = false
  res.json({ message: 'Aborted' })
})

// ─── Socket.IO ───────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)
  socket.emit('all-sessions', Object.fromEntries(statuses))
})

// ─── Start ───────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`✅ WA-Sender server running on port ${PORT}`)
})

module.exports = { app, server }
