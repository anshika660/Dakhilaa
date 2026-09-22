import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import './RazorpayModal.css';

// Har plan ka price + features (landing page se match)
const PLANS = {
  mains: {
    label: 'Mains Prep Plan',
    price: 799,
    features: [
      '15-min diagnostic test',
      'Mains question bank',
      'Chapter tests',
      'Daily Mains practice',
      'NIT college predictor',
    ],
  },
  advanced: {
    label: 'Advanced Prep Plan',
    price: 899,
    features: [
      '15-min diagnostic test',
      'Advanced question bank',
      'Advanced mock tests',
      'Daily Advanced practice',
      'IIT college predictor',
    ],
  },
  bundle: {
    label: 'Mains + Advanced Bundle',
    price: 1099,
    features: [
      'Everything in both plans',
      'Combined question bank',
      'Full-length mocks',
      'Dual weak topic analysis',
      'Both IIT & NIT predictors',
      'AI study planner',
      'Priority support',
    ],
  },
  test1: {
    label: 'Test Plan (₹1)',
    price: 1,
    features: [
      'Full bundle access (testing)',
      'For test payments only',
    ],
  },
};

// Referral code source: URL ?ref=  OR  sessionStorage (from /ref/CODE link)
function getInitialReferral() {
  const fromQuery = new URLSearchParams(window.location.search).get('ref');
  const fromStorage = sessionStorage.getItem('referralCode');
  return (fromQuery || fromStorage || '').toUpperCase();
}

export default function RazorpayModal({ plan = 'bundle', onClose }) {
  const { user } = useAuth();
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [referralCode, setReferralCode] = useState(getInitialReferral);
  const planInfo = PLANS[plan] || PLANS.bundle;

  const handlePay = async () => {
    if (!user) {
      setErrorMsg('Please log in first.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setErrorMsg('');

    try {
      const orderRes = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });

      if (!orderRes.ok) throw new Error('Order banane mein dikkat aayi.');
      const order = await orderRes.json();

      const options = {
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: 'Dakhilaa',
        description: planInfo.label,
        order_id: order.order_id,
        prefill: { email: user.email || '' },
        theme: { color: '#f97316' },
        handler: async (response) => {
          try {
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                plan,
                user_id: user.id,
                referral_code: referralCode ? referralCode.trim().toUpperCase() : null,
              }),
            });
            const result = await verifyRes.json();
            if (verifyRes.ok && result.success) {
              // referral use ho gaya — storage saaf karo
              sessionStorage.removeItem('referralCode');
              setStatus('success');
              setTimeout(() => window.location.reload(), 1500);
            } else {
              setErrorMsg('Payment verify nahi hui. Paisa kata ho to support se baat karein.');
              setStatus('error');
            }
          } catch {
            setErrorMsg('Verify karne mein network dikkat aayi.');
            setStatus('error');
          }
        },
        modal: {
          ondismiss: () => setStatus('idle'),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => {
        setErrorMsg('Payment fail ho gayi. Dobara try karein.');
        setStatus('error');
      });
      rzp.open();
      setStatus('idle');
    } catch (err) {
      setErrorMsg(err.message || 'Kuch galat ho gaya. Dobara try karein.');
      setStatus('error');
    }
  };

  return (
    <div className="rzp-overlay" onClick={onClose}>
      <div className="rzp-modal" onClick={(e) => e.stopPropagation()}>
        <button className="rzp-close" onClick={onClose}>✕</button>

        <div className="rzp-title">{planInfo.label}</div>
        <div className="rzp-price">₹{planInfo.price}<span> / year</span></div>

        {status === 'success' ? (
          <div className="rzp-success">
            ✅ Payment successful! Aapka plan unlock ho raha hai…
          </div>
        ) : (
          <>
            <ul className="rzp-features">
              {planInfo.features.map((f, i) => (
                <li key={i}>✓ {f}</li>
              ))}
            </ul>

            <input
              className="rzp-referral"
              placeholder="Have a referral code? (optional)"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
            />

            {status === 'error' && <div className="rzp-error">{errorMsg}</div>}

            <button
              className="rzp-pay-btn"
              onClick={handlePay}
              disabled={status === 'loading'}
            >
              {status === 'loading' ? 'Please wait…' : `Pay ₹${planInfo.price}`}
            </button>

            <div className="rzp-secure">🔒 Secure payment via Razorpay · Yearly</div>
          </>
        )}
      </div>
    </div>
  );
}
