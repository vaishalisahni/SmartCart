import { Link } from 'react-router-dom';
import { FiHome, FiShoppingBag } from 'react-icons/fi';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <div className="text-[120px] font-extrabold text-primary-100 dark:text-primary-900/60 leading-none select-none mb-2">404</div>
      <h1 className="text-3xl font-bold mb-3 text-surface-800 dark:text-surface-100">Page Not Found</h1>
      <p className="text-surface-500 dark:text-surface-400 mb-8 max-w-sm leading-relaxed">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="flex gap-3 flex-wrap justify-center">
        <Link to="/" className="btn-primary flex items-center gap-2">
          <FiHome size={14} /> Go Home
        </Link>
        <Link to="/products" className="btn-outline flex items-center gap-2">
          <FiShoppingBag size={14} /> Browse Products
        </Link>
      </div>
    </div>
  );
}