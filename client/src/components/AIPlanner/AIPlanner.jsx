import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import robotImg from '../../assets/ROBOT.jpeg';
import './AIPlanner.css';

// Rotating placeholders for the input box
const PLACEHOLDERS = [
  'How can I help you today?',
  'Solve your weak topics…',
  'Ask me anything about JEE',
  'Get started — type your doubt',
];

// Simple rule-based reply engine.
// (Later this can be swapped for a real Claude API call via a backend function.)
function buildReply(text, weakTopics) {
  const q = text.toLowerCase();
  const weakList = weakTopics.length
    ? weakTopics.map((w) => w.topic).join(', ')
    : null;

  if (q.includes('weak') || q.includes('kya padh') || q.includes('what should')) {
    if (weakList) {
      return `Based on your recent tests, your weak topics are: ${weakList}. I'd suggest starting a chapter test on the first one today, then reviewing the solutions carefully.`;
    }
    return `Take the diagnostic or a few chapter tests first — then I can point out exactly which topics are costing you the most marks.`;
  }

  if (q.includes('plan') || q.includes('schedule') || q.includes('routine')) {
    return buildStudyPlan(weakTopics);
  }

  if (q.includes('motivat') || q.includes('give up') || q.includes('tired') || q.includes('stress')) {
    return `Every topper struggled at some point — consistency beats intensity. Do just one focused chapter test right now; small wins add up. You've got this.`;
  }

  if (q.includes('hello') || q.includes('hi') || q.includes('hey')) {
    return weakList
      ? `Hi! I can see your weak topics are ${weakList}. Want a quick plan to fix them?`
      : `Hi! Ask me what to study, or tell me a topic you're stuck on.`;
  }

  // default
  return `Good question! For "${text}", I'd suggest breaking it into smaller concepts and practising 5-10 targeted questions. Want me to recommend a chapter test for this?`;
}

// Builds a detailed multi-day study plan from the user's weak topics.
function buildStudyPlan(weakTopics) {
  if (!weakTopics.length) {
    return `I don't have your weak topics yet. Take the 15-minute diagnostic or a couple of chapter tests first — then I'll build a plan targeting exactly what's costing you marks.`;
  }

  const lines = [];
  lines.push(`Here's your personalized ${weakTopics.length}-topic plan, ordered by where you're losing the most marks:`);
  lines.push('');

  weakTopics.forEach((w, i) => {
    const day = i + 1;
    const wrong = w.wrong ? ` (${w.wrong} wrong last time)` : '';
    lines.push(`Day ${day} — ${w.topic}${wrong}`);
    lines.push(`  1. Do a chapter test on ${w.topic} (10 questions).`);
    lines.push(`  2. Read the solution for every question you miss — write the key idea in your own words.`);
    lines.push(`  3. Re-attempt the ones you got wrong the next morning.`);
    lines.push('');
  });

  const nextDay = weakTopics.length + 1;
  lines.push(`Day ${nextDay} — Mixed revision`);
  lines.push(`  Take a full mock test. Check if your weak topics improved, and I'll adjust the plan.`);
  lines.push('');
  lines.push(`Tip: consistency beats cramming — one focused topic a day is enough. Want me to start today's chapter test?`);

  return lines.join('\n');
}

export default function AIPlanner() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [weakTopics, setWeakTopics] = useState([]);
  const [improvedTopics, setImprovedTopics] = useState([]);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [thinking, setThinking] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const scrollRef = useRef(null);

  // Set up speech recognition once (browser Web Speech API)
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return; // not supported in this browser
    const rec = new SR();
    rec.lang = 'en-IN';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      const said = e.results[0][0].transcript;
      setListening(false);
      send(said); // send the spoken doubt straight to the bot
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleMic = () => {
    const rec = recognitionRef.current;
    if (!rec) {
      alert('Voice input works best in Chrome. Please type your doubt instead.');
      return;
    }
    if (listening) {
      rec.stop();
      setListening(false);
    } else {
      try {
        rec.start();
        setListening(true);
      } catch {
        setListening(false);
      }
    }
  };

  // Rotate the placeholder text every 2.5s
  useEffect(() => {
    const t = setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % PLACEHOLDERS.length);
    }, 2500);
    return () => clearInterval(t);
  }, []);

  // Load the user's weak topics + detect improvement across attempts
  useEffect(() => {
    async function load() {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;
        if (!userId) return;
        // pull the two most recent attempts to compare progress
        const { data } = await supabase
          .from('attempts')
          .select('weak_topics, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(2);

        if (data && data.length) {
          const latest = Array.isArray(data[0]?.weak_topics) ? data[0].weak_topics : [];
          setWeakTopics(latest.slice(0, 3));

          // compare with the previous attempt to find improved topics
          if (data.length > 1 && Array.isArray(data[1]?.weak_topics)) {
            const prevTopics = data[1].weak_topics.map((w) => w.topic);
            const stillWeak = latest.map((w) => w.topic);
            const improved = prevTopics.filter((t) => !stillWeak.includes(t));
            setImprovedTopics(improved);
          }
        }
      } catch {
        // no data yet — fine
      }
    }
    load();
  }, []);

  // Greeting message once weak topics are known
  useEffect(() => {
    let greeting;
    const improvedLine = improvedTopics.length
      ? `Great progress — you've improved on ${improvedTopics.join(', ')}! `
      : '';
    if (weakTopics.length) {
      greeting = `${improvedLine}Your current weak topics are ${weakTopics.map((w) => w.topic).join(', ')}. What should we work on?`;
    } else if (improvedTopics.length) {
      greeting = `${improvedLine}No major weak topics right now — keep it up! Want a mixed revision plan?`;
    } else {
      greeting = `Hi! I'm your study buddy. Ask me what to study, or tell me a topic you're stuck on.`;
    }
    setMessages([{ from: 'bot', text: greeting }]);
  }, [weakTopics, improvedTopics]);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages, thinking]);

  const send = (text) => {
    const msg = (text ?? input).trim();
    if (!msg) return;
    setMessages((m) => [...m, { from: 'user', text: msg }]);
    setInput('');
    setThinking(true);
    // small delay so it feels like the bot is "thinking"
    setTimeout(() => {
      const reply = buildReply(msg, weakTopics);
      setMessages((m) => [...m, { from: 'bot', text: reply }]);
      setThinking(false);
    }, 700);
  };

  const quick = (label) => send(label);

  // Optional voice output — speaks the last bot message
  const speak = (text) => {
    if (!('speechSynthesis' in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  };

  return (
    <div className="aip">
      {/* Robot avatar with motion */}
      <div className="aip-robot-wrap">
        <div className="aip-robot-glow" />
        <img src={robotImg} alt="Dakhilaa AI robot" className="aip-robot" />
      </div>

      <div className="aip-title">Dakhilaa AI Planner</div>
      <div className="aip-subtitle">Your study buddy · always here</div>

      {/* Chat area */}
      <div className="aip-chat" ref={scrollRef}>
        {messages.map((m, i) => (
          <div key={i} className={`aip-msg ${m.from}`}>
            {m.text}
            {m.from === 'bot' && (
              <button className="aip-speak" onClick={() => speak(m.text)} title="Listen">
                <span>🔊</span>
              </button>
            )}
          </div>
        ))}
        {thinking && <div className="aip-msg bot aip-typing">Thinking…</div>}
      </div>

      {/* Quick suggestion chips */}
      <div className="aip-quick">
        <button onClick={() => quick('Make a detailed study plan for me')}>📋 Get my study plan</button>
        <button onClick={() => quick('What should I study today?')}>Solve my weak topics</button>
        <button onClick={() => quick('I need some motivation')}>Motivate me</button>
      </div>

      {/* Input box */}
      <div className="aip-input-row">
        <button
          className={`aip-mic ${listening ? 'on' : ''}`}
          onClick={toggleMic}
          aria-label="Speak your doubt"
          title="Speak your doubt"
        >
          🎤
        </button>
        <input
          className="aip-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder={listening ? 'Listening… speak now' : PLACEHOLDERS[placeholderIdx]}
        />
        <button className="aip-send" onClick={() => send()} aria-label="Send">↑</button>
      </div>
    </div>
  );
}
