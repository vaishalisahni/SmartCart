import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import API from '../../services/api';
import { useSelector } from 'react-redux';
import { FiSend } from 'react-icons/fi';

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
    socketRef.current?.on('message:new', msg => {
      if (msg.roomId === activeRoom._id) setMessages(prev => [...prev, msg]);
    });
  }, [activeRoom]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = () => {
    if (!text.trim() || !activeRoom) return;
    socketRef.current?.emit('message:send', {
      roomId: activeRoom._id, senderId: user._id, senderName: 'SmartCart Support', text, isAdmin: true,
    });
    setText('');
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <h1 className="text-2xl font-bold mb-4">Live Chat</h1>
      <div className="flex flex-1 gap-4 min-h-0 overflow-hidden">
        {/* Room list */}
        <div className="w-64 card overflow-y-auto">
          <div className="p-3 border-b border-gray-100 dark:border-gray-800 text-xs font-semibold text-gray-500 uppercase">Conversations</div>
          {rooms.map(r => (
            <button key={r._id} onClick={() => setActiveRoom(r)}
              className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-800 transition ${activeRoom?._id === r._id ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}>
              <p className="font-medium text-sm truncate">{r.senderName}</p>
              <p className="text-xs text-gray-500 truncate mt-0.5">{r.lastMessage}</p>
              {r.unread > 0 && <span className="badge bg-red-100 text-red-600 mt-1">{r.unread} new</span>}
            </button>
          ))}
        </div>
        {/* Chat area */}
        <div className="flex-1 card flex flex-col overflow-hidden">
          {activeRoom ? (
            <>
              <div className="p-3 border-b border-gray-100 dark:border-gray-800 font-semibold text-sm">{activeRoom.senderName}</div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50 dark:bg-gray-900">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.isAdmin ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] px-3 py-2 rounded-2xl text-sm ${m.isAdmin ? 'bg-primary-600 text-white rounded-br-none' : 'bg-white dark:bg-gray-800 rounded-bl-none'}`}>
                      {m.text}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
              <div className="p-3 border-t border-gray-100 dark:border-gray-800 flex gap-2">
                <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Type reply..." className="input text-sm flex-1" />
                <button onClick={sendMessage} className="btn-primary p-2.5"><FiSend size={14} /></button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">Select a conversation</div>
          )}
        </div>
      </div>
    </div>
  );
}