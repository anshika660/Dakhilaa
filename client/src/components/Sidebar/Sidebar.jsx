import { useState } from 'react';
import { NAV_ITEMS } from '../../data/planData';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

export default function Sidebar({ profile, planInfo, activeSection, onNavigate, onPaywall, onFeedback }) {
  const { signOut } = useAuth();
  const [open, setOpen] = useState(false);

  const fullName = profile?.full_name || 'Student';
  const initials = fullName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  const handleClick = (item) => {
    if (item.id === 'planner' && planInfo.plannerLocked) {
      onPaywall('Upgrade to Bundle', 1099);
      setOpen(false);
      return;
    }
    onNavigate(item.id);
    setOpen(false);   // mobile pe click ke baad sidebar band ho
  };

  return (
    <>
      {/* Hamburger — sirf mobile pe dikhega */}
      <button className="sidebar-toggle" onClick={() => setOpen(!open)}>
        {open ? '✕' : '☰'}
      </button>

      <div className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-logo"><span>◆</span>Dakhilaa</div>

        <div className="nav-menu">
          {NAV_ITEMS.map((item, i) => {
            if (item.divider) return <div className="sidebar-divider" key={`div-${i}`} />;
            const locked = item.lockable && planInfo.plannerLocked;
            const cls = ['nav-item', activeSection === item.id ? 'active' : '', locked ? 'locked' : '']
              .filter(Boolean).join(' ');
            return (
              <div className={cls} key={item.id} onClick={() => handleClick(item)}>
                <span>{item.icon}</span>{item.label}
                {locked && <span className="lock-tag">Pro</span>}
              </div>
            );
          })}
                  <div className="nav-item" onClick={onFeedback}>
            <span>⭐</span>Rate Us
          </div>
        </div>

        <div className="sidebar-divider" />
        <div className="profile-card">
          <div className="profile-avatar">{initials}</div>
          <div className="profile-name">{fullName}</div>
          <div className="profile-plan">{planInfo.sidebarText}</div>
          <button className="upgrade-btn" onClick={() => onPaywall('Upgrade to Bundle', 1099)}>
            🚀 Upgrade
          </button>
          <button className="upgrade-btn" onClick={onFeedback} style={{ marginTop: 8, background: '#232a3d' }}>
            ⭐ Rate Us
          </button>
          <button className="logout-btn" onClick={() => { if (confirm('Logout?')) signOut(); }}>
            Logout
          </button>
        </div>
      </div>

      {/* Overlay — sidebar khula ho to background dark, click pe band */}
      <div className="sidebar-overlay" onClick={() => setOpen(false)} />
    </>
  );
}