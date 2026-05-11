import { Link } from 'react-router-dom';
import { FiShoppingCart, FiMail, FiPhone, FiMapPin, FiHeart } from 'react-icons/fi';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 dark:bg-none dark:border-t-2 dark:border-primary-800/60"
      style={{ '--tw-bg-opacity': 1 }}
    >
      {/* Dark mode solid background */}
      <div className="absolute inset-0 hidden dark:block" style={{ backgroundColor: '#040f0f' }} />

      {/* Decorative blobs */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 dark:bg-primary-500/10 rounded-full pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-white/5 dark:bg-primary-500/8 rounded-full pointer-events-none" />
      {/* Dot grid */}
      <div
        className="absolute top-0 left-0 w-full h-full opacity-10 dark:opacity-20 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(124,199,195,0.4) 1px, transparent 1px)', backgroundSize: '32px 32px' }}
      />

      <div className="relative z-10">
        <div className="page-container py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              {/* Light mode: frosted glass | Dark mode: gradient */}
              <div className="w-9 h-9 bg-white/15 border border-white/20 dark:bg-gradient-to-br dark:from-primary-500 dark:to-primary-700 dark:border-0 rounded-xl flex items-center justify-center shadow-sm backdrop-blur-sm">
                <FiShoppingCart className="text-white" size={16} />
              </div>
              <span className="font-display text-white font-bold text-xl tracking-tight">SmartCart</span>
            </div>
            <p className="text-sm leading-relaxed mb-5 text-primary-200 dark:text-surface-400">
              AI-powered e-commerce built on MERN stack. Smart, fast, and personalised shopping for everyone.
            </p>
            <div className="flex flex-col gap-2.5 text-xs">
              <a href="mailto:support@smartcart.in" className="flex items-center gap-2 text-primary-300 hover:text-white dark:text-surface-400 dark:hover:text-primary-300 transition-colors">
                <FiMail size={12} className="text-primary-400 dark:text-primary-500 flex-shrink-0" /> support@smartcart.in
              </a>
              <a href="tel:+919876543210" className="flex items-center gap-2 text-primary-300 hover:text-white dark:text-surface-400 dark:hover:text-primary-300 transition-colors">
                <FiPhone size={12} className="text-primary-400 dark:text-primary-500 flex-shrink-0" /> +91 98765 43210
              </a>
              <span className="flex items-center gap-2 text-primary-300 dark:text-surface-400">
                <FiMapPin size={12} className="text-primary-400 dark:text-primary-500 flex-shrink-0" /> Dehradun, Uttarakhand
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
                  <Link to={to} className="text-primary-300 hover:text-white dark:text-surface-400 dark:hover:text-primary-300 transition-colors duration-200">
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
                  <Link to={to} className="text-primary-300 hover:text-white dark:text-surface-400 dark:hover:text-primary-300 transition-colors duration-200">
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
                  <Link to={to} className="text-primary-300 hover:text-white dark:text-surface-400 dark:hover:text-primary-300 transition-colors duration-200">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 dark:border-surface-800">
          <div className="page-container py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-primary-300 dark:text-surface-500">
            <p>© {year} SmartCart. All rights reserved.</p>
            <div className="flex items-center gap-5">
              <span className="flex items-center gap-1.5 dark:text-surface-400">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                All systems operational
              </span>
              <span className="flex items-center gap-1 dark:text-surface-500">
                Made with <FiHeart size={11} className="text-red-400 mx-0.5" fill="currentColor" /> in India
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}