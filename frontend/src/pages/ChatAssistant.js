import { useState, useRef, useEffect } from 'react';
import { sendGeminiMessage } from '../config/gemini';

const suggestions = [
  'How do I check in a guest?',
  'What rooms are available?',
  'How to handle check-out?',
  'Guide me through creating an invoice',
  'How does the waitlist work?',
  'Managing food orders?',
];

export default function ChatAssistant() {
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Hello! I\'m Otel.Pro AI. Ask me anything about hotel operations.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (text) => {
    const msg = text || input;
    if (!msg.trim()) return;
    setInput('');
    setMessages(h => [...h, { role: 'user', text: msg }]);
    setLoading(true);
    const res = await sendGeminiMessage(msg, 'Otel.Pro staff assistant', 'staff');
    setMessages(h => [...h, { role: 'ai', text: res.text }]);
    setLoading(false);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>AI Assistant</h1>
          <p>Powered by Google Gemini</p>
        </div>
      </div>

      <div className="chat-container">
        <div className="chat-messages">
          {messages.length === 1 && (
            <div className="chat-suggestions">
              <p className="text-muted mb-1">Try asking:</p>
              <div className="suggestion-chips">
                {suggestions.map((s, i) => (
                  <button key={i} className="suggestion-chip" onClick={() => handleSend(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.slice(1).map((m, i) => (
            <div key={i} className={`chat-bubble ${m.role}`}>
              {m.role === 'ai' && <div className="bubble-avatar"><i className="fas fa-robot"></i></div>}
              <div className="bubble-text">{m.text}</div>
            </div>
          ))}
          {loading && (
            <div className="chat-bubble ai">
              <div className="bubble-avatar"><i className="fas fa-robot"></i></div>
              <div className="bubble-text typing"><i className="fas fa-spinner fa-spin"></i> Thinking...</div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        <div className="chat-input-bar">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Ask about hotel operations..."
            className="form-control"
          />
          <button className="btn btn-primary" onClick={() => handleSend()} disabled={loading || !input.trim()}>
            <i className="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>

      <style>{`
        .chat-container {
          background: var(--bg-card);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow);
          display: flex;
          flex-direction: column;
          height: calc(100vh - 200px);
        }
        .chat-messages {
          flex: 1; padding: 24px; overflow-y: auto;
          display: flex; flex-direction: column; gap: 12px;
        }
        .chat-suggestions { margin-bottom: 8px; }
        .suggestion-chips { display: flex; flex-wrap: wrap; gap: 8px; }
        .suggestion-chip {
          padding: 8px 16px; border-radius: 100px;
          border: 1.5px solid var(--border); background: var(--white);
          font-size: 0.8rem; cursor: pointer; color: var(--text-secondary);
          transition: var(--transition);
        }
        .suggestion-chip:hover { border-color: var(--primary); color: var(--primary); background: rgba(26,26,46,0.03); }
        .chat-bubble {
          display: flex; gap: 10px; max-width: 80%;
        }
        .chat-bubble.user {
          align-self: flex-end; flex-direction: row-reverse;
        }
        .bubble-avatar {
          width: 32px; height: 32px; border-radius: 50%;
          background: var(--primary); color: var(--white);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; font-size: 0.85rem;
        }
        .chat-bubble.user .bubble-avatar { background: var(--accent); }
        .bubble-text {
          padding: 10px 14px; border-radius: 12px;
          font-size: 0.9rem; line-height: 1.5; white-space: pre-wrap;
        }
        .chat-bubble.user .bubble-text {
          background: var(--primary); color: var(--white);
          border-bottom-right-radius: 4px;
        }
        .chat-bubble.ai .bubble-text {
          background: var(--bg);
          border-bottom-left-radius: 4px;
        }
        .typing { color: var(--text-muted); }
        .chat-input-bar {
          display: flex; gap: 12px; padding: 16px 24px;
          border-top: 1px solid var(--border);
        }
        .chat-input-bar input { flex: 1; }
      `}</style>
    </div>
  );
}
