const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

const sendEmail = async ({ to, subject, html }) => {
  const mailOptions = {
    from: `"SmartCart" <${process.env.EMAIL_USER}>`,
    to, subject, html,
  };
  await transporter.sendMail(mailOptions);
};

const sendOTPEmail = async (email, otp) => {
  await sendEmail({
    to: email,
    subject: 'SmartCart - Password Reset OTP',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;border:1px solid #eee;padding:30px;border-radius:10px">
        <h2 style="color:#6366f1">🛒 SmartCart</h2>
        <h3>Password Reset OTP</h3>
        <p>Your OTP for password reset is:</p>
        <div style="font-size:36px;font-weight:bold;color:#6366f1;letter-spacing:8px;text-align:center;padding:20px;background:#f3f4ff;border-radius:8px">${otp}</div>
        <p style="color:#666;margin-top:20px">This OTP is valid for <strong>10 minutes</strong>. Do not share it with anyone.</p>
        <p style="color:#999;font-size:12px">If you didn't request this, ignore this email.</p>
      </div>
    `,
  });
};

const sendOrderConfirmationEmail = async (email, order) => {
  const itemsHtml = order.items.map(i =>
    `<tr><td>${i.name}</td><td>${i.quantity}</td><td>₹${i.price}</td></tr>`
  ).join('');
  await sendEmail({
    to: email,
    subject: `SmartCart - Order #${order._id} Confirmed!`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:30px">
        <h2 style="color:#6366f1">🛒 SmartCart</h2>
        <h3 style="color:#22c55e">✅ Order Confirmed!</h3>
        <p>Your order <strong>#${order._id}</strong> has been placed successfully.</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0">
          <thead><tr style="background:#f3f4ff"><th>Product</th><th>Qty</th><th>Price</th></tr></thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <p><strong>Total: ₹${order.totalPrice}</strong></p>
        <p>Payment: ${order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</p>
        <p style="color:#666">Track your order on SmartCart. Thank you for shopping!</p>
      </div>
    `,
  });
};

module.exports = { sendEmail, sendOTPEmail, sendOrderConfirmationEmail };
