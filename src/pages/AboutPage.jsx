import { Info, HelpCircle, BookOpen, Mail, User } from 'lucide-react'

export default function AboutPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', paddingRight: 8 }}>
      <div className="mb-4">
        <h1>About & Help</h1>
        <div className="subtitle">Everything you need to know to use WA-Sender effectively.</div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent)' }}>
          <Info size={18} /> About WA-Sender
        </h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: 14 }}>
          WA-Sender is a powerful, automated desktop application designed to streamline bulk WhatsApp messaging. 
          By seamlessly reading data from your Excel files, it allows you to automatically generate highly 
          personalized messages using customizable templates, and broadcast them directly through your linked WhatsApp account—all 
          without requiring expensive third-party APIs.
        </p>
        <div style={{ marginTop: 16, display: 'flex', gap: 24, fontSize: 13 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-primary)' }}>
            <User size={16} color="var(--text-hint)" /> <strong>Author:</strong> ALI QURESHI
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-primary)' }}>
            <Mail size={16} color="var(--text-hint)" /> <strong>Contact:</strong> <a href="mailto:aliaqureshi73@gmail.com" style={{ color: 'var(--accent)', textDecoration: 'none' }}>aliaqureshi73@gmail.com</a>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <div className="card">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BookOpen size={18} /> Step-by-Step Guide
          </h2>
          <ol style={{ paddingLeft: 16, color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: 13, margin: 0 }}>
            <li style={{ marginBottom: 12 }}>
              <strong>Connect your Account:</strong> Go to the Connect page, hit "Generate QR Code", and scan it using the "Linked Devices" feature in your WhatsApp mobile app. You can connect multiple accounts!
            </li>
            <li style={{ marginBottom: 12 }}>
              <strong>Upload Excel Data:</strong> Navigate to the Upload page. Drag and drop your Excel sheet containing contacts and categories. Ensure one column contains phone numbers.
            </li>
            <li style={{ marginBottom: 12 }}>
              <strong>Customize Templates:</strong> In the Templates page, you can define specific messages for different categories (e.g., Sabaq, Late). Click variables like {'{{1}}'} or {'{{name}}'} to dynamically insert Excel data into the text.
            </li>
            <li>
              <strong>Preview & Send:</strong> Go to the final step to review the generated messages. Set a delay (3-5 seconds recommended) and hit "Start Broadcast" to send the messages automatically.
            </li>
          </ol>
        </div>

        <div className="card">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <HelpCircle size={18} /> Frequently Asked Questions
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <strong style={{ fontSize: 13, color: 'var(--text-primary)', display: 'block', marginBottom: 4 }}>
                Q: Do I need a WhatsApp Business API account?
              </strong>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                No. WA-Sender connects directly to your standard WhatsApp or WhatsApp Business app via WhatsApp Web protocol. No API fees are required.
              </div>
            </div>
            <div>
              <strong style={{ fontSize: 13, color: 'var(--text-primary)', display: 'block', marginBottom: 4 }}>
                Q: Why do I need a delay between messages?
              </strong>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Sending messages too fast can trigger WhatsApp's anti-spam filters, which might lead to your number being temporarily banned. A 3-5 second delay is highly recommended.
              </div>
            </div>
            <div>
              <strong style={{ fontSize: 13, color: 'var(--text-primary)', display: 'block', marginBottom: 4 }}>
                Q: How should my Excel file be formatted?
              </strong>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                The app auto-detects horizontal blocks (up to 6 columns per category). Just ensure the last column in your block contains the valid phone number (with country code preferred).
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div style={{ textAlign: 'center', color: 'var(--text-hint)', fontSize: 12, padding: '16px 0' }}>
        WA-Sender Version 1.0.0 &copy; {new Date().getFullYear()} Ali Qureshi
      </div>
    </div>
  )
}
