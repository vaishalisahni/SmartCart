import { useState, useEffect } from 'react';
import API from '../../services/api';
import { PageLoader, Pagination } from '../../components/ui/index';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';

const STATUS_COLORS = {
  placed: 'bg-primary-100 text-primary-700 dark:bg-primary-900/60 dark:text-primary-300',
  confirmed: 'bg-teal-100 text-teal-700 dark:bg-teal-900/60 dark:text-teal-300',
  packed: 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300',
  shipped: 'bg-orange-100 text-orange-700 dark:bg-orange-900/60 dark:text-orange-300',
  delivered: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300',
  refunded: 'bg-surface-100 text-surface-700 dark:bg-surface-700/80 dark:text-surface-300',
};
const ORDER_STATUSES = ['placed', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled', 'refunded'];

const TH = ({ children }) => (
  <th className="px-4 py-3 text-left text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">{children}</th>
);

export function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchOrders = async () => {
    setLoading(true);
    const p = new URLSearchParams({ page, limit: 20 });
    if (statusFilter) p.set('status', statusFilter);
    const { data } = await API.get(`/admin/orders?${p}`);
    setOrders(data.orders);
    setTotal(data.total);
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, [page, statusFilter]);

  const updateStatus = async (id, status) => {
    try { await API.put(`/admin/orders/${id}/status`, { status }); toast.success('Status updated'); fetchOrders(); }
    catch { toast.error('Failed'); }
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">Orders</h1>
          <p className="text-sm text-surface-500 dark:text-surface-400">{total} total orders</p>
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="input w-auto text-sm">
          <option value="">All Statuses</option>
          {ORDER_STATUSES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
      </div>

      {loading ? <PageLoader /> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-50 dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700">
                <tr><TH>Order ID</TH><TH>Customer</TH><TH>Items</TH><TH>Total</TH><TH>Payment</TH><TH>Status</TH><TH>Date</TH><TH>Action</TH></tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-surface-700">
                {orders.map(o => (
                  <tr key={o._id} className="hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-surface-600 dark:text-surface-400">#{o._id.slice(-8).toUpperCase()}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-surface-800 dark:text-surface-200">{o.user?.name}</p>
                      <p className="text-xs text-surface-400 dark:text-surface-500">{o.user?.email}</p>
                    </td>
                    <td className="px-4 py-3 text-surface-600 dark:text-surface-400">{o.items?.length || '—'}</td>
                    <td className="px-4 py-3 font-semibold text-surface-800 dark:text-surface-200">₹{o.totalPrice?.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 capitalize text-xs text-surface-500 dark:text-surface-400">{o.paymentMethod}</td>
                    <td className="px-4 py-3"><span className={`badge capitalize text-xs ${STATUS_COLORS[o.orderStatus]}`}>{o.orderStatus}</span></td>
                    <td className="px-4 py-3 text-xs text-surface-500 dark:text-surface-400">{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
                    <td className="px-4 py-3">
                      <select value={o.orderStatus} onChange={e => updateStatus(o._id, e.target.value)}
                        className="text-xs border border-surface-200 dark:border-surface-600 rounded-lg px-2 py-1 bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-300 focus:outline-none focus:border-primary-400">
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
  const { user: currentUser } = useSelector(s => s.auth);
  const isSuperAdmin = currentUser?.role === 'super_admin';
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchUsers = async () => {
    setLoading(true);
    const { data } = await API.get(`/admin/users?page=${page}&limit=20`);
    setUsers(data.users);
    setTotal(data.total);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, [page]);

  const toggleBlock = async id => {
    try { await API.put(`/admin/users/${id}/block`); toast.success('Updated'); fetchUsers(); }
    catch { toast.error('Failed'); }
  };

  const updateRole = async (id, role) => {
    try {
      await API.put(`/admin/users/${id}/role`, { role });
      toast.success(`Role updated to ${role}`);
      fetchUsers();
    } catch { toast.error('Failed to update role'); }
  };

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">Users</h1>
        <p className="text-sm text-surface-500 dark:text-surface-400">{total} registered users</p>
      </div>

      {loading ? <PageLoader /> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-50 dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700">
                <tr><TH>User</TH><TH>Phone</TH><TH>Status</TH>{isSuperAdmin && <TH>Role</TH>}<TH>Joined</TH><TH>Action</TH></tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-surface-700">
                {users.map(u => (
                  <tr key={u._id} className="hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-surface-800 dark:text-surface-200">{u.name}</p>
                      <p className="text-xs text-surface-400 dark:text-surface-500">{u.email}</p>
                    </td>
                    <td className="px-4 py-3 text-surface-500 dark:text-surface-400">{u.phone || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`badge text-xs ${u.isBlocked
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300'}`}>
                        {u.isBlocked ? 'Blocked' : 'Active'}
                      </span>
                    </td>
                    {isSuperAdmin && (
                      <td className="px-4 py-3">
                        <select
                          value={u.role}
                          onChange={e => updateRole(u._id, e.target.value)}
                          className={`text-xs border rounded-lg px-2 py-1.5 focus:outline-none focus:border-primary-400 transition-colors
                            ${u.role === 'admin'
                              ? 'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-900/30 dark:border-purple-700 dark:text-purple-300'
                              : u.role === 'seller'
                                ? 'bg-teal-50 border-teal-200 text-teal-700 dark:bg-teal-900/30 dark:border-teal-700 dark:text-teal-300'
                                : 'bg-white border-surface-200 text-surface-600 dark:bg-surface-800 dark:border-surface-600 dark:text-surface-400'
                            }`}
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                          <option value="seller">Seller</option>
                        </select>
                      </td>
                    )}
                    <td className="px-4 py-3 text-xs text-surface-500 dark:text-surface-400">
                      {new Date(u.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleBlock(u._id)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${u.isBlocked
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300'
                            : 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-300'
                          }`}>
                        {u.isBlocked ? 'Unblock' : 'Block'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-surface-100 dark:border-surface-700">
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

  const fetchCoupons = async () => {
    setLoading(true);
    const { data } = await API.get('/coupons');
    setCoupons(data.coupons);
    setLoading(false);
  };
  useEffect(() => { fetchCoupons(); }, []);

  const createCoupon = async e => {
    e.preventDefault();
    try {
      await API.post('/coupons', { ...form, code: form.code.toUpperCase(), discountValue: Number(form.discountValue), minOrderAmount: Number(form.minOrderAmount || 0), maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null, usageLimit: form.usageLimit ? Number(form.usageLimit) : null });
      toast.success('Coupon created!');
      setShowForm(false);
      setForm({ code: '', discountType: 'percentage', discountValue: '', minOrderAmount: 0, maxDiscount: '', usageLimit: '', expiresAt: '' });
      fetchCoupons();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const deleteCoupon = async id => {
    if (!confirm('Delete coupon?')) return;
    await API.delete(`/coupons/${id}`);
    toast.success('Deleted');
    fetchCoupons();
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">Coupons</h1>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">+ New Coupon</button>
      </div>

      {showForm && (
        <form onSubmit={createCoupon} className="card p-5 space-y-4">
          <h2 className="font-semibold text-surface-800 dark:text-surface-200">Create Coupon</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <div><label className="label">Code *</label><input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="SAVE20" className="input text-sm uppercase font-mono tracking-widest" required /></div>
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
              <thead className="bg-surface-50 dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700">
                <tr><TH>Code</TH><TH>Discount</TH><TH>Min Order</TH><TH>Used</TH><TH>Expires</TH><TH>Status</TH><TH>Action</TH></tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-surface-700">
                {coupons.map(c => (
                  <tr key={c._id} className="hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-primary-600 dark:text-primary-400">{c.code}</td>
                    <td className="px-4 py-3 text-surface-700 dark:text-surface-300">{c.discountType === 'percentage' ? `${c.discountValue}%` : `₹${c.discountValue}`}</td>
                    <td className="px-4 py-3 text-surface-600 dark:text-surface-400">₹{c.minOrderAmount}</td>
                    <td className="px-4 py-3 text-surface-600 dark:text-surface-400">{c.usedCount}{c.usageLimit ? `/${c.usageLimit}` : ''}</td>
                    <td className="px-4 py-3 text-xs text-surface-500 dark:text-surface-400">{new Date(c.expiresAt).toLocaleDateString('en-IN')}</td>
                    <td className="px-4 py-3">
                      <span className={`badge text-xs ${c.isActive && new Date(c.expiresAt) > new Date() ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300' : 'bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300'}`}>
                        {c.isActive && new Date(c.expiresAt) > new Date() ? 'Active' : 'Expired'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => deleteCoupon(c._id)} className="text-red-400 hover:text-red-500 dark:text-red-400 dark:hover:text-red-300 text-xs font-medium transition-colors">Delete</button>
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