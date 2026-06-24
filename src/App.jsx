import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { Home, Shield, Package, MapPin, User, AlertTriangle } from 'lucide-react';
import Dashboard from './screens/Dashboard';
import Onboarding from './screens/Onboarding';
import PlanScreen, { PlanDetail, ScenarioDetail } from './screens/PlanScreen';
import KitScreen, { KitItemDetail } from './screens/KitScreen';
import PlacesScreen from './screens/PlacesScreen';
import ProfileScreen from './screens/ProfileScreen';
import ContactsScreen from './screens/ContactsScreen';
import RiskScreen from './screens/RiskScreen';
import EmergencyMode from './screens/EmergencyMode';

function TabBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  if (path === '/emergency' || path === '/onboarding') return null;

  const tabs = [
    { label: 'Home', icon: Home, path: '/' },
    { label: 'Plan', icon: Shield, path: '/plan' },
    { label: 'Kit', icon: Package, path: '/kit' },
    { label: 'Places', icon: MapPin, path: '/places' },
    { label: 'Profile', icon: User, path: '/profile' },
  ];

  return (
    <nav className="tab-bar">
      {tabs.map(tab => {
        const active = path === tab.path || (tab.path !== '/' && path.startsWith(tab.path));
        return (
          <button key={tab.label} className={`tab-item ${active ? 'active' : ''}`} onClick={() => navigate(tab.path)}>
            <tab.icon size={22} />
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}

function EmergencyFAB() {
  const navigate = useNavigate();
  const location = useLocation();
  if (location.pathname === '/emergency' || location.pathname === '/onboarding') return null;
  return (
    <button className="emergency-fab" onClick={() => navigate('/emergency')} title="Emergency Mode">
      <AlertTriangle size={22} />
    </button>
  );
}

function AppContent() {
  const { onboardingComplete } = useApp();

  return (
    <>
      <EmergencyFAB />
      <div className="app-container">
        <Routes>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/" element={onboardingComplete ? <Dashboard /> : <Onboarding />} />
          <Route path="/plan" element={<PlanScreen />} />
          <Route path="/plan/:type" element={<PlanDetail />} />
          <Route path="/scenario/:id" element={<ScenarioDetail />} />
          <Route path="/kit" element={<KitScreen />} />
          <Route path="/kit/:id" element={<KitItemDetail />} />
          <Route path="/places" element={<PlacesScreen />} />
          <Route path="/profile" element={<ProfileScreen />} />
          <Route path="/contacts" element={<ContactsScreen />} />
          <Route path="/risks" element={<RiskScreen />} />
          <Route path="/emergency" element={<EmergencyMode />} />
        </Routes>
      </div>
      <TabBar />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </BrowserRouter>
  );
}
