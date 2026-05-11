import { useState, useEffect } from 'react';
import { FiUsers, FiShoppingBag, FiPackage, FiDollarSign, FiAlertTriangle } from 'react-icons/fi';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from 'recharts';
import { Link } from 'react-router-dom';
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

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/admin/dashboard').then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;
  if (!data) return <div className="p-8 text-red-500">Failed to load dashboard</div>;

  const chartData = data.salesData.map(d => ({
    name: MONTHS[d._id.month - 1],
    revenue: d.revenue,
    orders: d.orders,
  }));

  const stats = [
    { label: 'Total Users',    value: data.stats.totalUsers,                            icon: <FiUsers size={20} />,       color: 'text-primary-600 dark:text-primary-400',  bg: 'bg-primary-50 dark:bg-primary-900/40' },
    { label: 'Total Products', value: data.stats.totalProducts,                         icon: <FiShoppingBag size={20} />, color: 'text-purple-600 dark:text-purple-400',    bg: 'bg-purple-50 dark:bg-purple-900/40' },
    { label: 'Total Orders',   value: data.stats.totalOrders,                           icon: <FiPackage size={20} />,     color: 'text-amber-600 dark:text-amber-400',      bg: 'bg-amber-50 dark:bg-amber-900/40' },
    { label: 'Total Revenue',  value: `₹${data.stats.totalRevenue?.toLocaleString('en-IN')}`, icon: <FiDollarSign size={20} />, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/40' },
  ];

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <h1 className="text-xl md:text-2xl font-bold text-surface-900 dark:text-surface-50">Dashboard Overview</h1>

      {/* Stats - 2 cols on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {stats.map(s => (
          <div key={s.label} className="card p-3 md:p-4 flex items-center gap-3 md:gap-4">
            <div className={`p-2 md:p-3 rounded-xl flex-shrink-0 ${s.bg}`}>
              <span className={s.color}>{s.icon}</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-surface-500 dark:text-surface-400 font-medium truncate">{s.label}</p>
              <p className="text-lg md:text-xl font-bold mt-0.5 text-surface-900 dark:text-surface-50 truncate">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts - stack on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="card p-4 md:p-5">
          <h2 className="font-bold mb-4 text-surface-800 dark:text-surface-200 text-sm md:text-base">Revenue (Last 6 Months)</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,150,148,0.15)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'currentColor' }} />
                <YAxis tick={{ fontSize: 11, fill: 'currentColor' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} width={45} />
                <Tooltip
                  contentStyle={{ background: 'var(--tooltip-bg, white)', border: '1px solid #dde', borderRadius: 12, fontSize: 12 }}
                  formatter={v => [`₹${v?.toLocaleString('en-IN')}`, 'Revenue']} />
                <Line type="monotone" dataKey="revenue" stroke="#247370" strokeWidth={2.5} dot={{ fill: '#247370', r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <p className="text-surface-400 dark:text-surface-500 text-sm text-center py-10">No sales data yet</p>}
        </div>

        <div className="card p-4 md:p-5">
          <h2 className="font-bold mb-4 text-surface-800 dark:text-surface-200 text-sm md:text-base">Orders per Month</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,150,148,0.15)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={35} />
                <Tooltip contentStyle={{ background: 'var(--tooltip-bg, white)', border: '1px solid #dde', borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="orders" fill="#247370" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-surface-400 dark:text-surface-500 text-sm text-center py-10">No orders data yet</p>}
        </div>
      </div>

      {/* Low Stock + Recent Orders - stack on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {data.lowStockProducts?.length > 0 && (
          <div className="card p-4 md:p-5">
            <h2 className="font-bold mb-4 flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm md:text-base">
              <FiAlertTriangle size={16} /> Low Stock Alert
            </h2>
            <div className="space-y-2.5">
              {data.lowStockProducts.map(p => (
                <div key={p._id} className="flex items-center justify-between text-sm">
                  <span className="truncate font-medium text-surface-700 dark:text-surface-300 mr-2">{p.name}</span>
                  <span className={`badge text-xs flex-shrink-0 ${p.stock === 0 ? 'bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300'}`}>
                    {p.stock} left
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="card p-4 md:p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-surface-800 dark:text-surface-200 text-sm md:text-base">Recent Orders</h2>
            <Link to="/admin/orders" className="text-primary-600 dark:text-primary-400 text-xs hover:underline font-medium">View All</Link>
          </div>
          <div className="space-y-3">
            {data.recentOrders?.map(o => (
              <div key={o._id} className="flex items-center justify-between text-sm gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-surface-800 dark:text-surface-200 truncate">{o.user?.name}</p>
                  <p className="text-xs text-surface-500 dark:text-surface-400">₹{o.totalPrice?.toLocaleString('en-IN')}</p>
                </div>
                <span className={`badge capitalize text-xs flex-shrink-0 ${STATUS_COLORS[o.orderStatus] || 'bg-surface-100 text-surface-700 dark:bg-surface-700 dark:text-surface-300'}`}>
                  {o.orderStatus}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}