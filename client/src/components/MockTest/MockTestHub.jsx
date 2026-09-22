import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import MockTest from './MockTest';
import AdvancedMockTest from '../AdvancedMock/AdvancedMockTest';
import './MockTestHub.css';

const SUBJECTS = ['Physics', 'Chemistry', 'Maths'];
const MIN_QUESTIONS = 1; // chapters with at least 1 question 

export default function MockTestHub() {
  const [loading, setLoading] = useState(true);
  const [topicMap, setTopicMap] = useState({}); // { Physics: { Kinematics: 8, ... }, ... }
  const [active, setActive] = useState(null);    // null = hub, else { mode, subject, topic }
  const [advancedTestOpen, setAdvancedTestOpen] = useState(false);  // ← ye line add karo
  const [openSubject, setOpenSubject] = useState('Physics');

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('questions')
        .select('subject, topic');
      if (error || !data) { setLoading(false); return; }

      const map = {};
      data.forEach(({ subject, topic }) => {
        if (!subject || !topic) return;
        if (!map[subject]) map[subject] = {};
        map[subject][topic] = (map[subject][topic] || 0) + 1;
      });
      setTopicMap(map);
      setLoading(false);
    }
    load();
  }, []);

  // If a test is active, render MockTest in the chosen mode
 if (active) {
    return (
      <MockTest
        mode={active.mode}
        chapterSubject={active.subject}
        chapterTopic={active.topic}
        onExit={() => setActive(null)}
      />
    );
  }

  if (advancedTestOpen) {
    return <AdvancedMockTest onExit={() => setAdvancedTestOpen(false)} />;
  }

  if (loading) {
    return <div className="hub-loading">Loading tests…</div>;
  }

  const startMock = () => setActive({ mode: 'mock' });
  const startChapter = (subject, topic) =>
    setActive({ mode: 'chapter', subject, topic });

  return (
    <div className="hub">
      {/* ---------- FULL MOCK TESTS ---------- */}
      <div className="hub-section-head">
        <h2>Full Mock Tests</h2>
        <p>Full-length JEE Main pattern test — 75 questions, 3 hours, +4 / −1 marking.</p>
      </div>

      <div className="hub-mock-grid">
        <div className="hub-mock-card">
          <span className="hub-badge free">JEE Main Pattern</span>
          <h3>Full Mock Test 1</h3>
          <ul className="hub-mock-meta">
            <li>75 Questions</li>
            <li>180 minutes</li>
            <li>+4 / −1 marking</li>
            <li>25 each: Physics, Chemistry, Maths</li>
          </ul>
          <button className="hub-start-btn" onClick={startMock}>Start Test</button>
        </div>
      
           <div className="hub-mock-card">
         <span className="hub-badge free">JEE Advanced Pattern</span>
          <h3>Full Mock Test 2</h3>
          <ul className="hub-mock-meta">
            <li>36 Questions across 12 sections</li>
            <li>180 minutes</li>
            <li>MCQ / MSQ / Numerical / Matching</li>
            <li>Sample questions — real bank coming soon</li>
          </ul>
          <button className="hub-start-btn" onClick={() => setAdvancedTestOpen(true)}>Start Test</button>
        </div>
      </div>

      {/* ---------- CHAPTER-WISE TESTS ---------- */}
      <div className="hub-section-head" style={{ marginTop: 32 }}>
        <h2>Chapter-wise Tests</h2>
        <p>Practice one chapter at a time. Choose a subject, then a chapter.</p>
      </div>

      {/* subject tabs */}
      <div className="hub-subject-tabs">
        {SUBJECTS.map(s => (
          <button
            key={s}
            className={`hub-subject-tab ${openSubject === s ? 'active' : ''}`}
            onClick={() => setOpenSubject(s)}
          >
            {s}
          </button>
        ))}
      </div>

      {/* chapter cards for the open subject */}
      <div className="hub-chapter-grid">
        {Object.entries(topicMap[openSubject] || {})
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([topic, count]) => {
            const enough = count >= MIN_QUESTIONS;
            const testSize = Math.min(count, 15);
            return (
              <div key={topic} className={`hub-chapter-card ${enough ? '' : 'soon'}`}>
                <h4>{topic}</h4>
                {enough ? (
                  <>
                    <p className="hub-chapter-count">{testSize} questions · {testSize} min</p>
                    <button
                      className="hub-chapter-btn"
                      onClick={() => startChapter(openSubject, topic)}
                    >
                      Start Test
                    </button>
                  </>
                ) : (
                  <>
                    <p className="hub-chapter-count muted">Only {count} question{count === 1 ? '' : 's'} yet</p>
                    <span className="hub-soon-tag">Coming soon</span>
                  </>
                )}
              </div>
            );
          })}
        {(!topicMap[openSubject] || Object.keys(topicMap[openSubject]).length === 0) && (
          <div className="hub-empty">No chapters found for {openSubject}.</div>
        )}
      </div>
    </div>
  );
}
