import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Shield, AlertTriangle, CheckCircle, ChevronRight, Package, MapPin, Phone, Zap, WifiOff, Download } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { family, readinessScore, checkedCount, totalKit, scenarioCards } = useApp();

  const topRisks = family.risks.filter(r => r.level === 'High' || r.level === 'Moderate').slice(0, 3);
  const nextAction = checkedCount < totalKit / 2
    ? 'Build your emergency kit — you\'re ' + Math.round((checkedCount / totalKit) * 100) + '% done'
    : 'Practice your family emergency drill';

  return (
    <div className="screen">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingTop: 8 }}>
        <div>
          <p style={{ fontSize: 14, color: 'var(--gray-400)', marginBottom: 4 }}>Welcome back,</p>
          <h1>{family.user.name}</h1>
        </div>
        <div style={{ width: 44, height: 44, borderRadius: 22, background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: 'white', fontWeight: 700, fontSize: 18 }}>{family.user.name[0]}</span>
        </div>
      </div>

      <div className="offline-banner">
        <Download size={16} />
        Offline plan available — your emergency info is saved on this device
      </div>

      {/* Readiness Score */}
      <div className="card" style={{ textAlign: 'center' }}>
        <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto 16px' }}>
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="50" fill="none" stroke="var(--gray-200)" strokeWidth="10" />
            <circle cx="60" cy="60" r="50" fill="none" stroke={readinessScore > 70 ? 'var(--green)' : readinessScore > 40 ? 'var(--orange)' : 'var(--red)'} strokeWidth="10"
              strokeDasharray={`${readinessScore * 3.14} ${314 - readinessScore * 3.14}`}
              strokeLinecap="round" transform="rotate(-90 60 60)" />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--navy)' }}>{readinessScore}%</span>
            <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>prepared</span>
          </div>
        </div>
        <h3>Your Family Readiness</h3>
        <p style={{ fontSize: 13 }}>Keep going — every step makes your family safer.</p>
      </div>

      {/* Next Action */}
      <div className="card" style={{ background: 'var(--orange-light)', cursor: 'pointer' }} onClick={() => navigate('/kit')}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Zap size={20} color="var(--orange)" />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--orange)', marginBottom: 4 }}>NEXT STEP</p>
            <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--gray-700)' }}>{nextAction}</p>
          </div>
          <ChevronRight size={18} color="var(--orange)" />
        </div>
      </div>

      {/* Top Risks */}
      <div className="section-title">Location Risks</div>
      {topRisks.map(risk => (
        <div key={risk.id} className="risk-card" onClick={() => navigate(`/plan/${risk.type.toLowerCase()}`)}>
          <div className="risk-info">
            <h3>{risk.type}</h3>
            <p>{risk.explanation.substring(0, 60)}...</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className={`badge badge-${risk.level.toLowerCase()}`}>{risk.level}</span>
            <ChevronRight size={16} color="var(--gray-400)" />
          </div>
        </div>
      ))}
      <button className="btn btn-outline btn-small" onClick={() => navigate('/risks')} style={{ marginTop: 4 }}>
        View All Risks
      </button>

      {/* Quick Actions */}
      <div className="section-title">Quick Actions</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[
          { label: 'Emergency Plan', icon: Shield, path: '/plan', color: 'var(--navy)' },
          { label: 'Emergency Kit', icon: Package, path: '/kit', color: 'var(--green)' },
          { label: 'Places', icon: MapPin, path: '/places', color: 'var(--orange)' },
          { label: 'Contacts', icon: Phone, path: '/contacts', color: '#7B68EE' },
        ].map(action => (
          <div key={action.label} className="card" style={{ textAlign: 'center', cursor: 'pointer', padding: 16 }} onClick={() => navigate(action.path)}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: action.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
              <action.icon size={20} color={action.color} />
            </div>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-700)' }}>{action.label}</p>
          </div>
        ))}
      </div>

      {/* Kit Progress */}
      <div className="section-title">Emergency Kit</div>
      <div className="card" onClick={() => navigate('/kit')} style={{ cursor: 'pointer' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <p style={{ fontSize: 14, fontWeight: 600 }}>Kit Progress</p>
          <p style={{ fontSize: 14, color: 'var(--gray-500)' }}>{checkedCount}/{totalKit} items</p>
        </div>
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: `${(checkedCount / totalKit) * 100}%`, background: 'var(--green)' }} />
        </div>
      </div>

      {/* Important Contacts */}
      <div className="section-title">Important Contacts</div>
      {family.contacts.slice(0, 3).map(c => (
        <div key={c.id} className="contact-card" onClick={() => navigate('/contacts')}>
          <div className="contact-avatar">{c.name[0]}</div>
          <div className="contact-info">
            <h4>{c.name}</h4>
            <p>{c.role}</p>
          </div>
          <a href={`tel:${c.phone}`} className="contact-action" onClick={e => e.stopPropagation()}>
            <Phone size={18} />
          </a>
        </div>
      ))}

      <div className="disclaimer" style={{ marginTop: 24 }}>
        ReadyNest provides preparedness guidance and planning support, but it does not replace official emergency alerts, local authorities, emergency services, medical professionals, or school/daycare emergency policies. In an emergency, follow instructions from local officials and call emergency services when needed.
      </div>
    </div>
  );
}
