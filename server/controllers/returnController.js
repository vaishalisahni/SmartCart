const Return = require('../models/Return');
const Order  = require('../models/Order');

const RETURN_WINDOW_DAYS = 7;

// ── @POST /api/returns  —  customer raises a return request ──
exports.createReturn = async (req, res) => {
  const { orderId, reason, reasonDetails, items } = req.body;

  if (!orderId || !reason || !items?.length)
    return res.status(400).json({ message: 'orderId, reason and items are required' });

  const order = await Order.findById(orderId);
  if (!order) return res.status(404).json({ message: 'Order not found' });

  // Must be this user's order
  if (order.user.toString() !== req.user._id.toString())
    return res.status(403).json({ message: 'Access denied' });

  // Only delivered orders can be returned
  if (order.orderStatus !== 'delivered')
    return res.status(400).json({ message: 'Only delivered orders can be returned' });

  // 7-day window from delivery date
  if (order.deliveredAt) {
    const daysSince = (Date.now() - new Date(order.deliveredAt)) / (1000 * 60 * 60 * 24);
    if (daysSince > RETURN_WINDOW_DAYS)
      return res.status(400).json({ message: `Return window (${RETURN_WINDOW_DAYS} days) has expired` });
  }

  // Already has an active return for this order?
  const existing = await Return.findOne({ order: orderId, status: { $nin: ['rejected'] } });
  if (existing)
    return res.status(400).json({ message: 'A return request already exists for this order' });

  // Build item list with price from original order
  const returnItems = items.map(ri => {
    const orderItem = order.items.find(oi => oi.product.toString() === ri.productId);
    if (!orderItem) throw new Error(`Product ${ri.productId} not in order`);
    return {
      product:  orderItem.product,
      name:     orderItem.name,
      image:    orderItem.image,
      price:    orderItem.price,
      quantity: ri.quantity,
      reason:   ri.reason || reason,
    };
  });

  const refundAmount = returnItems.reduce((s, i) => s + i.price * i.quantity, 0);

  const ret = await Return.create({
    order:   orderId,
    user:    req.user._id,
    items:   returnItems,
    reason,
    reasonDetails: reasonDetails || '',
    refundAmount,
    statusHistory: [{ status: 'requested', note: 'Return request submitted by customer' }],
  });

  // Update order status
  order.orderStatus = 'refunded'; // mark for tracking
  order.statusHistory.push({ status: 'refunded', note: 'Return request raised by customer' });
  await order.save();

  res.status(201).json({ success: true, return: ret });
};

// ── @GET /api/returns/my  —  customer's return requests ──
exports.getMyReturns = async (req, res) => {
  const returns = await Return.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .populate('order', 'createdAt totalPrice');
  res.json({ success: true, returns });
};

// ── @GET /api/returns/:id  —  single return ──
exports.getReturn = async (req, res) => {
  const ret = await Return.findById(req.params.id).populate('order');
  if (!ret) return res.status(404).json({ message: 'Return not found' });
  if (ret.user.toString() !== req.user._id.toString() && !['admin','super_admin'].includes(req.user.role))
    return res.status(403).json({ message: 'Access denied' });
  res.json({ success: true, return: ret });
};

// ── @GET /api/returns  (admin)  ──
exports.getAllReturns = async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const query = status ? { status } : {};
  const total   = await Return.countDocuments(query);
  const returns = await Return.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .populate('user', 'name email')
    .populate('order', 'createdAt totalPrice');
  res.json({ success: true, returns, total });
};

// ── @PUT /api/returns/:id/status  (admin)  ──
exports.updateReturnStatus = async (req, res) => {
  const { status, adminNote } = req.body;
  const ret = await Return.findById(req.params.id);
  if (!ret) return res.status(404).json({ message: 'Return not found' });

  ret.status    = status;
  ret.adminNote = adminNote || ret.adminNote;
  ret.statusHistory.push({ status, note: adminNote || '' });
  await ret.save();

  res.json({ success: true, return: ret });
};