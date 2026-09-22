import { useState } from 'react';
import { supabase } from '../lib/supabase';
import './Auth.css';

// Shown when the user arrives from a password-reset email link.
// Supabase puts a recovery session in place automatically when the link
// is opened, so we can call updateUser to set the new password.
export default function ResetPassword({ onDone }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);

    if (error) {
      setError(error.message);
      return;
    }
    setDone(true);
  };

  if (done) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="sidebar-logo auth-logo"><span>◆</span>Dakhilaa</div>
          <div className="auth-icon-big">✅</div>
          <h1>Password updated</h1>
          <p className="auth-sub">Your password has been changed. You can now sign in with your new password.</p>
          <button className="header-btn header-btn-primary auth-submit" onClick={onDone}>
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="sidebar-logo auth-logo"><span>◆</span>Dakhilaa</div>
        <h1>Set a new password</h1>
        <p className="auth-sub">Enter your new password below.</p>

        <form onSubmit={submit}>
          <div className="form-group">
            <label>New password</label>
            <input type="password" className="form-control" value={password}
                   onChange={(e) => setPassword(e.target.value)}
                   placeholder="At least 6 characters" required />
          </div>
          <div className="form-group">
            <label>Confirm new password</label>
            <input type="password" className="form-control" value={confirm}
                   onChange={(e) => setConfirm(e.target.value)}
                   placeholder="Re-enter password" required />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="header-btn header-btn-primary auth-submit" disabled={busy}>
            {busy ? 'Please wait…' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  );
}
