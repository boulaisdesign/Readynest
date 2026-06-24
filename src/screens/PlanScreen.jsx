import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ArrowLeft, ChevronRight, Shield, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import * as Icons from 'lucide-react';

export default function PlanScreen() {
  const navigate = useNavigate();
  const { scenarioCards, emergencyPlans, family } = useApp();

  return (
    <div className="screen">
      <div className="screen-header">
        <h1>Emergency Plans</h1>
      </div>

      <p style={{ marginBottom: 20 }}>
        Tap a scenario to see your family's personalized action plan.
      </p>

      <div className="section-title">Scenarios</div>
      {scenarioCards.map(card => {
        const Icon = Icons[card.icon] || Shield;
        return (
          <div key={card.id} className="scenario-card" style={{ borderLeftColor: card.color }}
            onClick={() => navigate(`/scenario/${card.id}`)}>
            <div className="sc-icon" style={{ background: card.color + '20' }}>
              <Icon size={22} color={card.color} />
            </div>
            <h3 style={{ flex: 1 }}>{card.title}</h3>
            <ChevronRight size={18} color="var(--gray-400)" />
          </div>
        );
      })}

      <div className="section-title">Risk-Based Plans</div>
      {emergencyPlans.map(plan => (
        <div key={plan.id} className="scenario-card" style={{ borderLeftColor: 'var(--navy)' }}
          onClick={() => navigate(`/plan/${plan.scenario.toLowerCase()}`)}>
          <div className="sc-icon" style={{ background: 'var(--navy)' + '15' }}>
            <AlertTriangle size={22} color="var(--navy)" />
          </div>
          <h3 style={{ flex: 1 }}>{plan.scenario} Plan</h3>
          <ChevronRight size={18} color="var(--gray-400)" />
        </div>
      ))}
    </div>
  );
}

export function PlanDetail() {
  const navigate = useNavigate();
  const { type } = useParams();
  const { emergencyPlans } = useApp();

  const plan = emergencyPlans.find(p => p.scenario.toLowerCase() === type);
  if (!plan) return <div className="screen"><p>Plan not found</p></div>;

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="back-btn" onClick={() => navigate(-1)}><ArrowLeft size={24} /></button>
        <h1>{plan.scenario} Plan</h1>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 20 }}>
        {plan.relatedPeople.map(p => <span key={p} className="member-chip">{p}</span>)}
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Clock size={18} color="var(--navy)" />
          <h3>Before an Emergency</h3>
        </div>
        <ul className="step-list">
          {plan.beforeSteps.map((s, i) => <li key={i}>{s}</li>)}
        </ul>
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <AlertTriangle size={18} color="var(--orange)" />
          <h3 style={{ color: 'var(--orange)' }}>During an Emergency</h3>
        </div>
        <ul className="step-list">
          {plan.duringSteps.map((s, i) => <li key={i}>{s}</li>)}
        </ul>
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <CheckCircle2 size={18} color="var(--green)" />
          <h3 style={{ color: 'var(--green)' }}>After an Emergency</h3>
        </div>
        <ul className="step-list">
          {plan.afterSteps.map((s, i) => <li key={i}>{s}</li>)}
        </ul>
      </div>

      <div style={{ marginTop: 16 }}>
        <p className="section-title">Related Places</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {plan.relatedPlaces.map(p => <span key={p} className="member-chip">{p}</span>)}
        </div>
      </div>
    </div>
  );
}

export function ScenarioDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { scenarioCards } = useApp();
  const card = scenarioCards.find(c => c.id === id);
  if (!card) return <div className="screen"><p>Scenario not found</p></div>;

  const Icon = Icons[card.icon] || Shield;

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="back-btn" onClick={() => navigate(-1)}><ArrowLeft size={24} /></button>
        <h1 style={{ fontSize: 20 }}>{card.title}</h1>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: card.color + '20', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
          <Icon size={32} color={card.color} />
        </div>
        <p>Here's what your family should do in this situation.</p>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 12 }}>Step-by-Step Plan</h3>
        <ul className="step-list">
          {card.steps.map((s, i) => <li key={i}>{s}</li>)}
        </ul>
      </div>

      <button className="btn btn-primary" onClick={() => navigate('/emergency')} style={{ marginTop: 16 }}>
        <AlertTriangle size={18} />
        Open Emergency Mode
      </button>
    </div>
  );
}
