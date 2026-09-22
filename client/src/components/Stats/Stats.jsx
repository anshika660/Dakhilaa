import './Stats.css';

function StatCard({ label, value, detail, pct }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-detail">{detail}</div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function Stats({ stats }) {
  if (!stats) {
    return (
      <div className="grid-4">
        <StatCard label="Questions Solved" value="0" detail="Take your first test" pct={0} />
        <StatCard label="Accuracy Rate" value="—" detail="No attempts yet" pct={0} />
        <StatCard label="Tests Taken" value="0" detail="Diagnostic + practice" pct={0} />
        <StatCard label="Latest Score" value="—" detail="Take your first test" pct={0} />
      </div>
    );
  }

  return (
    <div className="grid-4">
      <StatCard label="Questions Solved" value={stats.questionsSolved}
                detail="Across all tests" pct={Math.min(stats.questionsSolved, 100)} />
      <StatCard label="Accuracy Rate" value={`${stats.accuracy}%`}
                detail="Your overall accuracy" pct={stats.accuracy} />
      <StatCard label="Tests Taken" value={stats.testsTaken}
                detail="Diagnostic + practice" pct={Math.min(stats.testsTaken * 10, 100)} />
      <StatCard label="Latest Score" value={`${stats.latestScore}%`}
                detail="Most recent test" pct={stats.latestScore} />
    </div>
  );
}