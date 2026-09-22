import './PlanChooser.css';

// Teeno plans — ek jagah, taaki modal aur yahaan same rahein
const PLANS = [
  {
    key: 'mains',
    tag: 'Mains Prep',
    price: 799,
    featured: false,
    items: [
      '15-min diagnostic test',
      '10,000 Mains questions',
      '30 chapter tests',
      'Daily Mains practice',
      'NIT college predictor',
    ],
  },
  {
    key: 'advanced',
    tag: 'Advanced Prep',
    price: 899,
    featured: false,
    items: [
      '15-min diagnostic test',
      '5,000 Advanced questions',
      '50 advanced mock tests',
      'Daily Advanced practice',
      'IIT college predictor',
    ],
  },
  {
    key: 'bundle',
    tag: '⭐ Mains + Advanced',
    price: 1099,
    featured: true,
    items: [
      'Everything in both plans',
      '15,000+ total questions',
      '100+ full-length mocks',
      'Dual weak topic analysis',
      'Both IIT & NIT predictors',
      'AI study planner',
      'Priority support',
    ],
  },
];

export default function PlanChooser({ onChoose, onClose }) {
  return (
    <div className="pc-overlay" onClick={onClose}>
      <div className="pc-modal" onClick={(e) => e.stopPropagation()}>
        <button className="pc-close" onClick={onClose}>✕</button>

        <div className="pc-head">
          <div className="pc-title">Choose Your Plan</div>
          <div className="pc-sub">Yearly access · pick what fits your prep</div>
        </div>

        <div className="pc-grid">
          {PLANS.map((p) => (
            <div key={p.key} className={`pc-card ${p.featured ? 'featured' : ''}`}>
              {p.featured && <div className="pc-badge">Best Value</div>}
              <div className="pc-tag">{p.tag}</div>
              <div className="pc-price">₹{p.price.toLocaleString('en-IN')}<span>/year</span></div>
              <ul className="pc-list">
                {p.items.map((item) => <li key={item}>✓ {item}</li>)}
              </ul>
              <button
                className={`pc-btn ${p.featured ? 'pc-btn-primary' : 'pc-btn-ghost'}`}
                onClick={() => onChoose(p.key)}
              >
                Get {p.tag.replace('⭐ ', '')} →
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}