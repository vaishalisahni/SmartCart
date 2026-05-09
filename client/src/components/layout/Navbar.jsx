import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiShoppingCart, FiHeart, FiUser, FiSearch, FiMoon, FiSun, FiMenu, FiX, FiLogOut, FiPackage, FiSettings } from 'react-icons/fi';
import { toggleDarkMode } from '../../store/slices/uiSlice';
import { logoutUser } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector(s => s.auth);
  const { darkMode } = useSelector(s => s.ui);
  const { cart } = useSelector(s => s.cart);
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const cartCount = cart?.items?.reduce((s, i) => s + i.quantity, 0) || 0;

  const handleSearch = e => {
    e.preventDefault();
    if (search.trim()) { navigate(`/products?search=${encodeURIComponent(search.trim())}`); setSearch(''); }
  };

  const handleLogout = async () => {
    await dispatch(logoutUser());
    toast.success('Logged out');
    navigate('/');
    setUserMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <FiShoppingCart className="text-white text-lg" />
          </div>
          <span className="text-xl font-extrabold text-primary-600 hidden sm:block">SmartCart</span>
        </Link>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-auto">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-transparent focus:border-primary-400 focus:bg-white dark:focus:bg-gray-700 outline-none text-sm transition"
            />
          </div>
        </form>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button onClick={() => dispatch(toggleDarkMode())} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
            {darkMode ? <FiSun className="text-yellow-400" /> : <FiMoon className="text-gray-600" />}
          </button>

          {user && (
            <Link to="/wishlist" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
              <FiHeart className="text-gray-600 dark:text-gray-300" />
            </Link>
          )}

          <Link to="/cart" className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
            <FiShoppingCart className="text-gray-600 dark:text-gray-300" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">{cartCount}</span>
            )}
          </Link>

          {user ? (
            <div className="relative">
              <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-600 font-bold text-sm">
                  {user.name?.[0]?.toUpperCase()}
                </div>
                <span className="text-sm font-medium hidden sm:block max-w-[100px] truncate">{user.name}</span>
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 card py-1 shadow-lg animate-fade-in">
                  <Link to="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"><FiUser size={14} /> Profile</Link>
                  <Link to="/orders" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"><FiPackage size={14} /> My Orders</Link>
                  {user.role === 'admin' && (
                    <Link to="/admin" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 text-primary-600"><FiSettings size={14} /> Admin Panel</Link>
                  )}
                  <hr className="my-1 border-gray-100 dark:border-gray-800" />
                  <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-gray-50 dark:hover:bg-gray-800 w-full"><FiLogOut size={14} /> Logout</button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="btn-primary text-sm py-1.5 px-4">Login</Link>
          )}
        </div>
      </div>

      {/* Category nav */}
      <nav className="bg-primary-600 text-white text-sm">
        <div className="max-w-7xl mx-auto px-4 flex gap-6 overflow-x-auto py-2 scrollbar-hide">
          {['Electronics', 'Clothing', 'Books', 'Home & Kitchen', 'Sports'].map(cat => (
            <Link key={cat} to={`/products?search=${cat}`} className="whitespace-nowrap hover:text-primary-200 transition font-medium">{cat}</Link>
          ))}
        </div>
      </nav>
    </header>
  );
}