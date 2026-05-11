import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  FiShoppingCart, FiHeart, FiUser, FiSearch, FiMoon, FiSun,
  FiMenu, FiX, FiLogOut, FiPackage, FiSettings, FiAward, FiChevronDown,
} from 'react-icons/fi';
import { toggleDarkMode } from '../../store/slices/uiSlice';
import { logoutUser } from '../../store/slices/authSlice';
import VoiceSearch from '../search/VoiceSearch';
import toast from 'react-hot-toast';

const CATEGORIES = [
  'Electronics', 'Clothing', 'Books', 'Home & Kitchen',
  'Sports', 'Beauty', 'Furniture', 'Groceries', 'Jewellery', 'Toys',
];

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
  const [scrolled, setScrolled] = useState(false);
  const userMenuRef = useRef(null);
  const cartCount = cart?.items?.reduce((s, i) => s + i.quantity, 0) || 0;

  useEffect(() => {
    setMobileMenu(false);
    setUserMenu(false);
    setSearchOpen(false);
  }, [location]);

  useEffect(() => {
    const handler = e => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSearch = e => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/products?search=${encodeURIComponent(search.trim())}`);
      setSearch('');
      setSearchOpen(false);
    }
  };

  const handleLogout = async () => {
    await dispatch(logoutUser());
    toast.success('Logged out successfully');
    navigate('/');
  };

  return (
    <>
      <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled
        ? 'bg-white/95 dark:bg-surface-900/95 backdrop-blur-md shadow-soft border-b border-surface-200/80 dark:border-surface-700/80'
        : 'bg-white dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700'
        }`}>

        {/* ── Main bar ── */}
        <div className="page-container h-16 flex items-center gap-3">

          {/* Mobile hamburger */}
          <button
            className="sm:hidden btn-ghost p-2"
            onClick={() => setMobileMenu(!mobileMenu)}
            aria-label="Menu"
          >
            {mobileMenu ? <FiX size={20} /> : <FiMenu size={20} />}
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0 group">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-lifted transition-all">
              <FiShoppingCart className="text-white" size={15} />
            </div>
            <span className="font-display text-xl font-bold text-primary-700 dark:text-primary-400 hidden xs:block tracking-tight">
              SmartCart
            </span>
          </Link>

          {/* Search bar — desktop */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-auto hidden sm:flex">
            <div className="relative w-full flex items-center">
              <FiSearch className="absolute left-3.5 text-surface-400" size={15} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search products, brands..."
                className="w-full pl-10 pr-10 py-2.5 rounded-l-xl
                           bg-surface-100 dark:bg-surface-800
                           border border-surface-200 dark:border-surface-700
                           focus:border-primary-400 focus:bg-white dark:focus:bg-surface-700
                           outline-none text-sm transition-all duration-200
                           placeholder:text-surface-400
                           text-surface-900 dark:text-surface-100"
              />
              <VoiceSearch
                onTranscript={(text) => {
                  setSearch(text);
                  navigate(`/products?search=${encodeURIComponent(text)}`);
                }}
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-r-xl transition-colors"
              >
                Search
              </button>
            </div>
          </form>

          {/* Right actions */}
          <div className="flex items-center gap-1 ml-auto">

            {/* Mobile search */}
            <button
              className="sm:hidden btn-ghost p-2"
              onClick={() => setSearchOpen(!searchOpen)}
              aria-label="Search"
            >
              <FiSearch size={18} />
            </button>

            {/* Dark mode toggle */}
            <button
              onClick={() => dispatch(toggleDarkMode())}
              className="btn-ghost p-2 hidden sm:flex"
              aria-label="Toggle dark mode"
            >
              {darkMode
                ? <FiSun className="text-amber-400" size={18} />
                : <FiMoon className="text-surface-500" size={18} />
              }
            </button>

            {/* Wishlist */}
            {user && (
              <Link to="/wishlist" className="btn-ghost p-2 hidden sm:flex" aria-label="Wishlist">
                <FiHeart className="text-surface-500 dark:text-surface-300" size={18} />
              </Link>
            )}

            {/* Cart */}
            <Link to="/cart" className="btn-ghost p-2 relative" aria-label="Cart">
              <FiShoppingCart className="text-surface-600 dark:text-surface-300" size={18} />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-primary-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold leading-none">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>

            {/* User menu */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenu(!userMenu)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-all"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                    {user.name?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm font-semibold hidden md:block max-w-[80px] truncate text-surface-700 dark:text-surface-200">
                    {user.name?.split(' ')[0]}
                  </span>
                  <FiChevronDown size={13} className={`text-surface-400 transition-transform hidden md:block ${userMenu ? 'rotate-180' : ''}`} />
                </button>

                {userMenu && (
                  <div className="absolute right-0 mt-2 w-52 card py-1 shadow-soft z-50 animate-fade-in">
                    <div className="px-4 py-2.5 border-b border-surface-100 dark:border-surface-700">
                      <p className="text-sm font-semibold text-surface-900 dark:text-surface-100 truncate">{user.name}</p>
                      <p className="text-xs text-surface-400 truncate">{user.email}</p>
                    </div>
                    <Link to="/profile" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-surface-700 dark:text-surface-200 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors">
                      <FiUser size={14} className="text-surface-400" /> Profile
                    </Link>
                    <Link to="/orders" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-surface-700 dark:text-surface-200 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors">
                      <FiPackage size={14} className="text-surface-400" /> My Orders
                    </Link>
                    <Link to="/loyalty" className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors text-amber-600 dark:text-amber-400">
                      <FiAward size={14} /> Rewards
                    </Link>
                    {['admin', 'super_admin'].includes(user.role) && (
                      <Link to="/admin" className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors text-primary-600 dark:text-primary-400">
                        <FiSettings size={14} /> Admin Panel
                      </Link>
                    )}
                    <div className="flex items-center justify-between px-4 py-2.5 sm:hidden">
                      <span className="text-sm text-surface-600 dark:text-surface-300">Dark mode</span>
                      <button onClick={() => dispatch(toggleDarkMode())}>
                        {darkMode ? <FiSun className="text-amber-400" size={16} /> : <FiMoon size={16} className="text-surface-500" />}
                      </button>
                    </div>
                    <div className="border-t border-surface-100 dark:border-surface-700 mt-1" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 w-full transition-colors"
                    >
                      <FiLogOut size={14} /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn-ghost text-sm py-1.5 px-3 hidden sm:flex">Login</Link>
                <Link to="/login?mode=register" className="btn-primary text-sm py-1.5 px-4">Sign Up</Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile search bar */}
        {searchOpen && (
          <div className="sm:hidden px-4 pb-3 animate-slide-up">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1 flex items-center">
                <FiSearch className="absolute left-3 text-surface-400" size={14} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  autoFocus
                  placeholder="Search products..."
                  className="w-full pl-9 pr-2 py-2.5 text-sm rounded-xl bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 focus:border-primary-400 outline-none text-surface-900 dark:text-surface-100"
                />
              </div>
              <VoiceSearch
                onTranscript={(text) => {
                  setSearch(text);
                  navigate(`/products?search=${encodeURIComponent(text)}`);
                  setSearchOpen(false);
                }}
              />
              <button type="submit" className="btn-primary text-sm px-4 py-2">Go</button>
            </form>
          </div>
        )}

        {/* ── Category strip ── */}
        <nav className="bg-primary-700 dark:bg-primary-900 text-white overflow-x-auto scrollbar-hide">
          <div className="page-container flex gap-5 py-2 whitespace-nowrap text-xs font-semibold tracking-wide">
            <Link to="/products" className="hover:text-primary-200 transition-colors flex-shrink-0">
              All Products
            </Link>
            {CATEGORIES.map(cat => (
              <Link
                key={cat}
                to={`/products?search=${encodeURIComponent(cat)}`}
                className="hover:text-primary-200 transition-colors flex-shrink-0"
              >
                {cat}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      {/* ── Mobile slide-out menu ── */}
      {mobileMenu && (
        <div className="fixed inset-0 z-40 sm:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileMenu(false)}
          />
          <div className="absolute left-0 top-0 h-full w-72 bg-white dark:bg-surface-900 shadow-xl flex flex-col animate-slide-in">
            <div className="p-4 border-b border-surface-200 dark:border-surface-700 flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
                <FiShoppingCart className="text-white" size={15} />
              </div>
              <span className="font-display font-bold text-primary-700 dark:text-primary-400">SmartCart</span>
              <button className="ml-auto btn-ghost p-1.5" onClick={() => setMobileMenu(false)}>
                <FiX size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              <p className="text-xs text-surface-400 font-bold uppercase tracking-widest mb-3 px-2">Categories</p>
              {CATEGORIES.map(cat => (
                <Link
                  key={cat}
                  to={`/products?search=${encodeURIComponent(cat)}`}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 text-sm font-medium transition-colors text-surface-700 dark:text-surface-200"
                >
                  {cat}
                </Link>
              ))}

              {user && (
                <>
                  <div className="divider my-4" />
                  <p className="text-xs text-surface-400 font-bold uppercase tracking-widest mb-3 px-2">Account</p>
                  <Link to="/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 text-sm font-medium transition-colors text-surface-700 dark:text-surface-200"><FiUser size={16} /> Profile</Link>
                  <Link to="/orders" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 text-sm font-medium transition-colors text-surface-700 dark:text-surface-200"><FiPackage size={16} /> My Orders</Link>
                  <Link to="/wishlist" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 text-sm font-medium transition-colors text-surface-700 dark:text-surface-200"><FiHeart size={16} /> Wishlist</Link>
                  <Link to="/loyalty" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 text-sm font-medium text-amber-600 dark:text-amber-400 transition-colors"><FiAward size={16} /> Rewards</Link>
                </>
              )}
            </div>

            {user && (
              <div className="p-4 border-t border-surface-200 dark:border-surface-700">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-sm text-red-500 w-full px-3 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors font-medium"
                >
                  <FiLogOut size={16} /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}