import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FiPackage, FiChevronRight } from 'react-icons/fi';
import API from '../services/api';
import { PageLoader, EmptyState } from '../components/ui/index';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  placed: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-indigo-100 text-indigo-700',
  packed: 'bg-yellow-100 text-yellow-700',
  shipped: 'bg-orange-100 text-orange-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  refunded: 'bg-gray-100 text-gray-700',
};

export function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { API.get('/orders/my').then(r => setOrders(r.data.orders)).finally(() => setLoading(false)); }, []);
  if (loading) return <PageLoader />;
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Orders</h1>
      {orders.length === 0 ? (
        <EmptyState icon="📦" title="No orders yet" description="Your orders will appear here once you make a purchase."
          action={<Link to="/products" className="btn-primary">Start Shopping</Link>} />
      ) : (
        <div className="space-y-4">
          {orders.map(o => (
            <Link key={o._id} to={`/orders/${o._id}`} className="card p-4 flex items-center gap-4 hover:shadow-md transition group">
              <FiPackage size={32} className="text-primary-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">Order #{o._id.slice(-8).toUpperCase()}</p>
                <p className="text-xs text-gray-500">{new Date(o.createdAt).toLocaleDateString()} · {o.items?.length} items</p>
                <p className="text-sm font-bold mt-1">₹{o.totalPrice?.toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`badge capitalize ${STATUS_COLORS[o.orderStatus] || 'bg-gray-100 text-gray-700'}`}>{o.orderStatus}</span>
                <FiChevronRight className="text-gray-400 group-hover:text-primary-500 transition" />
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
  useEffect(() => { API.get(`/orders/${id}`).then(r => setOrder(r.data.order)).finally(() => setLoading(false)); }, [id]);

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
  if (!order) return <div className="text-center py-20">Order not found.</div>;

  const steps = ['placed', 'confirmed', 'packed', 'shipped', 'delivered'];
  const currentStep = steps.indexOf(order.orderStatus);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Order Details</h1>
          <p className="text-sm text-gray-500 font-mono">#{order._id}</p>
        </div>
        <span className={`badge text-sm px-3 py-1 capitalize ${STATUS_COLORS[order.orderStatus]}`}>{order.orderStatus}</span>
      </div>

      {/* Tracking */}
      {!['cancelled', 'refunded'].includes(order.orderStatus) && (
        <div className="card p-5">
          <h2 className="font-bold mb-4">Order Tracking</h2>
          <div className="flex items-center justify-between relative">
            <div className="absolute top-3.5 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700 z-0" />
            <div className="absolute top-3.5 left-0 h-0.5 bg-primary-500 z-0 transition-all" style={{ width: currentStep >= 0 ? `${(currentStep / 4) * 100}%` : '0%' }} />
            {steps.map((s, i) => (
              <div key={s} className="relative z-10 flex flex-col items-center gap-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition ${i <= currentStep ? 'bg-primary-600 border-primary-600 text-white' : 'bg-white dark:bg-gray-900 border-gray-300'}`}>
                  {i < currentStep ? '✓' : i + 1}
                </div>
                <span className="text-xs capitalize text-gray-600 dark:text-gray-400 hidden sm:block">{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Items */}
        <div className="card p-4 space-y-3">
          <h2 className="font-bold">Items Ordered</h2>
          {order.items?.map(item => (
            <div key={item._id} className="flex gap-3">
              <img src={item.image || 'https://via.placeholder.com/60'} alt={item.name} className="w-14 h-14 object-cover rounded-lg flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium">{item.name}</p>
                <p className="text-xs text-gray-500">Qty: {item.quantity} × ₹{item.price?.toLocaleString()}</p>
              </div>
              <p className="text-sm font-bold">₹{(item.price * item.quantity).toLocaleString()}</p>
            </div>
          ))}
        </div>

        {/* Summary + Address */}
        <div className="space-y-4">
          <div className="card p-4 space-y-2 text-sm">
            <h2 className="font-bold text-base">Price Summary</h2>
            <div className="flex justify-between"><span className="text-gray-500">Items Total</span><span>₹{order.itemsPrice?.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">GST</span><span>₹{order.taxPrice?.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span>{order.shippingPrice === 0 ? 'FREE' : `₹${order.shippingPrice}`}</span></div>
            {order.discountAmount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>−₹{order.discountAmount}</span></div>}
            <hr className="border-gray-200 dark:border-gray-700" />
            <div className="flex justify-between font-bold text-base"><span>Total Paid</span><span>₹{order.totalPrice?.toLocaleString()}</span></div>
            <p className="text-xs text-gray-500">Payment: {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</p>
          </div>

          <div className="card p-4 text-sm">
            <h2 className="font-bold text-base mb-2">Delivery Address</h2>
            <p className="font-medium">{order.shippingAddress?.fullName}</p>
            <p className="text-gray-500">{order.shippingAddress?.street}</p>
            <p className="text-gray-500">{order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}</p>
            <p className="text-gray-500">{order.shippingAddress?.phone}</p>
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