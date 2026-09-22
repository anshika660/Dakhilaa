  import useStats from '../../hooks/useStats';
import './Panels.css';

export default function Progress() {
  const { stats, loading } = useStats();

  if (loading) return <div className="panel-empty">Loading…</div>;

  if (!stats || !stats.history?.length) {
    return (
      <div className="panel-wrap">
        <div className="panel-title">Progress</div>
        <div className="panel-empty">
          <div className="panel-empty-emoji">📈</div>
          <p>No attempts yet. Take a test and your progress will show up here.</p>
        </div>
      </div>
    );
  }

  const { testsTaken, questionsSolved, accuracy, latestScore, history } = stats;
  const maxScore = Math.max(...history.map(h => h.score), 100);

  return (
    <div className="panel-wrap">
      <div className="panel-title">Progress</div>
      <p className="panel-sub">Your performance over time.</p>

      {/* summary stat cards */}
      <div className="stat-grid">
        <div className="stat-box">
          <div className="stat-num">{testsTaken}</div>
          <div className="stat-label">Tests Taken</div>
        </div>
        <div className="stat-box">
          <div className="stat-num">{questionsSolved}</div>
          <div className="stat-label">Questions Solved</div>
        </div>
        <div className="stat-box">
          <div className="stat-num">{accuracy}%</div>
          <div className="stat-label">Accuracy</div>
        </div>
        <div className="stat-box">
          <div className="stat-num">{latestScore}%</div>
          <div className="stat-label">Latest Score</div>
        </div>
      </div>

      {/* simple score-history bar chart (no library needed) */}
      <div className="chart-title">Score history</div>
      <div className="bar-chart">
        {history.map((h, i) => (
          <div className="bar-col" key={i}>
            <div className="bar-track">
              <div
                className="bar-fill"
                style={{ height: `${(h.score / maxScore) * 100}%` }}
                title={`${h.score}%`}
              />
            </div>
            <div className="bar-val">{h.score}%</div>
            <div className="bar-label">#{i + 1}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

