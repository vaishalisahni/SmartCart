import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiTrash2, FiMinus, FiPlus, FiShoppingBag, FiTag, FiArrowRight } from 'react-icons/fi';
import { updateCartItem, removeFromCart } from '../store/slices/cartSlice';
import { EmptyState } from '../components/ui/index';
import API from '../services/api';
import toast from 'react-hot-toast';

export default function CartPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { cart, loading } = useSelector(s => s.cart);
  const { user }          = useSelector(s => s.auth);
  const [couponCode, setCouponCode]         = useState('');
  const [couponData, setCouponData]         = useState(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const items    = cart?.items?.filter(i => i.product?.isActive) || [];
  const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const discount = couponData?.discount || 0;
  const tax      = Math.round(subtotal * 0.18);
  const shipping = subtotal > 499 ? 0 : 49;
  const total    = subtotal + tax + shipping - discount;

  const handleQty    = (productId, qty) => { if (qty < 1) return; dispatch(updateCartItem({ productId, quantity: qty })); };
  const handleRemove = productId => dispatch(removeFromCart(productId));

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
      <h2 className="text-2xl font-bold mb-2 text-surface-900 dark:text-surface-50">Your Cart</h2>
      <p className="text-surface-500 dark:text-surface-400 mb-6">Please login to view your cart.</p>
      <Link to="/login" className="btn-primary">Login</Link>
    </div>
  );

  if (items.length === 0) return (
    <EmptyState
      icon="🛒"
      title="Your cart is empty"
      description="Add some products to your cart and they'll appear here."
      action={<Link to="/products" className="btn-primary flex items-center gap-2"><FiShoppingBag /> Start Shopping</Link>}
    />
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-surface-900 dark:text-surface-50">
        Shopping Cart <span className="text-surface-400 dark:text-surface-500 text-lg font-normal">({items.length} items)</span>
      </h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Cart Items */}
        <div className="flex-1 space-y-4">
          {items.map(item => (
            <div key={item.product._id} className="card p-4 flex gap-4">
              <Link to={`/products/${item.product._id}`} className="flex-shrink-0">
                <img
                  src={item.product.images?.[0] || 'https://via.placeholder.com/100'}
                  alt={item.product.name}
                  className="w-20 h-20 object-cover rounded-xl"
                />
              </Link>
              <div className="flex-1 min-w-0">
                <Link
                  to={`/products/${item.product._id}`}
                  className="font-semibold text-sm hover:text-primary-600 dark:hover:text-primary-400 line-clamp-2 text-surface-800 dark:text-surface-100"
                >
                  {item.product.name}
                </Link>
                <p className="text-primary-600 dark:text-primary-400 font-bold mt-1">
                  ₹{item.product.price?.toLocaleString()}
                </p>
                {item.product.stock < 10 && (
                  <p className="text-amber-500 dark:text-amber-400 text-xs mt-0.5">Only {item.product.stock} left!</p>
                )}
              </div>
              <div className="flex flex-col items-end justify-between gap-2">
                <button
                  onClick={() => handleRemove(item.product._id)}
                  className="text-red-400 hover:text-red-500 dark:text-red-400 dark:hover:text-red-300 transition"
                >
                  <FiTrash2 size={16} />
                </button>
                <div className="flex items-center border border-surface-200 dark:border-surface-600 rounded-lg overflow-hidden bg-white dark:bg-surface-800">
                  <button
                    onClick={() => handleQty(item.product._id, item.quantity - 1)}
                    className="px-2 py-1 hover:bg-surface-100 dark:hover:bg-surface-700 transition text-surface-700 dark:text-surface-300"
                    disabled={loading}
                  >
                    <FiMinus size={12} />
                  </button>
                  <span className="px-3 py-1 text-sm font-semibold text-surface-900 dark:text-surface-100 min-w-[32px] text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => handleQty(item.product._id, item.quantity + 1)}
                    className="px-2 py-1 hover:bg-surface-100 dark:hover:bg-surface-700 transition text-surface-700 dark:text-surface-300"
                    disabled={loading || item.quantity >= item.product.stock}
                  >
                    <FiPlus size={12} />
                  </button>
                </div>
                <p className="text-sm font-bold text-surface-900 dark:text-surface-100">
                  ₹{(item.product.price * item.quantity).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="w-full lg:w-80 space-y-4">
          {/* Coupon */}
          <div className="card p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-surface-800 dark:text-surface-100">
              <FiTag size={16} className="text-primary-500" /> Apply Coupon
            </h3>
            <div className="flex gap-2">
              <input
                value={couponCode}
                onChange={e => setCouponCode(e.target.value.toUpperCase())}
                placeholder="ENTER CODE"
                className="input text-sm flex-1 uppercase tracking-widest"
              />
              <button onClick={applyCoupon} disabled={applyingCoupon} className="btn-primary text-sm px-4">
                {applyingCoupon ? '...' : 'Apply'}
              </button>
            </div>
            {couponData && (
              <p className="text-emerald-600 dark:text-emerald-400 text-xs mt-2 font-medium">✓ Saving ₹{couponData.discount}!</p>
            )}
          </div>

          {/* Price breakdown */}
          <div className="card p-4 space-y-3">
            <h3 className="font-bold text-base text-surface-900 dark:text-surface-100">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-surface-500 dark:text-surface-400">Subtotal</span>
                <span className="text-surface-800 dark:text-surface-200">₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-surface-500 dark:text-surface-400">GST (18%)</span>
                <span className="text-surface-800 dark:text-surface-200">₹{tax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-surface-500 dark:text-surface-400">Shipping</span>
                <span className={shipping === 0 ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-surface-800 dark:text-surface-200'}>
                  {shipping === 0 ? 'FREE' : `₹${shipping}`}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Coupon Discount</span>
                  <span>−₹{discount}</span>
                </div>
              )}
              <div className="divider" />
              <div className="flex justify-between font-bold text-base text-surface-900 dark:text-surface-100">
                <span>Total</span>
                <span>₹{total.toLocaleString()}</span>
              </div>
            </div>
            <button onClick={handleCheckout} className="btn-primary w-full py-3 text-base font-bold mt-2 flex items-center justify-center gap-2">
              Proceed to Checkout <FiArrowRight size={16} />
            </button>
            <Link
              to="/products"
              className="block text-center text-sm text-primary-600 dark:text-primary-400 hover:underline mt-2"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}