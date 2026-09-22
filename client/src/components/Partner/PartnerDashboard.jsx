import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import './PartnerDashboardPro.css';

export default function PartnerDashboard({ onLogout }) {
  const { user, signOut } = useAuth();
  const [partner, setPartner] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [section, setSection] = useState('dashboard'); // dashboard | referrals | payouts | profile | support

  useEffect(() => {
    const load = async () => {
      if (!user?.email) { setLoading(false); return; }
      const { data: pList } = await supabase
        .from('partners')
        .select('*')
        .ilike('email', user.email)
        .order('status', { ascending: true });
      const p = Array.isArray(pList) && pList.length > 0 ? pList[0] : null;
      if (p && p.status === 'approved' && p.referral_code) {
        setPartner(p);
        const { data: refs } = await supabase
          .from('referrals')
          .select('*')
          .eq('referral_code', p.referral_code)
          .order('created_at', { ascending: false });
        setReferrals(refs || []);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const copyLink = () => {
    const link = `https://dakhilaa.com/ref/${partner.referral_code}`;
    navigator.clipboard?.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="pd2-loading">Loading…</div>;

  if (!partner) {
    return (
      <div className="pd2-body">
        <div className="pd2-main pd2-main-full">
          <div className="pd2-card pd2-empty-card">
            Your partner application is under review. You'll get dashboard access once approved.
            <button className="pd2-btn" style={{ marginTop: 20, maxWidth: 220 }} onClick={onLogout}>
              Back to site
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---- Real numbers (paise stored → rupees) ----
  const commissionRate = 0.20;
  const paidConversions = referrals.length;
  const revenue = referrals.reduce((s, r) => s + (r.amount || 0), 0) / 100;
  const earnings = referrals.reduce((s, r) => s + (r.commission || 0), 0) / 100;

  const now = new Date();
  const thisMonthRefs = referrals.filter((r) => {
    const d = new Date(r.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const currentMonthEarnings = thisMonthRefs.reduce((s, r) => s + (r.commission || 0), 0) / 100;

  const nextPayout = new Date(now.getFullYear(), now.getMonth() + 1, 5);
  const nextPayoutStr = nextPayout.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const monthlyMap = {};
  referrals.forEach((r) => {
    const d = new Date(r.created_at);
    const key = d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
    if (!monthlyMap[key]) monthlyMap[key] = { revenue: 0, commission: 0 };
    monthlyMap[key].revenue += (r.amount || 0) / 100;
    monthlyMap[key].commission += (r.commission || 0) / 100;
  });
  const monthlyRows = Object.entries(monthlyMap).slice(0, 12);

  const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  // reusable blocks
  const statCards = (
    <div className="pd2-cards">
      <div className="pd2-card"><div>Total Revenue</div><div className="pd2-value">₹{revenue.toLocaleString('en-IN')}</div></div>
      <div className="pd2-card"><div>Partner Earnings ({(commissionRate*100).toFixed(0)}%)</div><div className="pd2-value">₹{earnings.toLocaleString('en-IN')}</div></div>
      <div className="pd2-card"><div>Referred Students</div><div className="pd2-value">{paidConversions}</div></div>
      <div className="pd2-card"><div>Conversions</div><div className="pd2-value">{paidConversions}</div></div>
      <div className="pd2-card"><div>Current Month Earnings</div><div className="pd2-value">₹{currentMonthEarnings.toLocaleString('en-IN')}</div></div>
      <div className="pd2-card"><div>Pending Payout</div><div className="pd2-value">₹{currentMonthEarnings.toLocaleString('en-IN')}</div></div>
      <div className="pd2-card"><div>Last Payout</div><div className="pd2-value">—</div><small>Not yet paid</small></div>
      <div className="pd2-card"><div>Next Payout Date</div><div className="pd2-value">{nextPayoutStr}</div></div>
    </div>
  );

  const referralCard = (
    <div className="pd2-card">
      <h2>Referral Details</h2>
      <div className="pd2-linkbox">https://dakhilaa.com/ref/{partner.referral_code}</div>
      <button className="pd2-btn" onClick={copyLink}>{copied ? '✓ Copied' : 'Copy Referral Link'}</button>
      <p><b>Referral Code:</b> {partner.referral_code}</p>
    </div>
  );

  const profileCard = (
    <div className="pd2-card">
      <h2>Partner Profile</h2>
      <p><b>Name:</b> {partner.name}</p>
      <p><b>Email:</b> {partner.email}</p>
      <p><b>Phone:</b> {partner.phone || '—'}</p>
      <p><b>Platform:</b> {partner.platform || '—'}</p>
      <p><b>Handle:</b> {partner.handle || '—'}</p>
      <p><b>Followers:</b> {partner.followers || '—'}</p>
      <p><b>Status:</b> <span className="pd2-badge">Approved</span></p>
    </div>
  );

  const monthlyCard = (
    <div className="pd2-card">
      <h2>Monthly Earnings & Payout History</h2>
      {monthlyRows.length === 0 ? (
        <p className="pd2-muted">No referrals yet — this table fills in as students sign up through your link.</p>
      ) : (
        <table>
          <tbody>
            <tr><th>Month</th><th>Revenue</th><th>Commission</th><th>Status</th></tr>
            {monthlyRows.map(([month, vals]) => (
              <tr key={month}>
                <td>{month}</td>
                <td>₹{vals.revenue.toLocaleString('en-IN')}</td>
                <td>₹{vals.commission.toLocaleString('en-IN')}</td>
                <td>Pending</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  const commissionCard = (
    <div className="pd2-card">
      <h2>Commission Logic</h2>
      <p>Every successful student purchase through your referral link automatically updates revenue.</p>
      <p><b>Commission = Total Revenue × {(commissionRate*100).toFixed(0)}%</b></p>
      <p>Payouts are released monthly on the 5th of the following month.</p>
    </div>
  );

  // ---- Dashboard = everything on one page (bhara-bhara) ----
  const renderDashboard = () => (
    <>
      {statCards}
      {referralCard}
      {profileCard}
      {monthlyCard}
      {commissionCard}
    </>
  );

  const renderReferrals = () => (
    <div className="pd2-card">
      <h2>Your Referrals ({referrals.length})</h2>
      {referrals.length === 0 ? (
        <p className="pd2-muted">No referrals yet — this fills in as students buy a plan through your link.</p>
      ) : (
        <table>
          <tbody>
            <tr><th>Date</th><th>Plan</th><th>Amount</th><th>Your Commission</th></tr>
            {referrals.map((r) => (
              <tr key={r.id}>
                <td>{fmtDate(r.created_at)}</td>
                <td>{r.plan || '—'}</td>
                <td>₹{((r.amount || 0)/100).toLocaleString('en-IN')}</td>
                <td>₹{((r.commission || 0)/100).toLocaleString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  const renderPayouts = () => (
    <>
      <div className="pd2-cards">
        <div className="pd2-card"><div>Pending Payout</div><div className="pd2-value">₹{currentMonthEarnings.toLocaleString('en-IN')}</div></div>
        <div className="pd2-card"><div>Total Earned</div><div className="pd2-value">₹{earnings.toLocaleString('en-IN')}</div></div>
        <div className="pd2-card"><div>Next Payout Date</div><div className="pd2-value">{nextPayoutStr}</div></div>
        <div className="pd2-card"><div>Last Payout</div><div className="pd2-value">—</div><small>Not yet paid</small></div>
      </div>
      {monthlyCard}
      <div className="pd2-card">
        <h2>How Payouts Work</h2>
        <p>Payouts are released monthly on the 5th of the following month.</p>
        <p>Your earned commission accumulates here and is paid to your registered account.</p>
      </div>
    </>
  );

  const renderProfile = () => profileCard;

  const renderSupport = () => (
    <div className="pd2-card">
      <h2>Support</h2>
      <p>Need help with your partner account, referrals, or payouts?</p>
      <p><b>Email:</b> Support@dakhilaa.com</p>
      <p>We usually respond within 24–48 hours.</p>
    </div>
  );

  const titles = {
    dashboard: 'Partner Dashboard',
    referrals: 'Referrals',
    payouts: 'Payouts',
    profile: 'Profile',
    support: 'Support',
  };

  return (
    <div className="pd2-wrap">
      <div className="pd2-sidebar">
        <div className="pd2-logo">DAKHILAA</div>
        <hr />
        {['dashboard', 'referrals', 'payouts', 'profile', 'support'].map((s) => (
          <p key={s} className={`pd2-nav-item ${section === s ? 'active' : ''}`} onClick={() => setSection(s)}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </p>
        ))}
        <hr />
        <p className="pd2-nav-item" onClick={() => { signOut(); onLogout?.(); }}>Logout</p>
      </div>

      <div className="pd2-main">
        <h1>{titles[section]}</h1>
        {section === 'dashboard' && renderDashboard()}
        {section === 'referrals' && renderReferrals()}
        {section === 'payouts' && renderPayouts()}
        {section === 'profile' && renderProfile()}
        {section === 'support' && renderSupport()}
      </div>
    </div>
  );
}
