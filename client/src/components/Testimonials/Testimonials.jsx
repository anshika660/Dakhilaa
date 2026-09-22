import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import './Testimonials.css';

export default function Testimonials() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // latest 4 approved testimonials
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .eq('approved', true)
        .order('created_at', { ascending: false })
        .limit(4);

      setItems(!error && data ? data : []);
      setLoading(false);
    }
    load();
  }, []);

  // Agar koi approved testimonial nahi, to section hi mat dikhao
  if (loading || items.length === 0) return null;

  return (
    <section className="tst-section">
      <div className="tst-head">
        <span className="tst-badge">STUDENT REVIEWS</span>
        <h2>What our students say</h2>
        <p>Real feedback from students preparing with Dakhilaa.</p>
      </div>

      <div className="tst-grid">
        {items.map((t) => (
          <div className="tst-card" key={t.id}>
            <div className="tst-stars">
              {'★'.repeat(t.rating)}{'☆'.repeat(5 - t.rating)}
            </div>
            <p className="tst-msg">"{t.message}"</p>
            <div className="tst-name">— {t.student_name}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
