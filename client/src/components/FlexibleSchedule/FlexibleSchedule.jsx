import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import './FlexibleSchedule.css';

const SUBJECTS = ['Physics', 'Chemistry', 'Maths'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  const diff = Math.round((target - today) / (1000 * 60 * 60 * 24));
  return diff;
}

// Builds a repeating 7-day plan.
// Each day: first block(s) go to weak topics (priority), remaining hours rotate
// through the 3 subjects for general revision.
function generateSchedule(hoursPerDay, weakTopics) {
  const blockLen = 1; // 1-hour blocks, simple and readable
  const totalBlocks = Math.max(1, Math.round(hoursPerDay));

  return DAYS.map((day, dayIdx) => {
    const blocks = [];
    let remaining = totalBlocks;

    // Priority block(s): rotate through weak topics, ~50% of the day's hours
    const weakBlockCount = weakTopics.length ? Math.max(1, Math.floor(totalBlocks * 0.5)) : 0;
    for (let i = 0; i < weakBlockCount && remaining > 0; i++) {
      const topic = weakTopics[(dayIdx + i) % weakTopics.length];
      blocks.push({ type: 'weak', label: `${topic.subject || 'Weak Topic'}: ${topic.topic}`, hours: blockLen });
      remaining -= blockLen;
    }

    // Remaining hours: rotate through subjects for general revision
    let subjIdx = dayIdx;
    while (remaining > 0) {
      const subject = SUBJECTS[subjIdx % SUBJECTS.length];
      blocks.push({ type: 'general', label: `${subject} — practice & revision`, hours: blockLen });
      remaining -= blockLen;
      subjIdx++;
    }

    return { day, blocks };
  });
}

export default function FlexibleSchedule() {
  const [hours, setHours] = useState(4);
  const [examDate, setExamDate] = useState('');
  const [weakTopics, setWeakTopics] = useState([]);
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load saved inputs/schedule (per-browser, so it persists across visits)
  useEffect(() => {
    const saved = localStorage.getItem('dakhilaa_flex_schedule');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setHours(parsed.hours ?? 4);
        setExamDate(parsed.examDate ?? '');
        setSchedule(parsed.schedule ?? null);
      } catch {
        // ignore corrupt data
      }
    }
    loadWeakTopics();
  }, []);

  async function loadWeakTopics() {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) { setLoading(false); return; }

      const { data } = await supabase
        .from('attempts')
        .select('weak_topics')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data?.weak_topics && Array.isArray(data.weak_topics)) {
        setWeakTopics(data.weak_topics.slice(0, 4));
      }
    } catch {
      // no data yet — fine, schedule will just be subject-rotation only
    }
    setLoading(false);
  }

  const build = () => {
    const newSchedule = generateSchedule(hours, weakTopics);
    setSchedule(newSchedule);
    localStorage.setItem(
      'dakhilaa_flex_schedule',
      JSON.stringify({ hours, examDate, schedule: newSchedule })
    );
  };

  const left = daysUntil(examDate);

  if (loading) {
    return <div className="fs-loading">Loading…</div>;
  }

  return (
    <div className="fs">
      <div className="fs-header">
        <div className="fs-badge">FLEXIBLE SCHEDULE</div>
        <h1>Your Adaptive Study Plan</h1>
        <p className="fs-sub">
          Built from your available time and weak topics — regenerate anytime as your progress changes.
        </p>
      </div>

      <div className="fs-form">
        <div className="fs-field">
          <label>Hours available per day</label>
          <input
            type="number"
            min="1"
            max="12"
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
          />
        </div>
        <div className="fs-field">
          <label>Exam date</label>
          <input
            type="date"
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
          />
        </div>
        <button className="fs-generate" onClick={build}>
          {schedule ? 'Regenerate Plan' : 'Generate My Plan'}
        </button>
      </div>

      {left !== null && (
        <div className="fs-countdown">
          {left > 0 ? `${left} days left until your exam` : left === 0 ? 'Exam is today!' : 'Exam date has passed'}
        </div>
      )}

      {!weakTopics.length && (
        <div className="fs-note">
          No weak-topic data found yet — take the diagnostic or a few chapter tests so this plan can prioritize the right topics. For now it rotates evenly across Physics, Chemistry and Maths.
        </div>
      )}

      {schedule && (
        <div className="fs-week">
          {schedule.map((d) => (
            <div className="fs-day" key={d.day}>
              <div className="fs-day-name">{d.day}</div>
              <div className="fs-blocks">
                {d.blocks.map((b, i) => (
                  <div className={`fs-block ${b.type}`} key={i}>
                    <span className="fs-block-hours">{b.hours}h</span>
                    <span className="fs-block-label">{b.label}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
