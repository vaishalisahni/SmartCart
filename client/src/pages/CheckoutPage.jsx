import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiCheck } from 'react-icons/fi';
import { clearCart } from '../store/slices/cartSlice';
import API from '../services/api';
import toast from 'react-hot-toast';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { cart } = useSelector(s => s.cart);
  const { user } = useSelector(s => s.auth);
  const couponCode = location.state?.couponCode || '';

  const [step, setStep] = useState(1); // 1=address, 2=payment
  const [address, setAddress] = useState({ fullName: user?.name || '', phone: '', street: '', city: '', state: '', pincode: '' });
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [loading, setLoading] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState(user?.addresses || []);

  useEffect(() => { if (user?.addresses?.length) setSavedAddresses(user.addresses); }, [user]);

  const items = cart?.items?.filter(i => i.product?.isActive) || [];
  const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const tax = Math.round(subtotal * 0.18);
  const shipping = subtotal > 499 ? 0 : 49;
  const total = subtotal + tax + shipping;

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
        theme: { color: '#6366f1' },
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
      {/* Load Razorpay script */}
      {!window.Razorpay && <script src="https://checkout.razorpay.com/v1/checkout.js" />}

      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      {/* Steps */}
      <div className="flex items-center gap-4 mb-8">
        {['Shipping Address', 'Payment'].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${step > i + 1 ? 'bg-green-500 text-white' : step === i + 1 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
              {step > i + 1 ? <FiCheck size={14} /> : i + 1}
            </div>
            <span className={`text-sm font-medium ${step === i + 1 ? 'text-primary-600' : 'text-gray-500'}`}>{s}</span>
            {i < 1 && <div className="w-12 h-0.5 bg-gray-200 dark:bg-gray-700" />}
          </div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-6">
          {/* Step 1: Address */}
          {step === 1 && (
            <div className="card p-5 space-y-4">
              <h2 className="font-bold text-lg">Shipping Address</h2>
              {savedAddresses.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">Saved Addresses:</p>
                  {savedAddresses.map(a => (
                    <button key={a._id} onClick={() => handleAddressSelect(a)}
                      className="w-full text-left p-3 border rounded-lg text-sm hover:border-primary-400 transition">
                      <p className="font-medium">{a.fullName}</p>
                      <p className="text-gray-500">{a.street}, {a.city}, {a.state} - {a.pincode}</p>
                    </button>
                  ))}
                  <p className="text-sm font-medium text-gray-600 pt-2">Or enter new address:</p>
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
              <h2 className="font-bold text-lg">Payment Method</h2>
              <div className="space-y-3">
                {[
                  { id: 'razorpay', label: 'Online Payment (UPI / Card / Net Banking)', icon: '💳', desc: 'Secure payment via Razorpay' },
                  { id: 'cod', label: 'Cash on Delivery', icon: '💵', desc: 'Pay when delivered' },
                ].map(m => (
                  <label key={m.id} className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition ${paymentMethod === m.id ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 hover:border-primary-300'}`}>
                    <input type="radio" name="payment" value={m.id} checked={paymentMethod === m.id} onChange={() => setPaymentMethod(m.id)} className="mt-1 accent-primary-600" />
                    <div>
                      <p className="font-medium text-sm">{m.icon} {m.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{m.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-sm">
                <p className="font-medium mb-1">Delivering to:</p>
                <p className="text-gray-600 dark:text-gray-400">{address.fullName}, {address.street}, {address.city}, {address.state} - {address.pincode}</p>
                <button onClick={() => setStep(1)} className="text-primary-600 text-xs mt-1 hover:underline">Change</button>
              </div>
            </div>
          )}

          <button onClick={handleSubmit} disabled={loading} className="btn-primary w-full py-3 text-base font-bold">
            {loading ? 'Processing...' : step === 1 ? 'Continue to Payment' : `Place Order ₹${total.toLocaleString()}`}
          </button>
        </div>

        {/* Order Summary */}
        <div className="w-full lg:w-80">
          <div className="card p-4 space-y-3">
            <h3 className="font-bold">Order Items ({items.length})</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {items.map(item => (
                <div key={item.product._id} className="flex gap-3">
                  <img src={item.product.images?.[0]} alt={item.product.name} className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium line-clamp-2">{item.product.name}</p>
                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold">₹{(item.product.price * item.quantity).toLocaleString()}</p>
                </div>
              ))}
            </div>
            <hr className="border-gray-200 dark:border-gray-700" />
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>₹{subtotal.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">GST (18%)</span><span>₹{tax.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span className={shipping === 0 ? 'text-green-600' : ''}>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span></div>
              <hr className="border-gray-200 dark:border-gray-700" />
              <div className="flex justify-between font-bold text-base"><span>Total</span><span>₹{total.toLocaleString()}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}