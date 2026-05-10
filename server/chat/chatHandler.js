const Message = require('../models/Message');

module.exports = (io) => {
  const onlineUsers = new Map(); // userId → socketId

  io.on('connection', (socket) => {

    socket.on('user:join', (userId) => {
      if (userId) {
        onlineUsers.set(String(userId), socket.id);
        io.emit('users:online', Array.from(onlineUsers.keys()));
      }
    });

    socket.on('room:join', (roomId) => {
      socket.join(roomId);
    });

    socket.on('message:send', async ({ roomId, senderId, senderName, text, isAdmin }) => {
      if (!roomId || !text?.trim()) return;
      try {
        const msg = await Message.create({
          roomId,
          senderId: String(senderId),
          senderName: senderName || 'User',
          text: text.trim(),
          isAdmin: Boolean(isAdmin),
        });
        io.to(roomId).emit('message:new', msg);
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
      );
    });

    socket.on('disconnect', () => {
      for (const [userId, sId] of onlineUsers.entries()) {
        if (sId === socket.id) {
          onlineUsers.delete(userId);
          break;
        }
      }
      io.emit('users:online', Array.from(onlineUsers.keys()));
    });
  });
};