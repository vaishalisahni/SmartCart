// ── chatRoutes.js ─────────────────────────────────────────────
const express = require('express');
const chatRouter = express.Router();
const Message = require('../models/Message');
const { protect } = require('../middleware/auth');

chatRouter.get('/rooms/:roomId/messages', protect, async (req, res) => {
  const messages = await Message.find({ roomId: req.params.roomId })
    .sort({ createdAt: 1 }).limit(100);
  res.json({ success: true, messages });
});

chatRouter.get('/admin/rooms', protect, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
  const rooms = await Message.aggregate([
    { $sort: { createdAt: -1 } },
    { $group: {
      _id: '$roomId',
      lastMessage:  { $first: '$text' },
      lastTime:     { $first: '$createdAt' },
      senderName:   { $first: '$senderName' },
      unread:       { $sum: { $cond: [{ $and: [{ $eq: ['$read', false] }, { $eq: ['$isAdmin', false] }] }, 1, 0] } },
    }},
    { $sort: { lastTime: -1 } },
  ]);
  res.json({ success: true, rooms });
});

chatRouter.delete('/rooms/:roomId', protect, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
  await Message.deleteMany({ roomId: req.params.roomId });
  res.json({ success: true });
});

module.exports = chatRouter;