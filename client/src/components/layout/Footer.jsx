import { Link } from 'react-router-dom';
import { FiShoppingCart, FiMail, FiPhone, FiMapPin, FiHeart } from 'react-icons/fi';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20" style={{ backgroundColor: '#040f0f' }}>
      <div className="border-t-2 border-primary-800/60" />
      <div className="page-container py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

        {/* Brand */}
        <div className="lg:col-span-1">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-sm">
              <FiShoppingCart className="text-white" size={16} />
            </div>
            <span className="font-display text-white font-bold text-xl tracking-tight">SmartCart</span>
          </div>
          <p className="text-sm leading-relaxed mb-5 text-surface-400">
            AI-powered e-commerce built on MERN stack. Smart, fast, and personalised shopping for everyone.
          </p>
          <div className="flex flex-col gap-2.5 text-xs">
            <a href="mailto:support@smartcart.in" className="flex items-center gap-2 text-surface-400 hover:text-primary-300 transition-colors">
              <FiMail size={12} className="text-primary-500 flex-shrink-0" /> support@smartcart.in
            </a>
            <a href="tel:+919876543210" className="flex items-center gap-2 text-surface-400 hover:text-primary-300 transition-colors">
              <FiPhone size={12} className="text-primary-500 flex-shrink-0" /> +91 98765 43210
            </a>
            <span className="flex items-center gap-2 text-surface-400">
              <FiMapPin size={12} className="text-primary-500 flex-shrink-0" /> Dehradun, Uttarakhand
            </span>
          </div>
        </div>

        {/* Shop */}
        <div>
          <h4 className="text-white font-bold mb-4 text-xs uppercase tracking-widest">Shop</h4>
          <ul className="space-y-2.5 text-sm">
            {[
              ['All Products',  '/products'],
              ['Featured',      '/products?featured=true'],
              ['Best Sellers',  '/products?sort=popularity'],
              ['New Arrivals',  '/products?sort=newest'],
              ['Electronics',   '/products?search=Electronics'],
              ['Clothing',      '/products?search=Clothing'],
            ].map(([label, to]) => (
              <li key={label}>
                <Link
                  to={to}
                  className="text-surface-400 hover:text-primary-300 transition-colors duration-200"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Account */}
        <div>
          <h4 className="text-white font-bold mb-4 text-xs uppercase tracking-widest">Account</h4>
          <ul className="space-y-2.5 text-sm">
            {[
              ['My Profile',  '/profile'],
              ['My Orders',   '/orders'],
              ['Wishlist',    '/wishlist'],
              ['Cart',        '/cart'],
              ['Rewards',     '/loyalty'],
            ].map(([label, to]) => (
              <li key={label}>
                <Link
                  to={to}
                  className="text-surface-400 hover:text-primary-300 transition-colors duration-200"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Info */}
        <div>
          <h4 className="text-white font-bold mb-4 text-xs uppercase tracking-widest">Info</h4>
          <ul className="space-y-2.5 text-sm">
            {[
              ['About Us',         '/'],
              ['Privacy Policy',   '/'],
              ['Terms of Service', '/'],
              ['Shipping Policy',  '/'],
              ['Return Policy',    '/'],
              ['Contact Us',       '/'],
            ].map(([label, to]) => (
              <li key={label}>
                <Link
                  to={to}
                  className="text-surface-400 hover:text-primary-300 transition-colors duration-200"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-surface-800">
        <div className="page-container py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-surface-500">
          <p>© {year} SmartCart. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1.5 text-surface-400">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              All systems operational
            </span>
            <span className="flex items-center gap-1 text-surface-500">
              Made with <FiHeart size={11} className="text-red-400 mx-0.5" fill="currentColor" /> in India
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}