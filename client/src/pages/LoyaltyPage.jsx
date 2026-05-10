import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { FiAward, FiGift, FiShare2 } from 'react-icons/fi';
import API from '../services/api';
import toast from 'react-hot-toast';

export default function LoyaltyPage() {
  const { user } = useSelector(s => s.auth);
  const [loyalty, setLoyalty] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/loyalty').then(r => setLoyalty(r.data.loyalty)).finally(() => setLoading(false));
  }, []);

  const referralLink = `${window.location.origin}/register?ref=${user?.referralCode}`;

  const copyReferral = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success('Referral link copied!');
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2 text-surface-900 dark:text-surface-50">
        <FiAward className="text-amber-500" /> Loyalty Rewards
      </h1>

      {/* Points balance */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Available Points', value: loyalty?.points || 0, color: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-50 dark:bg-primary-900/40' },
          { label: 'Total Earned',     value: loyalty?.totalEarned || 0, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/40' },
          { label: 'Total Redeemed',   value: loyalty?.totalRedeemed || 0, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/40' },
        ].map(s => (
          <div key={s.label} className={`card p-4 text-center ${s.bg}`}>
            <p className={`text-2xl font-extrabold ${s.color}`}>{s.value.toLocaleString('en-IN')}</p>
            <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="card p-5">
        <h2 className="font-bold mb-4 flex items-center gap-2 text-surface-800 dark:text-surface-200">
          <FiGift size={16} className="text-primary-500" /> How it works
        </h2>
        <div className="grid sm:grid-cols-3 gap-4 text-sm">
          {[
            { icon: '🛍️', title: 'Shop & Earn', desc: 'Earn 1 point for every ₹10 spent' },
            { icon: '💰', title: 'Redeem',      desc: '200 points = ₹100 off your next order' },
            { icon: '👥', title: 'Refer Friends', desc: 'Earn 200 bonus points per referral' },
          ].map(h => (
            <div key={h.title} className="text-center p-4 bg-surface-50 dark:bg-surface-700/50 rounded-xl border border-surface-100 dark:border-surface-700">
              <div className="text-2xl mb-2">{h.icon}</div>
              <p className="font-semibold text-surface-800 dark:text-surface-200">{h.title}</p>
              <p className="text-surface-500 dark:text-surface-400 text-xs mt-1">{h.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Referral */}
      <div className="card p-5">
        <h2 className="font-bold mb-2 flex items-center gap-2 text-surface-800 dark:text-surface-200">
          <FiShare2 size={16} className="text-primary-500" /> Refer &amp; Earn
        </h2>
        <p className="text-sm text-surface-500 dark:text-surface-400 mb-4">Share your referral link and earn 200 points for every friend who signs up!</p>
        <div className="flex gap-2">
          <input readOnly value={referralLink} className="input text-xs flex-1 font-mono" />
          <button onClick={copyReferral} className="btn-primary text-sm px-4">Copy</button>
        </div>
      </div>

      {/* History */}
      {loyalty?.history?.length > 0 && (
        <div className="card p-5">
          <h2 className="font-bold mb-3 text-surface-800 dark:text-surface-200">Points History</h2>
          <div className="space-y-0">
            {loyalty.history.slice().reverse().slice(0, 20).map((h, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-3 border-b border-surface-100 dark:border-surface-700 last:border-0">
                <div>
                  <p className="font-medium capitalize text-surface-800 dark:text-surface-200">{h.type}</p>
                  <p className="text-xs text-surface-400 dark:text-surface-500 mt-0.5">{h.description}</p>
                </div>
                <span className={`font-bold ${h.type === 'redeemed' ? 'text-red-500 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {h.type === 'redeemed' ? '-' : '+'}{h.points} pts
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}