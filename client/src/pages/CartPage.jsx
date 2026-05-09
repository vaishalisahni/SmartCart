import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiTrash2, FiMinus, FiPlus, FiShoppingBag, FiTag } from 'react-icons/fi';
import { updateCartItem, removeFromCart } from '../store/slices/cartSlice';
import { EmptyState } from '../components/ui/index';
import API from '../services/api';
import toast from 'react-hot-toast';

export default function CartPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { cart, loading } = useSelector(s => s.cart);
  const { user } = useSelector(s => s.auth);
  const [couponCode, setCouponCode] = useState('');
  const [couponData, setCouponData] = useState(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const items = cart?.items?.filter(i => i.product?.isActive) || [];
  const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const discount = couponData?.discount || 0;
  const tax = Math.round(subtotal * 0.18);
  const shipping = subtotal > 499 ? 0 : 49;
  const total = subtotal + tax + shipping - discount;

  const handleQty = (productId, qty) => {
    if (qty < 1) return;
    dispatch(updateCartItem({ productId, quantity: qty }));
  };

  const handleRemove = productId => { dispatch(removeFromCart(productId)); };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    try {
      const { data } = await API.post('/coupons/validate', { code: couponCode, cartTotal: subtotal });
      setCouponData(data);
      toast.success(`Coupon applied! You save ₹${data.discount}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid coupon');
      setCouponData(null);
    } finally { setApplyingCoupon(false); }
  };

  const handleCheckout = () => {
    if (!user) { toast.error('Please login to checkout'); navigate('/login'); return; }
    navigate('/checkout', { state: { couponCode: couponData ? couponCode : '' } });
  };

  if (!user) return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center">
      <div className="text-6xl mb-4">🛒</div>
      <h2 className="text-2xl font-bold mb-2">Your Cart</h2>
      <p className="text-gray-500 mb-6">Please login to view your cart.</p>
      <Link to="/login" className="btn-primary">Login</Link>
    </div>
  );

  if (items.length === 0) return (
    <EmptyState icon="🛒" title="Your cart is empty" description="Add some products to your cart and they'll appear here."
      action={<Link to="/products" className="btn-primary flex items-center gap-2"><FiShoppingBag /> Start Shopping</Link>} />
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Shopping Cart ({items.length} items)</h1>
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Cart Items */}
        <div className="flex-1 space-y-4">
          {items.map(item => (
            <div key={item.product._id} className="card p-4 flex gap-4">
              <Link to={`/products/${item.product._id}`}>
                <img src={item.product.images?.[0] || 'https://via.placeholder.com/100'} alt={item.product.name} className="w-20 h-20 object-cover rounded-lg flex-shrink-0" />
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/products/${item.product._id}`} className="font-semibold text-sm hover:text-primary-600 line-clamp-2">{item.product.name}</Link>
                <p className="text-primary-600 font-bold mt-1">₹{item.product.price?.toLocaleString()}</p>
                {item.product.stock < 10 && <p className="text-orange-500 text-xs">Only {item.product.stock} left!</p>}
              </div>
              <div className="flex flex-col items-end justify-between gap-2">
                <button onClick={() => handleRemove(item.product._id)} className="text-red-400 hover:text-red-600 transition"><FiTrash2 size={16} /></button>
                <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                  <button onClick={() => handleQty(item.product._id, item.quantity - 1)} className="px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 transition" disabled={loading}><FiMinus size={12} /></button>
                  <span className="px-3 py-1 text-sm font-semibold">{item.quantity}</span>
                  <button onClick={() => handleQty(item.product._id, item.quantity + 1)} className="px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 transition" disabled={loading || item.quantity >= item.product.stock}><FiPlus size={12} /></button>
                </div>
                <p className="text-sm font-bold">₹{(item.product.price * item.quantity).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="w-full lg:w-80 space-y-4">
          {/* Coupon */}
          <div className="card p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><FiTag size={16} /> Apply Coupon</h3>
            <div className="flex gap-2">
              <input value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())}
                placeholder="ENTER CODE" className="input text-sm flex-1 uppercase tracking-widest" />
              <button onClick={applyCoupon} disabled={applyingCoupon} className="btn-primary text-sm px-4">
                {applyingCoupon ? '...' : 'Apply'}
              </button>
            </div>
            {couponData && <p className="text-green-600 text-xs mt-2">✓ Saving ₹{couponData.discount}!</p>}
          </div>

          {/* Price breakdown */}
          <div className="card p-4 space-y-3">
            <h3 className="font-bold text-base">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span>₹{subtotal.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">GST (18%)</span><span>₹{tax.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Shipping</span><span className={shipping === 0 ? 'text-green-600 font-medium' : ''}>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span></div>
              {discount > 0 && <div className="flex justify-between text-green-600"><span>Coupon Discount</span><span>−₹{discount}</span></div>}
              <hr className="border-gray-200 dark:border-gray-700" />
              <div className="flex justify-between font-bold text-base"><span>Total</span><span>₹{total.toLocaleString()}</span></div>
            </div>
            <button onClick={handleCheckout} className="btn-primary w-full py-3 text-base font-bold mt-2">
              Proceed to Checkout
            </button>
            <Link to="/products" className="block text-center text-sm text-primary-600 hover:underline">Continue Shopping</Link>
          </div>
        </div>
      </div>
    </div>
  );
}