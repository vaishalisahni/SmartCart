import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FiPackage, FiChevronRight } from 'react-icons/fi';
import API from '../services/api';
import { PageLoader, EmptyState } from '../components/ui/index';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  placed:    'bg-primary-100 text-primary-700 dark:bg-primary-900/60 dark:text-primary-300',
  confirmed: 'bg-teal-100 text-teal-700 dark:bg-teal-900/60 dark:text-teal-300',
  packed:    'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300',
  shipped:   'bg-orange-100 text-orange-700 dark:bg-orange-900/60 dark:text-orange-300',
  delivered: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300',
  refunded:  'bg-surface-100 text-surface-700 dark:bg-surface-700 dark:text-surface-300',
};

export function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/orders/my').then(r => setOrders(r.data.orders)).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-surface-900 dark:text-surface-50">My Orders</h1>
      {orders.length === 0 ? (
        <EmptyState icon="📦" title="No orders yet" description="Your orders will appear here once you make a purchase."
          action={<Link to="/products" className="btn-primary">Start Shopping</Link>} />
      ) : (
        <div className="space-y-4">
          {orders.map(o => (
            <Link key={o._id} to={`/orders/${o._id}`}
              className="card p-4 flex items-center gap-4 hover:shadow-soft hover:border-primary-200 dark:hover:border-primary-700 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/40 flex items-center justify-center flex-shrink-0">
                <FiPackage size={20} className="text-primary-500 dark:text-primary-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-surface-800 dark:text-surface-200">Order #{o._id.slice(-8).toUpperCase()}</p>
                <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">{new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · {o.items?.length} item{o.items?.length !== 1 ? 's' : ''}</p>
                <p className="text-sm font-bold mt-1 text-surface-900 dark:text-surface-100">₹{o.totalPrice?.toLocaleString('en-IN')}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`badge capitalize text-xs ${STATUS_COLORS[o.orderStatus] || 'bg-surface-100 text-surface-700 dark:bg-surface-700 dark:text-surface-300'}`}>{o.orderStatus}</span>
                <FiChevronRight className="text-surface-400 group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors" size={16} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    API.get(`/orders/${id}`).then(r => setOrder(r.data.order)).finally(() => setLoading(false));
  }, [id]);

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    setCancelling(true);
    try {
      const { data } = await API.put(`/orders/${id}/cancel`, { reason: 'Cancelled by customer' });
      setOrder(data.order);
      toast.success('Order cancelled');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setCancelling(false); }
  };

  if (loading) return <PageLoader />;
  if (!order) return <div className="text-center py-20 text-surface-500 dark:text-surface-400">Order not found.</div>;

  const steps = ['placed', 'confirmed', 'packed', 'shipped', 'delivered'];
  const currentStep = steps.indexOf(order.orderStatus);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">Order Details</h1>
          <p className="text-sm text-surface-400 dark:text-surface-500 font-mono mt-0.5">#{order._id}</p>
        </div>
        <span className={`badge text-sm px-3 py-1 capitalize ${STATUS_COLORS[order.orderStatus]}`}>{order.orderStatus}</span>
      </div>

      {/* Tracking */}
      {!['cancelled', 'refunded'].includes(order.orderStatus) && (
        <div className="card p-5">
          <h2 className="font-bold mb-5 text-surface-800 dark:text-surface-200">Order Tracking</h2>
          <div className="flex items-center justify-between relative">
            <div className="absolute top-3.5 left-0 right-0 h-0.5 bg-surface-200 dark:bg-surface-700 z-0" />
            <div className="absolute top-3.5 left-0 h-0.5 bg-primary-500 z-0 transition-all duration-500"
              style={{ width: currentStep >= 0 ? `${(currentStep / 4) * 100}%` : '0%' }} />
            {steps.map((s, i) => (
              <div key={s} className="relative z-10 flex flex-col items-center gap-1.5">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300 ${
                  i <= currentStep
                    ? 'bg-primary-600 border-primary-600 text-white shadow-sm'
                    : 'bg-white dark:bg-surface-900 border-surface-300 dark:border-surface-600 text-surface-500 dark:text-surface-400'
                }`}>
                  {i < currentStep ? '✓' : i + 1}
                </div>
                <span className="text-xs capitalize text-surface-500 dark:text-surface-400 hidden sm:block font-medium">{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Items */}
        <div className="card p-4 space-y-3">
          <h2 className="font-bold text-surface-800 dark:text-surface-200">Items Ordered</h2>
          {order.items?.map(item => (
            <div key={item._id} className="flex gap-3">
              <img src={item.image || 'https://via.placeholder.com/60'} alt={item.name}
                className="w-14 h-14 object-cover rounded-xl flex-shrink-0 bg-surface-100 dark:bg-surface-700" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-surface-800 dark:text-surface-200 line-clamp-2">{item.name}</p>
                <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">Qty: {item.quantity} × ₹{item.price?.toLocaleString('en-IN')}</p>
              </div>
              <p className="text-sm font-bold text-surface-800 dark:text-surface-200 flex-shrink-0">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
            </div>
          ))}
        </div>

        {/* Summary + Address */}
        <div className="space-y-4">
          <div className="card p-4 space-y-2 text-sm">
            <h2 className="font-bold text-base text-surface-800 dark:text-surface-200">Price Summary</h2>
            <div className="flex justify-between text-surface-600 dark:text-surface-400"><span>Items Total</span><span>₹{order.itemsPrice?.toLocaleString('en-IN')}</span></div>
            <div className="flex justify-between text-surface-600 dark:text-surface-400"><span>GST</span><span>₹{order.taxPrice?.toLocaleString('en-IN')}</span></div>
            <div className="flex justify-between text-surface-600 dark:text-surface-400">
              <span>Shipping</span>
              <span className={order.shippingPrice === 0 ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''}>
                {order.shippingPrice === 0 ? 'FREE' : `₹${order.shippingPrice}`}
              </span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400"><span>Discount</span><span>−₹{order.discountAmount}</span></div>
            )}
            <div className="divider" />
            <div className="flex justify-between font-bold text-base text-surface-900 dark:text-surface-50"><span>Total Paid</span><span>₹{order.totalPrice?.toLocaleString('en-IN')}</span></div>
            <p className="text-xs text-surface-400 dark:text-surface-500">Payment: {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</p>
          </div>

          <div className="card p-4 text-sm">
            <h2 className="font-bold text-base mb-2.5 text-surface-800 dark:text-surface-200">Delivery Address</h2>
            <p className="font-semibold text-surface-800 dark:text-surface-200">{order.shippingAddress?.fullName}</p>
            <p className="text-surface-500 dark:text-surface-400 mt-1">{order.shippingAddress?.street}</p>
            <p className="text-surface-500 dark:text-surface-400">{order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}</p>
            <p className="text-surface-500 dark:text-surface-400 mt-0.5">{order.shippingAddress?.phone}</p>
          </div>
        </div>
      </div>

      {['placed', 'confirmed'].includes(order.orderStatus) && (
        <button onClick={handleCancel} disabled={cancelling} className="btn-danger text-sm px-6">
          {cancelling ? 'Cancelling...' : 'Cancel Order'}
        </button>
      )}
    </div>
  );
}

export default OrdersPage;