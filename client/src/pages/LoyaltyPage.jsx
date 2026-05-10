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

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2"><FiAward className="text-yellow-500" /> Loyalty Rewards</h1>

      {/* Points balance */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Available Points', value: loyalty?.points || 0, color: 'text-primary-600' },
          { label: 'Total Earned', value: loyalty?.totalEarned || 0, color: 'text-green-600' },
          { label: 'Total Redeemed', value: loyalty?.totalRedeemed || 0, color: 'text-orange-500' },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <p className={`text-2xl font-extrabold ${s.color}`}>{s.value.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="card p-5">
        <h2 className="font-bold mb-3 flex items-center gap-2"><FiGift size={16} /> How it works</h2>
        <div className="grid sm:grid-cols-3 gap-4 text-sm">
          {[
            { icon: '🛍️', title: 'Shop & Earn', desc: 'Earn 1 point for every ₹10 spent' },
            { icon: '💰', title: 'Redeem', desc: '200 points = ₹100 off your next order' },
            { icon: '👥', title: 'Refer Friends', desc: 'Earn 200 bonus points per referral' },
          ].map(h => (
            <div key={h.title} className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <div className="text-2xl mb-2">{h.icon}</div>
              <p className="font-semibold">{h.title}</p>
              <p className="text-gray-500 text-xs mt-1">{h.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Referral */}
      <div className="card p-5">
        <h2 className="font-bold mb-3 flex items-center gap-2"><FiShare2 size={16} /> Refer & Earn</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Share your referral link and earn 200 points for every friend who signs up!</p>
        <div className="flex gap-2">
          <input readOnly value={referralLink} className="input text-xs flex-1 font-mono" />
          <button onClick={copyReferral} className="btn-primary text-sm px-4">Copy</button>
        </div>
      </div>

      {/* History */}
      {loyalty?.history?.length > 0 && (
        <div className="card p-5">
          <h2 className="font-bold mb-3">Points History</h2>
          <div className="space-y-2">
            {loyalty.history.slice().reverse().slice(0, 20).map((h, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                <div>
                  <p className="font-medium capitalize">{h.type}</p>
                  <p className="text-xs text-gray-500">{h.description}</p>
                </div>
                <span className={`font-bold ${h.type === 'redeemed' ? 'text-red-500' : 'text-green-600'}`}>
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