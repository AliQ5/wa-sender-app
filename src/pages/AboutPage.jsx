import { useState } from 'react'
import { 
  Info, HelpCircle, BookOpen, Mail, User, 
  Shield, Cpu, Database, Settings, RefreshCw, 
  Layers, ArrowRight, FileSpreadsheet, ShieldAlert, 
  Smartphone, ChevronDown, ChevronUp, AlertCircle
} from 'lucide-react'

export default function AboutPage() {
  const [activeTab, setActiveTab] = useState('features')
  const [openFaq, setOpenFaq] = useState(null)

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index)
  }

  const features = [
    {
      icon: <Smartphone size={20} color="var(--accent)" />,
      title: "Multi-Account Connection",
      desc: "Link, save, start, and stop multiple WhatsApp profiles using secure, offline-first session data—eliminating expensive official API fees."
    },
    {
      icon: <FileSpreadsheet size={20} color="var(--accent)" />,
      title: "Intelligent Excel Parser",
      desc: "Drag-and-drop support that automatically parses horizontal categories (e.g., Sabaq, Manzil, Late, Absent) and column headers."
    },
    {
      icon: <Layers size={20} color="var(--accent)" />,
      title: "Automatic Deduplication",
      desc: "Scans uploaded lists for duplicate phone numbers. Prevent annoying double-messaging with one-click deduplication."
    },
    {
      icon: <Database size={20} color="var(--accent)" />,
      title: "Category-Based Templates",
      desc: "Assign distinct text templates to each parsed Excel category. Live bracket mapping dynamically inserts name, date, roll number, etc."
    },
    {
      icon: <Settings size={20} color="var(--accent)" />,
      title: "Smart Delay Randomizer",
      desc: "Protects your number by injecting customizable delay windows (Safe, Normal, Fast presets) that mimic natural human behavior."
    },
    {
      icon: <Cpu size={20} color="var(--accent)" />,
      title: "Real-Time Control Panel",
      desc: "Monitor live delivery charts. Pause, resume, or stop the transmission process instantly at any point during your broadcast."
    },
    {
      icon: <RefreshCw size={20} color="var(--accent)" />,
      title: "Failed Broadcast Retry",
      desc: "If any message fails (due to poor network or invalid phone numbers), WA-Sender isolates them so you can retry with one click."
    },
    {
      icon: <Shield size={20} color="var(--accent)" />,
      title: "100% Private & Local",
      desc: "Your data never leaves your device. All sessions, cookies, templates, and spreadsheets are processed entirely within Electron."
    }
  ]

  const faqs = [
    {
      q: "Do I need a WhatsApp Business API account?",
      a: "No. WA-Sender connects directly to your standard WhatsApp or WhatsApp Business mobile app using secure WhatsApp Web browser automation. There are absolutely no setup costs, per-message fees, or strict pre-approved template rules."
    },
    {
      q: "Is my personal data or customer list shared with anyone?",
      a: "Never. WA-Sender operates on an offline-first privacy model. All account credentials, session profiles, loaded spreadsheets, and configured templates are stored and executed entirely on your local machine. We have no external databases or analytics trackers."
    },
    {
      q: "Why is the Smart Delay Randomizer highly recommended?",
      a: "WhatsApp's spam filters look for uniform, high-speed automated messages. By randomly waiting between a minimum and maximum delay (e.g., 5 to 8 seconds) between each individual recipient, the broadcast successfully mimics human typing behavior, lowering the risk of account limitation."
    },
    {
      q: "How does the Deduplication Engine handle duplicate contacts?",
      a: "When uploading an Excel spreadsheet, a parent's number might appear multiple times under different children or categories. The app flags duplicates automatically. You can choose to 'Keep first occurrence only' (sending only one combined message) or 'Skip all duplicates' to clean your list."
    },
    {
      q: "Can I run the application in the background while doing other tasks?",
      a: "Yes. Once the broadcast is active, you can minimize the WA-Sender application window. However, ensure that your computer does not enter system hibernation, sleep, or lock screen mode, as this will pause the background Puppeteer browser session."
    },
    {
      q: "Can I broadcast media attachments like images or PDFs?",
      a: "Version 1.2.1 is fully optimized for lightning-fast text templating, WhatsApp formatting (*bold*, _italics_, ~strikethrough~), and advanced variables. Media attachments and file-sending support are currently scheduled for our next major version release."
    },
    {
      q: "How should my Excel spreadsheet columns be set up?",
      a: "The Excel file must have separate horizontal blocks (one block per category). Each block can support up to 6 columns. Ensure the last column in your block contains the valid phone number (e.g. with country codes preferred, like 923001234567)."
    }
  ]

  const safetyTips = [
    {
      title: "Warm Up New Accounts",
      desc: "If you are using a freshly registered SIM/WhatsApp account, do not send large broadcasts immediately. Start with 20-30 messages per day, and gradually increase the volume over 2-3 weeks to build positive sending reputation."
    },
    {
      title: "Highly Personalize Content",
      desc: "Identical messages are easier to flag as spam. Utilize our advanced variable chips (e.g., student name, customized attendance data, exact date) to ensure every outgoing WhatsApp message has uniquely formatted contents."
    },
    {
      title: "Clean and Verify Your Databases",
      desc: "Sending messages to dead, inactive, or non-WhatsApp phone numbers repeatedly will trigger automated anti-spam flags. Periodically purge outdated phone lists from your Excel files."
    },
    {
      title: "Stick to Recommended Delays",
      desc: "Avoid the temptation to use 'Fast Mode' (1-3 seconds) for large lists. We strongly suggest sticking to 'Normal' (3-5 seconds) or 'Safe' (5-8 seconds) delay presets to protect your account's health."
    }
  ]

  const troubleshooting = [
    {
      title: "QR Code won't load or generates errors",
      solution: "Ensure your computer has an active, stable internet connection. If the QR code stalls, click 'Delete Account' to wipe local cache folders and click 'New' to create a clean session."
    },
    {
      title: "Puppeteer Chromium Browser fails to launch",
      solution: "WA-Sender relies on Google Chrome or Microsoft Edge to run. Ensure you have Google Chrome or Microsoft Edge installed on your Windows machine in their default directories. The server automatically searches standard paths to initialize the browser environment."
    },
    {
      title: "Messages are failing to deliver with red dots",
      solution: "Verify that phone numbers in your Excel files include country codes (e.g., 92300... or 91987... without '+' or '00' prefixes). Use the built-in 'Retry Failed' button at the end of the broadcast to safely re-attempt failed rows."
    }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', paddingRight: 8 }}>
      
      {/* Page Header */}
      <div className="mb-4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>About & Help Center</h1>
          <div className="subtitle" style={{ marginBottom: 0 }}>Discover advanced features, step-by-step guides, safety rules, and FAQs.</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-secondary)', padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border)' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }}></div>
          <span style={{ fontSize: 12, fontWeight: 500 }}>Engine Version 1.2.1 (Premium)</span>
        </div>
      </div>

      {/* Tabs Navbar */}
      <div className="cat-tabs" style={{ marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
        <button 
          className={`cat-tab ${activeTab === 'features' ? 'active' : ''}`}
          onClick={() => setActiveTab('features')}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Cpu size={14} /> Features
        </button>
        <button 
          className={`cat-tab ${activeTab === 'guide' ? 'active' : ''}`}
          onClick={() => setActiveTab('guide')}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <BookOpen size={14} /> Step-by-Step Guide
        </button>
        <button 
          className={`cat-tab ${activeTab === 'faq' ? 'active' : ''}`}
          onClick={() => setActiveTab('faq')}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <HelpCircle size={14} /> FAQs
        </button>
        <button 
          className={`cat-tab ${activeTab === 'safety' ? 'active' : ''}`}
          onClick={() => setActiveTab('safety')}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <ShieldAlert size={14} /> Safety & Troubleshooting
        </button>
      </div>

      {/* Tab Content Display */}
      <div style={{ flex: 1, minHeight: 0 }}>
        
        {/* FEATURES TAB */}
        {activeTab === 'features' && (
          <div className="fade-in">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20, marginBottom: 24 }}>
              {features.map((f, i) => (
                <div className="card" key={i} style={{ display: 'flex', flexDirection: 'column', gap: 10, transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'default' }} onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)' }} onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ padding: 8, background: '#EAFDF0', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {f.icon}
                    </div>
                    <h3 style={{ fontSize: 14, fontWeight: 600 }}>{f.title}</h3>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.5, margin: 0 }}>
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
            
            {/* Quick Author block */}
            <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, background: '#E1F5EE', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, color: 'var(--accent-hover)' }}>
                  AQ
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>ALI QURESHI</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Lead Developer & Software Architect</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 20 }}>
                <a href="mailto:aliaqureshi73@gmail.com" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--accent-hover)', textDecoration: 'none', fontWeight: 500 }}>
                  <Mail size={14} /> Send an Email
                </a>
              </div>
            </div>
          </div>
        )}

        {/* GUIDE TAB */}
        {activeTab === 'guide' && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingLeft: 12 }}>
            <div style={{ display: 'flex', gap: 20, position: 'relative' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 'bold', zIndex: 2 }}>1</div>
                <div style={{ width: 2, flex: 1, background: 'var(--border)', margin: '4px 0' }}></div>
              </div>
              <div className="card" style={{ flex: 1, marginBottom: 8 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                  Link WhatsApp Device <ArrowRight size={14} color="var(--text-hint)" /> <span style={{ color: 'var(--text-hint)', fontWeight: 400 }}>Connect View</span>
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                  Start by clicking <strong>"New"</strong> to name a session. Hit <strong>"Start Session"</strong> to prompt the Chromium browser context to fetch WhatsApp Web. Scan the generated QR code on your mobile device (WhatsApp &gt; Linked Devices &gt; Link a Device). You can connect multiple profiles and toggle between them dynamically.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 20, position: 'relative' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 'bold', zIndex: 2 }}>2</div>
                <div style={{ width: 2, flex: 1, background: 'var(--border)', margin: '4px 0' }}></div>
              </div>
              <div className="card" style={{ flex: 1, marginBottom: 8 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                  Import Excel Spreadsheet <ArrowRight size={14} color="var(--text-hint)" /> <span style={{ color: 'var(--text-hint)', fontWeight: 400 }}>Upload View</span>
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                  Drag and drop your Excel workbook (compatible with <code>.xlsx</code>, <code>.xls</code>, or <code>.csv</code>). The engine automatically processes the active sheet, extracting attendance categories, student labels, and valid contact phone numbers from vertical chunks.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 20, position: 'relative' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 'bold', zIndex: 2 }}>3</div>
                <div style={{ width: 2, flex: 1, background: 'var(--border)', margin: '4px 0' }}></div>
              </div>
              <div className="card" style={{ flex: 1, marginBottom: 8 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                  Customize Text & Check Library <ArrowRight size={14} color="var(--text-hint)" /> <span style={{ color: 'var(--text-hint)', fontWeight: 400 }}>Templates View</span>
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                  Define dynamic, custom messages for separate Excel categories (e.g. <i>Sabaq</i> vs <i>Late</i>). Click on available variable chips like <code>{'{{Student Name}}'}</code> or <code>{'{{Roll Number}}'}</code> to inject them. View real-time rendered previews in our styled WhatsApp simulation block. You can also save templates to your local library.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 'bold', zIndex: 2 }}>4</div>
              </div>
              <div className="card" style={{ flex: 1 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                  Smart Random Broadcast & Retry <ArrowRight size={14} color="var(--text-hint)" /> <span style={{ color: 'var(--text-hint)', fontWeight: 400 }}>Send View</span>
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                  Review final recipient lists and choose a safety transmission speed limit (Safe, Normal, or Fast). Click <strong>"Start Broadcast"</strong> to begin. You can dynamically Pause, Resume, or Terminate the sending flow. If any messages fail, isolate them and retry immediately with one-click. Download the finalized delivery summaries as a CSV spreadsheet log.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* FAQs TAB */}
        {activeTab === 'faq' && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx
              return (
                <div 
                  key={idx} 
                  style={{ 
                    border: '1px solid var(--border)', 
                    borderRadius: 8, 
                    background: 'white', 
                    overflow: 'hidden', 
                    transition: 'all 0.2s' 
                  }}
                >
                  <button 
                    onClick={() => toggleFaq(idx)}
                    style={{ 
                      width: '100%', 
                      padding: '16px 20px', 
                      background: 'none', 
                      border: 'none', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      cursor: 'pointer', 
                      textAlign: 'left',
                      fontFamily: 'var(--font)',
                      fontWeight: 600,
                      fontSize: 14,
                      color: 'var(--text-primary)'
                    }}
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp size={16} color="var(--text-secondary)" /> : <ChevronDown size={16} color="var(--text-secondary)" />}
                  </button>
                  {isOpen && (
                    <div 
                      style={{ 
                        padding: '0 20px 16px 20px', 
                        fontSize: 13, 
                        lineHeight: 1.6, 
                        color: 'var(--text-secondary)',
                        borderTop: '1.5px dashed var(--bg-secondary)',
                        paddingTop: 12,
                        background: '#FAFBFD'
                      }}
                    >
                      {faq.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* SAFETY TAB */}
        {activeTab === 'safety' && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            
            {/* Safety Rules block */}
            <div>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#D85A30' }}>
                <ShieldAlert size={18} /> Essential WhatsApp Safety & Anti-Ban Rules
              </h2>
              <p className="subtitle" style={{ marginBottom: 16 }}>Broadcast automations are powerful, but must be used responsibly to safeguard your linked phone numbers.</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {safetyTips.map((tip, idx) => (
                  <div key={idx} className="card" style={{ borderLeft: '3px solid #D85A30', background: 'var(--bg-secondary)', padding: '14px 18px' }}>
                    <strong style={{ fontSize: 13, color: 'var(--text-primary)', display: 'block', marginBottom: 4 }}>{tip.title}</strong>
                    <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{tip.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '4px 0' }} />

            {/* Troubleshooting Block */}
            <div>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}>
                <AlertCircle size={18} color="var(--accent-hover)" /> Troubleshooting Common Issues
              </h2>
              <p className="subtitle" style={{ marginBottom: 16 }}>Steps to take when encountering network timeouts, code hangs, or scan failures.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {troubleshooting.map((t, idx) => (
                  <div key={idx} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                      Issue: {t.title}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, paddingLeft: 12, borderLeft: '2px solid var(--accent)' }}>
                      <strong>Solution:</strong> {t.solution}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>
      
      {/* Footer */}
      <div style={{ borderTop: '1px solid var(--border)', marginTop: 40, padding: '24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--text-hint)' }}>
        <div>
          WA-SENDER &bull; Enterprise Attendance Broadcast Suite
        </div>
        <div>
          &copy; {new Date().getFullYear()} ALI QURESHI. All Rights Reserved.
        </div>
      </div>
    </div>
  )
}
