import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import API from '../../services/api';
import { useSelector } from 'react-redux';
import { FiSend, FiMessageCircle, FiUser } from 'react-icons/fi';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export default function AdminChat() {
  const { user } = useSelector(s => s.auth);
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const socketRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    API.get('/chat/admin/rooms').then(r => setRooms(r.data.rooms));
    const socket = io(SOCKET_URL);
    socketRef.current = socket;
    socket.emit('user:join', user._id);
    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    if (!activeRoom) return;
    API.get(`/chat/rooms/${activeRoom._id}/messages`).then(r => setMessages(r.data.messages));
    socketRef.current?.emit('room:join', activeRoom._id);
    const handler = msg => {
      if (msg.roomId === activeRoom._id) setMessages(prev => [...prev, msg]);
    };
    socketRef.current?.on('message:new', handler);
    return () => socketRef.current?.off('message:new', handler);
  }, [activeRoom]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
  };

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">Live Chat</h1>
        <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5">Manage customer support conversations</p>
      </div>

      <div className="flex flex-1 gap-4 min-h-0 overflow-hidden">
        {/* Room list */}
        <div className="w-64 flex-shrink-0 bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-surface-100 dark:border-surface-700">
            <p className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
              Conversations ({rooms.length})
            </p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {rooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 gap-2 text-surface-400 dark:text-surface-500">
                <FiMessageCircle size={20} />
                <p className="text-xs">No conversations yet</p>
              </div>
            ) : rooms.map(r => (
              <button
                key={r._id}
                onClick={() => setActiveRoom(r)}
                className={`w-full text-left px-4 py-3.5 border-b border-surface-100 dark:border-surface-700 transition-colors last:border-0 ${
                  activeRoom?._id === r._id
                    ? 'bg-primary-50 dark:bg-primary-900/20 border-l-2 border-l-primary-500'
                    : 'hover:bg-surface-50 dark:hover:bg-surface-700/50'
                }`}
              >
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center flex-shrink-0">
                    <FiUser size={12} className="text-primary-600 dark:text-primary-400" />
                  </div>
                  <p className="font-semibold text-sm text-surface-800 dark:text-surface-200 truncate">{r.senderName}</p>
                </div>
                {r.lastMessage && (
                  <p className="text-xs text-surface-500 dark:text-surface-400 truncate pl-9">{r.lastMessage}</p>
                )}
                {r.unread > 0 && (
                  <div className="mt-1.5 pl-9">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-600 text-white">
                      {r.unread} new
                    </span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 flex flex-col overflow-hidden min-h-0">
          {activeRoom ? (
            <>
              {/* Header */}
              <div className="px-5 py-3.5 border-b border-surface-100 dark:border-surface-700 flex items-center gap-3 bg-surface-50 dark:bg-surface-700/50">
                <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
                  <FiUser size={14} className="text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-surface-800 dark:text-surface-200">{activeRoom.senderName}</p>
                  <p className="text-xs text-emerald-500 dark:text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block" />
                    Active
                  </p>
                </div>
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
                        {m.time ? new Date(m.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t border-surface-100 dark:border-surface-700 flex gap-2">
                <input
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a reply..."
                  className="flex-1 px-3.5 py-2.5 border border-surface-300 dark:border-surface-600 rounded-xl bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm"
                />
                <button
                  onClick={sendMessage}
                  disabled={!text.trim()}
                  className="p-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-surface-200 dark:disabled:bg-surface-700 text-white disabled:text-surface-400 rounded-xl transition-colors disabled:cursor-not-allowed"
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
                <p className="text-sm text-surface-400 dark:text-surface-500 mt-0.5">Choose a chat from the left to start responding</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}