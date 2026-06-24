import { createContext, useContext, useState } from 'react';
import { sampleFamily, kitItems as defaultKitItems, scenarioCards, emergencyPlans } from '../data/mockData';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [onboardingComplete, setOnboardingComplete] = useState(true);
  const [family, setFamily] = useState(sampleFamily);
  const [kitItems, setKitItems] = useState(defaultKitItems);

  const toggleKitItem = (id) => {
    setKitItems(prev => prev.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const toggleReminder = (id) => {
    setFamily(prev => ({
      ...prev,
      reminders: prev.reminders.map(r =>
        r.id === id ? { ...r, completed: !r.completed } : r
      ),
    }));
  };

  const checkedCount = kitItems.filter(i => i.checked).length;
  const totalKit = kitItems.length;

  const contactsAdded = family.contacts.length > 0;
  const meetingPlacesSet = !!family.reunification.primaryMeetingPlace;
  const schoolDaycareComplete = family.places.some(p => p.type === 'daycare' || p.type === 'school');
  const workLocationsAdded = family.places.some(p => p.type === 'work');
  const planCompleted = emergencyPlans.length > 0;

  const readinessFactors = [planCompleted, contactsAdded, meetingPlacesSet, (checkedCount / totalKit) > 0.5, schoolDaycareComplete, workLocationsAdded];
  const readinessScore = Math.round((readinessFactors.filter(Boolean).length / readinessFactors.length) * 100);

  const addMember = (member) => {
    setFamily(prev => ({ ...prev, members: [...prev.members, { ...member, id: 'm' + Date.now() }] }));
  };

  const addPlace = (place) => {
    setFamily(prev => ({ ...prev, places: [...prev.places, { ...place, id: 'pl' + Date.now() }] }));
  };

  const addPet = (pet) => {
    setFamily(prev => ({ ...prev, pets: [...prev.pets, { ...pet, id: 'p' + Date.now() }] }));
  };

  const addContact = (contact) => {
    setFamily(prev => ({ ...prev, contacts: [...prev.contacts, { ...contact, id: 'c' + Date.now() }] }));
  };

  const updateOnboarding = (data) => {
    setFamily(prev => ({ ...prev, ...data }));
  };

  return (
    <AppContext.Provider value={{
      onboardingComplete, setOnboardingComplete,
      family, setFamily, updateOnboarding,
      kitItems, toggleKitItem,
      scenarioCards, emergencyPlans,
      readinessScore, checkedCount, totalKit,
      toggleReminder,
      addMember, addPlace, addPet, addContact,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
