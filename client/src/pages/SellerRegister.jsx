import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { FiShoppingBag, FiCheckCircle, FiArrowRight } from 'react-icons/fi';
import { loadUser } from '../store/slices/authSlice';
import API from '../services/api';
import toast from 'react-hot-toast';

const PERKS = [
  { icon: '📦', title: 'Manage Your Catalog', desc: 'Add, edit, and track your products with ease.' },
  { icon: '📊', title: 'Revenue Analytics', desc: 'See your sales, orders, and earnings at a glance.' },
  { icon: '🚚', title: 'Order Fulfillment', desc: 'Track and manage customer orders end to end.' },
  { icon: '⭐', title: 'Review Insights', desc: 'Monitor customer feedback and sentiment on your products.' },
];

export default function SellerRegister() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);

  const [form, setForm] = useState({ storeName: '', storeDescription: '' });
  const [loading, setLoading] = useState(false);

  // Already a seller — redirect
  if (['seller', 'admin', 'super_admin'].includes(user?.role)) {
    navigate('/seller', { replace: true });
    return null;
  }

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.storeName.trim()) { toast.error('Store name is required'); return; }
    setLoading(true);
    try {
      await API.post('/seller/register', form);
      await dispatch(loadUser());
      toast.success('Seller account created! Welcome aboard 🎉');
      navigate('/seller');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-10 items-center">

        {/* Left — perks */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-sm">
              <FiShoppingBag size={20} className="text-white" />
            </div>
            <span className="font-bold text-xl text-primary-700 dark:text-primary-400" style={{ fontFamily: 'Syne, sans-serif' }}>
              SmartCart Seller
            </span>
          </div>

          <div>
            <h1 className="text-3xl font-black text-surface-900 dark:text-surface-50 mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>
              Start selling today.
            </h1>
            <p className="text-surface-500 dark:text-surface-400 leading-relaxed">
              Join SmartCart's seller ecosystem. Reach thousands of customers with AI-powered product discovery working in your favour.
            </p>
          </div>

          <div className="space-y-4">
            {PERKS.map(p => (
              <div key={p.title} className="flex items-start gap-3">
                <div className="w-10 h-10 bg-primary-50 dark:bg-primary-900/40 rounded-xl flex items-center justify-center text-lg flex-shrink-0">
                  {p.icon}
                </div>
                <div>
                  <p className="font-semibold text-sm text-surface-800 dark:text-surface-200">{p.title}</p>
                  <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
            <FiCheckCircle size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Your store will be reviewed by our admin team before going live. This typically takes less than 24 hours.
            </p>
          </div>
        </div>

        {/* Right — form */}
        <div className="card p-8 space-y-5">
          <div>
            <h2 className="text-xl font-bold text-surface-900 dark:text-surface-50">Create your store</h2>
            <p className="text-sm text-surface-400 dark:text-surface-500 mt-1">You're registering as: <strong className="text-surface-700 dark:text-surface-300">{user?.name}</strong></p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Store Name *</label>
              <input
                value={form.storeName}
                onChange={e => setForm(f => ({ ...f, storeName: e.target.value }))}
                placeholder="e.g. Bajaj Electronics"
                className="input"
                required
              />
            </div>

            <div>
              <label className="label">Store Description</label>
              <textarea
                value={form.storeDescription}
                onChange={e => setForm(f => ({ ...f, storeDescription: e.target.value }))}
                placeholder="Tell customers what you sell..."
                className="input resize-none"
                rows={3}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Register as Seller <FiArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}