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
        .ai-chat-window { flex: 1; background: rgba(15,25,53,0.4); border: 1px solid rgba(100,140,220,0.15); backdrop-filter: blur(10px); border-radius: 16px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.3); }
        .ai-messages { flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 24px; }
        .message-wrapper { display: flex; gap: 16px; max-width: 85%; }
        .message-wrapper.user { align-self: flex-end; flex-direction: row-reverse; }
        .message-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .bot .message-icon { background: linear-gradient(135deg, #3b82f633, #2dd4bf33); border: 1px solid #3b82f655; color: #60a5fa; }
        .user .message-icon { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #e5e7eb; }
        .message-content { display: flex; flex-direction: column; gap: 8px; }
        .message-text { padding: 12px 16px; border-radius: 14px; font-size: 0.95rem; line-height: 1.5; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); }
        .user .message-text { background: var(--primary-500); color: white; border: none; }
        .message-sql { background: #050b1a; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 10px; font-family: monospace; font-size: 0.8rem; }
        .sql-header { display: flex; align-items: center; gap: 6px; color: #94a3b8; font-size: 0.7rem; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.05em; }
        .message-sql code { color: #34d399; }
        .message-table-container { margin-top: 8px; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; background: rgba(0,0,0,0.2); overflow-x: auto; }
        .message-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
        .message-table th { text-align: left; padding: 8px 12px; background: rgba(255,255,255,0.05); color: #94a3b8; font-weight: 600; }
        .message-table td { padding: 8px 12px; border-top: 1px solid rgba(255,255,255,0.05); color: #e2e8f0; }
        .table-footer { padding: 6px 12px; font-size: 0.7rem; color: #64748b; background: rgba(0,0,0,0.1); }
        .suggested-queries { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px; }
        .suggested-queries button { background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.2); color: #60a5fa; padding: 6px 12px; border-radius: 20px; font-size: 0.8rem; cursor: pointer; transition: all 0.2s; }
        .suggested-queries button:hover { background: rgba(59,130,246,0.2); border-color: #60a5fa; }
        .ai-input-area { padding: 20px; border-top: 1px solid rgba(100,140,220,0.15); }
        .input-wrapper { position: relative; display: flex; align-items: center; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 4px 8px; transition: all 0.2s; }
        .input-wrapper:focus-within { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.2); }
        .sparkle-icon { margin-left: 10px; color: #60a5fa; }
        .input-wrapper input { flex: 1; background: none; border: none; color: white; padding: 12px; outline: none; font-size: 0.95rem; }
        .input-wrapper button { background: #3b82f6; color: white; border: none; width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .input-wrapper button:disabled { background: #334155; color: #64748b; cursor: not-allowed; }
        .ai-disclaimer { text-align: center; font-size: 0.72rem; color: #64748b; margin-top: 10px; }
        .loading span { font-size: 0.9rem; color: #94a3b8; display: flex; align-items: center; gap: 8px; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}
