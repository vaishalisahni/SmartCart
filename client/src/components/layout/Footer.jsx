import { Link } from 'react-router-dom';
import { FiShoppingCart, FiGithub, FiMail } from 'react-icons/fi';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <FiShoppingCart className="text-white" />
            </div>
            <span className="text-white font-bold text-lg">SmartCart</span>
          </div>
          <p className="text-sm leading-relaxed">AI-powered e-commerce platform built on MERN stack. Smart, fast, personalized shopping.</p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3">Shop</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/products" className="hover:text-white transition">All Products</Link></li>
            <li><Link to="/products?featured=true" className="hover:text-white transition">Featured</Link></li>
            <li><Link to="/products?sort=popularity" className="hover:text-white transition">Best Sellers</Link></li>
            <li><Link to="/products?sort=newest" className="hover:text-white transition">New Arrivals</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3">Account</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/profile" className="hover:text-white transition">My Profile</Link></li>
            <li><Link to="/orders" className="hover:text-white transition">My Orders</Link></li>
            <li><Link to="/wishlist" className="hover:text-white transition">Wishlist</Link></li>
            <li><Link to="/cart" className="hover:text-white transition">Cart</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-800 py-4 text-center text-xs">
        <p>© 2025 SmartCart — B.Tech AI & ML Major Project | Shivalik College of Engineering</p>
      </div>
    </footer>
  );
}