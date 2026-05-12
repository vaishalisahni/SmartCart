import { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import {
  FiMessageCircle, FiX, FiSend, FiMinus, FiUser,
  FiCpu, FiAlertCircle, FiCheckCircle, FiChevronRight,
} from 'react-icons/fi';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
const API_BASE   = import.meta.env.VITE_API_URL || '/api';

// ── How many consecutive "I don't know" replies before offering escalation ──
const ESCALATION_THRESHOLD = 2;

// ── Phrases that trigger immediate escalation offer ──────────────────────────
const ESCALATION_TRIGGERS = /human|agent|person|representative|support|complaint|manager|help me|not helpful|useless|terrible|frustrated/i;

// ── Phrases that mean bot truly couldn't help ────────────────────────────────
const BOT_UNSURE_MARKERS = /i('m| am) not sure|can't help|cannot help|i don't know|contact.*support|speak.*agent|for.*specific.*order/i;

// ── Quick reply chip sets ────────────────────────────────────────────────────
const INITIAL_CHIPS = ['Track my order', 'Return policy', 'Payment methods', 'Cancel order'];

const CONTEXTUAL_CHIPS = {
  track:   ['Where is my package?', 'Change delivery address', 'Mark as delivered'],
  return:  ['Start a return', 'Refund timeline', 'Exchange item'],
  payment: ['Pay via UPI', 'Is COD available?', 'EMI options'],
  cancel:  ['Cancel before shipping', 'Cancellation charges', 'Refund after cancel'],
  default: ['Talk to a person', 'Track my order', 'Return an item'],
};

function getContextualChips(botReply) {
  const t = (botReply || '').toLowerCase();
  if (t.includes('track') || t.includes('ship') || t.includes('deliver')) return CONTEXTUAL_CHIPS.track;
  if (t.includes('return') || t.includes('refund') || t.includes('exchang')) return CONTEXTUAL_CHIPS.return;
  if (t.includes('payment') || t.includes('pay') || t.includes('upi')) return CONTEXTUAL_CHIPS.payment;
  if (t.includes('cancel')) return CONTEXTUAL_CHIPS.cancel;
  return CONTEXTUAL_CHIPS.default;
}

// ── Typing dots ──────────────────────────────────────────────────────────────
function TypingDots({ color = '#6b7280' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 12px' }}>
      {[0, 0.2, 0.4].map((d, i) => (
        <div key={i} style={{
          width: 6, height: 6, borderRadius: '50%', background: color,
          animation: 'chatBounce 1.2s ease-in-out infinite',
          animationDelay: `${d}s`,
        }} />
      ))}
      <style>{`@keyframes chatBounce{0%,80%,100%{transform:scale(0.6)}40%{transform:scale(1)}}`}</style>
    </div>
  );
}

// ── Escalation card shown inside chat ────────────────────────────────────────
function EscalationCard({ onAccept, onDecline }) {
  return (
    <div style={{
      margin: '4px 0',
      padding: '12px 14px',
      background: 'linear-gradient(135deg,#eef7f6,#dff0ef)',
      border: '1px solid #aeddda',
      borderRadius: 14,
      maxWidth: '88%',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <FiAlertCircle size={14} color="#247370" />
        <span style={{ fontSize: 12, fontWeight: 700, color: '#1e5c5a', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          Connect to a live agent?
        </span>
      </div>
      <p style={{ fontSize: 12, color: '#3d706e', margin: '0 0 10px', lineHeight: 1.5 }}>
        It looks like I'm not fully answering your question. A support agent can help you right now.
      </p>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onAccept} style={{
          flex: 1, padding: '6px 0', borderRadius: 8, border: 'none',
          background: '#247370', color: '#fff', fontSize: 12, fontWeight: 600,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
        }}>
          <FiUser size={11} /> Yes, connect me
        </button>
        <button onClick={onDecline} style={{
          flex: 1, padding: '6px 0', borderRadius: 8,
          border: '1px solid #aeddda', background: 'transparent',
          color: '#247370', fontSize: 12, fontWeight: 600, cursor: 'pointer',
        }}>
          No, keep chatting
        </button>
      </div>
    </div>
  );
}

// ── Status pill ──────────────────────────────────────────────────────────────
function StatusPill({ mode, agentOnline }) {
  const isBot = mode === 'bot';
  return (
    <p style={{ fontSize: 11, opacity: .85, margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: isBot ? '#4ade80' : agentOnline ? '#4ade80' : '#fbbf24',
        display: 'inline-block',
      }} />
      {isBot
        ? 'AI Assistant · Online'
        : agentOnline ? 'Agent connected' : 'Waiting for agent…'
      }
    </p>
  );
}

// ── Render message text with clickable links ─────────────────────────────────
function MessageText({ text }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\[My Orders\]|\[Cart\]|\[Wishlist\]|\[Profile\])/g);
  return (
    <span style={{ fontSize: 13, lineHeight: 1.55 }}>
      {parts.map((p, i) => {
        if (p.startsWith('**') && p.endsWith('**'))
          return <strong key={i}>{p.slice(2, -2)}</strong>;
        const linkMap = { '[My Orders]': '/orders', '[Cart]': '/cart', '[Wishlist]': '/wishlist', '[Profile]': '/profile' };
        if (linkMap[p]) return (
          <a key={i} href={linkMap[p]} style={{ color: '#247370', fontWeight: 600, textDecoration: 'underline' }}>
            {p.slice(1, -1)}
          </a>
        );
        return <span key={i}>{p}</span>;
      })}
    </span>
  );
}

// ── Main API call to backend chat endpoint ───────────────────────────────────
async function getAIReply(userMessage, history, productContext) {
  try {
    const token = localStorage.getItem('accessToken');
    const res = await fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ message: userMessage, history, productContext }),
      signal: AbortSignal.timeout(9000),
    });
    const data = await res.json();
    return data.reply || "I'm not sure about that. Would you like me to connect you to a support agent?";
  } catch {
    return "Sorry, I'm having trouble right now. Would you like me to connect you to a live agent?";
  }
}

// ── Session storage helpers ──────────────────────────────────────────────────
const SESSION_KEY = 'smartcart_chat_session';
function loadSession() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)) || []; } catch { return []; }
}
function saveSession(msgs) {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(msgs.slice(-30))); } catch {}
}

// ════════════════════════════════════════════════════════════════════════════
export default function LiveChat() {
  const { user }     = useSelector(s => s.auth);
  const location     = useLocation();

  const [open, setOpen]           = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages]   = useState([]);
  const [text, setText]           = useState('');
  const [aiTyping, setAiTyping]   = useState(false);
  const [humanTyping, setHumanTyping] = useState(false);
  const [mode, setMode]           = useState('bot');          // 'bot' | 'escalation' | 'human'
  const [agentOnline, setAgentOnline] = useState(false);
  const [unread, setUnread]       = useState(0);
  const [chips, setChips]         = useState(INITIAL_CHIPS);
  const [showChips, setShowChips] = useState(true);
  const [unsureCount, setUnsureCount] = useState(0);

  const socketRef  = useRef(null);
  const bottomRef  = useRef(null);
  const roomId     = user ? `user_${user._id}` : null;

  // ── Detect product page for context injection ─────────────────────────────
  const productIdMatch = location.pathname.match(/\/products\/([a-f0-9]{24})/);
  const currentProductId = productIdMatch?.[1] || null;

  // ── Restore session on mount ──────────────────────────────────────────────
  useEffect(() => {
    const saved = loadSession();
    if (saved.length) {
      setMessages(saved);
      setShowChips(false);
    }
  }, []);

  // ── Welcome message on first open ────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    if (messages.length === 0) {
      const welcome = {
        id: Date.now(), isBot: true, isAdmin: false,
        text: `Hi ${user?.name?.split(' ')[0] || 'there'}! 👋 I'm SmartCart AI. Ask me anything about your orders, returns, or payments.`,
        time: new Date(),
      };
      setMessages([welcome]);
      saveSession([welcome]);
    }
  }, [open]);

  // ── Socket setup for human mode ───────────────────────────────────────────
  useEffect(() => {
    if (!open || !user || mode !== 'human') return;
    const socket = io(SOCKET_URL);
    socketRef.current = socket;
    socket.emit('user:join', user._id);
    socket.emit('room:join', roomId);

    socket.on('agent:connected', () => setAgentOnline(true));
    socket.on('agent:disconnected', () => setAgentOnline(false));

    socket.on('message:new', (msg) => {
      if (!msg.isAdmin) return;
      const newMsg = { ...msg, id: Date.now() };
      setMessages(prev => {
        const updated = [...prev, newMsg];
        saveSession(updated);
        return updated;
      });
      if (minimized) setUnread(n => n + 1);
    });

    socket.on('typing:update', ({ typing }) => setHumanTyping(typing));

    return () => socket.disconnect();
  }, [open, user, mode]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, aiTyping]);
  useEffect(() => { if (open) setUnread(0); }, [open]);

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (override) => {
    const msg = (override || text).trim();
    if (!msg) return;
    setText('');
    setShowChips(false);

    const userMsg = { id: Date.now(), text: msg, isBot: false, isAdmin: false, time: new Date() };
    setMessages(prev => {
      const updated = [...prev, userMsg];
      saveSession(updated);
      return updated;
    });

    // ── Immediate escalation trigger ──
    if (ESCALATION_TRIGGERS.test(msg) && mode === 'bot') {
      await new Promise(r => setTimeout(r, 400));
      offerEscalation();
      return;
    }

    if (mode === 'bot') {
      setAiTyping(true);

      const history = messages.slice(-8).map(m => ({
        role: m.isBot || m.isAdmin ? 'assistant' : 'user',
        content: m.text,
      }));

      const reply = await getAIReply(msg, history, currentProductId);
      setAiTyping(false);

      const botMsg = { id: Date.now(), text: reply, isBot: true, isAdmin: false, time: new Date() };
      setMessages(prev => {
        const updated = [...prev, botMsg];
        saveSession(updated);
        return updated;
      });

      // Update contextual chips
      setChips(getContextualChips(reply));
      setShowChips(true);

      // Track if bot was unsure
      const newUnsureCount = BOT_UNSURE_MARKERS.test(reply) ? unsureCount + 1 : 0;
      setUnsureCount(newUnsureCount);

      if (newUnsureCount >= ESCALATION_THRESHOLD) {
        setTimeout(() => offerEscalation(), 600);
        setUnsureCount(0);
      }

    } else if (mode === 'human') {
      socketRef.current?.emit('message:send', {
        roomId, senderId: user._id, senderName: user.name, text: msg, isAdmin: false,
      });
    }
  }, [text, messages, mode, currentProductId, unsureCount]);

  // ── Escalation offer ──────────────────────────────────────────────────────
  const offerEscalation = () => {
    setMode('escalation');
    const escMsg = {
      id: Date.now() + 1, isBot: true, isAdmin: false,
      isEscalation: true, time: new Date(), text: '',
    };
    setMessages(prev => {
      const updated = [...prev, escMsg];
      saveSession(updated);
      return updated;
    });
    setShowChips(false);
  };

  const acceptEscalation = () => {
    setMode('human');
    const sysMsg = {
      id: Date.now(), isBot: true, isAdmin: false, time: new Date(),
      text: 'Connecting you to a live support agent… Please hold on.',
    };
    setMessages(prev => {
      const updated = prev.filter(m => !m.isEscalation).concat(sysMsg);
      saveSession(updated);
      return updated;
    });
  };

  const declineEscalation = () => {
    setMode('bot');
    setUnsureCount(0);
    const sysMsg = {
      id: Date.now(), isBot: true, isAdmin: false, time: new Date(),
      text: "No problem! I'll keep trying. What else can I help with?",
    };
    setMessages(prev => {
      const updated = prev.filter(m => !m.isEscalation).concat(sysMsg);
      saveSession(updated);
      return updated;
    });
    setChips(INITIAL_CHIPS);
    setShowChips(true);
  };

  // ── Typing indicator for socket ───────────────────────────────────────────
  const handleTyping = (val) => {
    setText(val);
    if (mode === 'human' && socketRef.current) {
      socketRef.current.emit('typing:start', { roomId, userName: user.name });
      clearTimeout(window._typingTimer);
      window._typingTimer = setTimeout(() => socketRef.current?.emit('typing:stop', { roomId }), 1200);
    }
  };

  // ── Colours ───────────────────────────────────────────────────────────────
  const PRIMARY  = '#247370';
  const AGENT_BG = '#6366f1';

  if (!user) return null;

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 50, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>

      {/* ── Chat window ────────────────────────────────────────────────────── */}
      {open && !minimized && (
        <div style={{
          width: 348, background: 'white', borderRadius: 20,
          boxShadow: '0 20px 60px rgba(0,0,0,.15)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          border: '1px solid rgba(0,0,0,.08)',
          maxHeight: '82vh',
        }}>

          {/* Header */}
          <div style={{
            background: `linear-gradient(135deg, ${PRIMARY}, #1e5c5a)`,
            color: 'white', padding: '14px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 38, height: 38, borderRadius: '50%',
                background: 'rgba(255,255,255,.2)', border: '2px solid rgba(255,255,255,.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {mode === 'human' ? <FiUser size={17} /> : <FiCpu size={17} />}
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: 14, margin: 0, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                  {mode === 'human' ? 'Support Agent' : 'SmartCart AI'}
                </p>
                <StatusPill mode={mode} agentOnline={agentOnline} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {mode === 'human' && (
                <button onClick={() => { setMode('bot'); setUnsureCount(0); }} title="Back to AI"
                  style={{ background: 'rgba(255,255,255,.2)', border: '1px solid rgba(255,255,255,.3)', color: 'white', borderRadius: 8, padding: '4px 8px', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <FiCpu size={11} /> AI
                </button>
              )}
              <button onClick={() => setMinimized(true)}
                style={{ background: 'rgba(255,255,255,.15)', border: 'none', color: 'white', borderRadius: 8, padding: 5, cursor: 'pointer', display: 'flex' }}>
                <FiMinus size={13} />
              </button>
              <button onClick={() => setOpen(false)}
                style={{ background: 'rgba(255,255,255,.15)', border: 'none', color: 'white', borderRadius: 8, padding: 5, cursor: 'pointer', display: 'flex' }}>
                <FiX size={13} />
              </button>
            </div>
          </div>

          {/* Product context banner */}
          {currentProductId && mode === 'bot' && (
            <div style={{ background: '#eef7f6', borderBottom: '1px solid #aeddda', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <FiCheckCircle size={12} color="#247370" />
              <span style={{ fontSize: 11, color: '#1e5c5a', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                AI can answer questions about this product
              </span>
            </div>
          )}

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: 8, background: '#f8fafa' }}>
            {messages.map((m) => (
              <div key={m.id}>
                {m.isEscalation ? (
                  <EscalationCard onAccept={acceptEscalation} onDecline={declineEscalation} />
                ) : (
                  <div style={{ display: 'flex', justifyContent: m.isBot || m.isAdmin ? 'flex-start' : 'flex-end' }}>
                    {(m.isBot || m.isAdmin) && (
                      <div style={{
                        width: 26, height: 26, borderRadius: '50%',
                        background: m.isAdmin ? AGENT_BG : PRIMARY,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginRight: 6, flexShrink: 0, alignSelf: 'flex-end', marginBottom: 2,
                      }}>
                        {m.isAdmin ? <FiUser size={11} color="white" /> : <FiCpu size={11} color="white" />}
                      </div>
                    )}
                    <div style={{
                      maxWidth: '74%', padding: '9px 13px',
                      borderRadius: m.isBot || m.isAdmin ? '16px 16px 16px 4px' : '16px 16px 4px 16px',
                      background: m.isBot || m.isAdmin ? 'white' : PRIMARY,
                      color: m.isBot || m.isAdmin ? '#0a1f1e' : 'white',
                      boxShadow: '0 1px 4px rgba(0,0,0,.08)',
                      border: m.isBot || m.isAdmin ? '1px solid rgba(0,0,0,.06)' : 'none',
                    }}>
                      <MessageText text={m.text} />
                      <div style={{ fontSize: 10, opacity: .5, marginTop: 3, textAlign: 'right' }}>
                        {new Date(m.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicators */}
            {(aiTyping || humanTyping) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: aiTyping ? PRIMARY : AGENT_BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {aiTyping ? <FiCpu size={11} color="white" /> : <FiUser size={11} color="white" />}
                </div>
                <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,.08)', border: '1px solid rgba(0,0,0,.06)' }}>
                  <TypingDots color={aiTyping ? PRIMARY : AGENT_BG} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Contextual quick chips */}
          {showChips && mode !== 'human' && chips.length > 0 && (
            <div style={{ padding: '8px 12px', display: 'flex', flexWrap: 'wrap', gap: 6, borderTop: '1px solid #e8efef', background: 'white', flexShrink: 0 }}>
              {chips.map(qr => (
                <button key={qr} onClick={() => sendMessage(qr)} style={{
                  fontSize: 11, padding: '5px 11px', borderRadius: 999,
                  border: '1px solid #aeddda', background: '#eef7f6', color: '#1e5c5a',
                  cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3,
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                }}>
                  {qr} <FiChevronRight size={10} />
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          {mode !== 'escalation' && (
            <div style={{ padding: '10px 12px', borderTop: '1px solid #e8efef', display: 'flex', gap: 8, background: 'white', flexShrink: 0 }}>
              <input
                value={text}
                onChange={e => handleTyping(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder={mode === 'human' ? 'Message agent…' : 'Ask anything…'}
                style={{
                  flex: 1, padding: '8px 13px', borderRadius: 20,
                  border: '1.5px solid #ddeaea', outline: 'none',
                  fontSize: 13, background: '#f8fafa', color: '#0a1f1e',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                }}
              />
              <button onClick={() => sendMessage()} disabled={!text.trim() || aiTyping} style={{
                width: 36, height: 36, borderRadius: '50%',
                background: text.trim() && !aiTyping ? PRIMARY : '#e5e7eb',
                border: 'none', cursor: text.trim() && !aiTyping ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <FiSend size={14} color="white" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Minimised bar ──────────────────────────────────────────────────── */}
      {open && minimized && (
        <button onClick={() => setMinimized(false)} style={{
          background: PRIMARY, color: 'white', border: 'none', borderRadius: 12,
          padding: '10px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 13, fontWeight: 600, boxShadow: '0 8px 24px rgba(36,115,112,.4)',
          fontFamily: 'Plus Jakarta Sans, sans-serif',
        }}>
          <FiMessageCircle size={16} />
          SmartCart Support
          {unread > 0 && (
            <span style={{ background: '#ef4444', color: 'white', fontSize: 11, fontWeight: 700, width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
      )}

      {/* ── FAB ────────────────────────────────────────────────────────────── */}
      {!open && (
        <button onClick={() => { setOpen(true); setMinimized(false); setUnread(0); }}
          style={{
            width: 56, height: 56, background: PRIMARY, border: 'none', borderRadius: '50%',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(36,115,112,.4)', transition: 'transform .2s', position: 'relative',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          aria-label="Open chat"
        >
          <FiMessageCircle size={22} color="white" />
          {unread > 0 && (
            <span style={{ position: 'absolute', top: -2, right: -2, background: '#ef4444', color: 'white', fontSize: 11, fontWeight: 700, width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
      )}

      {/* ── Close FAB when open ───────────────────────────────────────────── */}
      {open && !minimized && (
        <button onClick={() => setOpen(false)} style={{
          width: 56, height: 56, background: PRIMARY, border: 'none', borderRadius: '50%',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(36,115,112,.4)', transition: 'transform .2s',
        }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          aria-label="Close chat"
        >
          <FiX size={22} color="white" />
        </button>
      )}
    </div>
  );
}