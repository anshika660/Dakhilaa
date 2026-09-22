import { useState } from 'react';
import './CollegePredictor.css';

// ⚠️ DUMMY CUTOFFS for testing only — replace with real JoSAA data before launch.
// Structure: each college has branches with a cutoff (out of 500, same as dummy).
const COLLEGES = {
  // ---------- IITs ----------
  'IIT Bombay':      { CSE: 340, ECE: 335, ME: 320, CE: 310 },
  'IIT Delhi':       { CSE: 338, ECE: 332, ME: 318, CE: 308 },
  'IIT Madras':      { CSE: 336, ECE: 330, ME: 316, CE: 306 },
  'IIT Kanpur':      { CSE: 334, ECE: 328, ME: 314, CE: 304 },
  'IIT Kharagpur':   { CSE: 332, ECE: 326, ME: 312, CE: 302 },
  'IIT Roorkee':     { CSE: 330, ECE: 324, ME: 310, CE: 300 },
  'IIT Guwahati':    { CSE: 328, ECE: 322, ME: 308, CE: 298 },
  'IIT Hyderabad':   { CSE: 326, ECE: 320, ME: 306, CE: 296 },
  'IIT Indore':      { CSE: 318, ECE: 312, ME: 300, CE: 290 },
  'IIT BHU Varanasi':{ CSE: 320, ECE: 314, ME: 302, CE: 292 },
  'IIT Dhanbad':     { CSE: 310, ECE: 304, ME: 294, CE: 284 },
  'IIT Ropar':       { CSE: 312, ECE: 306, ME: 296, CE: 286 },
  'IIT Bhubaneswar': { CSE: 308, ECE: 302, ME: 292, CE: 282 },
  'IIT Gandhinagar': { CSE: 314, ECE: 308, ME: 298, CE: 288 },
  'IIT Patna':       { CSE: 306, ECE: 300, ME: 290, CE: 280 },
  'IIT Mandi':       { CSE: 304, ECE: 298, ME: 288, CE: 278 },
  'IIT Jodhpur':     { CSE: 302, ECE: 296, ME: 286, CE: 276 },
  'IIT Tirupati':    { CSE: 298, ECE: 292, ME: 282, CE: 272 },
  'IIT Palakkad':    { CSE: 296, ECE: 290, ME: 280, CE: 270 },
  'IIT Bhilai':      { CSE: 294, ECE: 288, ME: 278, CE: 268 },
  'IIT Goa':         { CSE: 292, ECE: 286, ME: 276, CE: 266 },
  'IIT Jammu':       { CSE: 290, ECE: 284, ME: 274, CE: 264 },
  'IIT Dharwad':     { CSE: 288, ECE: 282, ME: 272, CE: 262 },

  // ---------- NITs ----------
  'NIT Trichy':      { CSE: 300, ECE: 294, ME: 284, CE: 274 },
  'NIT Surathkal':   { CSE: 298, ECE: 292, ME: 282, CE: 272 },
  'NIT Warangal':    { CSE: 296, ECE: 290, ME: 280, CE: 270 },
  'NIT Rourkela':    { CSE: 290, ECE: 284, ME: 274, CE: 264 },
  'NIT Calicut':     { CSE: 288, ECE: 282, ME: 272, CE: 262 },
  'NIT Kurukshetra': { CSE: 284, ECE: 278, ME: 268, CE: 258 },
  'NIT Durgapur':    { CSE: 282, ECE: 276, ME: 266, CE: 256 },
  'NIT Allahabad':   { CSE: 292, ECE: 286, ME: 276, CE: 266 },
  'NIT Jaipur':      { CSE: 286, ECE: 280, ME: 270, CE: 260 },
  'NIT Bhopal':      { CSE: 285, ECE: 279, ME: 269, CE: 259 },
  'NIT Nagpur':      { CSE: 283, ECE: 277, ME: 267, CE: 257 },
  'NIT Kozhikode':   { CSE: 287, ECE: 281, ME: 271, CE: 261 },
  'NIT Silchar':     { CSE: 275, ECE: 269, ME: 259, CE: 249 },
  'NIT Hamirpur':    { CSE: 273, ECE: 267, ME: 257, CE: 247 },
  'NIT Jalandhar':   { CSE: 278, ECE: 272, ME: 262, CE: 252 },
  'NIT Patna':       { CSE: 274, ECE: 268, ME: 258, CE: 248 },
  'NIT Raipur':      { CSE: 272, ECE: 266, ME: 256, CE: 246 },
  'NIT Srinagar':    { CSE: 268, ECE: 262, ME: 252, CE: 242 },
  'NIT Agartala':    { CSE: 266, ECE: 260, ME: 250, CE: 240 },
};

const BRANCH_FULL = { CSE: 'Computer Science', ECE: 'Electronics & Comm.', ME: 'Mechanical', CE: 'Civil' };

export default function CollegePredictor() {
  const [score, setScore] = useState('');
  const [college, setCollege] = useState('IIT Bombay');
  const [result, setResult] = useState(null);

  const check = () => {
    const s = parseInt(score, 10);
    if (isNaN(s)) { setResult({ error: 'Please enter a valid score.' }); return; }

    const branches = COLLEGES[college];
    const rows = Object.entries(branches).map(([br, cutoff]) => {
      const gap = cutoff - s;
      let status;
      if (s >= cutoff) status = 'safe';           // score cutoff se upar → safe
      else if (gap <= 20) status = 'moderate';    // 20 marks tak → close
      else status = 'reach';                       // zyada gap → reach
      return { br, cutoff, gap, status };
    });

    setResult({ college, rows });
  };

  return (
    <div className="cp-wrap">
      <div className="cp-title">College Predictor</div>
      <p className="cp-note">
        ⚠️ Testing data only — cutoffs are placeholders. Replace with real JoSAA data before launch.
      </p>

      <div className="cp-inputs">
        <div className="cp-field">
          <label>Your Current Score (out of 500)</label>
          <input
            type="number"
            value={score}
            onChange={e => setScore(e.target.value)}
            placeholder="e.g. 280"
          />
        </div>
        <div className="cp-field">
          <label>Target College</label>
          <select value={college} onChange={e => setCollege(e.target.value)}>
            {Object.keys(COLLEGES).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <button className="cp-btn" onClick={check}>Check Cutoff &amp; Gap</button>

      {result?.error && <div className="cp-error">{result.error}</div>}

      {result?.rows && (
        <div className="cp-result">
          <div className="cp-result-head">{result.college}</div>
          <div className="cp-result-sub">Branch-wise Cutoffs &amp; Gap Analysis</div>

          {result.rows.map(r => (
            <div className={`cp-branch cp-${r.status}`} key={r.br}>
              <div className="cp-branch-name">{r.br} <span>· {BRANCH_FULL[r.br]}</span></div>
              <div className="cp-branch-cut">Cutoff: {r.cutoff}</div>
              <div className="cp-branch-gap">
                {r.status === 'safe'
                  ? `✓ You qualify (${Math.abs(r.gap)} marks above)`
                  : `✗ Gap: ${r.gap} marks`}
              </div>
            </div>
          ))}

          <div className="cp-strategy">
            <strong>Your Strategy:</strong>{' '}
            Focus on fixing 2–3 weak topics to improve 20–40 marks in 3–4 weeks.
          </div>
        </div>
      )}
    </div>
  );
}
