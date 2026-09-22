import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { supabase } from './lib/supabase';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import ResetPassword from './pages/ResetPassword';
import SupportBot from './components/SupportBot/SupportBot';
import Dashboard from './pages/Dashboard';
import PartnerSection from './components/Partner/PartnerSection';
import PartnerDashboard from './components/Partner/PartnerDashboard';

function AppRoutes() {
  const { user, loading } = useAuth();
  const [page, setPage] = useState(() => {
  if (window.location.pathname === '/partner') return 'partner';
  return sessionStorage.getItem('page') || 'landing';
});
  const [authMode, setAuthMode] = useState('signup');
  const [isPartner, setIsPartner] = useState(null); // null = checking
useEffect(() => {
  sessionStorage.setItem('page', page);
  if (page === 'partner') {
    window.history.replaceState({}, '', '/partner');
  } else if (window.location.pathname === '/partner') {
    window.history.replaceState({}, '', '/');
  }
}, [page]);
    // ?plan=test1 ko turant store karo (login flow mein URL lost ho jaata hai)
  useEffect(() => {
    const urlPlan = new URLSearchParams(window.location.search).get('plan');
    if (urlPlan === 'test1') {
      sessionStorage.setItem('selectedPlan', 'test1');
    }
  }, []);
  // User change ho to check karo partner hai ya nahi
    useEffect(() => {
    if (!user?.email) { setIsPartner(false); return; }
    let active = true;
    setIsPartner(null);
    supabase
      .from('partners')
      .select('id, status')
      .ilike('email', user.email)
      .order('status', { ascending: true })   // 'approved' aage aata hai
      .then(({ data, error }) => {
        if (!active) return;
        if (error) { setIsPartner(false); return; }
        // koi bhi row mili to partner maano (duplicate ho tab bhi crash nahi)
        setIsPartner(Array.isArray(data) && data.length > 0);
      });
    return () => { active = false; };
  }, [user]);

  // Back button — dashboard/auth se landing pe wapas
  useEffect(() => {
    window.history.pushState({ app: true }, '');
    const onPopState = () => {
      window.history.pushState({ app: true }, '');
      setPage((current) => {
        if (current === 'dashboard' || current === 'auth') return 'landing';
        return 'landing';
      });
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Password recovery link
  const isRecovery = window.location.hash.includes('type=recovery')
    || new URLSearchParams(window.location.search).get('type') === 'recovery';
  if (isRecovery) {
    return <ResetPassword onDone={() => {
      window.location.hash = '';
      window.history.replaceState({}, '', window.location.pathname);
      setPage('auth');
      setAuthMode('login');
    }} />;
  }

  if (loading) {
    return <div style={{ padding: 40, color: 'var(--light)' }}>Loading...</div>;
  }

  // DASHBOARD — logged-in AND dashboard chuna
  if (user && page === 'dashboard') {
    return <Dashboard
      onGoHome={() => setPage('landing')}
      onLoggedOut={() => {
        sessionStorage.removeItem('page');
        setPage('landing');
      }}
    />;
  }

  // AUTH
  if (!user && page === 'auth') {
    return (
      <Auth
        mode={authMode}
        onBack={() => setPage('landing')}
        onSwitchMode={() => setAuthMode(authMode === 'signup' ? 'login' : 'signup')}
      />
    );
  }
   // PARTNER page
  if (page === 'partner') {
    if (user) {
      if (isPartner === null) {
        return <div style={{ padding: 40, color: 'var(--light)' }}>Loading...</div>;
      }
      if (isPartner) {
        return <PartnerDashboard onLogout={() => { sessionStorage.removeItem('page'); setPage('landing'); }} />;
      }
    }
    return <PartnerSection
      onBack={() => setPage('landing')}
      onLoginSuccess={() => setPage('dashboard')}
    />;
  }
  // LANDING
  return (
    <Landing
      isLoggedIn={!!user}
      onGetStarted={() => {
        if (user) {
          setPage('dashboard');
        } else {
          setAuthMode('signup');
          setPage('auth');
        }
      }}
      onGoToDashboard={() => setPage('dashboard')}
      onBecomePartner={() => setPage('partner')}
    />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
      <SupportBot />
    </AuthProvider>
  );
}