/**
 * invoiceController.js
 * Generates a PDF invoice for a given order using reportlab (via child process)
 * and sends it as a download.
 *
 * GET /api/orders/:id/invoice
 */
const { exec } = require('child_process');
const path  = require('path');
const fs    = require('fs');
const Order = require('../models/Order');

exports.downloadInvoice = async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'name email phone')
    .populate('items.product', 'name');

  if (!order) return res.status(404).json({ message: 'Order not found' });

  // Auth: owner or admin
  if (
    order.user._id.toString() !== req.user._id.toString() &&
    !['admin', 'super_admin'].includes(req.user.role)
  ) return res.status(403).json({ message: 'Access denied' });

  // Build data payload for Python script
  const invoiceData = {
    orderId:        order._id.toString(),
    orderShortId:   order._id.toString().slice(-8).toUpperCase(),
    createdAt:      new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
    paidAt:         order.paidAt ? new Date(order.paidAt).toLocaleDateString('en-IN') : 'Pending',
    paymentMethod:  order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online (Razorpay)',
    orderStatus:    order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1),
    customer: {
      name:  order.user.name,
      email: order.user.email,
      phone: order.user.phone || '',
    },
    shipping: order.shippingAddress,
    items: order.items.map(i => ({
      name:     i.name,
      quantity: i.quantity,
      price:    i.price,
      total:    i.price * i.quantity,
    })),
    itemsPrice:     order.itemsPrice,
    taxPrice:       order.taxPrice,
    shippingPrice:  order.shippingPrice,
    discountAmount: order.discountAmount || 0,
    totalPrice:     order.totalPrice,
    couponCode:     order.couponCode || '',
  };

  const tmpDir      = require('os').tmpdir();
  const dataFile    = path.join(tmpDir, `invoice_data_${order._id}.json`);
  const outputFile  = path.join(tmpDir, `invoice_${order._id}.pdf`);
  const scriptPath  = path.join(__dirname, '..', 'utils', 'generateInvoice.py');

  // Write JSON data for the Python script
  fs.writeFileSync(dataFile, JSON.stringify(invoiceData));

  const cmd = `python3 "${scriptPath}" "${dataFile}" "${outputFile}"`;

  exec(cmd, (err, stdout, stderr) => {
    // Clean up data file
    try { fs.unlinkSync(dataFile); } catch (_) {}

    if (err) {
      console.error('Invoice generation error:', stderr || err.message);
      return res.status(500).json({ message: 'Failed to generate invoice', detail: stderr });
    }

    if (!fs.existsSync(outputFile)) {
      return res.status(500).json({ message: 'Invoice file not created' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="SmartCart_Invoice_${invoiceData.orderShortId}.pdf"`);

    const stream = fs.createReadStream(outputFile);
    stream.pipe(res);
    stream.on('end', () => {
      try { fs.unlinkSync(outputFile); } catch (_) {}
    });
    stream.on('error', () => res.status(500).end());
  });
};