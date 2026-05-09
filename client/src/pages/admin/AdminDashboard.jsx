import { useState, useEffect } from 'react';
import { FiUsers, FiShoppingBag, FiPackage, FiDollarSign, FiAlertTriangle } from 'react-icons/fi';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from 'recharts';
import { Link } from 'react-router-dom';
import API from '../../services/api';
import { PageLoader } from '../../components/ui/index';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const STATUS_COLORS = { placed: 'bg-blue-100 text-blue-700', confirmed: 'bg-indigo-100 text-indigo-700', packed: 'bg-yellow-100 text-yellow-700', shipped: 'bg-orange-100 text-orange-700', delivered: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700' };

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
    { label: 'Total Users', value: data.stats.totalUsers, icon: <FiUsers size={22} />, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Total Products', value: data.stats.totalProducts, icon: <FiShoppingBag size={22} />, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { label: 'Total Orders', value: data.stats.totalOrders, icon: <FiPackage size={22} />, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
    { label: 'Total Revenue', value: `₹${data.stats.totalRevenue?.toLocaleString()}`, icon: <FiDollarSign size={22} />, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard Overview</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="card p-4 flex items-center gap-4">
            <div className={`p-3 rounded-xl ${s.bg} ${s.color}`}>{s.icon}</div>
            <div>
              <p className="text-xs text-gray-500 font-medium">{s.label}</p>
              <p className="text-xl font-bold mt-0.5">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h2 className="font-bold mb-4">Revenue (Last 6 Months)</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={v => [`₹${v?.toLocaleString()}`, 'Revenue']} />
                <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-400 text-sm text-center py-10">No sales data yet</p>}
        </div>

        <div className="card p-5">
          <h2 className="font-bold mb-4">Orders per Month</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="orders" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-400 text-sm text-center py-10">No orders data yet</p>}
        </div>
      </div>

      {/* Low Stock + Recent Orders */}
      <div className="grid lg:grid-cols-2 gap-6">
        {data.lowStockProducts?.length > 0 && (
          <div className="card p-5">
            <h2 className="font-bold mb-4 flex items-center gap-2 text-orange-600">
              <FiAlertTriangle size={16} /> Low Stock Alert
            </h2>
            <div className="space-y-2">
              {data.lowStockProducts.map(p => (
                <div key={p._id} className="flex items-center justify-between text-sm">
                  <span className="truncate font-medium">{p.name}</span>
                  <span className={`badge ${p.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>{p.stock} left</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold">Recent Orders</h2>
            <Link to="/admin/orders" className="text-primary-600 text-xs hover:underline">View All</Link>
          </div>
          <div className="space-y-3">
            {data.recentOrders?.map(o => (
              <div key={o._id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium">{o.user?.name}</p>
                  <p className="text-xs text-gray-500">₹{o.totalPrice?.toLocaleString()}</p>
                </div>
                <span className={`badge capitalize text-xs ${STATUS_COLORS[o.orderStatus] || 'bg-gray-100 text-gray-700'}`}>{o.orderStatus}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}