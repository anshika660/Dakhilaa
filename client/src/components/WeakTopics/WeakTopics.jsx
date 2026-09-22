  import useStats from '../../hooks/useStats';
import './Panels.css';

export default function WeakTopics({ onNavigate }) {
  const { stats, loading } = useStats();

  if (loading) return <div className="panel-empty">Loading…</div>;

  if (!stats || !stats.attempts?.length) {
    return (
      <div className="panel-wrap">
        <div className="panel-title">Weak Topics</div>
        <div className="panel-empty">
          <div className="panel-empty-emoji">🎯</div>
          <p>Take the diagnostic test first — we'll pinpoint the topics costing you the most marks.</p>
          {onNavigate && (
            <button className="header-btn header-btn-primary" onClick={() => onNavigate('daily')}>
              Take Diagnostic →
            </button>
          )}
        </div>
      </div>
    );
  }

  // pull weak topics from latest attempt; sort weakest first
  const weak = [...(stats.weakTopics || [])].sort((a, b) => a.accuracy - b.accuracy);

  return (
    <div className="panel-wrap">
      <div className="panel-title">Weak Topics</div>
      <p className="panel-sub">
        Based on your latest test. Focus here to gain the most marks.
      </p>

      {weak.length === 0 ? (
        <div className="panel-empty">
          <div className="panel-empty-emoji">🎉</div>
          <p>No weak topics right now — nice work! Keep practising to stay sharp.</p>
        </div>
      ) : (
        <div className="topic-list">
          {weak.map((t, i) => (
            <div className="topic-row" key={`${t.subject}-${t.topic}-${i}`}>
              <div className="topic-info">
                <div className="topic-name">{t.topic}</div>
                <div className="topic-subject">{t.subject}</div>
              </div>
              <div className="topic-bar-wrap">
                <div className="topic-bar">
                  <div
                    className="topic-bar-fill"
                    style={{ width: `${t.accuracy}%` }}
                  />
                </div>
                <span className="topic-acc">{t.accuracy}%</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {onNavigate && (
        <button
          className="header-btn header-btn-primary panel-cta"
          onClick={() => onNavigate('practice')}
        >
          Practice these topics →
        </button>
      )}
    </div>
  );
}

