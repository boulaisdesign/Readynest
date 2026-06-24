import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ArrowLeft, Plus, MapPin, Clock, Phone, Users, AlertTriangle, FileText } from 'lucide-react';

export default function PlacesScreen() {
  const navigate = useNavigate();
  const { family } = useApp();
  const [selectedPlace, setSelectedPlace] = useState(null);

  const typeColors = { home: '#4A90D9', work: '#E8913A', school: '#2ECC71', daycare: '#7B68EE', other: '#95A5A6' };

  if (selectedPlace) {
    const place = family.places.find(p => p.id === selectedPlace);
    if (!place) return null;
    return (
      <div className="screen">
        <div className="screen-header">
          <button className="back-btn" onClick={() => setSelectedPlace(null)}><ArrowLeft size={24} /></button>
          <h1 style={{ fontSize: 20 }}>{place.name}</h1>
        </div>
        <div className="card">
          <span className="member-chip" style={{ background: (typeColors[place.type] || '#95A5A6') + '20', color: typeColors[place.type] || '#95A5A6' }}>
            {place.type.charAt(0).toUpperCase() + place.type.slice(1)}
          </span>
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
              <MapPin size={18} color="var(--gray-400)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div><p style={{ fontSize: 13, color: 'var(--gray-400)' }}>Address</p><p>{place.address}</p></div>
            </div>
            {place.hours && <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
              <Clock size={18} color="var(--gray-400)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div><p style={{ fontSize: 13, color: 'var(--gray-400)' }}>Hours</p><p>{place.hours}</p></div>
            </div>}
            <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
              <Users size={18} color="var(--gray-400)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div><p style={{ fontSize: 13, color: 'var(--gray-400)' }}>People usually here</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                  {place.peopleUsuallyThere.map(p => <span key={p} className="member-chip">{p}</span>)}
                  {place.peopleUsuallyThere.length === 0 && <p style={{ fontSize: 13 }}>None assigned</p>}
                </div>
              </div>
            </div>
            {place.contactName && <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
              <Phone size={18} color="var(--gray-400)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div><p style={{ fontSize: 13, color: 'var(--gray-400)' }}>Contact</p><p>{place.contactName} — {place.contactPhone}</p></div>
            </div>}
            {place.emergencyNotes && <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
              <AlertTriangle size={18} color="var(--orange)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div><p style={{ fontSize: 13, color: 'var(--gray-400)' }}>Emergency notes</p><p>{place.emergencyNotes}</p></div>
            </div>}
            {place.pickupRules && <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
              <FileText size={18} color="var(--gray-400)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div><p style={{ fontSize: 13, color: 'var(--gray-400)' }}>Pickup rules</p><p>{place.pickupRules}</p></div>
            </div>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="screen-header">
        <h1>Places & Routines</h1>
      </div>
      <p style={{ marginBottom: 20 }}>
        Your family's regular locations help us plan for emergencies wherever everyone is during the day.
      </p>

      <div className="section-title">Scenarios We Plan For</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
        {['Parent at work, child at daycare', 'Kids at school, adults at work', 'Everyone at home overnight', 'One caregiver traveling', 'Older adult alone at home'].map(s => (
          <div key={s} className="card" style={{ padding: 12, fontSize: 13, textAlign: 'center' }}>{s}</div>
        ))}
      </div>

      <div className="section-title">Your Places</div>
      {family.places.map(place => (
        <div key={place.id} className="place-card" onClick={() => setSelectedPlace(place.id)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: 4, background: typeColors[place.type] || '#95A5A6' }} />
            <div className="place-type">{place.type}</div>
          </div>
          <h3>{place.name}</h3>
          <p style={{ fontSize: 13, color: 'var(--gray-500)' }}>{place.address}</p>
          {place.peopleUsuallyThere.length > 0 && (
            <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {place.peopleUsuallyThere.map(p => <span key={p} className="member-chip">{p}</span>)}
            </div>
          )}
        </div>
      ))}

      <button className="btn btn-outline" style={{ marginTop: 12 }}>
        <Plus size={18} /> Add a Place
      </button>
    </div>
  );
}
