import { Link } from 'react-router-dom';
import { FiShoppingCart, FiMail, FiPhone, FiMapPin, FiHeart } from 'react-icons/fi';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer style={{ backgroundColor: '#0a1f1e' }} className="mt-20">
      <div className="page-container py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

        {/* Brand */}
        <div className="lg:col-span-1">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-sm">
              <FiShoppingCart className="text-white" size={16} />
            </div>
            <span className="font-display text-white font-bold text-xl tracking-tight">SmartCart</span>
          </div>
          <p className="text-sm leading-relaxed mb-5 text-white/70">
            AI-powered e-commerce built on MERN stack. Smart, fast, and personalised shopping for everyone.
          </p>
          <div className="flex flex-col gap-2 text-xs">
            <span className="flex items-center gap-2 text-white/70">
              <FiMail size={12} className="text-primary-400" /> support@smartcart.in
            </span>
            <span className="flex items-center gap-2 text-white/70">
              <FiPhone size={12} className="text-primary-400" /> +91 98765 43210
            </span>
            <span className="flex items-center gap-2 text-white/70">
              <FiMapPin size={12} className="text-primary-400" /> Dehradun, Uttarakhand
            </span>
          </div>
        </div>

        {/* Shop */}
        <div>
          <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-widest">Shop</h4>
          <ul className="space-y-3 text-sm">
            {[
              ['All Products',  '/products'],
              ['Featured',      '/products?featured=true'],
              ['Best Sellers',  '/products?sort=popularity'],
              ['New Arrivals',  '/products?sort=newest'],
              ['Electronics',   '/products?search=Electronics'],
              ['Clothing',      '/products?search=Clothing'],
            ].map(([label, to]) => (
              <li key={label}>
                <Link to={to} className="text-white/70 hover:text-white transition-colors duration-200">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Account */}
        <div>
          <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-widest">Account</h4>
          <ul className="space-y-3 text-sm">
            {[
              ['My Profile',  '/profile'],
              ['My Orders',   '/orders'],
              ['Wishlist',    '/wishlist'],
              ['Cart',        '/cart'],
              ['Rewards',     '/loyalty'],
            ].map(([label, to]) => (
              <li key={label}>
                <Link to={to} className="text-white/70 hover:text-white transition-colors duration-200">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Info */}
        <div>
          <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-widest">Info</h4>
          <ul className="space-y-3 text-sm">
            {[
              ['About Us',         '/'],
              ['Privacy Policy',   '/'],
              ['Terms of Service', '/'],
              ['Shipping Policy',  '/'],
              ['Return Policy',    '/'],
              ['Contact Us',       '/'],
            ].map(([label, to]) => (
              <li key={label}>
                <Link to={to} className="text-white/70 hover:text-white transition-colors duration-200">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="py-5" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="page-container flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/50">
          <p>© {year} SmartCart — B.Tech AI &amp; ML Major Project | Shivalik College of Engineering</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-white/70">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              All systems operational
            </span>
            <span className="flex items-center gap-1 text-white/50">
              Made with <FiHeart size={11} className="text-red-400 mx-0.5" fill="currentColor" /> in India
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}