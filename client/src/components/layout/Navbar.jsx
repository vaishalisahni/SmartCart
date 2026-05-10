import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiShoppingCart, FiHeart, FiUser, FiSearch, FiMoon, FiSun, FiMenu, FiX, FiLogOut, FiPackage, FiSettings, FiAward } from 'react-icons/fi';
import { toggleDarkMode } from '../../store/slices/uiSlice';
import { logoutUser } from '../../store/slices/authSlice';
import VoiceSearch from '../search/VoiceSearch';
import toast from 'react-hot-toast';

const CATEGORIES = ['Electronics', 'Clothing', 'Books', 'Home & Kitchen', 'Sports', 'Beauty', 'Furniture', 'Groceries'];

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector(s => s.auth);
  const { darkMode } = useSelector(s => s.ui);
  const { cart } = useSelector(s => s.cart);
  const [search, setSearch] = useState('');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const userMenuRef = useRef(null);
  const cartCount = cart?.items?.reduce((s, i) => s + i.quantity, 0) || 0;

  useEffect(() => { setMobileMenu(false); setUserMenu(false); }, [location]);

  useEffect(() => {
    const handler = (e) => { if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenu(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = e => {
    e.preventDefault();
    if (search.trim()) { navigate(`/products?search=${encodeURIComponent(search.trim())}`); setSearch(''); setSearchOpen(false); }
  };

  const handleLogout = async () => {
    await dispatch(logoutUser());
    toast.success('Logged out');
    navigate('/');
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center gap-2 sm:gap-4">
          {/* Mobile menu button */}
          <button className="sm:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => setMobileMenu(!mobileMenu)}>
            {mobileMenu ? <FiX size={20} /> : <FiMenu size={20} />}
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-1.5 flex-shrink-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <FiShoppingCart className="text-white text-sm sm:text-lg" />
            </div>
            <span className="text-lg sm:text-xl font-extrabold text-primary-600 hidden xs:block">SmartCart</span>
          </Link>

          {/* Search — desktop */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-auto hidden sm:flex">
            <div className="relative w-full flex items-center">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-9 pr-10 py-2 rounded-l-lg bg-gray-100 dark:bg-gray-800 border border-transparent focus:border-primary-400 focus:bg-white dark:focus:bg-gray-700 outline-none text-sm transition"
              />
              <VoiceSearch />
              <button type="submit" className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-r-lg hover:bg-primary-700 transition">Search</button>
            </div>
          </form>

          {/* Right actions */}
          <div className="flex items-center gap-1 ml-auto">
            {/* Mobile search toggle */}
            <button className="sm:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => setSearchOpen(!searchOpen)}>
              <FiSearch size={18} />
            </button>

            <button onClick={() => dispatch(toggleDarkMode())} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition hidden sm:flex">
              {darkMode ? <FiSun className="text-yellow-400" size={18} /> : <FiMoon className="text-gray-600" size={18} />}
            </button>

            {user && (
              <Link to="/wishlist" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition hidden sm:flex">
                <FiHeart className="text-gray-600 dark:text-gray-300" size={18} />
              </Link>
            )}

            <Link to="/cart" className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
              <FiShoppingCart className="text-gray-600 dark:text-gray-300" size={18} />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-primary-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{cartCount > 9 ? '9+' : cartCount}</span>
              )}
            </Link>

            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button onClick={() => setUserMenu(!userMenu)} className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                  <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-600 font-bold text-xs">
                    {user.name?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm font-medium hidden md:block max-w-[80px] truncate">{user.name?.split(' ')[0]}</span>
                </button>
                {userMenu && (
                  <div className="absolute right-0 mt-2 w-48 card py-1 shadow-lg z-50">
                    <Link to="/profile" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"><FiUser size={14} /> Profile</Link>
                    <Link to="/orders" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"><FiPackage size={14} /> My Orders</Link>
                    <Link to="/loyalty" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 text-yellow-600"><FiAward size={14} /> Rewards</Link>
                    {user.role === 'admin' && (
                      <Link to="/admin" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 text-primary-600"><FiSettings size={14} /> Admin Panel</Link>
                    )}
                    <div className="flex items-center justify-between px-4 py-2.5 sm:hidden">
                      <span className="text-sm">Dark mode</span>
                      <button onClick={() => dispatch(toggleDarkMode())}>{darkMode ? <FiSun className="text-yellow-400" /> : <FiMoon />}</button>
                    </div>
                    <hr className="my-1 border-gray-100 dark:border-gray-800" />
                    <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-gray-50 dark:hover:bg-gray-800 w-full"><FiLogOut size={14} /> Logout</button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="btn-primary text-xs sm:text-sm py-1.5 px-3">Login</Link>
            )}
          </div>
        </div>

        {/* Mobile search bar */}
        {searchOpen && (
          <div className="sm:hidden px-3 pb-3">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1 flex items-center">
                <FiSearch className="absolute left-3 text-gray-400" size={14} />
                <input value={search} onChange={e => setSearch(e.target.value)} autoFocus placeholder="Search products..." className="w-full pl-9 pr-2 py-2 text-sm rounded-lg bg-gray-100 dark:bg-gray-800 border border-transparent focus:border-primary-400 outline-none" />
              </div>
              <VoiceSearch />
              <button type="submit" className="btn-primary text-sm px-3 py-2">Go</button>
            </form>
          </div>
        )}

        {/* Category strip — horizontal scroll */}
        <nav className="bg-primary-600 text-white text-xs sm:text-sm overflow-x-auto scrollbar-hide">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 flex gap-4 sm:gap-6 py-2 whitespace-nowrap">
            {CATEGORIES.map(cat => (
              <Link key={cat} to={`/products?search=${cat}`} className="hover:text-primary-200 transition font-medium flex-shrink-0">{cat}</Link>
            ))}
          </div>
        </nav>
      </header>

      {/* Mobile slide-out menu */}
      {mobileMenu && (
        <div className="fixed inset-0 z-40 sm:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenu(false)} />
          <div className="absolute left-0 top-0 h-full w-72 bg-white dark:bg-gray-900 shadow-xl flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center"><FiShoppingCart className="text-white" /></div>
              <span className="font-extrabold text-primary-600">SmartCart</span>
              <button className="ml-auto" onClick={() => setMobileMenu(false)}><FiX size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">Categories</p>
              {CATEGORIES.map(cat => (
                <Link key={cat} to={`/products?search=${cat}`} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-sm transition">{cat}</Link>
              ))}
              {user && (
                <>
                  <hr className="my-3 border-gray-200 dark:border-gray-700" />
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">Account</p>
                  <Link to="/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-sm"><FiUser size={16} /> Profile</Link>
                  <Link to="/orders" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-sm"><FiPackage size={16} /> My Orders</Link>
                  <Link to="/wishlist" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-sm"><FiHeart size={16} /> Wishlist</Link>
                  <Link to="/loyalty" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-sm text-yellow-600"><FiAward size={16} /> Rewards</Link>
                </>
              )}
            </div>
            {user && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-red-500 w-full px-3 py-2"><FiLogOut size={16} /> Logout</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}