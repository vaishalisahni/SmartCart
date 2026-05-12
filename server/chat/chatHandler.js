/**
 * server/chat/chatHandler.js
 * Drop-in replacement — adds real-time admin alert when user requests live agent.
 */
const Message = require('../models/Message');

module.exports = (io) => {
  const onlineUsers  = new Map(); // userId → socketId
  const adminSockets = new Set(); // socketIds belonging to admins

  io.on('connection', (socket) => {

    socket.on('user:join', (userId) => {
      if (userId) {
        onlineUsers.set(String(userId), socket.id);
        io.emit('users:online', Array.from(onlineUsers.keys()));
      }
    });

    // Admin page calls this on mount so we know which sockets are admins
    socket.on('admin:register', () => {
      adminSockets.add(socket.id);
    });

    socket.on('room:join', (roomId) => {
      socket.join(roomId);
    });

    socket.on('agent:connected', ({ roomId }) => {
      socket.to(roomId).emit('agent:connected');
    });

    // Fired when user clicks "Yes, connect me" in the escalation card
    socket.on('user:escalate', ({ roomId, userName, preview }) => {
      // Ping every admin socket immediately
      for (const adminSocketId of adminSockets) {
        io.to(adminSocketId).emit('escalation:new', {
          roomId,
          userName:  userName || 'A user',
          preview:   preview  || 'Requested live support',
          timestamp: new Date(),
        });
      }
    });

    socket.on('message:send', async ({ roomId, senderId, senderName, text, isAdmin }) => {
      if (!roomId || !text?.trim()) return;
      try {
        const msg = await Message.create({
          roomId,
          senderId:   String(senderId),
          senderName: senderName || 'User',
          text:       text.trim(),
          isAdmin:    Boolean(isAdmin),
        });
        io.to(roomId).emit('message:new', { ...msg.toObject(), roomId });
      } catch (err) {
        console.error('Chat save error:', err.message);
      }
    });

    socket.on('typing:start', ({ roomId, userName }) => {
      socket.to(roomId).emit('typing:update', { userName, typing: true });
    });

    socket.on('typing:stop', ({ roomId }) => {
      socket.to(roomId).emit('typing:update', { typing: false });
    });

    socket.on('message:read', async ({ roomId, userId }) => {
      await Message.updateMany(
        { roomId, senderId: { $ne: String(userId) }, read: false },
        { read: true }
      ).catch(() => {});
    });

    socket.on('disconnect', () => {
      adminSockets.delete(socket.id);
      for (const [userId, sId] of onlineUsers.entries()) {
        if (sId === socket.id) { onlineUsers.delete(userId); break; }
      }
      io.emit('users:online', Array.from(onlineUsers.keys()));
    });
  });
};