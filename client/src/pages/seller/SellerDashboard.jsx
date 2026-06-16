import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiPackage, FiShoppingBag, FiDollarSign, FiAlertTriangle, FiArrowRight, FiStar } from 'react-icons/fi';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import API from '../../services/api';
import { PageLoader } from '../../components/ui/index';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const STATUS_COLORS = {
  placed:    'bg-primary-100 text-primary-700 dark:bg-primary-900/60 dark:text-primary-300',
  confirmed: 'bg-teal-100 text-teal-700 dark:bg-teal-900/60 dark:text-teal-300',
  packed:    'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300',
  shipped:   'bg-orange-100 text-orange-700 dark:bg-orange-900/60 dark:text-orange-300',
  delivered: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300',
};

export default function SellerDashboard() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/seller/dashboard')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  if (!data?.profile) {
    return (
      <div className="p-8 text-center">
        <p className="text-surface-500 dark:text-surface-400">
          Seller profile not found.{' '}
          <Link to="/seller/register" className="text-primary-600 dark:text-primary-400 font-semibold hover:underline">
            Register as a seller →
          </Link>
        </p>
      </div>
    );
  }

  const { profile, stats, recentProducts, recentOrders, lowStock, salesData } = data;

  const chartData = (salesData || []).map(d => ({
    name: MONTHS[d._id.month - 1],
    revenue: d.revenue,
    orders: d.orders,
  }));

  const statCards = [
    {
      label: 'Products Listed',
      value: stats.totalProducts,
      icon: <FiShoppingBag size={20} />,
      color: 'text-primary-600 dark:text-primary-400',
      bg: 'bg-primary-50 dark:bg-primary-900/40',
      to: '/seller/products',
    },
    {
      label: 'Total Orders',
      value: stats.totalOrders,
      icon: <FiPackage size={20} />,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-900/40',
      to: '/seller/orders',
    },
    {
      label: 'Total Revenue',
      value: `₹${(stats.totalRevenue || 0).toLocaleString('en-IN')}`,
      icon: <FiDollarSign size={20} />,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-900/40',
    },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-surface-900 dark:text-surface-50">
            {profile.storeName}
          </h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5">
            {profile.approved
              ? '✅ Store is live'
              : '⏳ Pending admin approval'}
          </p>
        </div>
        <Link to="/seller/products/add" className="btn-primary text-sm flex items-center gap-2">
          + Add Product
        </Link>
      </div>

      {/* Approval banner */}
      {!profile.approved && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-center gap-3">
          <FiAlertTriangle size={18} className="text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-700 dark:text-amber-400">
            Your store is under review. You can add products now, but they won't be visible to customers until approved.
          </p>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map(s => (
          <div key={s.label} className={`card p-4 flex items-center gap-4 ${s.to ? 'hover:shadow-soft transition-shadow cursor-pointer' : ''}`}
            onClick={() => s.to && (window.location.href = s.to)}>
            <div className={`p-3 rounded-xl flex-shrink-0 ${s.bg}`}>
              <span className={s.color}>{s.icon}</span>
            </div>
            <div>
              <p className="text-xs text-surface-500 dark:text-surface-400 font-medium">{s.label}</p>
              <p className="text-xl font-bold text-surface-900 dark:text-surface-50 mt-0.5">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Chart + Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <div className="lg:col-span-2 card p-5">
          <h2 className="font-bold mb-4 text-surface-800 dark:text-surface-200">Revenue (Last 6 Months)</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,150,148,0.15)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} width={45} />
                <Tooltip
                  contentStyle={{ background: 'white', border: '1px solid #dde', borderRadius: 12, fontSize: 12 }}
                  formatter={v => [`₹${v?.toLocaleString('en-IN')}`, 'Revenue']}
                />
                <Line type="monotone" dataKey="revenue" stroke="#247370" strokeWidth={2.5} dot={{ fill: '#247370', r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-surface-400 dark:text-surface-500 text-sm">
              No sales data yet. Start selling to see your revenue chart.
            </div>
          )}
        </div>

        {/* Low stock */}
        <div className="card p-5">
          <h2 className="font-bold mb-4 flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm">
            <FiAlertTriangle size={15} /> Low Stock Alert
          </h2>
          {lowStock?.length > 0 ? (
            <div className="space-y-3">
              {lowStock.map(p => (
                <div key={p._id} className="flex items-center justify-between text-sm">
                  <span className="truncate text-surface-700 dark:text-surface-300 font-medium mr-2">{p.name}</span>
                  <span className={`badge text-xs flex-shrink-0 ${
                    p.stock === 0
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300'
                  }`}>
                    {p.stock} left
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-surface-400 dark:text-surface-500">All products are well-stocked.</p>
          )}
        </div>
      </div>

      {/* Recent Products + Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent products */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-surface-800 dark:text-surface-200">Recent Products</h2>
            <Link to="/seller/products" className="text-primary-600 dark:text-primary-400 text-xs hover:underline font-medium flex items-center gap-1">
              View All <FiArrowRight size={11} />
            </Link>
          </div>
          {recentProducts?.length > 0 ? (
            <div className="space-y-3">
              {recentProducts.map(p => (
                <div key={p._id} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-surface-100 dark:bg-surface-700 flex-shrink-0 border border-surface-200 dark:border-surface-600">
                    {p.images?.[0]
                      ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><FiShoppingBag size={14} className="text-surface-400" /></div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-800 dark:text-surface-200 truncate">{p.name}</p>
                    <p className="text-xs text-surface-500 dark:text-surface-400">₹{p.price?.toLocaleString('en-IN')} · {p.stock} in stock</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <FiStar size={11} className="text-amber-400 fill-amber-400" />
                    <span className="text-xs text-surface-500 dark:text-surface-400">{p.ratings?.toFixed(1) || '—'}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-surface-400 dark:text-surface-500 mb-3">No products yet.</p>
              <Link to="/seller/products/add" className="btn-primary text-sm px-4 py-2">Add your first product</Link>
            </div>
          )}
        </div>

        {/* Recent orders */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-surface-800 dark:text-surface-200">Recent Orders</h2>
            <Link to="/seller/orders" className="text-primary-600 dark:text-primary-400 text-xs hover:underline font-medium flex items-center gap-1">
              View All <FiArrowRight size={11} />
            </Link>
          </div>
          {recentOrders?.length > 0 ? (
            <div className="space-y-3">
              {recentOrders.map(o => (
                <div key={o._id} className="flex items-center justify-between text-sm">
                  <div className="min-w-0">
                    <p className="font-medium text-surface-800 dark:text-surface-200 truncate">{o.user?.name}</p>
                    <p className="text-xs text-surface-500 dark:text-surface-400">
                      ₹{o.items?.reduce((s, i) => s + i.price * i.quantity, 0).toLocaleString('en-IN')}
                      {' · '}
                      {new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <span className={`badge capitalize text-xs flex-shrink-0 ${STATUS_COLORS[o.orderStatus] || 'bg-surface-100 text-surface-600 dark:bg-surface-700 dark:text-surface-300'}`}>
                    {o.orderStatus}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-surface-400 dark:text-surface-500 text-center py-6">No orders yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}