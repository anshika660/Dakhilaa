import { useState } from 'react';
import { supabase } from '../../lib/supabase';

import './Partner.css';

// Naam se referral code banao (RAHUL + 3 random chars)
function makeCode(name) {
  const base = (name || 'PARTNER').replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 6) || 'PARTNER';
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `${base}${rand}`;
}

export default function PartnerSection({ onBack, onLoginSuccess }) {
  const [mode, setMode] = useState('signup'); // signup | login
  const [form, setForm] = useState({
  name: '', email: '', password: '', phone: '', aadhaar: '', pan: '',
  platform: 'Instagram', handle: '', followers: '<10k',
});
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [code, setCode] = useState('');

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSignup = async () => {
    if (!form.name || !form.email || !form.password) {
      setErrorMsg('Please fill name, email, and password.');
      setStatus('error');
      return;
    }
    setStatus('loading');
    setErrorMsg('');
    try {
      const { error: authErr } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { full_name: form.name } },
      });
      if (authErr) throw new Error(authErr.message);

      const refCode = makeCode(form.name);
      const { error: pErr } = await supabase.from('partners').insert({
  name: form.name,
  email: form.email,
  phone: form.phone,
  aadhaar: form.aadhaar,
  pan: form.pan,
  platform: form.platform,
  handle: form.handle,
  followers: form.followers,
  referral_code: refCode,
  status: 'pending',
});
      if (pErr) throw new Error(pErr.message);

      setCode(refCode);
      setStatus('done');
    } catch (err) {
      setErrorMsg(err.message || 'Something went wrong.');
      setStatus('error');
    }
  };

  const handleLogin = async () => {
    if (!form.email || !form.password) {
      setErrorMsg('Please enter email and password.');
      setStatus('error');
      return;
    }
    setStatus('loading');
    setErrorMsg('');
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });
      if (error) throw new Error(error.message);
      // Login ke baad App.jsx khud partner detect karke dashboard dikhायega — reload
    //onLoginSuccess?.();
    } catch (err) {
      setErrorMsg(err.message || 'Login failed.');
      setStatus('error');
    }
  };

  // Signup ke baad success
  if (status === 'done') {
    return (
      <div className="partner-page">
        <button className="partner-back" onClick={onBack}>← Back to site</button>
        <div className="partner-inner partner-success">
          <div className="partner-eyebrow">Application Received ✅</div>
          <h2>Thanks for applying to the Dakhilaa Partner Program</h2>
          <p>
            Our team will review your application and reach out within 24–48 hours.
            Once approved, you'll get your referral code and dashboard access.
          </p>
          <button className="partner-btn" style={{ maxWidth: 240, margin: '20px auto 0' }} onClick={onBack}>
            Back to site
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="partner-page">
      <button className="partner-back" onClick={onBack}>← Back to site</button>
      <div className="partner-inner">
        <div className="partner-left">
          <div className="partner-eyebrow">Partner Program</div>
          <h2>Grow with Dakhilaa</h2>
          <p>
            Are you a JEE educator or influencer? Join the Dakhilaa Partner Program.
            Get your own referral code, share it with your audience, and track your
            earnings in a live dashboard.
          </p>
          <ul className="partner-perks">
            <li>✓ Instant referral code on signup</li>
            <li>✓ Live earnings dashboard</li>
            <li>✓ Real-time referral tracking</li>
            <li>✓ No cost to join</li>
          </ul>
        </div>

        <div className="partner-form">
          <div className="partner-tabs">
            <button
              className={mode === 'signup' ? 'active' : ''}
              onClick={() => { setMode('signup'); setStatus('idle'); setErrorMsg(''); }}
            >Sign Up</button>
            <button
              className={mode === 'login' ? 'active' : ''}
              onClick={() => { setMode('login'); setStatus('idle'); setErrorMsg(''); }}
            >Log In</button>
          </div>

         {mode === 'signup' ? (
  <>
    <input placeholder="Full name" value={form.name} onChange={update('name')} />
    <input placeholder="Email" type="email" value={form.email} onChange={update('email')} />
    <input placeholder="Create a password" type="password" value={form.password} onChange={update('password')} />
    <input placeholder="Phone Number" value={form.phone} onChange={update('phone')} />
<input placeholder="Aadhaar Number" value={form.aadhaar} onChange={update('aadhaar')} />
<input placeholder="PAN Number" value={form.pan} onChange={update('pan')} />
              <select value={form.platform} onChange={update('platform')}>
                <option>Instagram</option>
                <option>YouTube</option>
                <option>Telegram</option>
                <option>Other</option>
              </select>
              <input placeholder="Your handle (@username)" value={form.handle} onChange={update('handle')} />
              <select value={form.followers} onChange={update('followers')}>
                <option value="<10k">Under 10k followers</option>
                <option value="10k-50k">10k – 50k</option>
                <option value="50k-100k">50k – 100k</option>
                <option value="100k+">100k+</option>
              </select>

              {status === 'error' && <div className="partner-error">{errorMsg}</div>}
              <button className="partner-btn" onClick={handleSignup} disabled={status === 'loading'}>
                {status === 'loading' ? 'Creating…' : 'Join & Get My Code'}
              </button>
            </>
          ) : (
            <>
              <input placeholder="Email" type="email" value={form.email} onChange={update('email')} />
              <input placeholder="Password" type="password" value={form.password} onChange={update('password')} />

              {status === 'error' && <div className="partner-error">{errorMsg}</div>}
              <button className="partner-btn" onClick={handleLogin} disabled={status === 'loading'}>
                {status === 'loading' ? 'Logging in…' : 'Log In to Dashboard'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}