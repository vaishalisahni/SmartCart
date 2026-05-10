import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiEye, FiEyeOff, FiMail, FiLock, FiShoppingBag, FiUser } from 'react-icons/fi';
import { loginUser, registerUser, clearError } from '../store/slices/authSlice';
import toast from 'react-hot-toast';

const GOOGLE_URL = `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}/api/auth/google`;

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loading, error } = useSelector(s => s.auth);

  const [mode, setMode] = useState(() => searchParams.get('mode') === 'register' ? 'register' : 'login');
  const [animating, setAnimating] = useState(false);
  const [formVisible, setFormVisible] = useState(true);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [regForm, setRegForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPwd, setShowPwd] = useState(false);

  useEffect(() => { dispatch(clearError()); }, []);
  useEffect(() => { if (error) toast.error(error); }, [error]);

  const switchMode = (next) => {
    if (animating || next === mode) return;
    setAnimating(true);
    setFormVisible(false);
    setTimeout(() => { setMode(next); }, 300);
    setTimeout(() => { setFormVisible(true); setAnimating(false); }, 650);
  };

  const handleLogin = async e => {
    e.preventDefault();
    const res = await dispatch(loginUser(loginForm));
    if (res.meta.requestStatus === 'fulfilled') { toast.success('Welcome back! 👋'); navigate('/'); }
  };

  const handleRegister = async e => {
    e.preventDefault();
    if (regForm.password !== regForm.confirm) { toast.error('Passwords do not match'); return; }
    if (regForm.password.length < 6) { toast.error('Min 6 characters'); return; }
    const res = await dispatch(registerUser({ name: regForm.name, email: regForm.email, password: regForm.password }));
    if (res.meta.requestStatus === 'fulfilled') { toast.success('Account created! Welcome 🎉'); navigate('/'); }
  };

  return (
    <div className="min-h-screen flex bg-surface-50 dark:bg-surface-950 overflow-hidden">
      <style>{`@keyframes floatUp { from { transform: translateY(0) rotate(0deg); } to { transform: translateY(-18px) rotate(8deg); } }`}</style>

      <div className="flex w-full" style={{ transition: 'all 0.6s cubic-bezier(0.77,0,0.175,1)', flexDirection: mode === 'register' ? 'row-reverse' : 'row' }}>

        {/* Dark teal panel */}
        <div className="hidden lg:flex w-5/12 relative overflow-hidden flex-col items-center justify-center p-12 flex-shrink-0 bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800">
          <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle, #7cc7c3 1px, transparent 1px)', backgroundSize: '26px 26px' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(46,143,138,0.4) 0%, transparent 70%)', filter: 'blur(50px)' }} />
          {[
            { size: 130, top: '6%',  left: '8%',  delay: '0s',   dur: '6s',  op: 0.12 },
            { size: 60,  top: '20%', left: '72%', delay: '1s',   dur: '8s',  op: 0.18 },
            { size: 90,  top: '58%', left: '12%', delay: '2s',   dur: '7s',  op: 0.1  },
            { size: 45,  top: '78%', left: '62%', delay: '0.5s', dur: '5s',  op: 0.15 },
            { size: 70,  top: '40%', left: '82%', delay: '1.5s', dur: '9s',  op: 0.08 },
          ].map((s, i) => (
            <div key={i} className="absolute rounded-full border border-primary-300/25"
              style={{ width: s.size, height: s.size, top: s.top, left: s.left, opacity: s.op,
                animation: `floatUp ${s.dur} ease-in-out infinite alternate`, animationDelay: s.delay }} />
          ))}

          <div className={`relative z-10 text-center max-w-xs transition-all duration-500 ${formVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <div className="w-16 h-16 mx-auto mb-8 rounded-2xl bg-white/10 border border-white/20 backdrop-blur flex items-center justify-center">
              <FiShoppingBag size={28} className="text-white" />
            </div>
            <h2 className="text-[2.2rem] font-black text-white leading-tight mb-4" style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-1.5px' }}>
              {mode === 'login' ? 'Your smart shopping starts here.' : 'Join 50,000+ smart shoppers today.'}
            </h2>
            <p className="text-primary-200 text-sm leading-relaxed mb-10">
              {mode === 'login' ? 'Discover personalised deals powered by AI. Save more, smile more.' : 'Get AI recommendations, exclusive deals, and the fastest checkout.'}
            </p>
            <div className="space-y-3 text-left">
              {['🤖 AI-personalised picks', '💳 Razorpay secure checkout', '🚀 50,000+ happy shoppers'].map(f => (
                <div key={f} className="flex items-center gap-3 bg-white/[0.08] border border-white/10 px-4 py-2.5 rounded-full text-sm text-white/85">{f}</div>
              ))}
            </div>
            <div className="mt-12 pt-8 border-t border-white/10">
              {mode === 'login' ? (
                <>
                  <p className="text-white/50 text-sm mb-3">New to SmartCart?</p>
                  <button onClick={() => switchMode('register')} className="px-6 py-2.5 rounded-full border-2 border-white/30 text-white text-sm font-bold hover:bg-white hover:text-primary-900 transition-all duration-300">Create Account →</button>
                </>
              ) : (
                <>
                  <p className="text-white/50 text-sm mb-3">Already a member?</p>
                  <button onClick={() => switchMode('login')} className="px-6 py-2.5 rounded-full border-2 border-white/30 text-white text-sm font-bold hover:bg-white hover:text-primary-900 transition-all duration-300">← Sign In</button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Form panel */}
        <div className="flex-1 flex items-center justify-center p-8 lg:p-16 bg-white dark:bg-surface-900">
          <div className={`w-full max-w-[400px] transition-all duration-500 ${formVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}`}>

            <div className="lg:hidden flex items-center gap-2 mb-8">
              <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
                <FiShoppingBag size={18} className="text-white" />
              </div>
              <span className="font-black text-xl text-primary-600 dark:text-primary-400" style={{ fontFamily: 'Syne, sans-serif' }}>SmartCart</span>
            </div>

            <h1 className="text-3xl font-black text-surface-900 dark:text-surface-50 mb-1" style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.5px' }}>
              {mode === 'login' ? 'Hello, Welcome back! 👋' : 'Create your account ✨'}
            </h1>
            <p className="text-surface-400 dark:text-surface-500 text-sm mb-8">
              {mode === 'login' ? 'Sign in to continue to SmartCart' : 'Start your smart shopping journey today'}
            </p>

            <button onClick={() => window.location.href = GOOGLE_URL}
              className="w-full flex items-center justify-center gap-3 border-2 border-surface-200 dark:border-surface-700 rounded-xl py-3 text-sm font-semibold text-surface-700 dark:text-surface-200 hover:bg-surface-50 dark:hover:bg-surface-800 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-md transition-all mb-5 bg-white dark:bg-surface-800">
              <GoogleIcon /> Continue with Google
            </button>

            <Divider label={mode === 'login' ? 'or sign in with email' : 'or register with email'} />

            {mode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4 mt-5">
                <Field label="Email address">
                  <div className="relative">
                    <FiMail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
                    <input type="email" value={loginForm.email} onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))} placeholder="you@example.com" autoComplete="email"
                      className="w-full pl-10 pr-4 py-3 border-2 border-surface-200 dark:border-surface-700 rounded-xl bg-surface-50 dark:bg-surface-800 text-sm focus:outline-none focus:border-primary-500 focus:bg-white dark:focus:bg-surface-700 text-surface-900 dark:text-surface-100 transition-all" required />
                  </div>
                </Field>
                <Field label="Password" right={<button type="button" onClick={() => navigate('/forgot-password')} className="text-xs text-primary-600 dark:text-primary-400 font-semibold hover:underline">Forgot password?</button>}>
                  <div className="relative">
                    <FiLock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
                    <input type={showPwd ? 'text' : 'password'} value={loginForm.password} onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" autoComplete="current-password"
                      className="w-full pl-10 pr-11 py-3 border-2 border-surface-200 dark:border-surface-700 rounded-xl bg-surface-50 dark:bg-surface-800 text-sm focus:outline-none focus:border-primary-500 focus:bg-white dark:focus:bg-surface-700 text-surface-900 dark:text-surface-100 transition-all" required />
                    <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300">
                      {showPwd ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                    </button>
                  </div>
                </Field>
                <SubmitBtn loading={loading} label="Sign In →" loadingLabel="Signing in..." />
              </form>
            )}

            {mode === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4 mt-5">
                <Field label="Full Name">
                  <div className="relative">
                    <FiUser size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
                    <input value={regForm.name} onChange={e => setRegForm(f => ({ ...f, name: e.target.value }))} placeholder="Your full name" autoComplete="name"
                      className="w-full pl-10 pr-4 py-3 border-2 border-surface-200 dark:border-surface-700 rounded-xl bg-surface-50 dark:bg-surface-800 text-sm focus:outline-none focus:border-primary-500 focus:bg-white dark:focus:bg-surface-700 text-surface-900 dark:text-surface-100 transition-all" required />
                  </div>
                </Field>
                <Field label="Email address">
                  <div className="relative">
                    <FiMail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
                    <input type="email" value={regForm.email} onChange={e => setRegForm(f => ({ ...f, email: e.target.value }))} placeholder="you@example.com" autoComplete="email"
                      className="w-full pl-10 pr-4 py-3 border-2 border-surface-200 dark:border-surface-700 rounded-xl bg-surface-50 dark:bg-surface-800 text-sm focus:outline-none focus:border-primary-500 focus:bg-white dark:focus:bg-surface-700 text-surface-900 dark:text-surface-100 transition-all" required />
                  </div>
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Password">
                    <div className="relative">
                      <FiLock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
                      <input type={showPwd ? 'text' : 'password'} value={regForm.password} onChange={e => setRegForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 6"
                        className="w-full pl-10 pr-3 py-3 border-2 border-surface-200 dark:border-surface-700 rounded-xl bg-surface-50 dark:bg-surface-800 text-sm focus:outline-none focus:border-primary-500 focus:bg-white dark:focus:bg-surface-700 text-surface-900 dark:text-surface-100 transition-all" required />
                    </div>
                  </Field>
                  <Field label="Confirm">
                    <div className="relative">
                      <FiLock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
                      <input type={showPwd ? 'text' : 'password'} value={regForm.confirm} onChange={e => setRegForm(f => ({ ...f, confirm: e.target.value }))} placeholder="Repeat"
                        className="w-full pl-10 pr-3 py-3 border-2 border-surface-200 dark:border-surface-700 rounded-xl bg-surface-50 dark:bg-surface-800 text-sm focus:outline-none focus:border-primary-500 focus:bg-white dark:focus:bg-surface-700 text-surface-900 dark:text-surface-100 transition-all" required />
                    </div>
                  </Field>
                </div>
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input type="checkbox" className="w-4 h-4 accent-primary-600 rounded" required />
                  <span className="text-xs text-surface-500 dark:text-surface-400">
                    I agree to the <span className="text-primary-600 dark:text-primary-400 font-semibold cursor-pointer hover:underline">Terms</span> &amp; <span className="text-primary-600 dark:text-primary-400 font-semibold cursor-pointer hover:underline">Privacy Policy</span>
                  </span>
                </label>
                <SubmitBtn loading={loading} label="Create Account →" loadingLabel="Creating account..." />
              </form>
            )}

            <div className="mt-6 text-center">
              {mode === 'login' ? (
                <p className="text-sm text-surface-400 dark:text-surface-500">Don't have an account?{' '}
                  <button onClick={() => switchMode('register')} className="text-primary-600 dark:text-primary-400 font-bold hover:underline transition-all">Create account</button>
                </p>
              ) : (
                <p className="text-sm text-surface-400 dark:text-surface-500">Already have an account?{' '}
                  <button onClick={() => switchMode('login')} className="text-primary-600 dark:text-primary-400 font-bold hover:underline transition-all">Sign in</button>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [passwords, setPasswords] = useState({ password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const base = import.meta.env.VITE_API_URL || '/api';

  const sendOTP = async e => {
    e.preventDefault(); setLoading(true);
    try {
      const r = await fetch(`${base}/auth/forgot-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      const d = await r.json();
      if (d.success) { toast.success('OTP sent to your email!'); setStep(2); }
      else toast.error(d.message);
    } finally { setLoading(false); }
  };

  const resetPassword = async e => {
    e.preventDefault();
    if (passwords.password !== passwords.confirm) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try {
      const r = await fetch(`${base}/auth/reset-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, otp, password: passwords.password }) });
      const d = await r.json();
      if (d.success) { toast.success('Password reset!'); navigate('/login'); }
      else toast.error(d.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex bg-surface-50 dark:bg-surface-950">
      <div className="hidden lg:flex w-5/12 relative overflow-hidden flex-col items-center justify-center p-12 bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800">
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle, #7cc7c3 1px, transparent 1px)', backgroundSize: '26px 26px' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(46,143,138,0.4) 0%, transparent 70%)', filter: 'blur(50px)' }} />
        <div className="relative z-10 text-center max-w-xs">
          <div className="w-16 h-16 mx-auto mb-8 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
            <FiShoppingBag size={28} className="text-white" />
          </div>
          <h2 className="text-[2.2rem] font-black text-white leading-tight mb-4" style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-1.5px' }}>Reset your password securely.</h2>
          <p className="text-primary-200 text-sm">We'll send a one-time password to your email to get you back in.</p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-8 lg:p-16 bg-white dark:bg-surface-900">
        <div className="w-full max-w-[400px]">
          <h1 className="text-3xl font-black text-surface-900 dark:text-surface-50 mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>
            {step === 1 ? 'Forgot password? 🔑' : 'Set new password'}
          </h1>
          <p className="text-surface-400 dark:text-surface-500 text-sm mb-8">
            {step === 1 ? "Enter your email and we'll send an OTP." : `OTP sent to ${email}. Check your inbox.`}
          </p>
          {step === 1 ? (
            <form onSubmit={sendOTP} className="space-y-4">
              <Field label="Email address">
                <div className="relative">
                  <FiMail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com"
                    className="w-full pl-10 pr-4 py-3 border-2 border-surface-200 dark:border-surface-700 rounded-xl bg-surface-50 dark:bg-surface-800 text-sm focus:outline-none focus:border-primary-500 focus:bg-white dark:focus:bg-surface-700 text-surface-900 dark:text-surface-100 transition-all" required />
                </div>
              </Field>
              <SubmitBtn loading={loading} label="Send OTP →" loadingLabel="Sending..." />
              <button type="button" onClick={() => navigate('/login')} className="block w-full text-center text-sm text-surface-400 dark:text-surface-500 hover:text-primary-600 dark:hover:text-primary-400 transition">← Back to login</button>
            </form>
          ) : (
            <form onSubmit={resetPassword} className="space-y-4">
              <Field label="6-digit OTP">
                <input value={otp} onChange={e => setOtp(e.target.value)} maxLength={6} placeholder="• • • • • •"
                  className="w-full px-4 py-3 border-2 border-surface-200 dark:border-surface-700 rounded-xl bg-surface-50 dark:bg-surface-800 text-center text-2xl font-black tracking-[0.5em] focus:outline-none focus:border-primary-500 focus:bg-white dark:focus:bg-surface-700 text-surface-900 dark:text-surface-100 transition-all" required />
              </Field>
              <Field label="New Password">
                <input type="password" value={passwords.password} onChange={e => setPasswords(p => ({ ...p, password: e.target.value }))} placeholder="Min 6 characters"
                  className="w-full px-4 py-3 border-2 border-surface-200 dark:border-surface-700 rounded-xl bg-surface-50 dark:bg-surface-800 text-sm focus:outline-none focus:border-primary-500 focus:bg-white dark:focus:bg-surface-700 text-surface-900 dark:text-surface-100 transition-all" required />
              </Field>
              <Field label="Confirm Password">
                <input type="password" value={passwords.confirm} onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} placeholder="Repeat"
                  className="w-full px-4 py-3 border-2 border-surface-200 dark:border-surface-700 rounded-xl bg-surface-50 dark:bg-surface-800 text-sm focus:outline-none focus:border-primary-500 focus:bg-white dark:focus:bg-surface-700 text-surface-900 dark:text-surface-100 transition-all" required />
              </Field>
              <SubmitBtn loading={loading} label="Reset Password →" loadingLabel="Resetting..." />
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export function RegisterPage() {
  const navigate = useNavigate();
  useEffect(() => { navigate('/login?mode=register', { replace: true }); }, []);
  return null;
}

function Field({ label, right, children }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm font-semibold text-surface-700 dark:text-surface-300">{label}</label>
        {right}
      </div>
      {children}
    </div>
  );
}

function Divider({ label }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px bg-surface-200 dark:bg-surface-700" />
      <span className="text-xs text-surface-400 dark:text-surface-500 font-medium">{label}</span>
      <div className="flex-1 h-px bg-surface-200 dark:bg-surface-700" />
    </div>
  );
}

function SubmitBtn({ loading, label, loadingLabel }) {
  return (
    <button type="submit" disabled={loading}
      className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-bold rounded-xl text-sm transition-all duration-200 active:scale-[0.98] shadow-lifted">
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          {loadingLabel}
        </span>
      ) : label}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 002.38-5.88c0-.57-.05-.66-.15-1.18z"/>
      <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 01-7.18-2.54H1.83v2.07A8 8 0 008.98 17z"/>
      <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 010-3.04V5.41H1.83a8 8 0 000 7.18l2.67-2.07z"/>
      <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 001.83 5.4L4.5 7.49a4.77 4.77 0 014.48-3.31z"/>
    </svg>
  );
}