import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { X, Phone, MessageCircle, MapPin, Users, Shield, Radio, Copy } from 'lucide-react';

export default function EmergencyMode() {
  const navigate = useNavigate();
  const { family } = useApp();

  const safeMessage = `I'm safe. I am currently at home. I'm following our family emergency plan and will check in again soon.`;
  const helpMessage = `I need help. I am at [location]. Please call me or send help.`;

  const copyToClipboard = (text) => {
    navigator.clipboard?.writeText(text);
  };

  return (
    <div className="emergency-mode">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22 }}>Emergency Mode</h1>
        <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 20, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <X size={20} color="white" />
        </button>
      </div>

      <a href="tel:911" style={{ textDecoration: 'none' }}>
        <button className="em-btn em-btn-primary">
          <Phone size={22} />
          Call 911
        </button>
      </a>

      <div style={{ margin: '20px 0 12px' }}>
        <h3 style={{ marginBottom: 12 }}>Family Check-In</h3>
        {family.contacts.filter(c => c.role === 'Primary contact' || c.role === 'Out-of-area / Backup guardian').map(c => (
          <a key={c.id} href={`tel:${c.phone}`} style={{ textDecoration: 'none' }}>
            <button className="em-btn">
              <Phone size={18} />
              Call {c.name} — {c.phone}
            </button>
          </a>
        ))}
      </div>

      <div style={{ margin: '20px 0 12px' }}>
        <h3 style={{ marginBottom: 12 }}>Quick Messages</h3>
        <button className="em-btn" onClick={() => copyToClipboard(safeMessage)}>
          <MessageCircle size={18} />
          <div style={{ textAlign: 'left', flex: 1 }}>
            <div style={{ fontWeight: 600, marginBottom: 2 }}>I'm Safe</div>
            <div style={{ fontSize: 13, opacity: 0.8 }}>{safeMessage}</div>
          </div>
          <Copy size={16} style={{ opacity: 0.6 }} />
        </button>
        <button className="em-btn" onClick={() => copyToClipboard(helpMessage)}>
          <MessageCircle size={18} />
          <div style={{ textAlign: 'left', flex: 1 }}>
            <div style={{ fontWeight: 600, marginBottom: 2 }}>I Need Help</div>
            <div style={{ fontSize: 13, opacity: 0.8 }}>{helpMessage}</div>
          </div>
          <Copy size={16} style={{ opacity: 0.6 }} />
        </button>
      </div>

      <div style={{ margin: '20px 0 12px' }}>
        <h3 style={{ marginBottom: 12 }}>Meeting Places</h3>
        <button className="em-btn">
          <MapPin size={18} />
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 600 }}>Primary</div>
            <div style={{ fontSize: 13, opacity: 0.8 }}>{family.reunification.primaryMeetingPlace}</div>
          </div>
        </button>
        <button className="em-btn">
          <MapPin size={18} />
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 600 }}>Backup</div>
            <div style={{ fontSize: 13, opacity: 0.8 }}>{family.reunification.backupMeetingPlace}</div>
          </div>
        </button>
      </div>

      <div style={{ margin: '20px 0 12px' }}>
        <h3 style={{ marginBottom: 12 }}>Emergency Contacts</h3>
        {family.contacts.slice(0, 6).map(c => (
          <a key={c.id} href={`tel:${c.phone}`} style={{ textDecoration: 'none' }}>
            <button className="em-btn">
              <Phone size={16} />
              <div style={{ textAlign: 'left', flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{c.name}</div>
                <div style={{ fontSize: 13, opacity: 0.8 }}>{c.phone}</div>
              </div>
            </button>
          </a>
        ))}
      </div>

      <div style={{ margin: '20px 0 12px' }}>
        <h3 style={{ marginBottom: 12 }}>If Phones Are Down</h3>
        <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 16 }}>
          <p style={{ fontSize: 14 }}>{family.reunification.ifPhonesDown}</p>
        </div>
      </div>

      <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: 12, marginTop: 20, fontSize: 12, textAlign: 'center' }}>
        <p style={{ fontSize: 12, opacity: 0.8 }}>
          This information is available offline. Follow instructions from local officials and call emergency services when needed.
        </p>
      </div>
    </div>
  );
}
