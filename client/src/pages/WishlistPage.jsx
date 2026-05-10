// WishlistPage.jsx
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { FiTrash2, FiShoppingCart } from 'react-icons/fi';
import { toggleWishlist } from '../store/slices/wishlistSlice';
import { addToCart } from '../store/slices/cartSlice';
import { EmptyState, StarRating } from '../components/ui/index';
import toast from 'react-hot-toast';

export default function WishlistPage() {
  const dispatch = useDispatch();
  const { wishlist } = useSelector(s => s.wishlist);
  const products = wishlist?.products || [];

  const handleRemove = id => { dispatch(toggleWishlist(id)); toast.success('Removed from wishlist'); };
  const handleCart = async id => {
    try { await dispatch(addToCart({ productId: id, quantity: 1 })).unwrap(); toast.success('Added to cart!'); }
    catch (err) { toast.error(err || 'Failed'); }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-surface-900 dark:text-surface-50">
        My Wishlist <span className="text-surface-400 dark:text-surface-500 text-lg font-normal">({products.length})</span>
      </h1>
      {products.length === 0 ? (
        <EmptyState icon="❤️" title="Your wishlist is empty" description="Save items you love by clicking the heart icon on any product."
          action={<Link to="/products" className="btn-primary">Browse Products</Link>} />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map(p => (
            <div key={p._id} className="card overflow-hidden group">
              <Link to={`/products/${p._id}`} className="block aspect-square overflow-hidden bg-surface-100 dark:bg-surface-700/50">
                <img src={p.images?.[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </Link>
              <div className="p-3 space-y-2">
                <Link to={`/products/${p._id}`}
                  className="text-sm font-semibold line-clamp-2 text-surface-800 dark:text-surface-200 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  {p.name}
                </Link>
                <StarRating rating={Math.round(p.ratings || 0)} size={12} />
                <p className="text-base font-bold text-surface-900 dark:text-surface-50">₹{p.price?.toLocaleString('en-IN')}</p>
                <div className="flex gap-2">
                  <button onClick={() => handleCart(p._id)} disabled={p.stock === 0}
                    className="btn-primary text-xs flex-1 py-1.5 flex items-center justify-center gap-1 disabled:opacity-40">
                    <FiShoppingCart size={12} /> Add
                  </button>
                  <button onClick={() => handleRemove(p._id)}
                    className="p-1.5 border border-surface-200 dark:border-surface-600 rounded-xl text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:border-red-300 dark:hover:border-red-700 transition-all">
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}