import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import MathText from '../MathText';
import './MyTests.css';

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function fmtTime(sec) {
  if (sec == null) return '—';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
}

export default function MyTests({ onExit }) {
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState([]);
  const [selected, setSelected] = useState(null);   // selected attempt for review
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewData, setReviewData] = useState([]); // joined answers + questions
  const [onlyWrong, setOnlyWrong] = useState(false);

  // ---- Load user's past attempts ----
  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) { setLoading(false); return; }

      const { data, error } = await supabase
        .from('attempts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      setAttempts(!error && data ? data : []);
      setLoading(false);
    }
    load();
  }, []);

  // ---- Open review for one attempt ----
  const openReview = async (attempt) => {
    setSelected(attempt);
    setReviewLoading(true);
    setOnlyWrong(false);

    // 1. get this attempt's answers
    const { data: ans } = await supabase
      .from('attempt_answers')
      .select('*')
      .eq('attempt_id', attempt.id);

    const answers = ans || [];
    const qIds = answers.map(a => a.question_id).filter(Boolean);

    // 2. get the actual questions
    let questionsById = {};
    if (qIds.length) {
      const { data: qs } = await supabase
        .from('questions')
        .select('*')
        .in('id', qIds);
      (qs || []).forEach(q => { questionsById[q.id] = q; });
    }

    // 3. merge
    const merged = answers.map(a => ({
      ...a,
      question: questionsById[a.question_id] || null,
    }));

    setReviewData(merged);
    setReviewLoading(false);
  };

  const backToList = () => {
    setSelected(null);
    setReviewData([]);
  };

  // ---------- REVIEW VIEW ----------
  if (selected) {
    const shown = onlyWrong ? reviewData.filter(r => !r.is_correct) : reviewData;
    const wrongCount = reviewData.filter(r => !r.is_correct).length;

    return (
      <div className="myt-wrap">
        <button className="myt-back" onClick={backToList}>&laquo; Back to My Tests</button>

        <div className="myt-review-head">
          <h2>{selected.test_type === 'chapter' ? 'Chapter Test' : 'Mock Test'} Review</h2>
          <div className="myt-review-meta">
            <span>{fmtDate(selected.created_at)}</span>
            <span>Score: {selected.score_percent}%</span>
            <span>Correct: {selected.correct_count}/{selected.total_questions}</span>
            <span>Time: {fmtTime(selected.time_taken_seconds)}</span>
          </div>
          <div className="myt-filter">
            <button
              className={!onlyWrong ? 'active' : ''}
              onClick={() => setOnlyWrong(false)}
            >
              All ({reviewData.length})
            </button>
            <button
              className={onlyWrong ? 'active' : ''}
              onClick={() => setOnlyWrong(true)}
            >
              Only Wrong ({wrongCount})
            </button>
          </div>
        </div>

        {reviewLoading ? (
          <div className="myt-loading">Loading review…</div>
        ) : shown.length === 0 ? (
          <div className="myt-empty">
            {onlyWrong ? 'No wrong answers — great job!' : 'No answers recorded for this test.'}
          </div>
        ) : (
          <div className="myt-review-list">
            {shown.map((r, i) => {
              const q = r.question;
              return (
                <div key={r.id || i} className="myt-review-item">
                  <div className="myt-review-q">
                    {q?.subject && <span className="pill pill-orange">{q.subject}</span>}
                    <span className="myt-review-num">Q{i + 1}</span>
                    <MathText>{q ? q.question_text : '(question not found)'}</MathText>
                  </div>

                  {q && (
                    <div className="myt-options">
                      {['a', 'b', 'c', 'd'].map(o => {
                        const isCorrect = o === q.correct_option;
                        const isPicked = o === r.selected_option;
                        let cls = 'myt-opt';
                        if (isCorrect) cls += ' correct';
                        else if (isPicked && !isCorrect) cls += ' wrong';
                        return (
                          <div key={o} className={cls}>
                            <span className="myt-opt-letter">{o.toUpperCase()}</span>
                            <MathText>{q[`option_${o}`]}</MathText>
                            {isPicked && <span className="myt-your">Your answer</span>}
                            {isCorrect && <span className="myt-correct-tag">Correct</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="myt-verdict">
                    {!r.selected_option ? (
                      <span className="myt-tag skip">Not answered</span>
                    ) : r.is_correct ? (
                      <span className="myt-tag good">Correct ✓</span>
                    ) : (
                      <span className="myt-tag bad">Wrong ✗</span>
                    )}
                  </div>

                  {q?.explanation && (
                    <div className="myt-exp">
                      <strong>Solution:</strong> <MathText>{q.explanation}</MathText>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ---------- LIST VIEW ----------
  return (
    <div className="myt-wrap">
      {onExit && <button className="myt-back" onClick={onExit}>&laquo; Back</button>}

      <div className="myt-list-head">
        <h2>My Tests</h2>
        <p>Review any of your past tests — see every question, your answer, and the solution.</p>
      </div>

      {loading ? (
        <div className="myt-loading">Loading your tests…</div>
      ) : attempts.length === 0 ? (
        <div className="myt-empty">
          You haven't taken any tests yet. Take a mock or chapter test — it'll show up here for review.
        </div>
      ) : (
        <div className="myt-cards">
          {attempts.map(a => (
            <div key={a.id} className="myt-card" onClick={() => openReview(a)}>
              <div className="myt-card-top">
                <span className={`myt-type ${a.test_type}`}>
                  {a.test_type === 'chapter' ? 'Chapter Test' : 'Mock Test'}
                </span>
                <span className="myt-card-date">{fmtDate(a.created_at)}</span>
              </div>

              <div className="myt-card-score">
                <span className="myt-score-big">{a.score_percent}%</span>
                <span className="myt-score-sub">{a.correct_count}/{a.total_questions} correct</span>
              </div>

              {Array.isArray(a.weak_topics) && a.weak_topics.length > 0 && (
                <div className="myt-weak">
                  {a.weak_topics.slice(0, 3).map((w, idx) => (
                    <span key={idx} className="myt-weak-tag">
                      {w.topic}{w.wrong ? ` (${w.wrong})` : ''}
                    </span>
                  ))}
                </div>
              )}

              <button className="myt-review-btn">Review Answers →</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
