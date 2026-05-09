import { useState, useEffect } from 'react';
import API from '../../services/api';
import { PageLoader, Pagination } from '../../components/ui/index';
import toast from 'react-hot-toast';

const STATUS_COLORS = { placed: 'bg-blue-100 text-blue-700', confirmed: 'bg-indigo-100 text-indigo-700', packed: 'bg-yellow-100 text-yellow-700', shipped: 'bg-orange-100 text-orange-700', delivered: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700', refunded: 'bg-gray-100 text-gray-700' };
const ORDER_STATUSES = ['placed', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled', 'refunded'];

export function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetch = async () => {
    setLoading(true);
    const p = new URLSearchParams({ page, limit: 20 });
    if (statusFilter) p.set('status', statusFilter);
    const { data } = await API.get(`/admin/orders?${p}`);
    setOrders(data.orders);
    setTotal(data.total);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, [page, statusFilter]);

  const updateStatus = async (id, status) => {
    try {
      await API.put(`/admin/orders/${id}/status`, { status });
      toast.success('Status updated');
      fetch();
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-bold">Orders</h1><p className="text-sm text-gray-500">{total} total orders</p></div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="input w-auto text-sm">
          <option value="">All Statuses</option>
          {ORDER_STATUSES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
      </div>
      {loading ? <PageLoader /> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>{['Order ID', 'Customer', 'Items', 'Total', 'Payment', 'Status', 'Date', 'Action'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {orders.map(o => (
                  <tr key={o._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 font-mono text-xs">#{o._id.slice(-8).toUpperCase()}</td>
                    <td className="px-4 py-3"><p className="font-medium">{o.user?.name}</p><p className="text-xs text-gray-400">{o.user?.email}</p></td>
                    <td className="px-4 py-3">{o.items?.length || '-'}</td>
                    <td className="px-4 py-3 font-semibold">₹{o.totalPrice?.toLocaleString()}</td>
                    <td className="px-4 py-3 capitalize text-xs">{o.paymentMethod}</td>
                    <td className="px-4 py-3"><span className={`badge capitalize text-xs ${STATUS_COLORS[o.orderStatus]}`}>{o.orderStatus}</span></td>
                    <td className="px-4 py-3 text-xs text-gray-500">{new Date(o.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <select value={o.orderStatus} onChange={e => updateStatus(o._id, e.target.value)} className="text-xs border border-gray-200 dark:border-gray-700 rounded px-2 py-1 bg-transparent">
                        {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetch = async () => {
    setLoading(true);
    const { data } = await API.get(`/admin/users?page=${page}&limit=20`);
    setUsers(data.users);
    setTotal(data.total);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, [page]);

  const toggleBlock = async id => {
    try { await API.put(`/admin/users/${id}/block`); toast.success('Updated'); fetch(); }
    catch { toast.error('Failed'); }
  };

  return (
    <div className="p-6 space-y-5">
      <div><h1 className="text-2xl font-bold">Users</h1><p className="text-sm text-gray-500">{total} registered users</p></div>
      {loading ? <PageLoader /> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>{['User', 'Phone', 'Status', 'Joined', 'Action'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {users.map(u => (
                  <tr key={u._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3"><p className="font-medium">{u.name}</p><p className="text-xs text-gray-400">{u.email}</p></td>
                    <td className="px-4 py-3 text-gray-500">{u.phone || '—'}</td>
                    <td className="px-4 py-3"><span className={`badge text-xs ${u.isBlocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{u.isBlocked ? 'Blocked' : 'Active'}</span></td>
                    <td className="px-4 py-3 text-xs text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleBlock(u._id)} className={`text-xs px-3 py-1 rounded font-medium transition ${u.isBlocked ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}>
                        {u.isBlocked ? 'Unblock' : 'Block'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
            <Pagination page={page} pages={Math.ceil(total / 20)} onPageChange={setPage} />
          </div>
        </div>
      )}
    </div>
  );
}

export function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ code: '', discountType: 'percentage', discountValue: '', minOrderAmount: 0, maxDiscount: '', usageLimit: '', expiresAt: '' });
  const [showForm, setShowForm] = useState(false);

  const fetch = async () => { setLoading(true); const { data } = await API.get('/coupons'); setCoupons(data.coupons); setLoading(false); };
  useEffect(() => { fetch(); }, []);

  const createCoupon = async e => {
    e.preventDefault();
    try {
      await API.post('/coupons', { ...form, code: form.code.toUpperCase(), discountValue: Number(form.discountValue), minOrderAmount: Number(form.minOrderAmount || 0), maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null, usageLimit: form.usageLimit ? Number(form.usageLimit) : null });
      toast.success('Coupon created!');
      setShowForm(false);
      setForm({ code: '', discountType: 'percentage', discountValue: '', minOrderAmount: 0, maxDiscount: '', usageLimit: '', expiresAt: '' });
      fetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const deleteCoupon = async id => {
    if (!confirm('Delete coupon?')) return;
    await API.delete(`/coupons/${id}`);
    toast.success('Deleted');
    fetch();
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Coupons</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">+ New Coupon</button>
      </div>

      {showForm && (
        <form onSubmit={createCoupon} className="card p-5 space-y-4">
          <h2 className="font-semibold">Create Coupon</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <div><label className="label">Code *</label><input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="SAVE20" className="input text-sm uppercase" required /></div>
            <div><label className="label">Type *</label>
              <select value={form.discountType} onChange={e => setForm(f => ({ ...f, discountType: e.target.value }))} className="input text-sm">
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat Amount (₹)</option>
              </select>
            </div>
            <div><label className="label">Value *</label><input type="number" value={form.discountValue} onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))} placeholder={form.discountType === 'percentage' ? '20' : '100'} className="input text-sm" required /></div>
            <div><label className="label">Min Order (₹)</label><input type="number" value={form.minOrderAmount} onChange={e => setForm(f => ({ ...f, minOrderAmount: e.target.value }))} className="input text-sm" /></div>
            <div><label className="label">Max Discount (₹)</label><input type="number" value={form.maxDiscount} onChange={e => setForm(f => ({ ...f, maxDiscount: e.target.value }))} className="input text-sm" placeholder="Optional" /></div>
            <div><label className="label">Usage Limit</label><input type="number" value={form.usageLimit} onChange={e => setForm(f => ({ ...f, usageLimit: e.target.value }))} className="input text-sm" placeholder="Unlimited" /></div>
            <div className="sm:col-span-3"><label className="label">Expires At *</label><input type="datetime-local" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} className="input text-sm" required /></div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary text-sm px-5">Create</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-outline text-sm px-5">Cancel</button>
          </div>
        </form>
      )}

      {loading ? <PageLoader /> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>{['Code', 'Discount', 'Min Order', 'Used', 'Expires', 'Status', 'Action'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {coupons.map(c => (
                  <tr key={c._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 font-mono font-bold text-primary-600">{c.code}</td>
                    <td className="px-4 py-3">{c.discountType === 'percentage' ? `${c.discountValue}%` : `₹${c.discountValue}`}</td>
                    <td className="px-4 py-3">₹{c.minOrderAmount}</td>
                    <td className="px-4 py-3">{c.usedCount}{c.usageLimit ? `/${c.usageLimit}` : ''}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{new Date(c.expiresAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span className={`badge text-xs ${c.isActive && new Date(c.expiresAt) > new Date() ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {c.isActive && new Date(c.expiresAt) > new Date() ? 'Active' : 'Expired'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => deleteCoupon(c._id)} className="text-red-400 hover:text-red-600 text-xs transition">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminOrders;