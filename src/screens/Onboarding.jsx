import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Shield, ChevronRight, MapPin, Users, Building, Heart } from 'lucide-react';

const steps = [
  { key: 'welcome', title: 'Welcome to ReadyNest', subtitle: "Emergency plans for every family, wherever they are.", icon: Shield },
  { key: 'name', title: "What's your name?", subtitle: "We'll use this to personalize your family's emergency plan." },
  { key: 'location', title: 'Where is your home?', subtitle: "This helps us identify emergency risks in your area.", icon: MapPin },
  { key: 'members', title: 'Who lives in your household?', subtitle: "Every family's emergency plan is different. Let's build one that fits your home, routines, and people.", icon: Users },
  { key: 'places', title: 'Where does your family spend time?', subtitle: "We'll plan for emergencies wherever your family members are during the day.", icon: Building },
  { key: 'needs', title: 'Any special needs or pets?', subtitle: "This helps us recommend the right supplies and plan steps.", icon: Heart },
  { key: 'concerns', title: "What concerns you most?", subtitle: "We'll prioritize planning for the scenarios that matter most to you." },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { setOnboardingComplete, updateOnboarding } = useApp();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: '', location: '', members: '', places: '', needs: '', concerns: [],
  });

  const current = steps[step];

  const next = () => {
    if (step === steps.length - 1) {
      setOnboardingComplete(true);
      navigate('/');
    } else {
      setStep(s => s + 1);
    }
  };

  const concernOptions = ['Earthquakes', 'Wildfires', 'Flooding', 'Power outages', 'Winter storms', 'Family separation', 'Medical emergencies', 'Extreme heat'];

  const toggleConcern = (c) => {
    setForm(f => ({
      ...f,
      concerns: f.concerns.includes(c) ? f.concerns.filter(x => x !== c) : [...f.concerns, c],
    }));
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-progress">
        {steps.map((_, i) => (
          <div key={i} className={`dot ${i === step ? 'active' : i < step ? 'done' : ''}`} />
        ))}
      </div>

      {current.key === 'welcome' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, borderRadius: 20, background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
            <Shield size={40} color="white" />
          </div>
          <h1 style={{ fontSize: 28, marginBottom: 12 }}>ReadyNest</h1>
          <p style={{ fontSize: 17, marginBottom: 8 }}>{current.subtitle}</p>
          <p style={{ fontSize: 14, color: 'var(--gray-400)', marginTop: 16 }}>
            We'll walk you through a few quick questions to create your family's personalized emergency plan.
          </p>
        </div>
      )}

      {current.key === 'name' && (
        <div style={{ flex: 1 }}>
          <h1 style={{ marginBottom: 8 }}>{current.title}</h1>
          <p style={{ marginBottom: 24 }}>{current.subtitle}</p>
          <div className="form-group">
            <label>Your first name</label>
            <input type="text" placeholder="e.g., Jordan" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
        </div>
      )}

      {current.key === 'location' && (
        <div style={{ flex: 1 }}>
          <h1 style={{ marginBottom: 8 }}>{current.title}</h1>
          <p style={{ marginBottom: 24 }}>{current.subtitle}</p>
          <div className="form-group">
            <label>Home address or ZIP code</label>
            <input type="text" placeholder="e.g., Portland, OR 97201" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
          </div>
          <div style={{ padding: 12, background: 'var(--green-light)', borderRadius: 8, fontSize: 13, color: '#1a8a4a' }}>
            Your location is only used to identify local emergency risks. It's stored on your device only.
          </div>
        </div>
      )}

      {current.key === 'members' && (
        <div style={{ flex: 1 }}>
          <h1 style={{ marginBottom: 8 }}>{current.title}</h1>
          <p style={{ marginBottom: 24 }}>{current.subtitle}</p>
          <div className="form-group">
            <label>How many adults?</label>
            <select value={form.adults || ''} onChange={e => setForm(f => ({ ...f, adults: e.target.value }))}>
              <option value="">Select</option>
              <option>1</option><option>2</option><option>3</option><option>4+</option>
            </select>
          </div>
          <div className="form-group">
            <label>How many children?</label>
            <select value={form.children || ''} onChange={e => setForm(f => ({ ...f, children: e.target.value }))}>
              <option value="">Select</option>
              <option>0</option><option>1</option><option>2</option><option>3</option><option>4+</option>
            </select>
          </div>
          <div className="form-group">
            <label>Ages of children (if any)</label>
            <input type="text" placeholder="e.g., 4, 8" value={form.childAges || ''} onChange={e => setForm(f => ({ ...f, childAges: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Any older adults (65+)?</label>
            <select value={form.olderAdults || ''} onChange={e => setForm(f => ({ ...f, olderAdults: e.target.value }))}>
              <option value="">Select</option>
              <option>No</option><option>1</option><option>2</option><option>3+</option>
            </select>
          </div>
        </div>
      )}

      {current.key === 'places' && (
        <div style={{ flex: 1 }}>
          <h1 style={{ marginBottom: 8 }}>{current.title}</h1>
          <p style={{ marginBottom: 24 }}>{current.subtitle}</p>
          {['Workplace', 'School', 'Daycare', 'Elder care facility'].map(place => (
            <div className="form-group" key={place}>
              <label>{place} (if applicable)</label>
              <input type="text" placeholder={`${place} name or address`} />
            </div>
          ))}
        </div>
      )}

      {current.key === 'needs' && (
        <div style={{ flex: 1 }}>
          <h1 style={{ marginBottom: 8 }}>{current.title}</h1>
          <p style={{ marginBottom: 24 }}>{current.subtitle}</p>
          <div className="form-group">
            <label>Pets</label>
            <input type="text" placeholder="e.g., 1 dog, 2 cats" value={form.pets || ''} onChange={e => setForm(f => ({ ...f, pets: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Medical or accessibility needs</label>
            <textarea rows={3} placeholder="e.g., allergies, medications, mobility needs" value={form.needs} onChange={e => setForm(f => ({ ...f, needs: e.target.value }))} />
          </div>
        </div>
      )}

      {current.key === 'concerns' && (
        <div style={{ flex: 1 }}>
          <h1 style={{ marginBottom: 8 }}>{current.title}</h1>
          <p style={{ marginBottom: 24 }}>{current.subtitle}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {concernOptions.map(c => (
              <button
                key={c}
                onClick={() => toggleConcern(c)}
                style={{
                  padding: '10px 16px', borderRadius: 20, border: '2px solid',
                  borderColor: form.concerns.includes(c) ? 'var(--navy)' : 'var(--gray-200)',
                  background: form.concerns.includes(c) ? 'var(--navy)' : 'var(--white)',
                  color: form.concerns.includes(c) ? 'var(--white)' : 'var(--gray-600)',
                  fontSize: 14, fontWeight: 500, cursor: 'pointer',
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      <button className="btn btn-primary" onClick={next} style={{ marginTop: 24 }}>
        {step === 0 ? "Let's Get Started" : step === steps.length - 1 ? 'Build My Plan' : 'Continue'}
        <ChevronRight size={18} />
      </button>

      {step > 0 && (
        <button className="btn btn-outline" onClick={() => setStep(s => s - 1)} style={{ marginTop: 8 }}>
          Back
        </button>
      )}
    </div>
  );
}
