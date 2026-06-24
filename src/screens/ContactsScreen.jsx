import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ArrowLeft, Phone, Plus } from 'lucide-react';

export default function ContactsScreen() {
  const navigate = useNavigate();
  const { family } = useApp();

  const grouped = {};
  family.contacts.forEach(c => {
    const role = c.role || 'Other';
    if (!grouped[role]) grouped[role] = [];
    grouped[role].push(c);
  });

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="back-btn" onClick={() => navigate(-1)}><ArrowLeft size={24} /></button>
        <h1>Emergency Contacts</h1>
      </div>

      <p style={{ marginBottom: 20 }}>
        Keep these numbers accessible. Print a copy for your emergency kit.
      </p>

      {Object.entries(grouped).map(([role, contacts]) => (
        <div key={role}>
          <div className="section-title">{role}</div>
          {contacts.map(c => (
            <div key={c.id} className="contact-card">
              <div className="contact-avatar">{c.name[0]}</div>
              <div className="contact-info" style={{ flex: 1 }}>
                <h4>{c.name}</h4>
                <p>{c.relationship} — {c.phone}</p>
                {c.email && <p>{c.email}</p>}
              </div>
              <a href={`tel:${c.phone}`} className="contact-action">
                <Phone size={18} />
              </a>
            </div>
          ))}
        </div>
      ))}

      <button className="btn btn-outline" style={{ marginTop: 16 }}>
        <Plus size={18} /> Add Contact
      </button>
    </div>
  );
}
