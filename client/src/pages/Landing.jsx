import { useState, useEffect, useRef } from 'react';
import useScrollReveal from '../hooks/useScrollReveal';
import LandingPredictor from '../components/LandingPredictor/LandingPredictor';
import BlogList from '../components/Blog/BlogList';
import PartnerSection from '../components/Partner/PartnerSection';
import Testimonials from '../components/Testimonials/Testimonials';
import BlogPost from '../components/Blog/BlogPost';
import './Landing.css';

function Reveal({ children, className = '', delay = 0 }) {
  const [ref, visible] = useScrollReveal();
  return (
    <div
      ref={ref}
      className={`reveal ${visible ? 'visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// Count-up animation for stats (gamification touch)
function CountUp({ end, suffix = '', duration = 1400 }) {
  const [val, setVal] = useState(0);
  const [ref, visible] = useScrollReveal();
  const started = useRef(false);

  useEffect(() => {
    if (!visible || started.current) return;
    started.current = true;
    const start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // ease-out
      setVal(Math.round(eased * end));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [visible, end, duration]);

  return <span ref={ref}>{val}{suffix}</span>;
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`faq-item ${open ? 'open' : ''}`}>
      <button className="faq-q" onClick={() => setOpen(!open)}>
        {q}<span classNae="faq-sign">{open ? '−' : '+'}</span>
      </button>
      <div className="faq-a"><p>{a}</p></div>
    </div>
  );
}
export default function Landing({ onGetStarted, isLoggedIn, onBecomePartner, onGoToDashboard }) {
  const [openSlug, setOpenSlug] = useState(null);  // konsा article khula hai
  return (
    <div className="landing">
            <nav className="landing-nav">
        <div className="sidebar-logo" onClick={onGetStarted} style={{ cursor: 'pointer' }}>
          <span>◆</span>Dakhilaa
        </div>
        <div className="landing-nav-links">
          <a href="#how">How it works</a>
          <a href="#features">Features</a>
          <a href="#blog">Blog</a>
          <a href="#pricing">Pricing</a>
          <button className="header-btn header-btn-primary" onClick={onGetStarted}>
            {isLoggedIn ? 'Go to Dashboard' : 'Free Test'}
          </button>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <header className="landing-hero">
        <div className="hero-badge">⏱ 15-Minute Diagnostic Test</div>
        <h1>
          Find Your <span className="accent-text">Weakest JEE Topics</span> in 15 Minutes
        </h1>
        <p className="hero-sub">
          The only platform that tells you exactly which topics to study next —
          based on your specific performance gaps.
        </p>
        <div className="hero-cta">
          <button className="header-btn header-btn-primary btn-lg" onClick={onGetStarted}>
            Take Free Diagnostic
          </button>
          <a href="#how" className="header-btn header-btn-ghost btn-lg">How It Works</a>
        </div>
        <div className="hero-ticks">
          <span>✓ Zero Cost</span>
          <span>✓ Instant Results</span>
          <span>✓ No Card Needed</span>
        </div>
        <div className="subject-pills">
          <span className="pill pill-orange">⚡ Physics</span>
          <span className="pill pill-teal">🧪 Chemistry</span>
          <span className="pill pill-purple">📐 Mathematics</span>
        </div>
      </header>

      {/* ===== STATS STRIP ===== */}
      <div className="stats-strip">
        {[
          ['15 min', 'Diagnostic Test'],
          ['3', 'Subjects Covered'],
          ['Instant', 'Weak Topic Report'],
          ['Free', 'To Get Started'],
        ].map(([big, small], i) => (
          <Reveal key={big} delay={i * 100}>
            <div className="strip-item">
              <strong>{big}</strong>
              <span>{small}</span>
            </div>
          </Reveal>
        ))}
      </div>

      {/* ===== HOW IT WORKS ===== */}
      <section className="landing-section" id="how">
        <Reveal>
          <div className="eyebrow">How it works</div>
          <div className="section-title">3 Steps to Know Your Weak Topics</div>
          <div className="section-subtitle">
            A data-driven approach to find exactly what's holding you back
          </div>
        </Reveal>

        <div className="steps-list">
          {[
            ['01', 'Take the 15-Min Test',
             'Answer questions across Physics, Chemistry, and Math. The test adapts — it gets harder as you answer correctly.'],
            ['02', 'Get Your Weak Topic Report',
             'See exactly which topics you are weak in, how many marks you are losing per exam, and your current JEE readiness score.'],
            ['03', 'See Your College Path',
             'Based on your current score, see which colleges are within reach and what marks you need for your dream college.'],
          ].map(([num, title, desc], i) => (
            <Reveal key={num} delay={i * 120}>
              <div className="step-row">
                <div className="step-badge">{num}</div>
                <div>
                  <div className="step-title">{title}</div>
                  <div className="step-desc">{desc}</div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className="landing-section" id="features">
        <Reveal>
          <div className="eyebrow">Why Dakhilaa</div>
          <div className="section-title">The Smart Way to Prep for JEE</div>
          <div className="section-subtitle">
            Not just another test series. A precision tool built for JEE.
          </div>
        </Reveal>

        <div className="feature-grid">
          {[
            ['🎯', 'Weakness Finder', 'Pinpoints the exact 2–3 topics costing you the most marks per exam.'],
            ['📊', 'Score Gap Analysis', 'Shows the gap between your current score and your dream college — and how to close it.'],
            ['🏆', 'College Predictor', 'Real-time predictions based on your performance. Know where you stand vs actual JEE cutoffs.'],
            ['⚡', 'Daily Practice', 'Get 10 targeted questions on your weak topics every day to fix them fast.'],
            ['🔄', 'Retest Anytime', 'Retake the diagnostic after 2 weeks to track your improvement and celebrate wins.'],
            ['🤖', 'Study Planner', 'AI-powered study recommendations focused on your weak topics for optimal results.'],
          ].map(([icon, title, desc], i) => (
            <Reveal key={title} delay={(i % 3) * 100}>
              <div className="feature-card">
                <div className="feature-icon">{icon}</div>
                <div className="feature-title">{title}</div>
                <div className="feature-desc">{desc}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ===== GAMIFICATION / MOMENTUM ===== */}
      <section className="landing-section" id="momentum">
        <Reveal>
          <div className="eyebrow">Stay Consistent</div>
          <div className="section-title">Prep That Feels Like a Streak, Not a Chore</div>
          <div className="section-subtitle">
            Daily goals, streaks, and progress that keep you coming back.
          </div>
        </Reveal>

        <div className="gami-grid">
          <Reveal delay={0}>
            <div className="gami-card">
              <div className="gami-emoji">🔥</div>
              <div className="gami-big"><CountUp end={30} suffix="-day" /></div>
              <div className="gami-label">Practice streaks to build momentum</div>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div className="gami-card">
              <div className="gami-emoji">🎯</div>
              <div className="gami-big"><CountUp end={10} /></div>
              <div className="gami-label">Daily targeted questions on weak topics</div>
            </div>
          </Reveal>
          <Reveal delay={200}>
            <div className="gami-card">
              <div className="gami-emoji">📈</div>
              <div className="gami-big"><CountUp end={100} suffix="%" /></div>
              <div className="gami-label">Progress tracking toward your target score</div>
            </div>
          </Reveal>
        </div>
      </section>

     {/* ===== COLLEGE PREDICTOR ===== */}
      <LandingPredictor />
      {/* ===== TESTIMONIALS (rolling 4 from DB) ===== */}
      <Testimonials />

      {/* ===== PRICING ===== */}
      <section className="landing-section" id="pricing">
        <Reveal>
          <div className="eyebrow">Pricing</div>
          <div className="section-title">Choose Your Path. Start Your Prep.</div>
          <div className="section-subtitle">
            Simple yearly pricing. Everything you need to prep smarter.
          </div>
        </Reveal>

        <div className="pricing-grid">
          {[
            {
              tag: 'Mains Prep', monthly: 67, yearly: 799, featured: false,
              cta: 'Get Mains',
              items: ['15-min diagnostic test', '10,000 Mains questions', '30 chapter tests',
                      'Daily Mains practice', 'NIT college predictor'],
            },
            {
              tag: 'Advanced Prep', monthly: 75, yearly: 899, featured: false,
              cta: 'Get Advanced',
              items: ['15-min diagnostic test', '5,000 Advanced questions', '50 advanced mock tests',
                      'Daily Advanced practice', 'IIT college predictor'],
            },
            {
              tag: '⭐ Mains + Advanced', monthly: 92, yearly: 1099, featured: true,
              cta: 'Get Bundle',
              items: ['Everything in both plans', '15,000+ total questions', '100+ full-length mocks',
                      'Dual weak topic analysis', 'Both IIT & NIT predictors', 'AI study planner',
                      'Priority support'],
            },
          ].map((p, i) => {
            return (
              <Reveal key={p.tag} delay={i * 110}>
                <div className={`price-card ${p.featured ? 'featured' : ''}`}>
                  <div className="price-tag">{p.tag}</div>
                  <div className="price-amount">₹{p.yearly.toLocaleString('en-IN')}<span>/year</span></div>
                  <ul className="price-list">
                    {p.items.map(item => <li key={item}>{item}</li>)}
                  </ul>
                  <button
                    className={`header-btn ${p.featured ? 'header-btn-primary' : 'header-btn-ghost'} price-btn`}
                    onClick={onGetStarted}
                  >
                    {p.cta}
                  </button>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ===== BLOG (coming soon) ===== */}
         {/* ===== BLOG ===== */}
      <section className="landing-section" id="blog">
        <Reveal>
          <div className="eyebrow">Blog</div>
          <div className="section-title">JEE Prep Insights</div>
          <div className="section-subtitle">
            Strategy, topic breakdowns, and score tips.
          </div>
        </Reveal>

        {openSlug ? (
          <BlogPost slug={openSlug} onBack={() => setOpenSlug(null)} />
        ) : (
          <BlogList onOpenPost={(slug) => setOpenSlug(slug)} />
        )}
      </section>

      {/* ===== FAQ ===== */}
      <section className="landing-section">
        <Reveal>
          <div className="eyebrow">FAQ</div>
          <div className="section-title">Questions About Dakhilaa?</div>
        </Reveal>

        <Reveal>
          <div className="faq-list">
            <FaqItem
              q="Can I take the diagnostic test for free?"
              a="Yes. The 15-minute diagnostic is completely free and needs no payment details. You get your weak topic report instantly."
            />
            <FaqItem
              q="How is Dakhilaa different from other platforms?"
              a="Most platforms give you thousands of questions and leave you to figure out what to study. Dakhilaa tells you exactly which 2–3 topics are costing you the most marks, and gives you targeted practice for them."
            />
            <FaqItem
              q="How accurate is the college predictor?"
              a="Predictions are based on official JEE cutoff data from previous years, mapped against your current performance. Cutoffs shift slightly each year, so treat it as a strong guide rather than a guarantee."
            />
            <FaqItem
              q="Can I use Dakhilaa alongside my coaching?"
              a="Absolutely. Most students do. Dakhilaa is a diagnostic and practice layer — it tells you where to focus, while your coaching handles concept teaching."
            />
            <FaqItem
              q="What if I'm preparing for both Mains and Advanced?"
              a="The Bundle plan covers both, with separate question banks, mock series, and college predictors for each."
            />
          </div>
        </Reveal>
      </section>

      {/* ===== FINAL CTA ===== */}
      <Reveal>
        <section className="final-cta">
          <h2>Stop Guessing. Start Knowing.</h2>
          <p>Find your exact weak JEE topics in 15 minutes. Then fix them.</p>
          <button className="header-btn header-btn-primary btn-lg" onClick={onGetStarted}>
            Get Started Now →
          </button>
          <div className="cta-ticks">
            <span>Free diagnostic</span>·<span>Instant results</span>·<span>No card needed</span>
          </div>
        </section>
            </Reveal>
       {/* ===== <PartnerSection onLoginSuccess={onGoToDashboard} /> ===== */}
      {/* ===== PARTNER BANNER (clickable → alag partner page) ===== */}
      <Reveal>
        <section className="partner-banner" onClick={onBecomePartner}>
          <div className="partner-banner-inner">
            <div className="eyebrow">Partner Program</div>
            <h2>Grow with Dakhilaa — Become a Partner</h2>
            <p>JEE educator or influencer? Get your referral code, share it, and earn from every student you bring in.</p>
            <button
              className="header-btn header-btn-primary btn-lg"
              onClick={(e) => { e.stopPropagation(); onBecomePartner(); }}
            >
              Join the Partner Program →
            </button>
          </div>
        </section>
      </Reveal>
      
      {/* ===== FOOTER ===== */}
      <footer className="landing-footer">
        <div className="footer-grid">
          <div>
           <div className="sidebar-logo" onClick={onGetStarted} style={{ cursor: 'pointer' }}>
          <span>◆</span>Dakhilaa
        </div>
            <p className="footer-about">
              The precision diagnostic platform for JEE prep. Find your weak topics and fix them.
            </p>
          </div>
                  <div>
            <div className="footer-head">Platform</div>
            <a href="#how">How it works</a>
            <a href="#features">Features</a>
            <a href="#blog">Blog</a>
            <a href="#pricing">Pricing</a>
            <a href="#" onClick={(e) => { e.preventDefault(); onBecomePartner(); }}>Become a Partner</a>
          </div>
                  <div>
            <div className="footer-head">Connect</div>
            <a href="https://instagram.com/dakhilaaofficial" target="_blank" rel="noopener noreferrer">Instagram</a>
            <a href="mailto:Support@dakhilaa.com">Email us</a>
            <a href="https://www.facebook.com/share/1BGUYMq7PZ/" target="_blank" rel="noopener noreferrer">Facebook</a>
          </div>
        </div>
        <div className="footer-bottom">
  <p>© 2026 Dakhilaa. Made for JEE aspirants who want precision prep.</p>
  <div className="footer-social-row">
    <a href="https://instagram.com/dakhilaaofficial" target="_blank" rel="noopener noreferrer">
      @Dakhilaaofficial
    </a>
    <span className="footer-dot">·</span>
    <a href="mailto:Support@dakhilaa.com">Support@dakhilaa.com</a>
    <span className="footer-dot">·</span>
    <a href="https://dakhilaa.com" target="_blank" rel="noopener noreferrer">
      dakhilaa.com
    </a>
  </div>
</div>
      </footer>
    </div>
  );
}
