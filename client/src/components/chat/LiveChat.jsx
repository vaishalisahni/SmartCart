import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import { FiMessageCircle, FiX, FiSend, FiMinus, FiUser, FiCpu } from 'react-icons/fi';
import toast from 'react-hot-toast';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
const API_BASE = import.meta.env.VITE_API_URL || '/api';

function TypingDots() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 12px' }}>
      {[0, 0.2, 0.4].map((d, i) => (
        <div key={i} style={{
          width: '6px', height: '6px', borderRadius: '50%',
          background: '#6b7280',
          animation: 'chatBounce 1.2s ease-in-out infinite',
          animationDelay: `${d}s`,
        }} />
      ))}
      <style>{`@keyframes chatBounce{0%,80%,100%{transform:scale(0.6)}40%{transform:scale(1)}}`}</style>
    </div>
  );
}

async function getAIReply(userMessage, history) {
  try {
    const token = localStorage.getItem('accessToken');
    const res = await fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ message: userMessage, history }),
      signal: AbortSignal.timeout(8000),
    });
    const data = await res.json();
    return data.reply || "I'm not sure about that. Let me connect you to a human agent!";
  } catch {
    return "Sorry, I'm having trouble right now. A human agent will assist you shortly.";
  }
}

const QUICK_REPLIES = [
  'Track my order',
  'Return policy',
  'Payment methods',
  'Cancel order',
];

export default function LiveChat() {
  const { user } = useSelector(s => s.auth);
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [aiTyping, setAiTyping] = useState(false);
  const [humanTyping, setHumanTyping] = useState(false);
  const [mode, setMode] = useState('bot');
  const [unread, setUnread] = useState(0);
  const socketRef = useRef(null);
  const bottomRef = useRef(null);
  const roomId = user ? `user_${user._id}` : null;

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        id: Date.now(),
        text: `Hi ${user?.name?.split(' ')[0] || 'there'}! 👋 I'm SmartCart AI. How can I help you today?`,
        isBot: true,
        isAdmin: false,
        time: new Date(),
      }]);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !user || mode !== 'human') return;
    const socket = io(SOCKET_URL);
    socketRef.current = socket;
    socket.emit('user:join', user._id);
    socket.emit('room:join', roomId);
    socket.on('message:new', (msg) => {
      if (msg.isAdmin) {
        setMessages(prev => [...prev, { ...msg, id: Date.now() }]);
        if (!open || minimized) setUnread(n => n + 1);
      }
    });
    socket.on('typing:update', ({ typing }) => setHumanTyping(typing));
    return () => socket.disconnect();
  }, [open, user, mode]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, aiTyping]);

  useEffect(() => {
    if (open) setUnread(0);
  }, [open]);

  const handleTyping = (val) => {
    setText(val);
    if (mode === 'human' && socketRef.current) {
      socketRef.current.emit('typing:start', { roomId, userName: user.name });
      clearTimeout(window._typingTimer);
      window._typingTimer = setTimeout(
        () => socketRef.current?.emit('typing:stop', { roomId }), 1000
      );
    }
  };

  const sendMessage = async (messageText) => {
    const msg = (messageText || text).trim();
    if (!msg) return;

    const userMsg = { id: Date.now(), text: msg, isBot: false, isAdmin: false, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setText('');

    if (mode === 'bot') {
      const wantsHuman = /human|agent|person|representative|support team/i.test(msg);
      if (wantsHuman) {
        setAiTyping(true);
        await new Promise(r => setTimeout(r, 800));
        setAiTyping(false);
        setMessages(prev => [...prev, {
          id: Date.now(),
          text: "Connecting you to a human support agent now. Please wait a moment...",
          isBot: true, isAdmin: false, time: new Date(),
        }]);
        setMode('human');
        return;
      }

      setAiTyping(true);
      const history = messages.slice(-6).map(m => ({
        role: m.isBot || m.isAdmin ? 'assistant' : 'user',
        content: m.text,
      }));
      const reply = await getAIReply(msg, history);
      setAiTyping(false);
      setMessages(prev => [...prev, {
        id: Date.now(),
        text: reply,
        isBot: true, isAdmin: false, time: new Date(),
      }]);
    } else {
      if (socketRef.current) {
        socketRef.current.emit('message:send', {
          roomId, senderId: user._id, senderName: user.name, text: msg, isAdmin: false,
        });
      }
    }
  };

  if (!user) return null;

  const primaryColor = '#247370';
  const agentColor = '#6366f1';

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 50, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
      {open && !minimized && (
        <div style={{
          width: '340px',
          height: '480px',
          background: 'white',
          borderRadius: '20px',
          boxShadow: '0 20px 60px rgba(0,0,0,.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid rgba(0,0,0,.08)',
        }}>
          {/* Header */}
          <div style={{
            background: `linear-gradient(135deg, ${primaryColor}, #1e5c5a)`,
            color: 'white',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '38px', height: '38px', borderRadius: '50%',
                background: 'rgba(255,255,255,.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid rgba(255,255,255,.3)',
              }}>
                {mode === 'bot' ? <FiCpu size={17} /> : <FiUser size={17} />}
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: '14px', margin: 0, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                  {mode === 'bot' ? 'SmartCart AI' : 'Support Agent'}
                </p>
                <p style={{ fontSize: '11px', opacity: .85, margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
                  {mode === 'bot' ? 'AI Assistant · Online' : 'Live Support'}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {mode === 'human' && (
                <button
                  onClick={() => setMode('bot')}
                  title="Switch to AI"
                  style={{
                    background: 'rgba(255,255,255,.2)', border: '1px solid rgba(255,255,255,.3)',
                    color: 'white', borderRadius: '8px', padding: '4px 8px', fontSize: '11px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '3px',
                  }}
                >
                  <FiCpu size={11} />AI
                </button>
              )}
              <button
                onClick={() => setMinimized(true)}
                style={{ background: 'rgba(255,255,255,.15)', border: 'none', color: 'white', borderRadius: '8px', padding: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <FiMinus size={13} />
              </button>
              <button
                onClick={() => setOpen(false)}
                style={{ background: 'rgba(255,255,255,.15)', border: 'none', color: 'white', borderRadius: '8px', padding: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <FiX size={13} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', background: '#f8fafa' }}>
            {messages.map((m) => (
              <div key={m.id} style={{ display: 'flex', justifyContent: m.isBot || m.isAdmin ? 'flex-start' : 'flex-end' }}>
                {(m.isBot || m.isAdmin) && (
                  <div style={{
                    width: '26px', height: '26px', borderRadius: '50%',
                    background: m.isBot ? primaryColor : agentColor,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginRight: '6px', flexShrink: 0, alignSelf: 'flex-end', marginBottom: '2px',
                  }}>
                    {m.isBot ? <FiCpu size={11} color="white" /> : <FiUser size={11} color="white" />}
                  </div>
                )}
                <div style={{
                  maxWidth: '72%',
                  padding: '9px 13px',
                  borderRadius: m.isBot || m.isAdmin ? '16px 16px 16px 4px' : '16px 16px 4px 16px',
                  background: m.isBot || m.isAdmin ? 'white' : primaryColor,
                  color: m.isBot || m.isAdmin ? '#0a1f1e' : 'white',
                  fontSize: '13px',
                  lineHeight: 1.55,
                  boxShadow: '0 1px 4px rgba(0,0,0,.08)',
                  border: m.isBot || m.isAdmin ? '1px solid rgba(0,0,0,.06)' : 'none',
                }}>
                  {m.text}
                  <div style={{ fontSize: '10px', opacity: .5, marginTop: '3px', textAlign: 'right' }}>
                    {new Date(m.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}

            {(aiTyping || humanTyping) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{
                  width: '26px', height: '26px', borderRadius: '50%',
                  background: aiTyping ? primaryColor : agentColor,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {aiTyping ? <FiCpu size={11} color="white" /> : <FiUser size={11} color="white" />}
                </div>
                <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,.08)', border: '1px solid rgba(0,0,0,.06)' }}>
                  <TypingDots />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick replies */}
          {mode === 'bot' && messages.length <= 1 && (
            <div style={{ padding: '8px 12px', display: 'flex', flexWrap: 'wrap', gap: '6px', borderTop: '1px solid #e8efef', background: 'white' }}>
              {QUICK_REPLIES.map(qr => (
                <button
                  key={qr}
                  onClick={() => sendMessage(qr)}
                  style={{
                    fontSize: '11px', padding: '5px 11px', borderRadius: '999px',
                    border: `1px solid #aeddda`,
                    background: '#eef7f6', color: '#1e5c5a',
                    cursor: 'pointer', fontWeight: 600,
                    transition: 'all .15s',
                  }}
                >
                  {qr}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ padding: '10px 12px', borderTop: '1px solid #e8efef', display: 'flex', gap: '8px', background: 'white' }}>
            <input
              value={text}
              onChange={e => handleTyping(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder={mode === 'bot' ? 'Ask anything…' : 'Message support…'}
              style={{
                flex: 1, padding: '8px 13px', borderRadius: '20px',
                border: '1.5px solid #ddeaea', outline: 'none',
                fontSize: '13px', background: '#f8fafa',
                color: '#0a1f1e', fontFamily: 'Plus Jakarta Sans, sans-serif',
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!text.trim() || aiTyping}
              style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: text.trim() && !aiTyping ? primaryColor : '#e5e7eb',
                border: 'none',
                cursor: text.trim() && !aiTyping ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background .2s',
                flexShrink: 0,
              }}
            >
              <FiSend size={14} color="white" />
            </button>
          </div>
        </div>
      )}

      {/* Minimized bar */}
      {open && minimized && (
        <button
          onClick={() => setMinimized(false)}
          style={{
            background: primaryColor,
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            padding: '10px 16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            fontWeight: 600,
            boxShadow: '0 8px 24px rgba(36,115,112,.4)',
            fontFamily: 'Plus Jakarta Sans, sans-serif',
          }}
        >
          <FiMessageCircle size={16} />
          SmartCart Support
        </button>
      )}

      {/* FAB button */}
      {!open && (
        <button
          onClick={() => { setOpen(true); setMinimized(false); setUnread(0); }}
          style={{
            width: '56px', height: '56px',
            background: primaryColor,
            border: 'none', borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(36,115,112,.4)',
            transition: 'transform .2s',
            position: 'relative',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          aria-label="Open chat"
        >
          <FiMessageCircle size={22} color="white" />
          {unread > 0 && (
            <span style={{
              position: 'absolute', top: '-2px', right: '-2px',
              background: '#ef4444', color: 'white',
              fontSize: '11px', fontWeight: 700,
              width: '18px', height: '18px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
      )}

      {open && !minimized && (
        <button
          onClick={() => setOpen(false)}
          style={{
            width: '56px', height: '56px',
            background: primaryColor,
            border: 'none', borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(36,115,112,.4)',
            transition: 'transform .2s',
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