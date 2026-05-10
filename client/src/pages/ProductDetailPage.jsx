import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiShoppingCart, FiHeart, FiShare2, FiChevronLeft, FiTruck, FiShield, FiStar } from 'react-icons/fi';
import { addToCart } from '../store/slices/cartSlice';
import { toggleWishlist } from '../store/slices/wishlistSlice';
import { StarRating } from '../components/ui/index';
import API from '../services/api';
import toast from 'react-hot-toast';

export default function ProductDetailPage() {
  const { id }     = useParams();
  const dispatch   = useDispatch();
  const { user }   = useSelector(s => s.auth);
  const { wishlist } = useSelector(s => s.wishlist);
  const [product, setProduct]         = useState(null);
  const [reviews, setReviews]         = useState([]);
  const [sentiment, setSentiment]     = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [qty, setQty]                 = useState(1);
  const [loading, setLoading]         = useState(true);
  const [reviewForm, setReviewForm]   = useState({ rating: 5, comment: '', title: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  const isWishlisted = wishlist?.products?.some(p => (p._id || p) === id);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [pRes, rRes] = await Promise.all([
          API.get(`/products/${id}`),
          API.get(`/reviews/product/${id}`),
        ]);
        setProduct(pRes.data.product);
        setReviews(rRes.data.reviews);
        if (user) {
          API.post('/ai/interact', { product_id: id, action: 'view' }).catch(() => {});
          API.post('/users/recently-viewed', { productId: id }).catch(() => {});
        }
        API.get(`/ai/sentiment/${id}`).then(r => setSentiment(r.data)).catch(() => {});
      } finally { setLoading(false); }
    };
    load();
  }, [id]);

  const handleAddToCart = async () => {
    if (!user) { toast.error('Please login first'); return; }
    try {
      await dispatch(addToCart({ productId: id, quantity: qty })).unwrap();
      toast.success('Added to cart!');
    } catch (err) { toast.error(err || 'Failed'); }
  };

  const handleWishlist = async () => {
    if (!user) { toast.error('Please login'); return; }
    await dispatch(toggleWishlist(id));
  };

  const submitReview = async e => {
    e.preventDefault();
    if (!user) { toast.error('Please login to review'); return; }
    setSubmittingReview(true);
    try {
      const { data } = await API.post('/reviews', { ...reviewForm, productId: id });
      setReviews(r => [data.review, ...r]);
      setReviewForm({ rating: 5, comment: '', title: '' });
      toast.success('Review submitted!');
      API.get(`/ai/sentiment/${id}`).then(r => setSentiment(r.data)).catch(() => {});
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setSubmittingReview(false); }
  };

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
      <div className="grid md:grid-cols-2 gap-10">
        <div className="skeleton aspect-square rounded-2xl" />
        <div className="space-y-4">
          <div className="skeleton h-8 w-3/4 rounded-xl" />
          <div className="skeleton h-5 w-1/3 rounded-xl" />
          <div className="skeleton h-10 w-1/2 rounded-xl" />
          <div className="skeleton h-32 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );

  if (!product) return <div className="text-center py-20 text-surface-500 dark:text-surface-400">Product not found.</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Link to="/products" className="flex items-center gap-1 text-sm text-surface-500 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 mb-6 transition-colors">
        <FiChevronLeft size={14} /> Back to Products
      </Link>

      <div className="grid md:grid-cols-2 gap-10">
        {/* Images */}
        <div className="space-y-3">
          <div className="aspect-square rounded-2xl overflow-hidden bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700">
            <img src={product.images?.[selectedImage] || 'https://via.placeholder.com/500'} alt={product.name} className="w-full h-full object-cover" />
          </div>
          {product.images?.length > 1 && (
            <div className="flex gap-2">
              {product.images.map((img, i) => (
                <button key={i} onClick={() => setSelectedImage(i)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                    selectedImage === i
                      ? 'border-primary-500 shadow-lifted'
                      : 'border-surface-200 dark:border-surface-600 hover:border-primary-300 dark:hover:border-primary-700'
                  }`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-4">
          {product.brand && (
            <p className="text-sm font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest">{product.brand}</p>
          )}
          <h1 className="text-2xl md:text-3xl font-bold text-surface-900 dark:text-surface-50">{product.name}</h1>

          <div className="flex items-center gap-3">
            <StarRating rating={Math.round(product.ratings)} />
            <span className="text-sm text-surface-500 dark:text-surface-400">{product.ratings?.toFixed(1)} ({product.numReviews} reviews)</span>
          </div>

          <div className="flex items-end gap-3 flex-wrap">
            <span className="text-3xl font-extrabold text-surface-900 dark:text-surface-50">₹{product.price?.toLocaleString()}</span>
            {product.originalPrice > product.price && (
              <>
                <span className="text-lg text-surface-400 dark:text-surface-500 line-through">₹{product.originalPrice?.toLocaleString()}</span>
                <span className="badge bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400">{product.discountPercent}% off</span>
              </>
            )}
          </div>

          {/* AI Sentiment */}
          {sentiment && sentiment.total > 0 && (
            <div className="bg-primary-50 dark:bg-primary-950/40 border border-primary-200 dark:border-primary-800 rounded-xl p-3.5">
              <p className="text-xs font-semibold text-primary-700 dark:text-primary-300 mb-1">🤖 AI Review Analysis</p>
              <p className="text-sm text-primary-800 dark:text-primary-200">{sentiment.summary}</p>
              <div className="flex gap-3 mt-2 text-xs">
                <span className="text-emerald-600 dark:text-emerald-400">👍 {sentiment.positive} positive</span>
                <span className="text-red-500 dark:text-red-400">👎 {sentiment.negative} negative</span>
                <span className="text-surface-500 dark:text-surface-400">😐 {sentiment.neutral} neutral</span>
              </div>
            </div>
          )}

          <p className="text-surface-600 dark:text-surface-400 leading-relaxed">{product.description}</p>

          {/* Stock */}
          {product.stock > 0 ? (
            <p className="text-emerald-600 dark:text-emerald-400 font-medium text-sm">✓ In Stock {product.stock < 10 && `(Only ${product.stock} left!)`}</p>
          ) : (
            <p className="text-red-500 dark:text-red-400 font-medium text-sm">✗ Out of Stock</p>
          )}

          {/* Quantity + Buttons */}
          {product.stock > 0 && (
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center border border-surface-300 dark:border-surface-600 rounded-xl overflow-hidden bg-white dark:bg-surface-800">
                <button onClick={() => setQty(q => Math.max(1, q - 1))} className="px-3 py-2 hover:bg-surface-100 dark:hover:bg-surface-700 font-bold transition text-surface-700 dark:text-surface-300">−</button>
                <span className="px-4 py-2 font-semibold min-w-[40px] text-center text-surface-900 dark:text-surface-100">{qty}</span>
                <button onClick={() => setQty(q => Math.min(product.stock, q + 1))} className="px-3 py-2 hover:bg-surface-100 dark:hover:bg-surface-700 font-bold transition text-surface-700 dark:text-surface-300">+</button>
              </div>
              <button onClick={handleAddToCart} className="btn-primary flex items-center gap-2 px-6">
                <FiShoppingCart size={16} /> Add to Cart
              </button>
              <button
                onClick={handleWishlist}
                className={`p-2.5 rounded-xl border-2 transition-all ${
                  isWishlisted
                    ? 'bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-700 text-red-500 dark:text-red-400'
                    : 'border-surface-300 dark:border-surface-600 text-surface-600 dark:text-surface-400 hover:border-red-300 dark:hover:border-red-700 hover:text-red-500'
                }`}
              >
                <FiHeart fill={isWishlisted ? 'currentColor' : 'none'} size={16} />
              </button>
              <button
                onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!'); }}
                className="p-2.5 rounded-xl border-2 border-surface-300 dark:border-surface-600 text-surface-600 dark:text-surface-400 hover:border-primary-300 dark:hover:border-primary-600 transition"
              >
                <FiShare2 size={16} />
              </button>
            </div>
          )}

          {/* Delivery info */}
          <div className="flex flex-col gap-2.5 pt-4 border-t border-surface-100 dark:border-surface-700">
            <div className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
              <FiTruck size={14} className="text-primary-500 dark:text-primary-400 flex-shrink-0" />
              Free delivery on orders above ₹499
            </div>
            <div className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
              <FiShield size={14} className="text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
              Easy 7-day returns &amp; exchange policy
            </div>
          </div>
        </div>
      </div>

      {/* Specifications */}
      {product.specifications?.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-bold mb-4 text-surface-900 dark:text-surface-50">Specifications</h2>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                {product.specifications.map((s, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-surface-50 dark:bg-surface-700/50' : 'bg-white dark:bg-surface-800'}>
                    <td className="px-4 py-2.5 font-medium text-surface-600 dark:text-surface-400 w-1/3">{s.key}</td>
                    <td className="px-4 py-2.5 text-surface-800 dark:text-surface-200">{s.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reviews */}
      <div className="mt-10">
        <h2 className="text-xl font-bold mb-6 text-surface-900 dark:text-surface-50">Customer Reviews</h2>

        {/* Review Form */}
        {user && (
          <form onSubmit={submitReview} className="card p-5 mb-6 space-y-3">
            <h3 className="font-semibold text-surface-800 dark:text-surface-200">Write a Review</h3>
            <div>
              <label className="text-sm font-medium mb-1.5 block text-surface-700 dark:text-surface-300">Rating</label>
              <StarRating rating={reviewForm.rating} size={24} onChange={r => setReviewForm(f => ({ ...f, rating: r }))} />
            </div>
            <input
              value={reviewForm.title}
              onChange={e => setReviewForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Review title (optional)"
              className="input text-sm"
            />
            <textarea
              value={reviewForm.comment}
              onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
              placeholder="Share your experience..."
              className="input text-sm resize-none"
              rows={3}
              required
            />
            <button type="submit" disabled={submittingReview} className="btn-primary text-sm px-5">
              {submittingReview ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        )}

        {reviews.length === 0 ? (
          <p className="text-surface-500 dark:text-surface-400 text-sm">No reviews yet. Be the first to review!</p>
        ) : (
          <div className="space-y-4">
            {reviews.map(r => (
              <div key={r._id} className="card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/60 flex items-center justify-center text-primary-700 dark:text-primary-300 font-bold text-sm">
                      {r.user?.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-surface-800 dark:text-surface-200">{r.user?.name}</p>
                      <StarRating rating={r.rating} size={12} />
                    </div>
                  </div>
                  <span className="text-xs text-surface-400 dark:text-surface-500">{new Date(r.createdAt).toLocaleDateString()}</span>
                </div>
                {r.title && <p className="font-medium text-sm mt-2 text-surface-800 dark:text-surface-200">{r.title}</p>}
                <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">{r.comment}</p>
                {r.isVerifiedPurchase && (
                  <span className="badge bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 mt-2">✓ Verified Purchase</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}