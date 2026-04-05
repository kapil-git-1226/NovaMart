import { useState, useRef, useEffect } from 'react';
import { aiAPI } from '../api';
import { Send, Bot, User, Sparkles, Terminal, Loader2 } from 'lucide-react';

export default function AiAssistant() {
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: "Hello! I'm Nova, your AI retail assistant. Ask me anything about your store's inventory, sales, or performance.",
      isInitial: true
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const storeId = user.store_id || 1;

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setLoading(true);

    try {
      const res = await aiAPI.post('/ai/query', { query: userText, store_id: storeId });
      setMessages(prev => [...prev, {
        role: 'bot',
        text: `I found ${res.data.row_count} relevant records.`,
        sql: res.data.sql,
        data: res.data.results
      }]);
    } catch (err) {
      const errorMsg = err.response?.data?.detail || "I'm sorry, I couldn't process that request.";
      setMessages(prev => [...prev, { role: 'bot', text: errorMsg, isError: true }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-assistant-container" style={{ animation: 'fadeIn 0.4s ease' }}>
      <div className="ai-chat-window">
        <div className="ai-messages">
          {messages.map((m, i) => (
            <div key={i} className={`message-wrapper ${m.role}`}>
              <div className="message-icon">
                {m.role === 'bot' ? <Bot size={18} /> : <User size={18} />}
              </div>
              <div className="message-content">
                <div className="message-text">{m.text}</div>

                {m.sql && (
                  <div className="message-sql">
                    <div className="sql-header"><Terminal size={12} /> Generated SQL</div>
                    <code>{m.sql}</code>
                  </div>
                )}

                {m.data && m.data.length > 0 && (
                  <div className="message-table-container">
                    <table className="message-table">
                      <thead>
                        <tr>{Object.keys(m.data[0]).map(k => <th key={k}>{k.replace(/_/g, ' ').toUpperCase()}</th>)}</tr>
                      </thead>
                      <tbody>
                        {m.data.slice(0, 10).map((row, ri) => (
                          <tr key={ri}>
                            {Object.values(row).map((v, ci) => (
                              <td key={ci}>{typeof v === 'number' ? v.toLocaleString() : String(v)}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {m.data.length > 10 && <div className="table-footer">Showing first 10 of {m.data.length} rows</div>}
                  </div>
                )}

                {m.isInitial && (
                  <div className="suggested-queries">
                    <button onClick={() => setInput("What are my top 3 selling products?")}>Top 3 products</button>
                    <button onClick={() => setInput("Show me all out of stock items")}>Out of stock</button>
                    <button onClick={() => setInput("Total revenue today")}>Today's Revenue</button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="message-wrapper bot">
              <div className="message-icon"><Bot size={18} /></div>
              <div className="message-content loading">
                <Loader2 size={18} className="animate-spin" />
                <span>Nova is thinking...</span>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        <form className="ai-input-area" onSubmit={handleSend}>
          <div className="input-wrapper">
            <Sparkles className="sparkle-icon" size={18} />
            <input
              placeholder="Ask Nova... (e.g. 'What is my total revenue this month?')"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button type="submit" disabled={!input.trim() || loading}>
              <Send size={18} />
            </button>
          </div>
          <p className="ai-disclaimer">Nova can make mistakes. Verify important data.</p>
        </form>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .ai-assistant-container { height: calc(100vh - 140px); display: flex; flex-direction: column; max-width: 1000px; margin: 0 auto; }
        .ai-chat-window { flex: 1; background: var(--glass-bg); border: 1px solid var(--glass-border); backdrop-filter: blur(10px); border-radius: 16px; display: flex; flex-direction: column; overflow: hidden; box-shadow: var(--glass-shadow); }
        .ai-messages { flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 24px; }
        .message-wrapper { display: flex; gap: 16px; max-width: 85%; }
        .message-wrapper.user { align-self: flex-end; flex-direction: row-reverse; }
        .message-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .bot .message-icon { background: rgba(255,255,255,0.05); border: 1px solid var(--border-subtle); color: var(--text-primary); }
        .user .message-icon { background: var(--bg-card); border: 1px solid var(--border-subtle); color: var(--text-primary); }
        .message-content { display: flex; flex-direction: column; gap: 8px; }
        .message-text { padding: 12px 16px; border-radius: 14px; font-size: 0.95rem; line-height: 1.5; background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); }
        .user .message-text { background: var(--primary-500); color: oklch(0 0 0); border: none; }
        .message-sql { background: var(--bg-body); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 10px; font-family: monospace; font-size: 0.8rem; }
        .sql-header { display: flex; align-items: center; gap: 6px; color: var(--text-muted); font-size: 0.7rem; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.05em; }
        .message-sql code { color: var(--success); }
        .message-table-container { margin-top: 8px; border: 1px solid var(--border-subtle); border-radius: 8px; background: var(--bg-body); overflow-x: auto; }
        .message-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
        .message-table th { text-align: left; padding: 8px 12px; background: rgba(255,255,255,0.05); color: var(--text-muted); font-weight: 600; }
        .message-table td { padding: 8px 12px; border-top: 1px solid var(--border-subtle); color: var(--text-primary); }
        .table-footer { padding: 6px 12px; font-size: 0.7rem; color: var(--text-muted); background: rgba(0,0,0,0.1); }
        .suggested-queries { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px; }
        .suggested-queries button { background: transparent; border: 1px solid var(--border-subtle); color: var(--text-secondary); padding: 6px 12px; border-radius: 20px; font-size: 0.8rem; cursor: pointer; transition: all 0.2s; }
        .suggested-queries button:hover { background: var(--bg-card-hover); border-color: var(--primary-400); color: var(--text-primary); }
        .ai-input-area { padding: 20px; border-top: 1px solid var(--border-subtle); }
        .input-wrapper { position: relative; display: flex; align-items: center; background: var(--bg-input); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 4px 8px; transition: all 0.2s; }
        .input-wrapper:focus-within { border-color: var(--primary-500); box-shadow: 0 0 0 2px var(--border-active); }
        .sparkle-icon { margin-left: 10px; color: var(--primary-500); }
        .input-wrapper input { flex: 1; background: none; border: none; color: var(--text-primary); padding: 12px; outline: none; font-size: 0.95rem; }
        .input-wrapper button { background: var(--primary-500); color: oklch(0 0 0); border: none; width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .input-wrapper button:disabled { background: var(--bg-card); color: var(--text-muted); cursor: not-allowed; }
        .ai-disclaimer { text-align: center; font-size: 0.72rem; color: var(--text-muted); margin-top: 10px; }
        .loading span { font-size: 0.9rem; color: var(--text-secondary); display: flex; align-items: center; gap: 8px; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}
