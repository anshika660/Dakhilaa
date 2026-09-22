import { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import MathText from '../MathText';
import './MockTest.css';

// JEE Main pattern: 25 Physics + 25 Chemistry + 25 Maths = 75 questions
const SUBJECTS = ['Physics', 'Chemistry', 'Maths'];
const PER_SUBJECT = 25;
const TOTAL_TIME = 180 * 60; // 180 minutes in seconds (full mock)
const OPTIONS = ['a', 'b', 'c', 'd'];
const MARK_CORRECT = 4;
const MARK_WRONG = -1;
const CHAPTER_MAX = 15; // max questions in a chapter test


// Question status codes for the palette
// 'notVisited' | 'notAnswered' | 'answered' | 'marked' | 'answeredMarked'

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function formatTime(sec) {
  const h = String(Math.floor(sec / 3600)).padStart(2, '0');
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
  const s = String(sec % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export default function MockTest({ mode = 'mock', chapterSubject, chapterTopic, liveTest, onExit }) {
  const isAdvanced = mode === 'advanced';
  const isChapter = mode === 'chapter';
  const isLive = mode === 'live';
  // stage: 'loading' | 'instructions' | 'test' | 'result'
  const [stage, setStage] = useState('loading');
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});        // { [index]: 'a' }
  const [status, setStatus] = useState({});          // { [index]: statusCode }
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);    // current radio pick before save
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [totalTime, setTotalTime] = useState(TOTAL_TIME);
  const [agreed, setAgreed] = useState(false);
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const timerRef = useRef(null);

  // ---- Load questions (mock = 25x3 balanced; chapter = one topic) ----
  useEffect(() => {
    async function load() {
      let query = supabase.from('questions').select('*');
            if (isAdvanced) {
        // Advanced: sirf exam_type='advanced' questions
        query = query.eq('exam_type', 'advanced');
      }
      if (isChapter) {
        query = query.eq('subject', chapterSubject).eq('topic', chapterTopic);
      }
            if (!isAdvanced && !isChapter) {
        // Mains mock + live: sirf exam_type='main' questions
        query = query.eq('exam_type', 'main');
      }
      const { data, error } = await query;
      if (error || !data) {
        setQuestions([]);
        setStage('instructions');
        return;
      }
      let picked = [];
      if (isChapter) {
        picked = shuffle(data).slice(0, CHAPTER_MAX);
      } else if (isLive) {
        // Live test — subject_mix se questions (ya default 25 each)
        const mix = liveTest?.subject_mix || { Physics: 25, Chemistry: 25, Maths: 25 };
        for (const subj of SUBJECTS) {
          const count = mix[subj] ?? mix[subj.toLowerCase()] ?? 25;
          const pool = shuffle(data.filter(q => q.subject === subj));
          picked.push(...pool.slice(0, count));
        }
      } else if (isAdvanced) {
        // Advanced: subject-wise saare advanced questions (abhi jitne hain sab)
        for (const subj of SUBJECTS) {
          const pool = shuffle(data.filter(q => q.subject === subj));
          picked.push(...pool);
        }
      } else {
        for (const subj of SUBJECTS) {
          const pool = shuffle(data.filter(q => q.subject === subj));
          picked.push(...pool.slice(0, PER_SUBJECT));
        }
      }

      // set timer: mock = 180min; chapter = 1min/q; live = duration_minutes
      const t = isChapter
        ? picked.length * 60
        : isLive
          ? (liveTest?.duration_minutes || 180) * 60
          : TOTAL_TIME;
      setTotalTime(t);
      setTimeLeft(t);
      // init all as not visited
      const st = {};
      picked.forEach((_, i) => { st[i] = 'notVisited'; });
      setQuestions(picked);
      setStatus(st);
      setStage('instructions');
    }
    load();
  }, [mode, chapterSubject, chapterTopic]);

  // ---- Timer ----
  useEffect(() => {
    if (stage !== 'test') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          handleSubmit(true); // auto submit
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  const q = questions[current];

  // when moving to a question, load its saved answer & mark visited
  useEffect(() => {
    if (stage !== 'test' || !questions.length) return;
    setSelected(answers[current] ?? null);
    setStatus(prev => {
      if (prev[current] === 'notVisited') {
        return { ...prev, [current]: 'notAnswered' };
      }
      return prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, stage]);

  const startTest = () => {
    setCurrent(0);
    setStage('test');
  };

  const saveAndNext = () => {
    setAnswers(prev => ({ ...prev, [current]: selected }));
    setStatus(prev => ({
      ...prev,
      [current]: selected ? 'answered' : 'notAnswered',
    }));
    goNext();
  };

  const saveAndMark = () => {
    setAnswers(prev => ({ ...prev, [current]: selected }));
    setStatus(prev => ({
      ...prev,
      [current]: selected ? 'answeredMarked' : 'marked',
    }));
    goNext();
  };

  const markAndNext = () => {
    setStatus(prev => ({
      ...prev,
      [current]: selected ? 'answeredMarked' : 'marked',
    }));
    goNext();
  };

  const clearResponse = () => {
    setSelected(null);
    setAnswers(prev => {
      const copy = { ...prev };
      delete copy[current];
      return copy;
    });
    setStatus(prev => ({ ...prev, [current]: 'notAnswered' }));
  };

  const goNext = () => {
    if (current < questions.length - 1) setCurrent(current + 1);
  };
  const goBack = () => {
    if (current > 0) setCurrent(current - 1);
  };
  const jumpTo = (i) => setCurrent(i);

  // ---- Submit & score ----
  const handleSubmit = async (auto = false) => {
    if (!auto) {
      const ok = window.confirm('Are you sure you want to submit the test?');
      if (!ok) return;
    }
    clearInterval(timerRef.current);
    setSaving(true);

    // merge current unsaved selection
    const finalAnswers = { ...answers };
    if (selected && status[current] !== 'answered' && status[current] !== 'answeredMarked') {
      // don't auto-save unsaved pick unless it was saved; keep strict like NTA
    }

    let correct = 0, wrong = 0, attempted = 0;
    const weak = {};
    const answerRows = [];

    questions.forEach((qq, i) => {
      const sel = finalAnswers[i];
      if (!sel) return; // unanswered = no marks (JEE)
      attempted++;
      const isCorrect = sel === qq.correct_option;
      if (isCorrect) correct++;
      else {
        wrong++;
        weak[qq.topic] = (weak[qq.topic] || 0) + 1;
      }
      answerRows.push({
        question_id: qq.id,
        selected_option: sel,
        is_correct: isCorrect,
        topic: qq.topic,
        subject: qq.subject,
      });
    });

    const marks = correct * MARK_CORRECT + wrong * MARK_WRONG;
    const maxMarks = questions.length * MARK_CORRECT;
    const percent = questions.length ? Math.round((correct / questions.length) * 100) : 0;
    const weakTopics = Object.entries(weak)
      .sort((a, b) => b[1] - a[1])
      .map(([topic, count]) => ({ topic, wrong: count }));

    const resultData = {
      total: questions.length,
      attempted,
      correct,
      wrong,
      unanswered: questions.length - attempted,
      marks,
      maxMarks,
      percent,
      weakTopics,
      timeTaken: totalTime - timeLeft,
      answers: finalAnswers,
    };

    // ---- Save to Supabase ----
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (userId) {
        const { data: attempt, error: aErr } = await supabase
          .from('attempts')
          .insert({
            user_id: userId,
            test_type: isChapter ? 'chapter' : 'mock',
            total_questions: questions.length,
            correct_count: correct,
            score_percent: percent,
            weak_topics: weakTopics,
            time_taken_seconds: totalTime - timeLeft,
          })
          .select()
          .single();

        if (!aErr && attempt) {
          const rows = answerRows.map(r => ({ ...r, attempt_id: attempt.id }));
          if (rows.length) await supabase.from('attempt_answers').insert(rows);
        }
                // Live test — leaderboard ke liye result bhi save karo
        if (isLive && liveTest?.id) {
          await supabase.from('live_test_results').insert({
            test_id: liveTest.id,
            user_id: userId,
            score: marks,
            correct_count: correct,
            time_taken_seconds: totalTime - timeLeft,
          });
        }
      }
    } catch (e) {
      // saving is best-effort; still show result
      console.error('Save failed', e);
    }

    setResult(resultData);
    setSaving(false);
    setStage('result');
  };

  // counts for palette legend
  const counts = { notVisited: 0, notAnswered: 0, answered: 0, marked: 0, answeredMarked: 0 };
  Object.values(status).forEach(s => { counts[s] = (counts[s] || 0) + 1; });

  // ---------- RENDER ----------

  if (stage === 'loading') {
    return <div className="mt-loading">Loading test…</div>;
  }

  if (stage === 'instructions') {
    return (
      <div className="mt-instructions mt-exam">
        <h2 className="mt-inst-title">General Instructions</h2>
        <p className="mt-inst-sub">Please read the instructions carefully</p>

        <ol className="mt-inst-list">
          <li>Total duration of the test is <strong>{Math.round(totalTime / 60)} minutes</strong>.</li>
          <li>The countdown timer at the top will show the remaining time. When it reaches zero, the test ends automatically.</li>
          <li>The Question Palette on the right shows the status of each question using these symbols:
            <div className="mt-legend">
              <span><i className="box grey" /> You have not visited the question yet.</span>
              <span><i className="box red" /> You have not answered the question.</span>
              <span><i className="box green" /> You have answered the question.</span>
              <span><i className="circle purple" /> You have NOT answered, but marked for review.</span>
              <span><i className="circle purple tick" /> Answered and marked for review (will be considered for evaluation).</span>
            </div>
          </li>
          <li>Marking scheme: <strong>+4</strong> for each correct answer, <strong>−1</strong> for each wrong answer. Unanswered questions get 0.</li>
          {isChapter ? (
            <li>This is a <strong>{chapterTopic}</strong> chapter test ({questions.length} questions) from <strong>{chapterSubject}</strong>.</li>
          ) : (
            <li>The test has <strong>3 sections</strong> — Physics, Chemistry, Mathematics (25 questions each, 75 total).</li>
          )}
          <li>Use <strong>Save &amp; Next</strong> to save your answer and move on. <strong>Mark for Review</strong> flags a question to revisit.</li>
          <li>You can move between questions anytime during the test.</li>
        </ol>

        <label className="mt-agree">
          <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
          I have read and understood the instructions and am ready to begin.
        </label>

        <button className="mt-proceed" disabled={!agreed || !questions.length} onClick={startTest}>
          {questions.length ? 'Proceed to Test' : 'No questions available'}
        </button>
        {onExit && (
          <button className="mt-back-link" onClick={onExit}>&laquo; Back to all tests</button>
        )}
      </div>
    );
  }

  if (stage === 'result') {
    const r = result;
    return (
      <div className="mt-result mt-exam">
        <h2 className="mt-result-title">Test Submitted</h2>

        <div className="mt-score-grid">
          <div className="mt-score-card highlight">
            <div className="mt-score-num">{r.marks}<span> / {r.maxMarks}</span></div>
            <div className="mt-score-label">JEE Marks (+4 / −1)</div>
          </div>
          <div className="mt-score-card">
            <div className="mt-score-num">{r.correct}</div>
            <div className="mt-score-label">Correct</div>
          </div>
          <div className="mt-score-card">
            <div className="mt-score-num">{r.wrong}</div>
            <div className="mt-score-label">Wrong</div>
          </div>
          <div className="mt-score-card">
            <div className="mt-score-num">{r.unanswered}</div>
            <div className="mt-score-label">Unanswered</div>
          </div>
        </div>

        <div className="mt-result-meta">
          <span>Attempted: {r.attempted}/{r.total}</span>
          <span>Accuracy: {r.attempted ? Math.round((r.correct / r.attempted) * 100) : 0}%</span>
          <span>Time taken: {formatTime(r.timeTaken)}</span>
        </div>

        {r.weakTopics.length > 0 && (
          <div className="mt-weak">
            <h3>Topics to revise</h3>
            <div className="mt-weak-tags">
              {r.weakTopics.map(w => (
                <span key={w.topic} className="mt-weak-tag">{w.topic} ({w.wrong})</span>
              ))}
            </div>
          </div>
        )}

        <h3 className="mt-review-head">Review your answers</h3>
        <div className="mt-review-list">
          {questions.map((qq, i) => {
            const sel = r.answers[i];
            const isCorrect = sel === qq.correct_option;
            return (
              <div key={i} className="mt-review-item">
                <div className="mt-review-q">
                  <span className="pill pill-orange">{qq.subject}</span>
                  <span className="mt-review-num">Q{i + 1}</span>
                  <MathText>{qq.question_text}</MathText>
                </div>
                <div className="mt-review-ans">
                  {!sel ? (
                    <span className="mt-tag skip">Not answered</span>
                  ) : isCorrect ? (
                    <span className="mt-tag good">Your answer: {sel.toUpperCase()} ✓</span>
                  ) : (
                    <>
                      <span className="mt-tag bad">Your answer: {sel.toUpperCase()} ✗</span>
                      <span className="mt-tag good">Correct: {qq.correct_option.toUpperCase()}</span>
                    </>
                  )}
                </div>
                {qq.explanation && (
                  <div className="mt-review-exp"><strong>Solution:</strong> <MathText>{qq.explanation}</MathText></div>
                )}
              </div>
            );
          })}
        </div>

        <button className="mt-proceed" onClick={() => onExit ? onExit() : window.location.reload()}>
          {onExit ? 'Back to all tests' : 'Take Another Test'}
        </button>
      </div>
    );
  }

  // ---- TEST STAGE ----
  const currentSubject = q?.subject;
  return (
    <div className="mt-test mt-exam">
      {/* NTA-style header strip (Dakhilaa branding) */}
      <div className="mt-header">
        Dakhilaa &mdash; {isChapter ? `${chapterSubject}: ${chapterTopic} Test` : 'JEE Main Pattern Mock Test'}
      </div>

      {/* Candidate bar */}
      <div className="mt-cand-bar">
        <div className="mt-avatar"><span>👤</span></div>
        <div className="mt-cand-info">
          <div>Exam Name : <b>{isChapter ? 'Chapter Test' : 'JEE Main Pattern Mock'}</b></div>
          <div>Subject Name : <b>{isChapter ? chapterTopic : currentSubject}</b></div>
        </div>
        <div className="mt-timer-box">
          Remaining Time
          <span className={`t ${timeLeft < 300 ? 'danger' : ''}`}>{formatTime(timeLeft)}</span>
        </div>
      </div>

      {/* Section tabs — only for full mock (3 subjects) */}
      {!isChapter && (
      <div className="mt-sections">
        {SUBJECTS.map((s, si) => {
          const startIdx = si * PER_SUBJECT;
          const active = currentSubject === s;
          return (
            <button
              key={s}
              className={`mt-section-tab ${active ? 'active' : ''}`}
              onClick={() => jumpTo(startIdx)}
            >
              {s}
            </button>
          );
        })}
      </div>
      )}

      <div className="mt-body">
        {/* Question area */}
        <div className="mt-qarea">
          <div className="mt-qnum">Question {current + 1}:</div>
          <div className="mt-qtext"><MathText>{q.question_text}</MathText></div>

          <div className="mt-options">
            {OPTIONS.map(o => (
              <label key={o} className={`mt-option ${selected === o ? 'sel' : ''}`}>
                <input
                  type="radio"
                  name={`q-${current}`}
                  checked={selected === o}
                  onChange={() => setSelected(o)}
                />
                <span className="mt-opt-letter">{o.toUpperCase()}</span>
                <MathText>{q[`option_${o}`]}</MathText>
              </label>
            ))}
          </div>

          <div className="mt-actions">
            <button className="mt-btn green" onClick={saveAndNext}>Save &amp; Next</button>
            <button className="mt-btn light" onClick={clearResponse}>Clear</button>
            <button className="mt-btn orange" onClick={saveAndMark}>Save &amp; Mark for Review</button>
            <button className="mt-btn blue" onClick={markAndNext}>Mark for Review &amp; Next</button>
          </div>

          <div className="mt-nav">
            <button className="mt-nav-btn" onClick={goBack} disabled={current === 0}>&laquo; Back</button>
            <button className="mt-nav-btn" onClick={goNext} disabled={current === questions.length - 1}>Next &raquo;</button>
            <button className="mt-submit" onClick={() => handleSubmit(false)} disabled={saving}>
              {saving ? 'Submitting…' : 'Submit'}
            </button>
          </div>
        </div>

        {/* Palette */}
        <div className="mt-palette">
          <div className="mt-legend-box">
            <div className="mt-legend small">
              <span><i className="box grey" /> Not Visited ({counts.notVisited})</span>
              <span><i className="box red" /> Not Answered ({counts.notAnswered})</span>
              <span><i className="box green" /> Answered ({counts.answered})</span>
              <span><i className="circle purple" /> Marked ({counts.marked})</span>
              <span><i className="circle purple tick" /> Ans + Marked ({counts.answeredMarked})</span>
            </div>
          </div>

          <div className="mt-palette-grid">
            {questions.map((_, i) => (
              <button
                key={i}
                className={`mt-pbtn ${status[i]} ${i === current ? 'now' : ''}`}
                onClick={() => jumpTo(i)}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
