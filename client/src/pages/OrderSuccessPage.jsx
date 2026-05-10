// OrderSuccessPage.jsx
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FiCheckCircle, FiPackage, FiShoppingBag } from 'react-icons/fi';
import API from '../services/api';

export function OrderSuccessPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => { API.get(`/orders/${id}`).then(r => setOrder(r.data.order)); }, [id]);

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center mx-auto mb-6">
        <FiCheckCircle size={40} className="text-emerald-500 dark:text-emerald-400" />
      </div>
      <h1 className="text-2xl font-bold mb-2 text-surface-900 dark:text-surface-50">Order Placed Successfully!</h1>
      <p className="text-surface-500 dark:text-surface-400 mb-3">
        Order ID: <span className="font-mono text-xs bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 px-2 py-1 rounded-lg">{id}</span>
      </p>
      {order && (
        <p className="text-surface-600 dark:text-surface-400 mb-3">
          Total: <strong className="text-surface-900 dark:text-surface-100">₹{order.totalPrice?.toLocaleString('en-IN')}</strong> via{' '}
          {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
        </p>
      )}
      <p className="text-sm text-surface-400 dark:text-surface-500 mb-8">
        A confirmation email has been sent to your registered email address.
      </p>
      <div className="flex gap-3 justify-center flex-wrap">
        <Link to={`/orders/${id}`} className="btn-primary flex items-center gap-2">
          <FiPackage size={14} /> Track Order
        </Link>
        <Link to="/products" className="btn-outline flex items-center gap-2">
          <FiShoppingBag size={14} /> Continue Shopping
        </Link>
      </div>
    </div>
  );
}

export default OrderSuccessPage;