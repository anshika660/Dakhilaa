import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import './Auth.css';

export default function Auth({ mode = 'signup', onBack, onSwitchMode }) {
  const { signUp, signIn } = useAuth();
  const isSignup = mode === 'signup';

  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);   // show "check your email" screen
  const [showReset, setShowReset] = useState(false);     // show forgot-password screen
  const [resetSent, setResetSent] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    if (isSignup && form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setBusy(true);
    const { error } = isSignup
      ? await signUp(form)
      : await signIn({ email: form.email, password: form.password });
    setBusy(false);

    if (error) {
      setError(error.message);
      return;
    }

    // On signup success: email confirmation is ON, so show "check your email" instead
    // of expecting an instant login.
    if (isSignup) {
      setCheckEmail(true);
    }
    // On sign-in success: AuthContext sets the user and the app moves on.
  };

  const sendReset = async (e) => {
    e.preventDefault();
    setError('');
    if (!resetEmail) {
      setError('Please enter your email.');
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) setError(error.message);
    else setResetSent(true);
  };

  // ---------- "Check your email" screen (after signup) ----------
  if (checkEmail) {
    return (
      <div className="auth-page">
        <button className="auth-back" onClick={onBack}>← Back</button>
        <div className="auth-card">
          <div className="sidebar-logo auth-logo"><span>◆</span>Dakhilaa</div>
          <div className="auth-icon-big">✉️</div>
          <h1>Check your email</h1>
          <p className="auth-sub">
            We've sent a confirmation link to <strong>{form.email}</strong>.
            Please open it and click <strong>Confirm email address</strong> to activate your account.
          </p>
          <p className="auth-note" style={{ marginTop: 16 }}>
            Can't find it? Check your spam or promotions folder.
          </p>
          <button
            className="header-btn header-btn-primary auth-submit"
            onClick={() => { setCheckEmail(false); if (isSignup) onSwitchMode(); }}
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  // ---------- Forgot password screen ----------
  if (showReset) {
    return (
      <div className="auth-page">
        <button className="auth-back" onClick={() => { setShowReset(false); setResetSent(false); setError(''); }}>← Back</button>
        <div className="auth-card">
          <div className="sidebar-logo auth-logo"><span>◆</span>Dakhilaa</div>
          {resetSent ? (
            <>
              <div className="auth-icon-big">✉️</div>
              <h1>Reset link sent</h1>
              <p className="auth-sub">
                If an account exists for <strong>{resetEmail}</strong>, we've sent a
                password reset link. Check your email (and spam folder).
              </p>
              <button className="header-btn header-btn-primary auth-submit"
                      onClick={() => { setShowReset(false); setResetSent(false); }}>
                Back to Sign In
              </button>
            </>
          ) : (
            <>
              <h1>Reset your password</h1>
              <p className="auth-sub">Enter your email and we'll send you a reset link.</p>
              <form onSubmit={sendReset}>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" className="form-control" value={resetEmail}
                         onChange={(e) => setResetEmail(e.target.value)}
                         placeholder="you@example.com" required />
                </div>
                {error && <div className="auth-error">{error}</div>}
                <button type="submit" className="header-btn header-btn-primary auth-submit" disabled={busy}>
                  {busy ? 'Please wait…' : 'Send reset link'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    );
  }

  // ---------- Normal signup / signin screen ----------
  return (
    <div className="auth-page">
      <button className="auth-back" onClick={onBack}>← Back</button>

      <div className="auth-card">
        <div className="sidebar-logo auth-logo"><span>◆</span>Dakhilaa</div>

        <h1>{isSignup ? 'Get Started' : 'Welcome back'}</h1>
        <p className="auth-sub">
          {isSignup
            ? 'Create your account and take the free diagnostic test.'
            : 'Sign in to continue your preparation.'}
        </p>

        <form onSubmit={submit}>
          {isSignup && (
            <div className="form-group">
              <label>Full Name</label>
              <input className="form-control" value={form.fullName}
                     onChange={set('fullName')} placeholder="Your name" required />
            </div>
          )}

          <div className="form-group">
            <label>Email</label>
            <input type="email" className="form-control" value={form.email}
                   onChange={set('email')} placeholder="you@example.com" required />
          </div>

          {isSignup && (
            <div className="form-group">
              <label>Phone Number (WhatsApp)</label>
              <input type="tel" className="form-control" value={form.phone}
                     onChange={set('phone')} placeholder="10-digit number" required />
            </div>
          )}

          <div className="form-group">
            <label>Password</label>
            <input type="password" className="form-control" value={form.password}
                   onChange={set('password')}
                   placeholder={isSignup ? 'At least 6 characters' : 'Your password'} required />
          </div>

          {/* Forgot password link — only on sign-in */}
          {!isSignup && (
            <div className="auth-forgot">
              <button type="button" onClick={() => { setShowReset(true); setResetEmail(form.email); setError(''); }}>
                Forgot password?
              </button>
            </div>
          )}

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="header-btn header-btn-primary auth-submit" disabled={busy}>
            {busy ? 'Please wait…' : isSignup ? 'Create Account →' : 'Sign In →'}
          </button>
        </form>

        <div className="auth-switch">
          {isSignup ? 'Already have an account? ' : "Don't have an account? "}
          <button onClick={onSwitchMode}>{isSignup ? 'Sign in' : 'Sign up'}</button>
        </div>

        {isSignup && (
          <p className="auth-note">Free diagnostic · 15 minutes · Instant results</p>
        )}
      </div>
    </div>
  );
}
