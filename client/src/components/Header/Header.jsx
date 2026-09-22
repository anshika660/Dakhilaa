import './Header.css';

export default function Header({ planInfo, firstName, onNavigate }) {
  return (
    <>
      <div className="dashboard-header">
        <div className="header-left">
          <h1>Welcome, {firstName}! 👋</h1>
          <p>Track, practice and dominate your JEE preparation journey.</p>
        </div>
        <div className="header-right">
          <button className="header-btn header-btn-ghost" onClick={() => onNavigate('settings')}>
            ⚙️ Settings
          </button>
          <button className="header-btn header-btn-primary" onClick={() => onNavigate('daily')}>
            Start Daily Practice
          </button>
        </div>
      </div>

      <div className={`subscription-banner ${planInfo.bannerClass}`}>
        <div className="plan-badge">{planInfo.badge}</div>
        <h2>{planInfo.title}</h2>
        <p>{planInfo.desc}</p>
      </div>
    </>
  );
}