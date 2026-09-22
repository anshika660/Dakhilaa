import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import './FeedbackModal.css';

export default function FeedbackModal({ profile, onClose }) {
  const [name, setName] = useState(profile?.full_name || '');
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('idle'); // idle | saving | done | error
  const [errorMsg, setErrorMsg] = useState('');

  const submit = async () => {
    if (!name.trim()) { setErrorMsg('Please enter your name.'); return; }
    if (rating === 0) { setErrorMsg('Please select a star rating.'); return; }
    if (!message.trim()) { setErrorMsg('Please write a short message.'); return; }

    setStatus('saving');
    setErrorMsg('');

    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id || null;

      const { error } = await supabase.from('testimonials').insert({
        user_id: userId,
        student_name: name.trim(),
        rating,
        message: message.trim(),
        // approved stays false — owner approves before it shows on landing
      });

      if (error) { setErrorMsg('Could not submit. Please try again.'); setStatus('error'); return; }
      setStatus('done');
    } catch {
      setErrorMsg('Something went wrong. Please try again.');
      setStatus('error');
    }
  };

  return (
    <div className="fb-overlay" onClick={onClose}>
      <div className="fb-modal" onClick={(e) => e.stopPropagation()}>
        <button className="fb-close" onClick={onClose}>✕</button>

        {status === 'done' ? (
          <div className="fb-done">
            <div className="fb-done-icon">🎉</div>
            <h3>Thank you for your feedback!</h3>
            <p>Your review has been submitted. Once approved, it may appear on our homepage.</p>
            <button className="fb-btn" onClick={onClose}>Close</button>
          </div>
        ) : (
          <>
            <h3 className="fb-title">Rate your experience</h3>
            <p className="fb-sub">Your feedback helps us improve Dakhilaa.</p>

            <label className="fb-label">Your name</label>
            <input
              className="fb-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />

            <label className="fb-label">Rating</label>
            <div className="fb-stars">
              {[1, 2, 3, 4, 5].map(n => (
                <span
                  key={n}
                  className={`fb-star ${(hover || rating) >= n ? 'on' : ''}`}
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                >
                  ★
                </span>
              ))}
            </div>

            <label className="fb-label">Your feedback</label>
            <textarea
              className="fb-textarea"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What did you like? What can we improve?"
              rows={4}
              maxLength={300}
            />
            <div className="fb-count">{message.length}/300</div>

            {errorMsg && <div className="fb-error">{errorMsg}</div>}

            <button className="fb-btn" onClick={submit} disabled={status === 'saving'}>
              {status === 'saving' ? 'Submitting…' : 'Submit Feedback'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
