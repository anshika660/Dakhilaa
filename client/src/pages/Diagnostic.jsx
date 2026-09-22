import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import MathText from '../components/MathText';
import './Diagnostic.css';

const OPTIONS = ['a', 'b', 'c', 'd'];

export default function Diagnostic({ onExit, onDone }) {
  const { user } = useAuth();

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [startedAt] = useState(Date.now());
  const [secondsLeft, setSecondsLeft] = useState(15 * 60);
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
   supabase
  .from('questions')
  .select('*')
  .eq('is_diagnostic', true)
  .limit(30)
  .then(({ data, error }) => {
        if (!error && data) setQuestions(data);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (result || loading) return;
    if (secondsLeft <= 0) { finish(); return; }
    const t = setTimeout(() => setSecondsLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft, result, loading]);

  const mmss = () => {
    const m = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
    const s = String(secondsLeft % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  const pick = (opt) => setAnswers({ ...answers, [questions[idx].id]: opt });

  const finish = async () => {
    if (saving) return;
    setSaving(true);

    const rows = questions.map(q => ({
      question_id: q.id,
      selected_option: answers[q.id] ?? null,
      is_correct: answers[q.id] === q.correct_option,
      topic: q.topic,
      subject: q.subject,
    }));

    const correct = rows.filter(r => r.is_correct).length;
    const percent = Math.round((correct / questions.length) * 100);

    // topic-wise weakness
   const byTopic = {};
    rows.forEach(r => {
      const key = `${r.subject}|${r.topic}`;
      if (!byTopic[key]) byTopic[key] = { total: 0, correct: 0, subject: r.subject, topic: r.topic };
      byTopic[key].total++;
      if (r.is_correct) byTopic[key].correct++;
    });

    const topicStats = Object.values(byTopic).map(s => ({
      topic: s.topic,
      subject: s.subject,
      accuracy: Math.round((s.correct / s.total) * 100),
    })).sort((a, b) => a.accuracy - b.accuracy);
    const weak = topicStats.filter(t => t.accuracy < 60);

    const { data: attempt } = await supabase
      .from('attempts')
      .insert({
        user_id: user.id,
        total_questions: questions.length,
        correct_count: correct,
        score_percent: percent,
        weak_topics: weak,
        time_taken_seconds: Math.round((Date.now() - startedAt) / 1000),
      })
      .select()
      .single();

    if (attempt) {
      await supabase
        .from('attempt_answers')
        .insert(rows.map(r => ({ ...r, attempt_id: attempt.id })));
    }

    setResult({ correct, total: questions.length, percent, topicStats, weak });
    setSaving(false);
  };

  if (loading) return <div className="diag-loading">Loading questions…</div>;

  if (!questions.length) {
    return (
      <div className="diag-loading">
        No questions available yet.
        <button className="header-btn header-btn-ghost" onClick={onExit}>Back</button>
      </div>
    );
  }

  /* ---------- RESULT ---------- */
  if (result) {
    return (
      <div className="diag-page">
        <div className="diag-result">
          <div className="hero-badge">Diagnostic Complete</div>
          <h1>You scored {result.percent}%</h1>
          <p className="diag-result-sub">
            {result.correct} out of {result.total} correct
          </p>

          <div className="diag-topics">
            <div className="section-title" style={{ fontSize: 17 }}>Topic breakdown</div>
            {result.topicStats.map(t => (
              <div className="diag-topic-row" key={t.topic}>
                <div>
                  <div className="diag-topic-name">{t.topic}</div>
                  <div className="diag-topic-sub">{t.subject}</div>
                </div>
                <div className={`diag-topic-acc ${t.accuracy < 60 ? 'weak' : ''}`}>
                  {t.accuracy}%
                </div>
              </div>
            ))}
          </div>

          {result.weak.length > 0 && (
            <div className="diag-weak-box">
              <strong>Focus here first:</strong>{' '}
              {result.weak.slice(0, 3).map(w => w.topic).join(', ')}
            </div>
          )}

          <button className="header-btn header-btn-primary diag-cta" onClick={onDone}>
            Go to Dashboard →
          </button>
        </div>
      </div>
    );
  }

  /* ---------- TEST ---------- */
  const q = questions[idx];
  const selected = answers[q.id];
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="diag-page">
      <div className="diag-bar">
        <button className="diag-exit" onClick={() => {
          if (confirm('Leave the test? Your progress will be lost.')) onExit();
        }}>← Exit</button>
        <div className="diag-progress-text">
          Question {idx + 1} of {questions.length} · {answeredCount} answered
        </div>
        <div className={`diag-timer ${secondsLeft < 60 ? 'low' : ''}`}>{mmss()}</div>
      </div>

      <div className="diag-progress">
        <div className="diag-progress-fill"
             style={{ width: `${((idx + 1) / questions.length) * 100}%` }} />
      </div>

      <div className="diag-card">
        <div className="diag-meta">
          <span className="pill pill-orange">{q.subject}</span>
          <span className={`diff-tag diff-${q.difficulty}`}>{q.difficulty}</span>
        </div>

        <div className="diag-question"><MathText>{q.question_text}</MathText></div>

        <div className="diag-options">
          {OPTIONS.map(o => (
            <button
              key={o}
              className={`diag-option ${selected === o ? 'selected' : ''}`}
              onClick={() => pick(o)}
            >
              <span className="diag-option-letter">{o.toUpperCase()}</span>
              <MathText>{q[`option_${o}`]}</MathText>
            </button>
          ))}
        </div>

        <div className="diag-nav">
          <button
            className="header-btn header-btn-ghost"
            disabled={idx === 0}
            onClick={() => setIdx(idx - 1)}
          >
            Previous
          </button>

          {idx < questions.length - 1 ? (
            <button className="header-btn header-btn-primary" onClick={() => setIdx(idx + 1)}>
              Next →
            </button>
          ) : (
            <button className="header-btn header-btn-primary" onClick={finish} disabled={saving}>
              {saving ? 'Saving…' : 'Submit Test'}
            </button>
          )}
        </div>
      </div>

      <div className="diag-palette">
        {questions.map((qq, i) => (
          <button
            key={qq.id}
            className={`diag-num ${i === idx ? 'current' : ''} ${answers[qq.id] ? 'answered' : ''}`}
            onClick={() => setIdx(i)}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
