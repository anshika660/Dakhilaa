// Har Sunday apne aap ek naya live test schedule karta hai (us din shaam 7 baje IST)
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    // Aaj (jab cron chale) shaam 7 baje IST = 13:30 UTC
    const next = new Date();
    next.setUTCHours(13, 30, 0, 0); // 13:30 UTC = 7:00 PM IST
    if (next.getTime() < Date.now()) {
      next.setUTCDate(next.getUTCDate() + 1);
    }

    const { error } = await supabase.from('scheduled_tests').insert({
      title: `JEE Live Test — ${next.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' })}`,
      scheduled_at: next.toISOString(),
      duration_minutes: 180,
      subject_mix: { physics: 25, chemistry: 25, maths: 25 },
      question_ids: [],
    });

    if (error) {
      console.error('cron insert error:', error);
      return res.status(500).json({ error: 'Insert failed' });
    }

    return res.status(200).json({ success: true, scheduled_at: next.toISOString() });
  } catch (err) {
    console.error('cron error:', err);
    return res.status(500).json({ error: 'Cron failed' });
  }
}