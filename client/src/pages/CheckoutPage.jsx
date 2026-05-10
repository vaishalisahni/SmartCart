import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiCheck, FiMapPin, FiCreditCard } from 'react-icons/fi';
import { clearCart } from '../store/slices/cartSlice';
import API from '../services/api';
import toast from 'react-hot-toast';

export default function CheckoutPage() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const dispatch   = useDispatch();
  const { cart }   = useSelector(s => s.cart);
  const { user }   = useSelector(s => s.auth);
  const couponCode = location.state?.couponCode || '';

  const [step, setStep]             = useState(1);
  const [address, setAddress]       = useState({ fullName: user?.name || '', phone: '', street: '', city: '', state: '', pincode: '' });
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [loading, setLoading]       = useState(false);
  const [savedAddresses, setSavedAddresses] = useState(user?.addresses || []);

  useEffect(() => { if (user?.addresses?.length) setSavedAddresses(user.addresses); }, [user]);

  const items    = cart?.items?.filter(i => i.product?.isActive) || [];
  const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const tax      = Math.round(subtotal * 0.18);
  const shipping = subtotal > 499 ? 0 : 49;
  const total    = subtotal + tax + shipping;

  const handleAddressSelect = addr => {
    setAddress({ fullName: addr.fullName, phone: addr.phone, street: addr.street, city: addr.city, state: addr.state, pincode: addr.pincode });
  };

  const placeOrder = async (paymentResult = {}) => {
    setLoading(true);
    try {
      const orderItems = items.map(i => ({ product: i.product._id, quantity: i.quantity }));
      const { data } = await API.post('/orders', {
        items: orderItems, shippingAddress: address, paymentMethod,
        couponCode, paymentResult,
      });
      dispatch(clearCart());
      toast.success('Order placed successfully!');
      navigate(`/order-success/${data.order._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Order failed');
    } finally { setLoading(false); }
  };

  const handleRazorpay = async () => {
    setLoading(true);
    try {
      const { data } = await API.post('/payment/razorpay/order', { amount: total });
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.order.amount,
        currency: 'INR',
        name: 'SmartCart',
        description: 'Order Payment',
        order_id: data.order.id,
        handler: async response => {
          const verify = await API.post('/payment/razorpay/verify', response);
          if (verify.data.success) await placeOrder(response);
          else toast.error('Payment verification failed');
        },
        prefill: { name: user.name, email: user.email, contact: address.phone },
        theme: { color: '#247370' },
      };
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => toast.error('Payment failed'));
      rzp.open();
    } catch { toast.error('Failed to initiate payment'); }
    finally { setLoading(false); }
  };

  const handleSubmit = () => {
    if (!address.fullName || !address.phone || !address.street || !address.city || !address.state || !address.pincode) {
      toast.error('Please fill all address fields'); return;
    }
    if (step === 1) { setStep(2); return; }
    if (paymentMethod === 'razorpay') handleRazorpay();
    else placeOrder();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-surface-900 dark:text-surface-50">Checkout</h1>

      {/* Steps */}
      <div className="flex items-center gap-4 mb-8">
        {[
          { label: 'Shipping Address', icon: <FiMapPin size={14} /> },
          { label: 'Payment', icon: <FiCreditCard size={14} /> }
        ].map((s, i) => (
          <div key={s.label} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
              step > i + 1
                ? 'bg-emerald-500 dark:bg-emerald-600 text-white'
                : step === i + 1
                  ? 'bg-primary-600 text-white shadow-lifted'
                  : 'bg-surface-200 dark:bg-surface-700 text-surface-500 dark:text-surface-400'
            }`}>
              {step > i + 1 ? <FiCheck size={14} /> : i + 1}
            </div>
            <span className={`text-sm font-medium ${
              step === i + 1
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-surface-500 dark:text-surface-400'
            }`}>{s.label}</span>
            {i < 1 && <div className="w-12 h-0.5 bg-surface-200 dark:bg-surface-700 mx-1" />}
          </div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-6">
          {/* Step 1: Address */}
          {step === 1 && (
            <div className="card p-5 space-y-4">
              <h2 className="font-bold text-lg text-surface-900 dark:text-surface-100">Shipping Address</h2>
              {savedAddresses.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-surface-600 dark:text-surface-400">Saved Addresses:</p>
                  {savedAddresses.map(a => (
                    <button key={a._id} onClick={() => handleAddressSelect(a)}
                      className="w-full text-left p-3 border border-surface-200 dark:border-surface-600 rounded-xl text-sm hover:border-primary-400 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950/30 transition bg-white dark:bg-surface-800">
                      <p className="font-medium text-surface-800 dark:text-surface-200">{a.fullName}</p>
                      <p className="text-surface-500 dark:text-surface-400">{a.street}, {a.city}, {a.state} - {a.pincode}</p>
                    </button>
                  ))}
                  <p className="text-sm font-medium text-surface-600 dark:text-surface-400 pt-2">Or enter new address:</p>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input value={address.fullName} onChange={e => setAddress(a => ({ ...a, fullName: e.target.value }))} placeholder="Full Name *" className="input text-sm" />
                <input value={address.phone} onChange={e => setAddress(a => ({ ...a, phone: e.target.value }))} placeholder="Phone *" className="input text-sm" />
                <input value={address.street} onChange={e => setAddress(a => ({ ...a, street: e.target.value }))} placeholder="Street Address *" className="input text-sm sm:col-span-2" />
                <input value={address.city} onChange={e => setAddress(a => ({ ...a, city: e.target.value }))} placeholder="City *" className="input text-sm" />
                <input value={address.state} onChange={e => setAddress(a => ({ ...a, state: e.target.value }))} placeholder="State *" className="input text-sm" />
                <input value={address.pincode} onChange={e => setAddress(a => ({ ...a, pincode: e.target.value }))} placeholder="Pincode *" className="input text-sm" />
              </div>
            </div>
          )}

          {/* Step 2: Payment */}
          {step === 2 && (
            <div className="card p-5 space-y-4">
              <h2 className="font-bold text-lg text-surface-900 dark:text-surface-100">Payment Method</h2>
              <div className="space-y-3">
                {[
                  { id: 'razorpay', label: 'Online Payment (UPI / Card / Net Banking)', icon: '💳', desc: 'Secure payment via Razorpay' },
                  { id: 'cod',      label: 'Cash on Delivery', icon: '💵', desc: 'Pay when your order arrives' },
                ].map(m => (
                  <label key={m.id} className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    paymentMethod === m.id
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/40'
                      : 'border-surface-200 dark:border-surface-600 hover:border-primary-300 dark:hover:border-primary-700 bg-white dark:bg-surface-800'
                  }`}>
                    <input type="radio" name="payment" value={m.id} checked={paymentMethod === m.id} onChange={() => setPaymentMethod(m.id)} className="mt-1 accent-primary-600" />
                    <div>
                      <p className="font-medium text-sm text-surface-800 dark:text-surface-200">{m.icon} {m.label}</p>
                      <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">{m.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
              <div className="bg-surface-50 dark:bg-surface-700/50 rounded-xl p-3 text-sm border border-surface-100 dark:border-surface-600">
                <p className="font-medium text-surface-800 dark:text-surface-200 mb-1">Delivering to:</p>
                <p className="text-surface-600 dark:text-surface-400">{address.fullName}, {address.street}, {address.city}, {address.state} - {address.pincode}</p>
                <button onClick={() => setStep(1)} className="text-primary-600 dark:text-primary-400 text-xs mt-1.5 hover:underline font-medium">Change address</button>
              </div>
            </div>
          )}

          <button onClick={handleSubmit} disabled={loading} className="btn-primary w-full py-3.5 text-base font-bold">
            {loading ? 'Processing...' : step === 1 ? 'Continue to Payment →' : `Place Order — ₹${total.toLocaleString()}`}
          </button>
        </div>

        {/* Order Summary */}
        <div className="w-full lg:w-80">
          <div className="card p-4 space-y-3 sticky top-24">
            <h3 className="font-bold text-surface-900 dark:text-surface-100">Order Items ({items.length})</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {items.map(item => (
                <div key={item.product._id} className="flex gap-3">
                  <img src={item.product.images?.[0]} alt={item.product.name} className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium line-clamp-2 text-surface-800 dark:text-surface-200">{item.product.name}</p>
                    <p className="text-xs text-surface-500 dark:text-surface-400">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold text-surface-800 dark:text-surface-200">₹{(item.product.price * item.quantity).toLocaleString()}</p>
                </div>
              ))}
            </div>
            <div className="divider" />
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-surface-500 dark:text-surface-400">Subtotal</span><span className="text-surface-800 dark:text-surface-200">₹{subtotal.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-surface-500 dark:text-surface-400">GST (18%)</span><span className="text-surface-800 dark:text-surface-200">₹{tax.toLocaleString()}</span></div>
              <div className="flex justify-between">
                <span className="text-surface-500 dark:text-surface-400">Shipping</span>
                <span className={shipping === 0 ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-surface-800 dark:text-surface-200'}>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
              </div>
              <div className="divider" />
              <div className="flex justify-between font-bold text-base text-surface-900 dark:text-surface-100">
                <span>Total</span><span>₹{total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}