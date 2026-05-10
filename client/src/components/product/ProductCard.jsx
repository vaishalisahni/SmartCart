import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiHeart, FiShoppingCart, FiStar } from 'react-icons/fi';
import { addToCart } from '../../store/slices/cartSlice';
import { toggleWishlist } from '../../store/slices/wishlistSlice';
import toast from 'react-hot-toast';

export default function ProductCard({ product }) {
  const dispatch = useDispatch();
  const { user }     = useSelector(s => s.auth);
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
    if (!user) { toast.error('Please login first'); return; }
    await dispatch(toggleWishlist(product._id));
    toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist');
  };

  return (
    <Link
      to={`/products/${product._id}`}
      className="card-hover group flex flex-col overflow-hidden transition-all duration-300"
    >
      {/* Image */}
      <div className="relative overflow-hidden bg-surface-100 dark:bg-surface-800 aspect-square">
        <img
          src={product.images?.[0] || 'https://via.placeholder.com/300'}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500 ease-out"
          loading="lazy"
        />

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
          {product.discountPercent > 0 && (
            <span className="badge bg-red-500 text-white shadow-sm">
              -{product.discountPercent}%
            </span>
          )}
          {product.isFeatured && !product.discountPercent && (
            <span className="badge bg-primary-600 text-white shadow-sm">Featured</span>
          )}
        </div>

        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/55 backdrop-blur-[1px] flex items-center justify-center">
            <span className="text-white font-bold text-sm bg-black/40 px-3 py-1 rounded-full">Out of Stock</span>
          </div>
        )}

        {product.stock > 0 && product.stock < 10 && (
          <span className="absolute top-2.5 right-10 badge bg-amber-500 text-white shadow-sm">
            {product.stock} left
          </span>
        )}

        {/* Wishlist button */}
        <button
          onClick={handleWishlist}
          className={`absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center shadow-md transition-all duration-200 active:scale-90 ${
            isWishlisted
              ? 'bg-red-500 text-white'
              : 'bg-white/90 dark:bg-surface-800/90 text-surface-500 hover:text-red-500 hover:bg-white dark:hover:bg-surface-700'
          }`}
          aria-label="Toggle wishlist"
        >
          <FiHeart size={13} fill={isWishlisted ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Info */}
      <div className="p-3.5 flex flex-col gap-1.5 flex-1">
        {product.brand && (
          <p className="text-[10px] text-primary-600 dark:text-primary-400 font-bold uppercase tracking-widest">
            {product.brand}
          </p>
        )}
        <h3 className="text-sm font-semibold line-clamp-2 text-surface-800 dark:text-surface-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors leading-snug">
          {product.name}
        </h3>

        <div className="flex items-center gap-1 mt-0.5">
          <FiStar size={11} className="text-amber-400 fill-amber-400" />
          <span className="text-[11px] text-surface-500 dark:text-surface-400 font-medium">
            {product.ratings?.toFixed(1)}{' '}
            <span className="text-surface-400">({product.numReviews})</span>
          </span>
        </div>

        <div className="flex items-baseline gap-2 mt-auto pt-2">
          <span className="text-base font-bold text-surface-900 dark:text-white">
            ₹{product.price?.toLocaleString('en-IN')}
          </span>
          {product.originalPrice > product.price && (
            <span className="text-xs text-surface-400 line-through">
              ₹{product.originalPrice?.toLocaleString('en-IN')}
            </span>
          )}
        </div>

        <button
          onClick={handleAddToCart}
          disabled={product.stock === 0}
          className="mt-2 w-full btn-primary text-xs py-2 gap-1.5 disabled:opacity-40"
        >
          <FiShoppingCart size={12} />
          {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </Link>
  );
}