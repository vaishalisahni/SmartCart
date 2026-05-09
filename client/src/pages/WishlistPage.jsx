import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { FiTrash2, FiShoppingCart } from 'react-icons/fi';
import { toggleWishlist } from '../store/slices/wishlistSlice';
import { addToCart } from '../store/slices/cartSlice';
import { EmptyState } from '../components/ui/index';
import { StarRating } from '../components/ui/index';
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
      <h1 className="text-2xl font-bold mb-6">My Wishlist ({products.length})</h1>
      {products.length === 0 ? (
        <EmptyState icon="❤️" title="Your wishlist is empty" description="Save items you love by clicking the heart icon."
          action={<Link to="/products" className="btn-primary">Browse Products</Link>} />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map(p => (
            <div key={p._id} className="card overflow-hidden group">
              <Link to={`/products/${p._id}`} className="block aspect-square overflow-hidden bg-gray-50 dark:bg-gray-800">
                <img src={p.images?.[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
              </Link>
              <div className="p-3 space-y-2">
                <Link to={`/products/${p._id}`} className="text-sm font-semibold line-clamp-2 hover:text-primary-600">{p.name}</Link>
                <StarRating rating={Math.round(p.ratings || 0)} size={12} />
                <p className="text-base font-bold">₹{p.price?.toLocaleString()}</p>
                <div className="flex gap-2">
                  <button onClick={() => handleCart(p._id)} disabled={p.stock === 0} className="btn-primary text-xs flex-1 py-1.5 flex items-center justify-center gap-1">
                    <FiShoppingCart size={12} /> Add
                  </button>
                  <button onClick={() => handleRemove(p._id)} className="p-1.5 border border-gray-200 rounded-lg text-red-400 hover:bg-red-50 transition">
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