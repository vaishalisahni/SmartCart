import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiShoppingCart, FiEye, FiEyeOff } from 'react-icons/fi';
import { loginUser, registerUser, clearError } from '../store/slices/authSlice';
import toast from 'react-hot-toast';

function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white dark:from-gray-950 dark:to-gray-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
              <FiShoppingCart size={20} className="text-white" />
            </div>
            <span className="text-2xl font-extrabold text-primary-600">SmartCart</span>
          </Link>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-gray-500 text-sm mt-1">{subtitle}</p>
        </div>
        <div className="card p-6 shadow-lg">{children}</div>
      </div>
    </div>
  );
}

export function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector(s => s.auth);
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);

  useEffect(() => { dispatch(clearError()); }, []);
  useEffect(() => { if (error) toast.error(error); }, [error]);

  const handleSubmit = async e => {
    e.preventDefault();
    const res = await dispatch(loginUser(form));
    if (res.meta.requestStatus === 'fulfilled') { toast.success('Welcome back!'); navigate('/'); }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Login to your SmartCart account">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Email</label>
          <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@example.com" className="input" required />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 flex justify-between">
            Password <Link to="/forgot-password" className="text-primary-600 font-normal hover:underline text-xs">Forgot password?</Link>
          </label>
          <div className="relative">
            <input type={showPwd ? 'text' : 'password'} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" className="input pr-10" required />
            <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {showPwd ? <FiEyeOff size={16} /> : <FiEye size={16} />}
            </button>
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">{loading ? 'Logging in...' : 'Login'}</button>
        <p className="text-center text-sm">Don't have an account? <Link to="/register" className="text-primary-600 font-semibold hover:underline">Register</Link></p>
      </form>
    </AuthLayout>
  );
}

export function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector(s => s.auth);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPwd, setShowPwd] = useState(false);

  useEffect(() => { dispatch(clearError()); }, []);
  useEffect(() => { if (error) toast.error(error); }, [error]);

  const handleSubmit = async e => {
    e.preventDefault();
    if (form.password !== form.confirm) { toast.error('Passwords do not match'); return; }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    const res = await dispatch(registerUser({ name: form.name, email: form.email, password: form.password }));
    if (res.meta.requestStatus === 'fulfilled') { toast.success('Account created!'); navigate('/'); }
  };

  return (
    <AuthLayout title="Create Account" subtitle="Join SmartCart for personalised shopping">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Full Name</label>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your full name" className="input" required />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Email</label>
          <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@example.com" className="input" required />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Password</label>
          <div className="relative">
            <input type={showPwd ? 'text' : 'password'} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 6 characters" className="input pr-10" required />
            <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {showPwd ? <FiEyeOff size={16} /> : <FiEye size={16} />}
            </button>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Confirm Password</label>
          <input type="password" value={form.confirm} onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))} placeholder="Repeat password" className="input" required />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">{loading ? 'Creating account...' : 'Create Account'}</button>
        <p className="text-center text-sm">Already have an account? <Link to="/login" className="text-primary-600 font-semibold hover:underline">Login</Link></p>
      </form>
    </AuthLayout>
  );
}

export function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [passwords, setPasswords] = useState({ password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || '/api';

  const sendOTP = async e => {
    e.preventDefault(); setLoading(true);
    try {
      const r = await fetch(`${API_URL}/auth/forgot-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      const d = await r.json();
      if (d.success) { toast.success('OTP sent!'); setStep(2); }
      else toast.error(d.message);
    } finally { setLoading(false); }
  };

  const resetPassword = async e => {
    e.preventDefault();
    if (passwords.password !== passwords.confirm) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try {
      const r = await fetch(`${API_URL}/auth/reset-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, otp, password: passwords.password }) });
      const d = await r.json();
      if (d.success) { toast.success('Password reset!'); navigate('/login'); }
      else toast.error(d.message);
    } finally { setLoading(false); }
  };

  return (
    <AuthLayout title="Reset Password" subtitle={step === 1 ? "We'll send an OTP to your email" : "Enter the OTP and your new password"}>
      {step === 1 ? (
        <form onSubmit={sendOTP} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Email Address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" className="input" required />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">{loading ? 'Sending...' : 'Send OTP'}</button>
          <Link to="/login" className="block text-center text-sm text-primary-600 hover:underline">Back to Login</Link>
        </form>
      ) : (
        <form onSubmit={resetPassword} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">OTP (check your email)</label>
            <input value={otp} onChange={e => setOtp(e.target.value)} placeholder="6-digit OTP" className="input text-center text-2xl tracking-widest font-bold" maxLength={6} required />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">New Password</label>
            <input type="password" value={passwords.password} onChange={e => setPasswords(p => ({ ...p, password: e.target.value }))} placeholder="Min 6 characters" className="input" required />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Confirm New Password</label>
            <input type="password" value={passwords.confirm} onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} placeholder="Repeat password" className="input" required />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">{loading ? 'Resetting...' : 'Reset Password'}</button>
        </form>
      )}
    </AuthLayout>
  );
}

export default LoginPage;