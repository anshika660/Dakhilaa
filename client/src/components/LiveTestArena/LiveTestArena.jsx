import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import MockTest from '../MockTest/MockTest';
import './LiveTestArena.css';

function formatCountdown(ms) {
  if (ms <= 0) return null;
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds };
}

export default function LiveTestArena() {
  const [upcomingTest, setUpcomingTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());
  const [testStarted, setTestStarted] = useState(false);

  // Load the next upcoming scheduled test
  useEffect(() => {
    async function loadTest() {
           // "Live window" = scheduled_at se duration_minutes tak. Us window ke baad wale tests chhod do.
      // Simple: sabse recent/upcoming test lो jiska window abhi khatam nahi hua.
      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from('scheduled_tests')
        .select('*')
        .order('scheduled_at', { ascending: true });

      let chosen = null;
      if (!error && data) {
        const nowMs = Date.now();
        for (const test of data) {
          const start = new Date(test.scheduled_at).getTime();
          const end = start + (test.duration_minutes || 180) * 60 * 1000;
          // upcoming ya abhi-live test chuno (jiska end abhi nahi nikla)
          if (end > nowMs) { chosen = test; break; }
        }
      }
      if (chosen) setUpcomingTest(chosen);

      setLoading(false);
    }
    loadTest();
  }, []);

  // Tick every second for the countdown
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

    // Test shuru — MockTest live mode kholo
  if (testStarted && upcomingTest) {
    return (
      <MockTest
        mode="live"
        liveTest={upcomingTest}
        onExit={() => setTestStarted(false)}
      />
    );
  }

  if (loading) {
    return <div className="lta-loading">Loading…</div>;
  }

  if (!upcomingTest) {
    return (
      <div className="lta">
        <div className="lta-empty">
          <div className="lta-empty-icon">🏆</div>
          <h2>Live Test Arena</h2>
          <p>No live test is scheduled right now. Check back soon — competitive, exam-day-style tests with an all-India leaderboard are coming here.</p>
        </div>
      </div>
    );
  }

   const scheduledTime = new Date(upcomingTest.scheduled_at).getTime();
  const endTime = scheduledTime + (upcomingTest.duration_minutes || 180) * 60 * 1000;
  const diff = scheduledTime - now;
  const countdown = formatCountdown(diff);

  // Lifecycle status
  const isOver = now > endTime;          // window khatam
  const isLiveNow = !countdown && !isOver; // shuru ho gaya, khatam nahi
  return (
    <div className="lta">
      <div className="lta-header">
        <div className="lta-badge">LIVE TEST ARENA</div>
        <h1>{upcomingTest.title}</h1>
        <p className="lta-sub">
          {upcomingTest.duration_minutes} minutes · Exam-style full-screen test · All-India leaderboard after submit
        </p>
      </div>

            {countdown ? (
        <div className="lta-countdown">
          <div className="lta-countdown-label">Starts in</div>
          <div className="lta-countdown-timer">
            {countdown.days > 0 && (
              <div className="lta-time-block">
                <span className="lta-num">{countdown.days}</span>
                <span className="lta-unit">days</span>
              </div>
            )}
            <div className="lta-time-block">
              <span className="lta-num">{String(countdown.hours).padStart(2, '0')}</span>
              <span className="lta-unit">hrs</span>
            </div>
            <div className="lta-time-block">
              <span className="lta-num">{String(countdown.minutes).padStart(2, '0')}</span>
              <span className="lta-unit">min</span>
            </div>
            <div className="lta-time-block">
              <span className="lta-num">{String(countdown.seconds).padStart(2, '0')}</span>
              <span className="lta-unit">sec</span>
            </div>
          </div>
        </div>
      ) : isLiveNow ? (
        <div className="lta-live-now">
          <div className="lta-live-dot" />
          Test is live now — join before time runs out!
        </div>
      ) : (
        <div className="lta-live-now">
          Test has ended. Check back for the next one.
        </div>
      )}

         <button
        className="lta-cta"
        disabled={!isLiveNow}
        onClick={() => setTestStarted(true)}
      >
        {countdown ? 'Test not started yet' : isLiveNow ? 'Enter Test' : 'Test ended'}
      </button>
    </div>
  );
}