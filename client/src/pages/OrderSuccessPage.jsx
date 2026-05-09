// OrderSuccessPage.jsx
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FiCheckCircle, FiPackage } from 'react-icons/fi';
import API from '../services/api';

export default function OrderSuccessPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  useEffect(() => { API.get(`/orders/${id}`).then(r => setOrder(r.data.order)); }, [id]);
  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <FiCheckCircle size={64} className="text-green-500 mx-auto mb-4" />
      <h1 className="text-2xl font-bold mb-2">Order Placed Successfully!</h1>
      <p className="text-gray-500 mb-2">Order ID: <span className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{id}</span></p>
      {order && <p className="text-gray-600 mb-6">Total: <strong>₹{order.totalPrice?.toLocaleString()}</strong> via {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</p>}
      <p className="text-sm text-gray-500 mb-8">A confirmation email has been sent to your registered email address.</p>
      <div className="flex gap-3 justify-center">
        <Link to={`/orders/${id}`} className="btn-primary flex items-center gap-2"><FiPackage size={14} /> Track Order</Link>
        <Link to="/products" className="btn-outline">Continue Shopping</Link>
      </div>
    </div>
  );
}