import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ArrowLeft, ShoppingCart, ExternalLink, CheckCircle2 } from 'lucide-react';

export default function KitScreen() {
  const navigate = useNavigate();
  const { kitItems, toggleKitItem, checkedCount, totalKit } = useApp();
  const [filter, setFilter] = useState('All');

  const categories = ['All', ...new Set(kitItems.map(i => i.category))];
  const filtered = filter === 'All' ? kitItems : kitItems.filter(i => i.category === filter);

  const grouped = {};
  filtered.forEach(item => {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  });

  return (
    <div className="screen">
      <div className="screen-header">
        <h1>Emergency Kit</h1>
      </div>

      <div className="card" style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <p style={{ fontSize: 14, fontWeight: 600 }}>Kit Progress</p>
          <p style={{ fontSize: 14 }}>{checkedCount}/{totalKit}</p>
        </div>
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: `${(checkedCount / totalKit) * 100}%`, background: 'var(--green)' }} />
        </div>
        <p style={{ fontSize: 13, color: 'var(--gray-400)', marginTop: 8 }}>
          {checkedCount === totalKit ? 'Your kit is complete!' : `${totalKit - checkedCount} items remaining`}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8, marginBottom: 16 }}>
        {categories.map(c => (
          <button key={c} onClick={() => setFilter(c)} style={{
            padding: '6px 14px', borderRadius: 20, border: 'none', whiteSpace: 'nowrap',
            background: filter === c ? 'var(--navy)' : 'var(--gray-100)',
            color: filter === c ? 'var(--white)' : 'var(--gray-600)',
            fontSize: 13, fontWeight: 500, cursor: 'pointer',
          }}>
            {c}
          </button>
        ))}
      </div>

      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat}>
          <div className="category-header">{cat}</div>
          {items.map(item => (
            <div key={item.id} className={`checklist-item ${item.checked ? 'checked' : ''}`}>
              <input type="checkbox" checked={item.checked} onChange={() => toggleKitItem(item.id)} />
              <div style={{ flex: 1 }} onClick={() => navigate(`/kit/${item.id}`)}>
                <p className="item-name" style={{ fontSize: 15, fontWeight: 500, color: 'var(--gray-700)', cursor: 'pointer' }}>{item.name}</p>
                <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
                  <span className={`badge badge-${item.priority === 'Critical' ? 'high' : item.priority === 'High' ? 'moderate' : 'low'}`}>
                    {item.priority}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>{item.quantity}</span>
                </div>
              </div>
              {item.amazonSearchUrl && (
                <a href={item.amazonSearchUrl} target="_blank" rel="noopener noreferrer"
                  style={{ color: '#FF9900', padding: 4, flexShrink: 0 }}
                  onClick={e => e.stopPropagation()}>
                  <ShoppingCart size={18} />
                </a>
              )}
            </div>
          ))}
        </div>
      ))}

      <div className="disclaimer">
        ReadyNest may earn from qualifying purchases. Always verify product quality, quantity, and expiration dates.
      </div>
    </div>
  );
}

export function KitItemDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { kitItems, toggleKitItem } = useApp();
  const item = kitItems.find(i => i.id === id);
  if (!item) return <div className="screen"><p>Item not found</p></div>;

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="back-btn" onClick={() => navigate(-1)}><ArrowLeft size={24} /></button>
        <h1 style={{ fontSize: 20 }}>{item.name}</h1>
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <span className={`badge badge-${item.priority === 'Critical' ? 'high' : item.priority === 'High' ? 'moderate' : 'low'}`}>
            {item.priority} Priority
          </span>
          <span className="member-chip">{item.category}</span>
        </div>

        <div className="form-group">
          <label>Recommended Quantity</label>
          <p style={{ fontWeight: 500 }}>{item.quantity}</p>
        </div>

        <div className="form-group">
          <label>Why It Matters</label>
          <p>{item.whyNeeded}</p>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          <button className={`btn ${item.checked ? 'btn-success' : 'btn-outline'}`} onClick={() => toggleKitItem(item.id)}>
            <CheckCircle2 size={18} />
            {item.checked ? 'Got It' : 'Mark as Packed'}
          </button>
        </div>

        {item.amazonSearchUrl && (
          <a href={item.amazonSearchUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block', marginTop: 12 }}>
            <button className="btn btn-amazon">
              <ShoppingCart size={18} />
              Buy on Amazon
              <ExternalLink size={14} />
            </button>
          </a>
        )}
      </div>

      <div className="disclaimer">
        ReadyNest may earn from qualifying purchases. Always verify product quality, quantity, and expiration dates.
      </div>
    </div>
  );
}
