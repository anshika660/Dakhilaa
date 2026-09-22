import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import './PrioritySupport.css';

// Fast rule-based answers for common questions.
// Returns null if nothing matches confidently — caller then falls back to real Claude API.
function ruleBasedReply(text) {
  const q = text.toLowerCase();

  if (q.includes('price') || q.includes('cost') || q.includes('fee') || q.includes('₹') || q.includes('paisa')) {
    return `We have 3 yearly plans — Mains Prep ₹799, Advanced Prep ₹899, and the Mains + Advanced Bundle ₹1099. All include a free 15-minute diagnostic test to try first.`;
  }
  if (q.includes('refund') || q.includes('cancel') || q.includes('money back')) {
    return `For refund or cancellation requests, please email Support@dakhilaa.com with your registered email and order details — as a priority member, we'll respond to you first.`;
  }
  if (q.includes('signup') || q.includes('sign up') || q.includes('register') || q.includes('account') || q.includes('login')) {
    return `Signing up is free — click "Free Test" at the top, enter your email, and you'll get instant access to the 15-minute diagnostic.`;
  }
  if (q.includes('diagnostic') || q.includes('test kaise') || q.includes('how does it work') || q.includes('kaise kaam')) {
    return `The diagnostic is a free 15-minute test covering Physics, Chemistry and Maths, and identifies your exact weak topics.`;
  }
  if (q.includes('college predictor') || q.includes('cutoff') || q.includes('rank')) {
    return `Our College Predictor estimates which colleges you can target based on your score and past-year cutoff trends.`;
  }
  if (q.includes('hi') || q.includes('hello') || q.includes('hey')) {
    return `Hi! As a paid member your questions get priority attention here. What would you like help with?`;
  }
  return null;
}

async function aiReply(text) {
  try {
    const { data, error } = await supabase.functions.invoke('chat-support', {
      body: { message: text },
    });
    if (error || !data?.reply) {
      return `I couldn't reach the AI assistant right now. Please email Support@dakhilaa.com — as a priority member, we'll get back to you first.`;
    }
    return data.reply;
  } catch {
    return `I couldn't reach the AI assistant right now. Please email Support@dakhilaa.com — as a priority member, we'll get back to you first.`;
  }
}

async function buildReply(text) {
  const ruleAnswer = ruleBasedReply(text);
  if (ruleAnswer) return ruleAnswer;
  return await aiReply(text);
}

const QUICK_CHIPS = ['Pricing', 'Refund policy', 'Signup process', 'How does it work?'];

export default function PrioritySupport() {
  const [messages, setMessages] = useState([
    {
      from: 'bot',
      text: `Hi! As a paid member, your questions get priority attention here. Ask me anything, or for anything urgent, email Support@dakhilaa.com and we'll get back to you first.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages, thinking]);

  const send = async (text) => {
    const msg = (text ?? input).trim();
    if (!msg) return;
    setMessages((m) => [...m, { from: 'user', text: msg }]);
    setInput('');
    setThinking(true);
    const reply = await buildReply(msg);
    setMessages((m) => [...m, { from: 'bot', text: reply }]);
    setThinking(false);
  };

  return (
    <div className="psup">
      <div className="psup-header">
        <div className="psup-badge">⚡ PRIORITY SUPPORT</div>
        <div className="psup-title">Dakhilaa Assistant</div>
        <div className="psup-sub">Urgent? Email Support@dakhilaa.com — priority members get answered first</div>
      </div>

      <div className="psup-chat" ref={scrollRef}>
        {messages.map((m, i) => (
          <div key={i} className={`psup-msg ${m.from}`}>{m.text}</div>
        ))}
        {thinking && <div className="psup-msg bot psup-typing">Typing…</div>}
      </div>

      <div className="psup-quick">
        {QUICK_CHIPS.map((c) => (
          <button key={c} onClick={() => send(c)}>{c}</button>
        ))}
      </div>

      <div className="psup-input-row">
        <input
          className="psup-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Type your question…"
        />
        <button className="psup-send" onClick={() => send()} aria-label="Send">↑</button>
      </div>
    </div>
  );
}
