import Stats from '../Stats/Stats';
import './Overview.css';

export default function Overview({ planInfo, plan, stats, onNavigate }) {
  const hasAttempt = !!stats;

  return (
    <section className="view-section">
      {!hasAttempt ? (
        <div className="weakness-alert-banner">
          <div className="weakness-text">
            <span className="paywall-badge">Get Started</span>
            <h3>Take your free diagnostic test</h3>
            <p>15 minutes to find out exactly which topics are costing you the most marks.</p>
          </div>
          <button className="header-btn header-btn-primary" onClick={() => onNavigate('daily')}>
            Start Diagnostic →
          </button>
        </div>
      ) : stats.weakTopics.length > 0 ? (
        <div className="weakness-alert-banner">
          <div className="weakness-text">
            <span className="paywall-badge">Your Weak Areas</span>
            <h3>
              Focus on {stats.weakTopics.slice(0, 2).map(w => w.topic).join(' and ')}
            </h3>
            <p>Your accuracy in these topics is below 60%. Fixing them gives the fastest score gain.</p>
          </div>
          <button className="header-btn header-btn-primary" onClick={() => onNavigate('daily')}>
            Retake Test
          </button>
        </div>
      ) : null}

      <Stats stats={stats} />

      {hasAttempt && stats.weakTopics.length > 0 && (
        <>
          <div className="section-title">Topics to work on</div>
          <div className="section-subtitle">Based on your latest diagnostic</div>
          <div className="benefits-grid">
            {stats.weakTopics.slice(0, 4).map(w => (
              <div className="benefit-card" key={`${w.subject}-${w.topic}`}>
                <div className="benefit-icon">🎯</div>
                <div className="benefit-title">{w.topic}</div>
                <div className="benefit-desc">{w.subject} · {w.accuracy}% accuracy</div>
                <span className="benefit-badge">Needs work</span>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="section-title">Your Plan Benefits</div>
      <div className="section-subtitle">Everything included in your active plan</div>
      <div className="benefits-grid">
        {planInfo.benefits.map(([icon, title, desc, badge]) => {
          // title ke hisaab se decide karo click pe kahan jaana hai
                 const t = title.toLowerCase();
          let target = null;
          if (t.includes('question')) target = 'practice';           // Question Bank
          else if (t.includes('mock')) target = 'mocks';             // Mock Tests
          else if (t.includes('daily') || t.includes('diagnostic')) target = 'daily';  // Daily Practice
          else if (t.includes('planner') || t.includes('ai study')) target = 'planner'; // AI Planner
          else if (t.includes('analytics') || t.includes('progress')) target = 'progress'; // Progress
          else if (t.includes('predictor')) target = 'predictor';    // College Predictor
          else if (t.includes('weak')) target = 'weak';              // Weak Topics
          else if (t.includes('flexible') || t.includes('schedule')) target = 'schedule'; // Flexible Schedule
            else if (t.includes('priority') || t.includes('support')) target = 'support';
          else target = null;

                  return (
            <div
              className={`benefit-card ${target ? 'benefit-clickable' : ''}`}
              key={title}
              onClick={() => target && onNavigate(target)}
            >
              <div className="benefit-icon">{icon}</div>
              <div className="benefit-title">{title}</div>
              <div className="benefit-desc">{desc}</div>
              <span className="benefit-badge">{badge}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}