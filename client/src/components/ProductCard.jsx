import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiHeart, FiShoppingCart, FiStar } from 'react-icons/fi';
import { addToCart } from '../../store/slices/cartSlice';
import { toggleWishlist } from '../../store/slices/wishlistSlice';
import toast from 'react-hot-toast';

export default function ProductCard({ product }) {
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);
  const { wishlist } = useSelector(s => s.wishlist);
  const isWishlisted = wishlist?.products?.some(p => (p._id || p) === product._id);

  const handleAddToCart = async e => {
    e.preventDefault();
    if (!user) { toast.error('Please login to add to cart'); return; }
    try {
      await dispatch(addToCart({ productId: product._id, quantity: 1 })).unwrap();
      toast.success('Added to cart!');
    } catch (err) { toast.error(err || 'Failed to add'); }
  };

  const handleWishlist = async e => {
    e.preventDefault();
    if (!user) { toast.error('Please login'); return; }
    await dispatch(toggleWishlist(product._id));
    toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist');
  };

  return (
    <Link to={`/products/${product._id}`} className="card group hover:shadow-md transition-shadow duration-300 overflow-hidden flex flex-col">
      {/* Image */}
      <div className="relative overflow-hidden bg-gray-50 dark:bg-gray-800 aspect-square">
        <img
          src={product.images?.[0] || 'https://via.placeholder.com/300'}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {product.discountPercent > 0 && (
          <span className="absolute top-2 left-2 badge bg-red-500 text-white">{product.discountPercent}% OFF</span>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-bold text-sm">Out of Stock</span>
          </div>
        )}
        {product.stock > 0 && product.stock < 10 && (
          <span className="absolute top-2 right-2 badge bg-orange-500 text-white">Only {product.stock} left</span>
        )}
        <button onClick={handleWishlist}
          className={`absolute top-2 right-2 p-1.5 rounded-full shadow transition ${isWishlisted ? 'bg-red-500 text-white' : 'bg-white text-gray-600 hover:text-red-500'}`}>
          <FiHeart size={14} fill={isWishlisted ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-1 flex-1">
        {product.brand && <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">{product.brand}</p>}
        <h3 className="text-sm font-semibold line-clamp-2 text-gray-900 dark:text-gray-100 group-hover:text-primary-600 transition">{product.name}</h3>

        <div className="flex items-center gap-1 mt-0.5">
          <FiStar size={12} className="text-yellow-400 fill-yellow-400" />
          <span className="text-xs text-gray-600 dark:text-gray-400">{product.ratings?.toFixed(1)} ({product.numReviews})</span>
        </div>

        <div className="flex items-center gap-2 mt-auto pt-2">
          <span className="text-base font-bold text-gray-900 dark:text-white">₹{product.price?.toLocaleString()}</span>
          {product.originalPrice > product.price && (
            <span className="text-xs text-gray-400 line-through">₹{product.originalPrice?.toLocaleString()}</span>
          )}
        </div>

        <button onClick={handleAddToCart} disabled={product.stock === 0}
          className="mt-2 w-full btn-primary text-xs py-2 flex items-center justify-center gap-1.5 disabled:opacity-40">
          <FiShoppingCart size={13} /> Add to Cart
        </button>
      </div>
    </Link>
  );
}