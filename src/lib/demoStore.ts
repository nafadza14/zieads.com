import { useState, useEffect } from 'react';

const DEMO_MODE_KEY = 'zieads_demo_mode_active';
const ONBOARDING_KEY = 'zieads_onboarding_completed';

export function getDemoModeActive(): boolean {
  return localStorage.getItem(DEMO_MODE_KEY) === 'true';
}

export function setDemoModeActive(active: boolean) {
  localStorage.setItem(DEMO_MODE_KEY, active ? 'true' : 'false');
  window.dispatchEvent(new Event('zieads_demo_change'));
}

export function useDemoMode() {
  const [active, setActive] = useState(getDemoModeActive());

  useEffect(() => {
    const handleDemoChange = () => {
      setActive(getDemoModeActive());
    };
    window.addEventListener('zieads_demo_change', handleDemoChange);
    return () => window.removeEventListener('zieads_demo_change', handleDemoChange);
  }, []);

  return {
    isActive: active,
    setDemoMode: (val: boolean) => {
      setDemoModeActive(val);
      setActive(val);
    }
  };
}
