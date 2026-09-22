// api/verify-payment.js
// Signature verify karta hai, plan update karta hai, aur referral commission record karta hai

import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    plan,
      user_id,
      referral_code,
    } = req.body || {};

    // Zaroori fields check
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !plan || !user_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Plan validate — sirf teen allowed
       const validPlans = ['mains', 'advanced', 'bundle', 'test1']; // test1 = TESTING ONLY
    if (!validPlans.includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    // ---- SIGNATURE VERIFY (asli security) ----
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Payment verification failed' });
    }

    // ---- Signature sahi — Supabase (service key se) ----
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

       // test1 (₹1 test) ko bundle access do — profiles mein 'test1' valid nahi
    const finalPlan = plan === 'test1' ? 'bundle' : plan;

    const { error } = await supabase
      .from('profiles')
      .update({ plan: finalPlan })
      .eq('id', user_id);

    if (error) {
      console.error('Supabase update error:', error);
      return res.status(500).json({ error: 'Plan update failed' });
    }

    // ---- Referral tracking — agar valid code, sale + 15% commission ----
    if (referral_code) {
      const PLAN_PAISE = { mains: 79900, advanced: 89900, bundle: 109900 };
      const amount = PLAN_PAISE[plan] || 0;
      const commission = Math.round(amount * 0.15); // 15%

      // Code valid hai? partners table mein check
      const { data: partner } = await supabase
        .from('partners')
        .select('referral_code')
        .eq('referral_code', referral_code)
        .maybeSingle();

      if (partner) {
        await supabase.from('referrals').insert({
          referral_code: referral_code,
          student_id: user_id,
          plan,
          amount,
          commission,
        });
      }
    }

    return res.status(200).json({ success: true, plan });
  } catch (err) {
    console.error('verify-payment error:', err);
    return res.status(500).json({ error: 'Verification failed' });
  }
}