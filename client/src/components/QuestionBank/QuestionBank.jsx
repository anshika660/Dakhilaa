import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import MathText from '../MathText';
import './QuestionBank.css';

const OPTIONS = ['a', 'b', 'c', 'd'];
const SUBJECTS = ['All', 'Physics', 'Chemistry', 'Maths'];
const LEVELS = ['All', 'easy', 'medium', 'hard'];

export default function QuestionBank() {
  const [subject, setSubject] = useState('All');
  const [level, setLevel] = useState('All');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);   // option user clicked
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState({ correct: 0, done: 0 });

  // Fetch questions when filters change
  useEffect(() => {
    setLoading(true);
        let query = supabase.from('questions').select('*').limit(20000);
    if (subject !== 'All') query = query.eq('subject', subject);
    if (level !== 'All') query = query.eq('difficulty', level);

    query.then(({ data, error }) => {
      console.log('QB COUNT:', data?.length, 'error:', error);
      let list = (!error && data) ? data : [];
      // shuffle so questions don't repeat in the same order
      list = list.sort(() => Math.random() - 0.5);
      setQuestions(list);
      setIdx(0);
      setPicked(null);
      setRevealed(false);
      setScore({ correct: 0, done: 0 });
      setLoading(false);
    });
  }, [subject, level]);

  const q = questions[idx];

  const choose = (opt) => {
    if (revealed) return;              // lock after answering
    setPicked(opt);
    setRevealed(true);
    setScore(s => ({
      correct: s.correct + (opt === q.correct_option ? 1 : 0),
      done: s.done + 1,
    }));
  };

  const next = () => {
    setPicked(null);
    setRevealed(false);
    setIdx(i => (i + 1) % questions.length); // loop back at end
  };

  return (
    <div className="qb">
      <div className="qb-head">
        <div>
          <div className="section-title" style={{ textAlign: 'left', fontSize: 22 }}>
            Question Bank 
          </div>
          <p className="qb-sub">Practice by subject and difficulty. Instant feedback.</p>
        </div>
        {score.done > 0 && (
          <div className="qb-score">
            {score.correct}/{score.done} correct
          </div>
        )}
      </div>

      <div className="qb-filters">
        <div className="qb-filter-group">
          {SUBJECTS.map(s => (
            <button
              key={s}
              className={`qb-chip ${subject === s ? 'active' : ''}`}
              onClick={() => setSubject(s)}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="qb-filter-group">
          {LEVELS.map(l => (
            <button
              key={l}
              className={`qb-chip ${level === l ? 'active' : ''}`}
              onClick={() => setLevel(l)}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="qb-empty">Loading questions…</div>
      ) : !questions.length ? (
        <div className="qb-empty">
          No questions for this filter yet. Try a different subject or level.
        </div>
      ) : (
        <div className="qb-card">
          <div className="qb-meta">
            <span className="pill pill-orange">{q.subject}</span>
            <span className={`diff-tag diff-${q.difficulty}`}>{q.difficulty}</span>
            <span className="qb-count">Question {idx + 1} of {questions.length}</span>
          </div>

          <div className="qb-question"><MathText>{q.question_text}</MathText></div>

          <div className="qb-options">
            {OPTIONS.map(o => {
              const isCorrect = o === q.correct_option;
              const isPicked = o === picked;
              let cls = 'qb-option';
              if (revealed && isCorrect) cls += ' correct';
              else if (revealed && isPicked && !isCorrect) cls += ' wrong';
              return (
                <button key={o} className={cls} onClick={() => choose(o)} disabled={revealed}>
                  <span className="qb-option-letter">{o.toUpperCase()}</span>
                  <MathText>{q[`option_${o}`]}</MathText>
                </button>
              );
            })}
          </div>

         {revealed && (
            <>
              <div className={`qb-feedback ${picked === q.correct_option ? 'good' : 'bad'}`}>
                {picked === q.correct_option
                  ? '✓ Correct!'
                  : `✗ Correct answer is ${q.correct_option.toUpperCase()}`}
              </div>
              {q.explanation && (
                <div className="qb-explanation">
                  <strong>Solution:</strong> <MathText>{q.explanation}</MathText>
                </div>
              )}
            </>
          )}
          <div className="qb-nav">
            <button
              className="header-btn header-btn-primary"
              onClick={next}
              disabled={!revealed}
            >
              Next Question →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
