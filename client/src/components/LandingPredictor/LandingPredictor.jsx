import { useState } from 'react';
import './LandingPredictor.css';

// ⚠️ DUMMY CUTOFFS for testing — replace with real JoSAA data before launch.
// Grouped by tier for the dropdown (matches netlify structure).
const COLLEGE_GROUPS = {
  'IIT Tier 1': {
    'IIT Bombay':    { CSE: 340, ECE: 335, ME: 320, CE: 310 },
    'IIT Delhi':     { CSE: 338, ECE: 332, ME: 318, CE: 308 },
    'IIT Madras':    { CSE: 336, ECE: 330, ME: 316, CE: 306 },
  },
  'IIT Tier 2': {
    'IIT Kanpur':    { CSE: 334, ECE: 328, ME: 314, CE: 304 },
    'IIT Roorkee':   { CSE: 330, ECE: 324, ME: 310, CE: 300 },
    'IIT Hyderabad': { CSE: 326, ECE: 320, ME: 306, CE: 296 },
  },
  'IIT Tier 3': {
    'IIT Indore':    { CSE: 318, ECE: 312, ME: 300, CE: 290 },
    'IIT BHU':       { CSE: 320, ECE: 314, ME: 302, CE: 292 },
    'IIT Guwahati':  { CSE: 328, ECE: 322, ME: 308, CE: 298 },
    'IIT Kharagpur': { CSE: 332, ECE: 326, ME: 312, CE: 302 },
  },
  'NIT Tier 1': {
    'NIT Trichy':    { CSE: 300, ECE: 294, ME: 284, CE: 274 },
    'NIT Warangal':  { CSE: 296, ECE: 290, ME: 280, CE: 270 },
    'NIT Surathkal': { CSE: 298, ECE: 292, ME: 282, CE: 272 },
  },
  'NIT Tier 2': {
    'NIT Calicut':   { CSE: 288, ECE: 282, ME: 272, CE: 262 },
    'NIT Delhi':     { CSE: 290, ECE: 284, ME: 274, CE: 264 },
    'NIT Rourkela':  { CSE: 290, ECE: 284, ME: 274, CE: 264 },
    'NIT Allahabad': { CSE: 292, ECE: 286, ME: 276, CE: 266 },
  },
};

const BRANCH_FULL = { CSE: 'Computer Science', ECE: 'Electronics & Comm.', ME: 'Mechanical', CE: 'Civil' };

// flat lookup: college name → branches
const ALL = Object.assign({}, ...Object.values(COLLEGE_GROUPS));

export default function LandingPredictor() {
  const [score, setScore] = useState('');
  const [college, setCollege] = useState('');
  const [result, setResult] = useState(null);

  const check = () => {
    const s = parseInt(score, 10);
    if (isNaN(s)) { setResult({ error: 'Please enter a valid score.' }); return; }
    if (!college) { setResult({ error: 'Please select a college.' }); return; }

    const branches = ALL[college];
    const rows = Object.entries(branches).map(([br, cutoff]) => {
      const gap = cutoff - s;
      let status;
      if (s >= cutoff) status = 'safe';
      else if (gap <= 20) status = 'moderate';
      else status = 'reach';
      return { br, cutoff, gap, status };
    });
    setResult({ college, rows });
  };

  return (
    <section className="landing-section" id="predictor">
      <div className="eyebrow">College Predictor</div>
      <div className="section-title">See Your Dream College Path</div>
      <div className="section-subtitle">
        Branch-wise cutoffs and score gaps for IITs, NITs, and IIITs
      </div>

      <div className="lp-card">
        <div className="lp-inputs">
          <div className="lp-field">
            <label>Your Current Score</label>
            <input
              type="number"
              value={score}
              onChange={e => setScore(e.target.value)}
              placeholder="e.g. 280"
            />
          </div>
          <div className="lp-field">
            <label>Target College</label>
            <select value={college} onChange={e => setCollege(e.target.value)}>
              <option value="">Select college</option>
              {Object.entries(COLLEGE_GROUPS).map(([tier, colleges]) => (
                <optgroup label={tier} key={tier}>
                  {Object.keys(colleges).map(c => <option key={c} value={c}>{c}</option>)}
                </optgroup>
              ))}
            </select>
          </div>
        </div>

        <button className="lp-btn" onClick={check}>Check Cutoff &amp; Gap</button>

        {result?.error && <div className="lp-error">{result.error}</div>}

        {result?.rows && (
          <div className="lp-result">
            <div className="lp-result-head">{result.college}</div>
            <div className="lp-result-sub">Branch-wise Cutoffs &amp; Gap Analysis</div>

            {result.rows.map(r => (
              <div className={`lp-branch lp-${r.status}`} key={r.br}>
                <div className="lp-branch-name">{r.br} <span>· {BRANCH_FULL[r.br]}</span></div>
                <div className="lp-branch-cut">Cutoff: {r.cutoff}</div>
                <div className="lp-branch-gap">
                  {r.status === 'safe'
                    ? `✓ You qualify (${Math.abs(r.gap)} marks above)`
                    : `✗ Gap: ${r.gap} marks`}
                </div>
              </div>
            ))}

            <div className="lp-strategy">
              <strong>Your Strategy:</strong>{' '}
              Focus on fixing 2–3 weak topics to improve 20–40 marks in 3–4 weeks.
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
