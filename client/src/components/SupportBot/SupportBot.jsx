import { useState, useRef, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import './SupportBot.css';

// Fast rule-based answers for common questions.
// Returns null if nothing matches confidently — caller then falls back to real Claude API.
function ruleBasedReply(text) {
  const q = text.toLowerCase();

  if (q.includes('price') || q.includes('cost') || q.includes('fee') || q.includes('₹') || q.includes('paisa')) {
    return `We have 3 yearly plans — Mains Prep ₹799, Advanced Prep ₹899, and the Mains + Advanced Bundle ₹1099. All include a free 15-minute diagnostic test to try first. Want me to open the pricing section?`;
  }

  if (q.includes('refund') || q.includes('cancel') || q.includes('money back')) {
    return `For refund or cancellation requests, please email us at Support@dakhilaa.com with your registered email and order details — our team will help you directly.`;
  }

  if (q.includes('signup') || q.includes('sign up') || q.includes('register') || q.includes('account') || q.includes('login')) {
    return `Signing up is free — click "Free Test" at the top, enter your email, and you'll get instant access to the 15-minute diagnostic. No card needed to start.`;
  }

  if (q.includes('diagnostic') || q.includes('test kaise') || q.includes('how does it work') || q.includes('kaise kaam')) {
    return `The diagnostic is a free 15-minute test covering Physics, Chemistry and Maths. Based on your answers, we identify your exact weak topics and show a personalized report — no payment needed.`;
  }

  if (q.includes('college predictor') || q.includes('cutoff') || q.includes('rank')) {
    return `Our College Predictor estimates which colleges you can target based on your score and past-year cutoff trends. It's available on any paid plan, or you can try a preview from the landing page.`;
  }

  if (q.includes('hi') || q.includes('hello') || q.includes('hey')) {
    return `Hi! I can help with pricing, signup, refunds, or how Dakhilaa works — or ask me any doubt. What would you like to know?`;
  }

  // No confident match — signal caller to use the real AI fallback
  return null;
}

// Real Claude API call via Supabase Edge Function (for anything rules can't answer,
// e.g. subject doubts, unusual phrasing, multi-part questions).
async function aiReply(text) {
  try {
    const { data, error } = await supabase.functions.invoke('chat-support', {
      body: { message: text },
    });
    if (error || !data?.reply) {
      return `I couldn't reach the AI assistant right now. Please email Support@dakhilaa.com and we'll help directly.`;
    }
    return data.reply;
  } catch {
    return `I couldn't reach the AI assistant right now. Please email Support@dakhilaa.com and we'll help directly.`;
  }
}

async function buildReply(text) {
  const ruleAnswer = ruleBasedReply(text);
  if (ruleAnswer) return ruleAnswer;
  return await aiReply(text);
}

const QUICK_CHIPS = ['Pricing', 'How does it work?', 'Refund policy', 'Signup process'];

export default function SupportBot() {
  const [open, setOpen] = useState(false);
  const [priority, setPriority] = useState(false);
  const [messages, setMessages] = useState([
    { from: 'bot', text: `Hi! I'm the Dakhilaa Assistant. Ask me about pricing, signup, refunds, or how things work.` },
  ]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef(null);

  // Allow other parts of the app (e.g. the "Priority Support" benefit card)
  // to open this chat in priority mode via a custom event.
  useEffect(() => {
    const handler = () => {
      setPriority(true);
      setOpen(true);
      setMessages((m) =>
        m.length === 1
          ? [{ from: 'bot', text: `Hi! As a paid member, your questions get priority attention here. Ask me anything, or for anything urgent, email Support@dakhilaa.com and we'll get back to you first.` }]
          : m
      );
    };
    window.addEventListener('openSupportBot', handler);
    return () => window.removeEventListener('openSupportBot', handler);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages, thinking, open]);

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
    <>
      <button className="sbot-fab" onClick={() => setOpen((o) => !o)} aria-label="Chat with us">
        {open ? '✕' : '💬'}
      </button>

      {open && (
        <div className="sbot-panel">
          <div className="sbot-header">
            {priority && <div className="sbot-priority-badge">⚡ Priority Support</div>}
            <div className="sbot-header-title">Dakhilaa Assistant</div>
            <div className="sbot-header-sub">
              {priority ? 'Urgent? Email Support@dakhilaa.com' : 'Usually replies instantly'}
            </div>
          </div>

          <div className="sbot-chat" ref={scrollRef}>
            {messages.map((m, i) => (
              <div key={i} className={`sbot-msg ${m.from}`}>{m.text}</div>
            ))}
            {thinking && <div className="sbot-msg bot sbot-typing">Typing…</div>}
          </div>

          <div className="sbot-quick">
            {QUICK_CHIPS.map((c) => (
              <button key={c} onClick={() => send(c)}>{c}</button>
            ))}
          </div>

          <div className="sbot-input-row">
            <input
              className="sbot-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Type your question…"
            />
            <button className="sbot-send" onClick={() => send()} aria-label="Send">↑</button>
          </div>
        </div>
      )}
    </>
  );
}
