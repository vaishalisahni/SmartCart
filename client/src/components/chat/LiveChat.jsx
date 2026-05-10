import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import { FiMessageCircle, FiX, FiSend, FiMinus } from 'react-icons/fi';
import toast from 'react-hot-toast';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export default function LiveChat() {
  const { user } = useSelector(s => s.auth);
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const socketRef = useRef(null);
  const bottomRef = useRef(null);
  const roomId = user ? `user_${user._id}` : null;

  useEffect(() => {
    if (!open || !user) return;
    const socket = io(SOCKET_URL);
    socketRef.current = socket;
    socket.emit('user:join', user._id);
    socket.emit('room:join', roomId);
    socket.on('message:new', (msg) => {
      setMessages(prev => [...prev, msg]);
    });
    socket.on('typing:update', ({ typing: t }) => setTyping(t));
    return () => socket.disconnect();
  }, [open, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!text.trim() || !socketRef.current) return;
    socketRef.current.emit('message:send', {
      roomId, senderId: user._id, senderName: user.name, text, isAdmin: false,
    });
    setText('');
  };

  const handleTyping = (val) => {
    setText(val);
    if (socketRef.current) {
      socketRef.current.emit('typing:start', { roomId, userName: user.name });
      clearTimeout(window._typingTimer);
      window._typingTimer = setTimeout(() => socketRef.current?.emit('typing:stop', { roomId }), 1000);
    }
  };

  if (!user) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && !minimized && (
        <div className="w-80 card shadow-xl flex flex-col overflow-hidden" style={{ height: '420px' }}>
          {/* Header */}
          <div className="bg-primary-600 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full" />
              <span className="font-semibold text-sm">SmartCart Support</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setMinimized(true)} className="text-white/70 hover:text-white"><FiMinus size={14} /></button>
              <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white"><FiX size={14} /></button>
            </div>
          </div>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50 dark:bg-gray-900">
            {messages.length === 0 && (
              <div className="text-center text-gray-400 text-xs mt-8">
                <p className="text-2xl mb-2">👋</p>
                <p>Hi {user.name}! How can we help you today?</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.isAdmin ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[70%] px-3 py-2 rounded-2xl text-sm ${m.isAdmin ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-none' : 'bg-primary-600 text-white rounded-br-none'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-gray-800 px-3 py-2 rounded-2xl rounded-bl-none text-xs text-gray-400">typing...</div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          {/* Input */}
          <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex gap-2">
            <input
              value={text} onChange={e => handleTyping(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message..." className="input text-sm flex-1 py-2"
            />
            <button onClick={sendMessage} className="btn-primary p-2.5 rounded-lg">
              <FiSend size={14} />
            </button>
          </div>
        </div>
      )}
      <button
        onClick={() => { setOpen(!open); setMinimized(false); }}
        className="w-14 h-14 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95"
      >
        {open ? <FiX size={22} /> : <FiMessageCircle size={22} />}
      </button>
    </div>
  );
}