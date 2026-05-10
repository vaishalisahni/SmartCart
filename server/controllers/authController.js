const User = require('../models/User');
const { generateTokens, setTokenCookies } = require('../utils/jwt');
const { sendOTPEmail } = require('../utils/email');
const jwt = require('jsonwebtoken');

// Simple referral code generator — no extra deps
const genReferralCode = (len = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

// @POST /api/auth/register
exports.register = async (req, res) => {
  const { name, email, password, ref } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'All fields required' });
  if (await User.findOne({ email })) return res.status(400).json({ message: 'Email already registered' });

  // Generate unique referral code
  let referralCode;
  do { referralCode = genReferralCode(); } while (await User.findOne({ referralCode }));

  const user = await User.create({ name, email, password, referralCode });
  const { accessToken, refreshToken } = generateTokens(user._id);
  user.refreshToken = refreshToken;

  // Handle referral bonus
  if (ref) {
    const referrer = await User.findOne({ referralCode: ref });
    if (referrer) {
      user.referredBy = referrer._id;
      // Give referrer bonus points (lazy-load to avoid circular deps)
      try {
        const { addReferralPoints } = require('./loyaltyController');
        await addReferralPoints(referrer._id);
      } catch (_) {}
    }
  }

  await user.save({ validateBeforeSave: false });

  // Welcome bonus
  try {
    const { addWelcomeBonus } = require('./loyaltyController');
    await addWelcomeBonus(user._id);
  } catch (_) {}

  setTokenCookies(res, accessToken, refreshToken);
  res.status(201).json({
    success: true,
    accessToken,
    user: { _id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
  });
};

// @POST /api/auth/login
exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password)))
    return res.status(401).json({ message: 'Invalid credentials' });
  if (user.isBlocked) return res.status(403).json({ message: 'Account is blocked' });

  const { accessToken, refreshToken } = generateTokens(user._id);
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  setTokenCookies(res, accessToken, refreshToken);
  res.json({
    success: true,
    accessToken,
    user: { _id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
  });
};

// @POST /api/auth/logout
exports.logout = async (req, res) => {
  if (req.user) { req.user.refreshToken = ''; await req.user.save({ validateBeforeSave: false }); }
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.json({ success: true, message: 'Logged out' });
};

// @POST /api/auth/refresh
exports.refresh = async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  if (!token) return res.status(401).json({ message: 'No refresh token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || user.refreshToken !== token)
      return res.status(401).json({ message: 'Invalid refresh token' });
    const { accessToken, refreshToken } = generateTokens(user._id);
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    setTokenCookies(res, accessToken, refreshToken);
    res.json({ success: true, accessToken });
  } catch {
    res.status(401).json({ message: 'Refresh token expired, please login again' });
  }
};

// @POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'No account with this email' });
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.resetOTP = otp;
  user.resetOTPExpiry = new Date(Date.now() + 10 * 60 * 1000);
  await user.save({ validateBeforeSave: false });
  try {
    await sendOTPEmail(email, otp);
  } catch (e) {
    console.error('OTP email failed:', e.message);
    return res.status(500).json({ message: 'Failed to send email. Check email config.' });
  }
  res.json({ success: true, message: 'OTP sent to email' });
};

// @POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
  const { email, otp, password } = req.body;
  const user = await User.findOne({ email }).select('+resetOTP +resetOTPExpiry');
  if (!user || user.resetOTP !== otp || user.resetOTPExpiry < Date.now()) {
    return res.status(400).json({ message: 'Invalid or expired OTP' });
  }
  user.password = password;
  user.resetOTP = undefined;
  user.resetOTPExpiry = undefined;
  await user.save();
  res.json({ success: true, message: 'Password reset successful' });
};

// @GET /api/auth/me
exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};