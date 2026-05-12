import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import API from '../../services/api';
import { useSelector } from 'react-redux';
import { FiSend, FiMessageCircle, FiUser, FiCpu, FiZap } from 'react-icons/fi';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
const API_BASE   = import.meta.env.VITE_API_URL || '/api';

// ── Fetch an AI-drafted reply suggestion ─────────────────────────────────────
async function getDraftReply(userMessage, history) {
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
    return data.reply || '';
  } catch {
    return '';
  }
}

export default function AdminChat() {
  const { user } = useSelector(s => s.auth);
  const [rooms, setRooms]         = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages]   = useState([]);
  const [text, setText]           = useState('');
  const [drafting, setDrafting]   = useState(false);
  const socketRef = useRef(null);
  const bottomRef = useRef(null);

  // ── Load rooms & connect socket ───────────────────────────────────────────
  useEffect(() => {
    fetchRooms();
    const socket = io(SOCKET_URL);
    socketRef.current = socket;
    socket.emit('user:join', user._id);

    // Notify the user's room that an agent connected
    socket.on('room:join', (roomId) => {
      socket.emit('agent:connected', { roomId });
    });

    // When a new message arrives in any room, refresh room list for unread badge
    socket.on('message:new', (msg) => {
      if (!msg.isAdmin) {
        fetchRooms();
        // If it's in the active room, append it
        setActiveRoom(prev => {
          if (prev && msg.roomId === prev._id) {
            setMessages(m => [...m, msg]);
          }
          return prev;
        });
      }
    });

    return () => socket.disconnect();
  }, []);

  const fetchRooms = () => {
    API.get('/chat/admin/rooms').then(r => setRooms(r.data.rooms)).catch(() => {});
  };

  // ── Select room ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!activeRoom) return;
    API.get(`/chat/rooms/${activeRoom._id}/messages`).then(r => {
      setMessages(r.data.messages);
    });
    socketRef.current?.emit('room:join', activeRoom._id);
    socketRef.current?.emit('agent:connected', { roomId: activeRoom._id });

    const handler = msg => {
      if (msg.roomId === activeRoom._id) {
        setMessages(prev => [...prev, msg]);
      }
      fetchRooms();
    };
    socketRef.current?.on('message:new', handler);
    return () => socketRef.current?.off('message:new', handler);
  }, [activeRoom]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // ── Send ─────────────────────────────────────────────────────────────────
  const sendMessage = () => {
    if (!text.trim() || !activeRoom) return;
    socketRef.current?.emit('message:send', {
      roomId: activeRoom._id,
      senderId: user._id,
      senderName: 'SmartCart Support',
      text,
      isAdmin: true,
    });
    setText('');
    fetchRooms();
  };

  // ── AI Draft suggestion ───────────────────────────────────────────────────
  const handleAIDraft = async () => {
    const lastUserMsg = [...messages].reverse().find(m => !m.isAdmin);
    if (!lastUserMsg) return;
    setDrafting(true);
    const history = messages.slice(-10).map(m => ({
      role: m.isAdmin ? 'assistant' : 'user',
      content: m.text,
    }));
    const draft = await getDraftReply(lastUserMsg.text, history);
    if (draft) setText(draft);
    setDrafting(false);
  };

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // ── Relative time helper ──────────────────────────────────────────────────
  const relTime = (ts) => {
    if (!ts) return '';
    const diff = Date.now() - new Date(ts).getTime();
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">Live Chat</h1>
        <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5">
          {rooms.length} conversation{rooms.length !== 1 ? 's' : ''} · AI draft assist enabled
        </p>
      </div>

      <div className="flex flex-1 gap-4 min-h-0 overflow-hidden">

        {/* ── Room list ──────────────────────────────────────────────────── */}
        <div className="w-64 flex-shrink-0 bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-surface-100 dark:border-surface-700 flex items-center justify-between">
            <p className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">Conversations</p>
            <button onClick={fetchRooms} className="text-xs text-primary-600 dark:text-primary-400 hover:underline">Refresh</button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {rooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 gap-2 text-surface-400 dark:text-surface-500">
                <FiMessageCircle size={20} />
                <p className="text-xs">No conversations yet</p>
              </div>
            ) : rooms.map(r => (
              <button key={r._id} onClick={() => setActiveRoom(r)}
                className={`w-full text-left px-4 py-3.5 border-b border-surface-100 dark:border-surface-700 transition-colors last:border-0 ${
                  activeRoom?._id === r._id
                    ? 'bg-primary-50 dark:bg-primary-900/20 border-l-2 border-l-primary-500'
                    : 'hover:bg-surface-50 dark:hover:bg-surface-700/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center flex-shrink-0">
                      <FiUser size={12} className="text-primary-600 dark:text-primary-400" />
                    </div>
                    <p className="font-semibold text-sm text-surface-800 dark:text-surface-200 truncate max-w-[100px]">
                      {r.senderName}
                    </p>
                  </div>
                  {r.unread > 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-600 text-white">
                      {r.unread}
                    </span>
                  )}
                </div>
                {r.lastMessage && (
                  <p className="text-xs text-surface-500 dark:text-surface-400 truncate pl-9">{r.lastMessage}</p>
                )}
                <p className="text-[10px] text-surface-400 dark:text-surface-500 pl-9 mt-0.5">{relTime(r.lastTime)}</p>
              </button>
            ))}
          </div>
        </div>

        {/* ── Chat area ─────────────────────────────────────────────────── */}
        <div className="flex-1 bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 flex flex-col overflow-hidden min-h-0">
          {activeRoom ? (
            <>
              {/* Header */}
              <div className="px-5 py-3.5 border-b border-surface-100 dark:border-surface-700 flex items-center justify-between bg-surface-50 dark:bg-surface-700/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
                    <FiUser size={14} className="text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-surface-800 dark:text-surface-200">{activeRoom.senderName}</p>
                    <p className="text-xs text-emerald-500 dark:text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block" />
                      You are connected as agent
                    </p>
                  </div>
                </div>
                {/* AI Draft button */}
                <button
                  onClick={handleAIDraft}
                  disabled={drafting}
                  title="AI: draft a reply to the last user message"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-700 hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors disabled:opacity-50"
                >
                  {drafting ? (
                    <span className="w-3 h-3 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
                  ) : (
                    <FiZap size={12} />
                  )}
                  {drafting ? 'Drafting…' : 'AI Draft'}
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-surface-50 dark:bg-surface-900/30">
                {messages.length === 0 && (
                  <div className="flex items-center justify-center h-full text-surface-400 dark:text-surface-500 text-sm">
                    No messages yet — start the conversation
                  </div>
                )}
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.isAdmin ? 'justify-end' : 'justify-start'}`}>
                    {!m.isAdmin && (
                      <div className="w-6 h-6 rounded-full bg-surface-200 dark:bg-surface-700 flex items-center justify-center mr-2 flex-shrink-0 self-end">
                        <FiUser size={10} className="text-surface-500 dark:text-surface-400" />
                      </div>
                    )}
                    <div className={`max-w-[70%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      m.isAdmin
                        ? 'bg-primary-600 text-white rounded-br-sm'
                        : 'bg-white dark:bg-surface-800 text-surface-800 dark:text-surface-200 border border-surface-200 dark:border-surface-700 rounded-bl-sm'
                    }`}>
                      {m.text}
                      <div className={`text-[10px] mt-1 ${m.isAdmin ? 'text-white/60' : 'text-surface-400 dark:text-surface-500'}`}>
                        {m.createdAt ? relTime(m.createdAt) : ''}
                        {m.isAdmin && ' · You'}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t border-surface-100 dark:border-surface-700 flex gap-2">
                <textarea
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a reply… (Enter to send, Shift+Enter for new line)"
                  rows={2}
                  className="flex-1 px-3.5 py-2.5 border border-surface-300 dark:border-surface-600 rounded-xl bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm resize-none"
                />
                <button
                  onClick={sendMessage}
                  disabled={!text.trim()}
                  className="p-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-surface-200 dark:disabled:bg-surface-700 text-white disabled:text-surface-400 rounded-xl transition-colors disabled:cursor-not-allowed self-end"
                >
                  <FiSend size={15} />
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-surface-400 dark:text-surface-500">
              <div className="w-14 h-14 bg-surface-100 dark:bg-surface-700 rounded-2xl flex items-center justify-center">
                <FiMessageCircle size={24} />
              </div>
              <div className="text-center">
                <p className="font-medium text-surface-600 dark:text-surface-400">Select a conversation</p>
                <p className="text-sm text-surface-400 dark:text-surface-500 mt-0.5">
                  Use the <strong>AI Draft</strong> button to auto-compose replies
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}