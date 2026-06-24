import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { User, Heart, PawPrint, FileText, Phone, Bell, Settings, ChevronRight, Shield, MapPin, Plus } from 'lucide-react';

export default function ProfileScreen() {
  const navigate = useNavigate();
  const { family, readinessScore } = useApp();
  const [view, setView] = useState('main');

  if (view === 'settings') {
    return (
      <div className="screen">
        <div className="screen-header">
          <button className="back-btn" onClick={() => setView('main')}><Settings size={24} /></button>
          <h1>Settings</h1>
        </div>
        {['Notifications', 'Language', 'Data & Privacy', 'Export Plan (PDF)', 'About ReadyNest', 'Reset Onboarding'].map(item => (
          <div key={item} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: 16 }}>
            <p style={{ fontWeight: 500 }}>{item}</p>
            <ChevronRight size={18} color="var(--gray-400)" />
          </div>
        ))}
        <div className="disclaimer" style={{ marginTop: 24 }}>
          ReadyNest v1.0 Prototype<br />
          Your data is stored locally on this device.
        </div>
      </div>
    );
  }

  if (view === 'reminders') {
    return (
      <div className="screen">
        <div className="screen-header">
          <button className="back-btn" onClick={() => setView('main')}><Bell size={24} /></button>
          <h1>Reminders</h1>
        </div>
        <p style={{ marginBottom: 16 }}>Stay on top of your family's preparedness with regular reminders.</p>
        {family.reminders.map(r => (
          <div key={r.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14 }}>
            <input type="checkbox" checked={r.completed} readOnly style={{ width: 20, height: 20, accentColor: 'var(--green)' }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 500, fontSize: 14, textDecoration: r.completed ? 'line-through' : 'none', color: r.completed ? 'var(--gray-400)' : 'var(--gray-700)' }}>{r.title}</p>
              <p style={{ fontSize: 12, color: 'var(--gray-400)' }}>Every {r.interval} — Next: {r.nextDue}</p>
            </div>
          </div>
        ))}
        <button className="btn btn-outline" style={{ marginTop: 12 }}><Plus size={18} /> Add Reminder</button>
      </div>
    );
  }

  if (view === 'reunification') {
    const r = family.reunification;
    return (
      <div className="screen">
        <div className="screen-header">
          <button className="back-btn" onClick={() => setView('main')}><MapPin size={24} /></button>
          <h1>Reunification Plan</h1>
        </div>
        <p style={{ marginBottom: 16 }}>If your family is separated during an emergency, here's how you'll find each other.</p>
        {[
          { label: 'Primary Meeting Place', value: r.primaryMeetingPlace },
          { label: 'Backup Meeting Place', value: r.backupMeetingPlace },
          { label: 'Out-of-Area Contact', value: r.outOfAreaContact },
          { label: 'Pickup Permissions', value: r.pickupPermissions },
          { label: 'If Phones Are Down', value: r.ifPhonesDown },
        ].map(item => (
          <div key={item.label} className="card">
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-400)', marginBottom: 4 }}>{item.label.toUpperCase()}</p>
            <p style={{ fontWeight: 500 }}>{item.value}</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="screen-header"><h1>Family Profile</h1></div>

      <div className="card" style={{ textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: 32, background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
          <span style={{ color: 'white', fontSize: 24, fontWeight: 700 }}>{family.user.name[0]}</span>
        </div>
        <h2>{family.user.name}'s Family</h2>
        <p>{family.user.location}</p>
        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center', gap: 16 }}>
          <div><span style={{ fontSize: 20, fontWeight: 700, color: 'var(--navy)' }}>{family.members.length}</span><br /><span style={{ fontSize: 12, color: 'var(--gray-400)' }}>Members</span></div>
          <div><span style={{ fontSize: 20, fontWeight: 700, color: 'var(--navy)' }}>{family.pets.length}</span><br /><span style={{ fontSize: 12, color: 'var(--gray-400)' }}>Pets</span></div>
          <div><span style={{ fontSize: 20, fontWeight: 700, color: 'var(--navy)' }}>{readinessScore}%</span><br /><span style={{ fontSize: 12, color: 'var(--gray-400)' }}>Ready</span></div>
        </div>
      </div>

      <div className="section-title">Household Members</div>
      {family.members.map(m => (
        <div key={m.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14 }}>
          <div className="contact-avatar">{m.name[0]}</div>
          <div style={{ flex: 1 }}>
            <h4 style={{ fontSize: 15 }}>{m.name}, {m.age}</h4>
            <p style={{ fontSize: 13, color: 'var(--gray-500)' }}>{m.relationship} — {m.usualLocation}</p>
            {m.allergies && <span className="badge badge-moderate" style={{ marginTop: 4 }}>Allergy: {m.allergies}</span>}
            {m.medications && <p style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>Meds: {m.medications}</p>}
          </div>
        </div>
      ))}
      <button className="btn btn-outline btn-small" style={{ marginTop: 8 }}><Plus size={16} /> Add Member</button>

      <div className="section-title">Pets</div>
      {family.pets.map(p => (
        <div key={p.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14 }}>
          <div className="contact-avatar" style={{ background: 'var(--orange)' }}><PawPrint size={18} /></div>
          <div>
            <h4 style={{ fontSize: 15 }}>{p.name}</h4>
            <p style={{ fontSize: 13, color: 'var(--gray-500)' }}>{p.type} — {p.needs}</p>
          </div>
        </div>
      ))}

      <div className="section-title">Quick Links</div>
      {[
        { label: 'Emergency Contacts', icon: Phone, action: () => navigate('/contacts') },
        { label: 'Reunification Plan', icon: MapPin, action: () => setView('reunification') },
        { label: 'Reminders', icon: Bell, action: () => setView('reminders') },
        { label: 'Settings', icon: Settings, action: () => setView('settings') },
      ].map(item => (
        <div key={item.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, cursor: 'pointer' }} onClick={item.action}>
          <item.icon size={18} color="var(--navy)" />
          <p style={{ flex: 1, fontWeight: 500 }}>{item.label}</p>
          <ChevronRight size={18} color="var(--gray-400)" />
        </div>
      ))}
    </div>
  );
}
