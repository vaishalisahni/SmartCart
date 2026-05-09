const Razorpay = require('razorpay');
const crypto = require('crypto');

const getRazorpay = () => new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create Razorpay order
exports.createRazorpayOrder = async (req, res) => {
  const { amount } = req.body; // in rupees
  if (!amount) return res.status(400).json({ message: 'Amount required' });
  try {
    const razorpay = getRazorpay();
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ message: 'Razorpay order creation failed', error: err.message });
  }
};

// Verify payment signature
exports.verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSig = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(body).digest('hex');
  if (expectedSig !== razorpay_signature) return res.status(400).json({ success: false, message: 'Invalid payment signature' });
  res.json({ success: true, message: 'Payment verified' });
};