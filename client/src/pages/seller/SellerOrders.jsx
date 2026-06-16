import { useState, useEffect } from 'react';
import { FiPackage, FiChevronDown } from 'react-icons/fi';
import API from '../../services/api';
import { PageLoader, Pagination, EmptyState } from '../../components/ui/index';

const STATUS_COLORS = {
  placed:    'bg-primary-100 text-primary-700 dark:bg-primary-900/60 dark:text-primary-300',
  confirmed: 'bg-teal-100 text-teal-700 dark:bg-teal-900/60 dark:text-teal-300',
  packed:    'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300',
  shipped:   'bg-orange-100 text-orange-700 dark:bg-orange-900/60 dark:text-orange-300',
  delivered: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300',
  refunded:  'bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300',
};

const ORDER_STATUSES = ['placed','confirmed','packed','shipped','delivered','cancelled','refunded'];

export default function SellerOrders() {
  const [orders, setOrders]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage]             = useState(1);
  const [total, setTotal]           = useState(0);
  const [expandedId, setExpandedId] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    const p = new URLSearchParams({ page, limit: 20 });
    if (statusFilter) p.set('status', statusFilter);
    try {
      const { data } = await API.get(`/seller/orders?${p}`);
      setOrders(data.orders);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [page, statusFilter]);

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-surface-900 dark:text-surface-50">My Orders</h1>
          <p className="text-sm text-surface-500 dark:text-surface-400">{total} orders for your products</p>
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="input w-auto text-sm"
        >
          <option value="">All Statuses</option>
          {ORDER_STATUSES.map(s => (
            <option key={s} value={s} className="capitalize">{s}</option>
          ))}
        </select>
      </div>

      {loading ? <PageLoader /> : orders.length === 0 ? (
        <EmptyState
          icon="📦"
          title="No orders yet"
          description="Orders containing your products will appear here."
        />
      ) : (
        <div className="space-y-3">
          {orders.map(o => (
            <div key={o._id} className="card overflow-hidden">
              {/* Row */}
              <div
                className="flex items-center gap-4 p-4 cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-700/30 transition-colors"
                onClick={() => setExpandedId(expandedId === o._id ? null : o._id)}
              >
                <div className="min-w-0 flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-surface-400 dark:text-surface-500 font-medium mb-0.5">Order</p>
                    <p className="font-semibold text-surface-800 dark:text-surface-200 font-mono text-xs">
                      #{o._id.slice(-8).toUpperCase()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-surface-400 dark:text-surface-500 font-medium mb-0.5">Customer</p>
                    <p className="text-surface-700 dark:text-surface-300 truncate">{o.user?.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-surface-400 dark:text-surface-500 font-medium mb-0.5">Revenue</p>
                    <p className="font-bold text-primary-600 dark:text-primary-400">
                      ₹{o.items?.reduce((s, i) => s + i.price * i.quantity, 0).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-surface-400 dark:text-surface-500 font-medium mb-0.5">Status</p>
                    <span className={`badge capitalize text-xs ${STATUS_COLORS[o.orderStatus] || 'bg-surface-100 text-surface-600 dark:bg-surface-700 dark:text-surface-300'}`}>
                      {o.orderStatus}
                    </span>
                  </div>
                </div>
                <FiChevronDown
                  size={15}
                  className={`text-surface-400 transition-transform flex-shrink-0 ${expandedId === o._id ? 'rotate-180' : ''}`}
                />
              </div>

              {/* Expanded */}
              {expandedId === o._id && (
                <div className="border-t border-surface-100 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50 p-4 space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-2">
                      Your Items in this Order
                    </p>
                    <div className="space-y-2">
                      {o.items?.map((item, i) => (
                        <div key={i} className="flex items-center gap-3 bg-white dark:bg-surface-800 rounded-xl p-2.5 border border-surface-100 dark:border-surface-700">
                          <img
                            src={item.image || 'https://via.placeholder.com/40'}
                            alt={item.name}
                            className="w-10 h-10 object-cover rounded-lg flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-surface-800 dark:text-surface-200 truncate">{item.name}</p>
                            <p className="text-xs text-surface-400 dark:text-surface-500">Qty: {item.quantity} × ₹{item.price?.toLocaleString('en-IN')}</p>
                          </div>
                          <p className="text-sm font-semibold text-surface-700 dark:text-surface-300 flex-shrink-0">
                            ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-surface-400 dark:text-surface-500 font-medium mb-1">Ship To</p>
                      <p className="text-surface-700 dark:text-surface-300">
                        {o.shippingAddress?.fullName}<br />
                        {o.shippingAddress?.street}, {o.shippingAddress?.city}<br />
                        {o.shippingAddress?.state} — {o.shippingAddress?.pincode}<br />
                        {o.shippingAddress?.phone}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-surface-400 dark:text-surface-500 font-medium mb-1">Order Date</p>
                      <p className="text-surface-700 dark:text-surface-300">
                        {new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                      <p className="text-xs text-surface-400 dark:text-surface-500 mt-1">
                        Payment: {o.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online (Razorpay)'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {Math.ceil(total / 20) > 1 && (
            <Pagination page={page} pages={Math.ceil(total / 20)} onPageChange={setPage} />
          )}
        </div>
      )}
    </div>
  );
}