import { useState, useEffect } from 'react';
import { planData } from '../data/planData';
import useProfile from '../hooks/useProfile';
import useStats from '../hooks/useStats';
import Sidebar from '../components/Sidebar/Sidebar';
import Header from '../components/Header/Header';
import Overview from '../components/Overview/Overview';
import QuestionBank from '../components/QuestionBank/QuestionBank';
import MockTestHub from '../components/MockTest/MockTestHub';
import WeakTopics from '../components/WeakTopics/WeakTopics';
import Progress from '../components/Progress/Progress';
import CollegePredictor from '../components/CollegePredictor/CollegePredictor';
import RazorpayModal from '../components/Common/RazorpayModal';
import Diagnostic from './Diagnostic';
import FlexibleSchedule from '../components/FlexibleSchedule/FlexibleSchedule';
import AIPlanner from '../components/AIPlanner/AIPlanner';
import PrioritySupport from '../components/SupportBot/PrioritySupport';
import PlanChooser from '../components/PlanChooser/PlanChooser';
import MyTests from '../components/MyTests/MyTests';
import FeedbackModal from '../components/Feedback/FeedbackModal';
import LiveTestArena from '../components/LiveTestArena/LiveTestArena';
import './Dashboard.css';
export default function Dashboard({ onGoHome, onLoggedOut }) {
  const { profile, loading } = useProfile();
  const { stats, loading: statsLoading } = useStats();
  const [section, setSection] = useState('overview');
  const [modal, setModal] = useState(null);
  const [chooserOpen, setChooserOpen] = useState(false);
  const [testOpen, setTestOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
       useEffect(() => {
    const urlPlan = new URLSearchParams(window.location.search).get('plan');
    if (urlPlan === 'test1') {
      setModal({ plan: 'test1' });
      return;
    }
    const chosen = sessionStorage.getItem('selectedPlan');
    if (chosen) {
      sessionStorage.removeItem('selectedPlan');
      setModal({ plan: chosen });
    }
  }, []);

  if (loading || statsLoading) {
    return <div style={{ padding: 40, color: 'var(--light)' }}>Loading…</div>;
  }

  if (testOpen) {
    return (
      <Diagnostic
        onExit={() => setTestOpen(false)}
        onDone={() => { setTestOpen(false); window.location.reload(); }}
        key={testOpen ? 'test' : 'closed'}
      />
    );
  }

  const plan = profile?.plan && planData[profile.plan] ? profile.plan : 'free';
  const planInfo = planData[plan];
  const firstName = profile?.full_name?.split(' ')[0] || 'there';
  const isPaid = plan !== 'free';

  const navigate = (id) => {
    if (id === 'daily') { setTestOpen(true); return; }
    setSection(id);
    window.scrollTo(0, 0);
  };

  // Andar se upgrade — pehle plan chooser kholo
  const openPaywall = () => setChooserOpen(true);

  // Chooser se plan chuna — ab us plan ka payment kholo
  const handleChoosePlan = (planKey) => {
    setChooserOpen(false);
    setModal({ plan: planKey });
  };

  // Which section to render in the main area
  const renderSection = () => {
    if (section === 'overview') {
      return <Overview planInfo={planInfo} plan={plan} stats={stats} onNavigate={navigate} />;
    }

    if (section === 'practice') {
      // Question Bank is a paid feature — free users see a prompt
      if (!isPaid) {
        return (
          <div className="panel-card">
            <div className="section-title">Question Bank is a premium feature</div>
            <p style={{ fontSize: 13, color: 'var(--light)', marginBottom: 16 }}>
              Unlock the full question bank with any paid plan.
            </p>
            <button
              className="header-btn header-btn-primary"
              onClick={() => openPaywall('bundle')}
            >
              Upgrade to unlock →
            </button>
          </div>
        );
      }
      return <QuestionBank />;
    }
    if (section === 'mocks') {
    // Mock Test is a paid feature — free users see paywall
    if (!isPaid) {
      return (
        <div className="panel-card">
          <div className="section-title">Mock / Chapter Tests</div>
          <p style={{ fontSize: 13, color: 'var(--light)' }}>
            Unlock full JEE Main pattern mock tests with any paid plan.
          </p>
          <button
            className="header-btn header-btn-primary"
           onClick={() => openPaywall('bundle')}
          >
            Upgrade to unlock →
          </button>
        </div>
      );
    }
   return <MockTestHub />;
  }

   if (section === 'weak') {
      return <WeakTopics onNavigate={navigate} />;
    }

    if (section === 'planner') {
      if (!isPaid) {
        return (
          <div className="panel-card">
            <div className="section-title">AI Planner is a premium feature</div>
            <p style={{ fontSize: 13, color: 'var(--light)', marginBottom: 16 }}>
              Your AI study buddy — weak-topic fixes, study plans and motivation.
              Unlock it with any paid plan.
            </p>
            <button
              className="header-btn header-btn-primary"
                           onClick={() => openPaywall()}
            >
              Upgrade to unlock →
            </button>
          </div>
        );
      }
      return <AIPlanner />;
    }
   if (section === 'cbt') {
  return <LiveTestArena />;
}
if (section === 'support') {
  return <PrioritySupport />;
}
if (section === 'schedule') {
  return <FlexibleSchedule />;
}
    if (section === 'progress') {
      return <Progress />;
    }
        if (section === 'mytests') {
      return <MyTests />;
    }
    if (section === 'predictor') {
      return <CollegePredictor />;
    }

    // everything else — still being built
    return (
      <div className="panel-card">
        <div className="section-title">Coming soon</div>
        <p style={{ fontSize: 12, color: 'var(--light)' }}>
          This section is being built.
        </p>
      </div>
    );
  };

  return (
    <>
      <Sidebar
        profile={profile}
        planInfo={planInfo}
        activeSection={section}
        onNavigate={navigate}
        onPaywall={openPaywall}
        onGoHome={onGoHome}
        onFeedback={() => setFeedbackOpen(true)}
      />

      <div className="main-content">
        <Header planInfo={planInfo} firstName={firstName} onNavigate={navigate} />
        {renderSection()}
      </div>

      <footer>© 2026 Dakhilaa. All rights reserved.</footer>
      {chooserOpen && (
        <PlanChooser onChoose={handleChoosePlan} onClose={() => setChooserOpen(false)} />
      )}

      {modal && <RazorpayModal {...modal} onClose={() => setModal(null)} />}
        {feedbackOpen && (
  <FeedbackModal profile={profile} onClose={() => setFeedbackOpen(false)} />
)}
    </>
  );
}
