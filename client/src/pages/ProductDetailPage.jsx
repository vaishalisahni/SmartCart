import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiShoppingCart, FiHeart, FiShare2, FiChevronLeft, FiTruck, FiShield } from 'react-icons/fi';
import { addToCart } from '../store/slices/cartSlice';
import { toggleWishlist } from '../store/slices/wishlistSlice';
import { StarRating } from '../components/ui/index';
import API from '../services/api';
import toast from 'react-hot-toast';

export default function ProductDetailPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);
  const { wishlist } = useSelector(s => s.wishlist);
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [sentiment, setSentiment] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '', title: '' });
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
        // Record view + get sentiment
        if (user) {
          API.post('/ai/interact', { product_id: id, action: 'view' }).catch(() => {});
          API.post('/users/recently-viewed', { productId: id }).catch(() => {});
        }
        API.get(`/ai/sentiment/${id}`).then(r => setSentiment(r.data)).catch(() => {});
      } finally {
        setLoading(false);
      }
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
          <div className="skeleton h-8 w-3/4 rounded" />
          <div className="skeleton h-5 w-1/3 rounded" />
          <div className="skeleton h-10 w-1/2 rounded" />
          <div className="skeleton h-32 w-full rounded" />
        </div>
      </div>
    </div>
  );

  if (!product) return <div className="text-center py-20">Product not found.</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Link to="/products" className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600 mb-6">
        <FiChevronLeft size={14} /> Back to Products
      </Link>

      <div className="grid md:grid-cols-2 gap-10">
        {/* Images */}
        <div className="space-y-3">
          <div className="aspect-square rounded-2xl overflow-hidden bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
            <img src={product.images?.[selectedImage] || 'https://via.placeholder.com/500'} alt={product.name} className="w-full h-full object-cover" />
          </div>
          {product.images?.length > 1 && (
            <div className="flex gap-2">
              {product.images.map((img, i) => (
                <button key={i} onClick={() => setSelectedImage(i)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition ${selectedImage === i ? 'border-primary-500' : 'border-gray-200'}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-4">
          {product.brand && <p className="text-sm font-semibold text-primary-600 uppercase tracking-widest">{product.brand}</p>}
          <h1 className="text-2xl md:text-3xl font-bold">{product.name}</h1>

          <div className="flex items-center gap-3">
            <StarRating rating={Math.round(product.ratings)} />
            <span className="text-sm text-gray-500">{product.ratings?.toFixed(1)} ({product.numReviews} reviews)</span>
          </div>

          <div className="flex items-end gap-3">
            <span className="text-3xl font-extrabold text-gray-900 dark:text-white">₹{product.price?.toLocaleString()}</span>
            {product.originalPrice > product.price && (
              <>
                <span className="text-lg text-gray-400 line-through">₹{product.originalPrice?.toLocaleString()}</span>
                <span className="badge bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300">{product.discountPercent}% off</span>
              </>
            )}
          </div>

          {/* AI Sentiment */}
          {sentiment && sentiment.total > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">🤖 AI Review Analysis</p>
              <p className="text-sm text-blue-800 dark:text-blue-200">{sentiment.summary}</p>
              <div className="flex gap-3 mt-2 text-xs">
                <span className="text-green-600">👍 {sentiment.positive} positive</span>
                <span className="text-red-500">👎 {sentiment.negative} negative</span>
                <span className="text-gray-500">😐 {sentiment.neutral} neutral</span>
              </div>
            </div>
          )}

          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{product.description}</p>

          {/* Stock */}
          {product.stock > 0 ? (
            <p className="text-green-600 font-medium text-sm">✓ In Stock {product.stock < 10 && `(Only ${product.stock} left!)`}</p>
          ) : (
            <p className="text-red-500 font-medium text-sm">✗ Out of Stock</p>
          )}

          {/* Quantity + Buttons */}
          {product.stock > 0 && (
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                <button onClick={() => setQty(q => Math.max(1, q - 1))} className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 font-bold transition">−</button>
                <span className="px-4 py-2 font-semibold min-w-[40px] text-center">{qty}</span>
                <button onClick={() => setQty(q => Math.min(product.stock, q + 1))} className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 font-bold transition">+</button>
              </div>
              <button onClick={handleAddToCart} className="btn-primary flex items-center gap-2 px-6">
                <FiShoppingCart /> Add to Cart
              </button>
              <button onClick={handleWishlist} className={`p-2.5 rounded-lg border transition ${isWishlisted ? 'bg-red-50 border-red-300 text-red-500' : 'border-gray-300 text-gray-600 hover:border-red-300'}`}>
                <FiHeart fill={isWishlisted ? 'currentColor' : 'none'} />
              </button>
              <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!'); }}
                className="p-2.5 rounded-lg border border-gray-300 text-gray-600 hover:border-primary-300 transition">
                <FiShare2 />
              </button>
            </div>
          )}

          {/* Delivery info */}
          <div className="flex flex-col gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <FiTruck size={14} className="text-primary-500" />
              Free delivery on orders above ₹499
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <FiShield size={14} className="text-green-500" />
              Easy 7-day returns & exchange policy
            </div>
          </div>
        </div>
      </div>

      {/* Specifications */}
      {product.specifications?.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-bold mb-4">Specifications</h2>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                {product.specifications.map((s, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800' : ''}>
                    <td className="px-4 py-2.5 font-medium text-gray-600 dark:text-gray-400 w-1/3">{s.key}</td>
                    <td className="px-4 py-2.5">{s.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reviews */}
      <div className="mt-10">
        <h2 className="text-xl font-bold mb-6">Customer Reviews</h2>

        {/* Review Form */}
        {user && (
          <form onSubmit={submitReview} className="card p-5 mb-6 space-y-3">
            <h3 className="font-semibold">Write a Review</h3>
            <div>
              <label className="text-sm font-medium mb-1 block">Rating</label>
              <StarRating rating={reviewForm.rating} size={24} onChange={r => setReviewForm(f => ({ ...f, rating: r }))} />
            </div>
            <input value={reviewForm.title} onChange={e => setReviewForm(f => ({ ...f, title: e.target.value }))} placeholder="Review title (optional)" className="input text-sm" />
            <textarea value={reviewForm.comment} onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))} placeholder="Share your experience..." className="input text-sm resize-none" rows={3} required />
            <button type="submit" disabled={submittingReview} className="btn-primary text-sm px-5">
              {submittingReview ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        )}

        {reviews.length === 0 ? (
          <p className="text-gray-500 text-sm">No reviews yet. Be the first to review!</p>
        ) : (
          <div className="space-y-4">
            {reviews.map(r => (
              <div key={r._id} className="card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-600 font-bold text-sm">
                      {r.user?.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{r.user?.name}</p>
                      <StarRating rating={r.rating} size={12} />
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                </div>
                {r.title && <p className="font-medium text-sm mt-2">{r.title}</p>}
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{r.comment}</p>
                {r.isVerifiedPurchase && <span className="badge bg-green-100 text-green-700 mt-2">✓ Verified Purchase</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}