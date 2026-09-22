import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import './AdvancedMockTest.css';

// ===== SECTION CONFIG (matches real JEE Advanced Paper 1 pattern) =====
const SUBJECTS = ['Maths', 'Physics', 'Chemistry'];
const SECTION_TYPES = [
  { num: 1, type: 'mcq', label: 'Sec 1', count: 4, marksCorrect: 3, marksWrong: 1,
    rule: 'This section contains FOUR (04) questions. Each question has FOUR options (A), (B), (C) and (D). ONLY ONE is correct.\nFull Marks: +3 if only correct option is chosen\nZero Marks: 0 if unanswered\nNegative Marks: −1 in all other cases' },
  { num: 2, type: 'msq', label: 'Sec 2', count: 3, marksCorrect: 4, marksWrong: 2,
    rule: 'This section contains THREE (03) questions. Each question has FOUR options, ONE OR MORE of which are correct.\nFull Marks: +4 if all correct options are chosen\nPartial Marks: +1 to +3 for each correct option chosen (no wrong option chosen)\nZero Marks: 0 if unanswered\nNegative Marks: −2 if any wrong option is chosen' },
  { num: 3, type: 'numerical', label: 'Sec 3', count: 3, marksCorrect: 4, marksWrong: 0,
    rule: 'This section contains THREE (03) questions. The answer is a NUMERICAL VALUE.\nFull Marks: +4 if correct value entered\nZero Marks: 0 in all other cases (no negative marking)' },
  { num: 4, type: 'matching', label: 'Sec 4', count: 3, marksCorrect: 4, marksWrong: 1,
    rule: 'This section contains THREE (03) Matching List Sets. Each set has TWO lists: List-I and List-II. FOUR options are given, ONLY ONE of which satisfies the condition.\nFull Marks: +4 if only correct combination is chosen\nZero Marks: 0 if unanswered\nNegative Marks: −1 in all other cases' },
];

function buildSections() {
  const sections = [];
  SUBJECTS.forEach((subject) => {
    SECTION_TYPES.forEach((st) => {
      sections.push({
        id: `${subject}-Sec${st.num}`,
        subject,
        ...st,
      });
    });
  });
  return sections;
}

// Fallback sample questions so the UI is fully testable before real
// Advanced-pattern questions are added to Supabase.
const SAMPLE = {
  mcq: (i) => ({
    text: `Sample MCQ question ${i + 1}. Consider the matrix P representing a linear transformation. Which of the following statements is correct?`,
    options: ['32', '8', '16', '24'],
    correct: 'a',
  }),
  msq: (i) => ({
    text: `Sample MSQ question ${i + 1}. Which of the following statement(s) is/are correct? (One or more may be correct.)`,
    options: ['Option A is correct', 'Option B is correct', 'Option C is correct', 'Option D is correct'],
    correct: ['a', 'c'],
  }),
  numerical: (i) => ({
    text: `Sample Numerical question ${i + 1}. Find the value of x that satisfies the given equation. Enter your answer as a number.`,
    correct: 4,
  }),
  matching: (i) => ({
    text: `Sample Matching question ${i + 1}.\n\nList-I\n(P) Item 1\n(Q) Item 2\n(R) Item 3\n(S) Item 4\n\nList-II\n(1) Match A\n(2) Match B\n(3) Match C\n(4) Match D`,
    options: [
      'P→1; Q→2; R→3; S→4',
      'P→2; Q→1; R→4; S→3',
      'P→3; Q→4; R→1; S→2',
      'P→4; Q→3; R→2; S→1',
    ],
    correct: 'a',
  }),
};

async function loadQuestionsForSection(section) {
  try {
    const { data } = await supabase
      .from('questions')
      .select('*')
      .eq('subject', section.subject)
      .eq('exam_type', 'advanced')
      .eq('question_type', section.type)
      .limit(section.count);

    if (data && data.length >= section.count) {
      return data.slice(0, section.count).map((q) => ({
        text: q.question_text,
        options: [q.option_a, q.option_b, q.option_c, q.option_d],
        correct: section.type === 'msq' ? (q.correct_options || []) : q.correct_option,
        correctValue: q.correct_value,
      }));
    }
  } catch {
    // table/columns may not exist yet — fall back to samples
  }
  // Fallback: sample questions
  return Array.from({ length: section.count }, (_, i) => SAMPLE[section.type](i));
}

function formatTime(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function AdvancedMockTest({ onExit }) {
  const sections = useRef(buildSections()).current;
  const [loading, setLoading] = useState(true);
  const [questionsBySection, setQuestionsBySection] = useState({});
  const [sectionIdx, setSectionIdx] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [status, setStatus] = useState({});
  const [timeLeft, setTimeLeft] = useState(3 * 60 * 60);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);

  const section = sections[sectionIdx];
  const key = `${section.id}-${qIdx}`;
  const q = questionsBySection[section.id]?.[qIdx];

  useEffect(() => {
    async function loadAll() {
      const map = {};
      for (const s of sections) {
        map[s.id] = await loadQuestionsForSection(s);
      }
      setQuestionsBySection(map);
      setLoading(false);
    }
    loadAll();
  }, []);

  useEffect(() => {
    if (submitted || loading) return;
    const t = setInterval(() => {
      setTimeLeft((s) => {
        if (s <= 1) { clearInterval(t); handleSubmit(); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [submitted, loading]);

  const setAnswer = (value) => {
    setAnswers((a) => ({ ...a, [key]: value }));
  };

  const clearResponse = () => {
    setAnswers((a) => { const copy = { ...a }; delete copy[key]; return copy; });
    setStatus((s) => ({ ...s, [key]: 'notAnswered' }));
  };

  const goTo = (sIdx, questionIdx) => {
    setSectionIdx(sIdx);
    setQIdx(questionIdx);
  };

  const saveAndNext = (markReview = false) => {
    const hasAnswer = answers[key] !== undefined && answers[key] !== '' &&
      !(Array.isArray(answers[key]) && answers[key].length === 0);
    setStatus((s) => ({
      ...s,
      [key]: hasAnswer ? (markReview ? 'answeredMarked' : 'answered') : (markReview ? 'marked' : 'notAnswered'),
    }));

    if (qIdx < section.count - 1) {
      setQIdx(qIdx + 1);
    } else if (sectionIdx < sections.length - 1) {
      setSectionIdx(sectionIdx + 1);
      setQIdx(0);
    }
  };

  const scoreMCQ = (correct, given) => {
    if (given === undefined) return 0;
    return given === correct ? section.marksCorrect : -section.marksWrong;
  };

  const scoreMSQ = (correctArr, givenArr) => {
    if (!givenArr || givenArr.length === 0) return 0;
    const wrongChosen = givenArr.some((g) => !correctArr.includes(g));
    if (wrongChosen) return -section.marksWrong;
    if (givenArr.length === correctArr.length) return section.marksCorrect;
    return givenArr.length;
  };

  const scoreNumerical = (correctVal, given) => {
    if (given === undefined || given === '') return 0;
    const num = parseFloat(given);
    if (isNaN(num)) return 0;
    return Math.abs(num - correctVal) < 0.01 ? section.marksCorrect : 0;
  };

  function handleSubmit() {
    let total = 0;
    const bySubject = { Maths: 0, Physics: 0, Chemistry: 0 };
    let attempted = 0, correct = 0;

    sections.forEach((s) => {
      const qs = questionsBySection[s.id] || [];
      qs.forEach((question, i) => {
        const k = `${s.id}-${i}`;
        const given = answers[k];
        let marks = 0;
        if (s.type === 'mcq' || s.type === 'matching') {
          marks = scoreMCQ(question.correct, given);
          if (given !== undefined) { attempted++; if (given === question.correct) correct++; }
        } else if (s.type === 'msq') {
          marks = scoreMSQ(question.correct, given);
          if (given && given.length) attempted++;
        } else if (s.type === 'numerical') {
          marks = scoreNumerical(question.correct ?? question.correctValue, given);
          if (given !== undefined && given !== '') attempted++;
        }
        total += marks;
        bySubject[s.subject] += marks;
      });
    });

    setResult({ total, bySubject, attempted, correct });
    setSubmitted(true);
  }

  if (loading) {
    return <div className="amt-loading">Loading JEE Advanced Mock Exam…</div>;
  }

  if (submitted && result) {
    return (
      <div className="amt-result">
        <div className="amt-result-badge">JEE ADVANCED 2026 — Paper 1 Mock Exam</div>
        <h2>Test Submitted</h2>
        <div className="amt-result-total">{result.total} <span>marks</span></div>
        <div className="amt-result-grid">
          {Object.entries(result.bySubject).map(([subj, marks]) => (
            <div className="amt-result-card" key={subj}>
              <div className="amt-result-subject">{subj}</div>
              <div className="amt-result-marks">{marks}</div>
            </div>
          ))}
        </div>
        <p className="amt-result-note">Attempted: {result.attempted} questions</p>
        <button className="amt-result-exit" onClick={onExit}>Back to Mock Tests</button>
      </div>
    );
  }

  const statusCounts = { answered: 0, notAnswered: 0, notVisited: 0, marked: 0, answeredMarked: 0 };
  sections.forEach((s) => {
    for (let i = 0; i < s.count; i++) {
      const st = status[`${s.id}-${i}`];
      if (st === 'answered') statusCounts.answered++;
      else if (st === 'notAnswered') statusCounts.notAnswered++;
      else if (st === 'marked') statusCounts.marked++;
      else if (st === 'answeredMarked') statusCounts.answeredMarked++;
      else statusCounts.notVisited++;
    }
  });

  return (
    <div className="amt">
      <div className="amt-topbar">
        <div className="amt-topbar-title">JEE Advanced 2026 Paper 1 Mock Exam</div>
        <div className="amt-timer">Time Left: {formatTime(timeLeft)}</div>
      </div>

      <div className="amt-body">
        <div className="amt-main">
          <div className="amt-tabs">
            {sections.map((s, i) => (
              <button
                key={s.id}
                className={`amt-tab ${i === sectionIdx ? 'active' : ''}`}
                onClick={() => goTo(i, 0)}
              >
                {s.subject.slice(0, 4)} {s.label}
              </button>
            ))}
          </div>

          <div className="amt-qtype-bar">
            Question Type: {section.type.toUpperCase()}
            <span className="amt-marks-info">
              Marks for correct: {section.marksCorrect} | Negative: {section.marksWrong}
            </span>
          </div>

          <div className="amt-question-area">
            <div className="amt-qnum">Question No. {qIdx + 1}</div>

            <div className="amt-rule-box">
              <strong>SECTION {section.num}</strong>
              {section.rule.split('\n').map((line, i) => <div key={i}>{line}</div>)}
            </div>

            <div className="amt-question-text">{q?.text}</div>

            {section.type === 'mcq' || section.type === 'matching' ? (
              <div className="amt-options">
                {['a', 'b', 'c', 'd'].map((letter, i) => (
                  <label key={letter} className="amt-option">
                    <input
                      type="radio"
                      name={key}
                      checked={answers[key] === letter}
                      onChange={() => setAnswer(letter)}
                    />
                    {q?.options?.[i]}
                  </label>
                ))}
              </div>
            ) : section.type === 'msq' ? (
              <div className="amt-options">
                {['a', 'b', 'c', 'd'].map((letter, i) => {
                  const selected = answers[key] || [];
                  return (
                    <label key={letter} className="amt-option">
                      <input
                        type="checkbox"
                        checked={selected.includes(letter)}
                        onChange={() => {
                          const next = selected.includes(letter)
                            ? selected.filter((x) => x !== letter)
                            : [...selected, letter];
                          setAnswer(next);
                        }}
                      />
                      {q?.options?.[i]}
                    </label>
                  );
                })}
              </div>
            ) : (
              <div className="amt-numerical">
                <input
                  type="number"
                  step="any"
                  value={answers[key] ?? ''}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Enter numerical value"
                />
              </div>
            )}
          </div>

          <div className="amt-actions">
            <button onClick={() => saveAndNext(true)}>Mark for Review & Next</button>
            <button onClick={clearResponse}>Clear Response</button>
            <button className="amt-save" onClick={() => saveAndNext(false)}>Save & Next</button>
          </div>
        </div>

        <div className="amt-side">
          <div className="amt-status-grid">
            <div><span className="dot green" />{statusCounts.answered} Answered</div>
            <div><span className="dot red" />{statusCounts.notAnswered} Not Answered</div>
            <div><span className="dot gray" />{statusCounts.notVisited} Not Visited</div>
            <div><span className="dot purple" />{statusCounts.marked} Marked</div>
          </div>

          <div className="amt-side-section">{section.subject} {section.label}</div>
          <div className="amt-palette">
            {Array.from({ length: section.count }, (_, i) => {
              const st = status[`${section.id}-${i}`] || 'notVisited';
              return (
                <button
                  key={i}
                  className={`amt-pnum ${st} ${i === qIdx ? 'current' : ''}`}
                  onClick={() => goTo(sectionIdx, i)}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>

          <button className="amt-submit" onClick={handleSubmit}>Submit</button>
        </div>
      </div>
    </div>
  );
}
