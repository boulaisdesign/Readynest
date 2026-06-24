import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ArrowLeft, ChevronRight, MapPin } from 'lucide-react';

export default function RiskScreen() {
  const navigate = useNavigate();
  const { family } = useApp();

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="back-btn" onClick={() => navigate(-1)}><ArrowLeft size={24} /></button>
        <h1>Risk Profile</h1>
      </div>

      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <MapPin size={20} color="var(--navy)" />
        <div>
          <p style={{ fontSize: 13, color: 'var(--gray-400)' }}>Your location</p>
          <p style={{ fontWeight: 600 }}>{family.user.location}</p>
        </div>
      </div>

      <p style={{ marginBottom: 20 }}>
        Based on your location, here are the emergency risks most likely to affect your family. Tap any risk to see your personalized plan.
      </p>

      {family.risks.map(risk => (
        <div key={risk.id} className="card" style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h3>{risk.type}</h3>
            <span className={`badge badge-${risk.level.toLowerCase()}`}>{risk.level}</span>
          </div>
          <p style={{ fontSize: 14, marginBottom: 12 }}>{risk.explanation}</p>
          <div style={{ marginBottom: 12 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-400)', marginBottom: 6 }}>SUGGESTED ACTIONS</p>
            {risk.recommendedActions.map((a, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                <span style={{ color: 'var(--green)', fontSize: 14 }}>•</span>
                <p style={{ fontSize: 14 }}>{a}</p>
              </div>
            ))}
          </div>
          <button className="btn btn-primary btn-small" onClick={() => navigate(`/plan/${risk.type.toLowerCase()}`)}>
            View Plan <ChevronRight size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
