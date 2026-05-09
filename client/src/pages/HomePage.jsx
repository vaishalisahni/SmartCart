import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FiArrowRight, FiZap, FiTruck, FiShield, FiHeadphones } from 'react-icons/fi';
import API from '../services/api';
import ProductCard from '../components/product/ProductCard';
import { ProductSkeleton } from '../components/ui/index';

export default function HomePage() {
  const { user } = useSelector(s => s.auth);
  const [featured, setFeatured] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [featRes, bsRes, catRes] = await Promise.all([
          API.get('/products?featured=true&limit=8'),
          API.get('/products?sort=popularity&limit=8'),
          API.get('/categories'),
        ]);
        setFeatured(featRes.data.products);
        setBestSellers(bsRes.data.products);
        setCategories(catRes.data.categories);

        if (user) {
          const [recRes, rvRes] = await Promise.all([
            API.get('/ai/recommendations').catch(() => ({ data: { productIds: [] } })),
            API.get('/users/recently-viewed').catch(() => ({ data: { products: [] } })),
          ]);
          if (recRes.data.productIds?.length) {
            const ids = recRes.data.productIds.slice(0, 8).join(',');
            const prods = await API.get(`/products?ids=${ids}&limit=8`).catch(() => ({ data: { products: [] } }));
            setRecommended(prods.data.products);
          }
          setRecentlyViewed(rvRes.data.products?.slice(0, 4) || []);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  return (
    <div>
      {/* Hero Banner */}
      <section className="bg-gradient-to-br from-primary-700 via-primary-600 to-primary-500 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1 space-y-6">
            <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full text-sm font-medium">
              <FiZap size={14} /> AI-Powered Shopping Experience
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
              Shop Smarter<br />with <span className="text-yellow-300">SmartCart</span>
            </h1>
            <p className="text-primary-100 text-lg max-w-lg">
              Personalised recommendations, real-time sentiment analysis and seamless checkout — all in one place.
            </p>
            <div className="flex gap-4 flex-wrap">
              <Link to="/products" className="bg-white text-primary-700 font-bold px-6 py-3 rounded-xl hover:bg-primary-50 transition flex items-center gap-2">
                Shop Now <FiArrowRight />
              </Link>
              {!user && (
                <Link to="/register" className="border-2 border-white text-white font-bold px-6 py-3 rounded-xl hover:bg-white/10 transition">
                  Create Account
                </Link>
              )}
            </div>
          </div>
          <div className="flex-1 flex justify-center">
            <div className="relative">
              <div className="w-72 h-72 md:w-96 md:h-96 bg-white/10 rounded-full flex items-center justify-center">
                <img src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=500" alt="Shopping" className="w-64 h-64 md:w-80 md:h-80 object-cover rounded-full shadow-2xl" />
              </div>
              <div className="absolute -top-4 -right-4 bg-yellow-400 text-yellow-900 font-bold px-4 py-2 rounded-xl shadow-lg text-sm animate-bounce">
                🤖 AI Picks For You!
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features strip */}
      <section className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: <FiTruck className="text-primary-500" size={22} />, title: 'Free Delivery', desc: 'On orders above ₹499' },
            { icon: <FiShield className="text-green-500" size={22} />, title: 'Secure Payments', desc: 'Razorpay + COD' },
            { icon: <FiZap className="text-yellow-500" size={22} />, title: 'AI Recommendations', desc: 'Personalised for you' },
            { icon: <FiHeadphones className="text-blue-500" size={22} />, title: '24/7 Support', desc: 'Always here to help' },
          ].map(f => (
            <div key={f.title} className="flex items-center gap-3 p-3">
              <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">{f.icon}</div>
              <div>
                <p className="font-semibold text-sm">{f.title}</p>
                <p className="text-xs text-gray-500">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-10 space-y-14">
        {/* Categories */}
        <section>
          <SectionHeader title="Shop by Category" link="/products" />
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 mt-4">
            {categories.map(cat => (
              <Link key={cat._id} to={`/products?category=${cat._id}`}
                className="card p-4 flex flex-col items-center gap-2 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md transition group">
                <img src={cat.image || 'https://via.placeholder.com/80'} alt={cat.name} className="w-16 h-16 object-cover rounded-full group-hover:scale-110 transition" />
                <span className="text-xs font-semibold text-center">{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* AI Recommendations */}
        {user && recommended.length > 0 && (
          <section>
            <SectionHeader title="🤖 AI Picks For You" link="/products" />
            <ProductGrid products={recommended} loading={false} />
          </section>
        )}

        {/* Recently Viewed */}
        {user && recentlyViewed.length > 0 && (
          <section>
            <SectionHeader title="Recently Viewed" link="/products" />
            <ProductGrid products={recentlyViewed} loading={false} />
          </section>
        )}

        {/* Featured */}
        <section>
          <SectionHeader title="⭐ Featured Products" link="/products?featured=true" />
          <ProductGrid products={featured} loading={loading} />
        </section>

        {/* Best Sellers */}
        <section>
          <SectionHeader title="🔥 Best Sellers" link="/products?sort=popularity" />
          <ProductGrid products={bestSellers} loading={loading} />
        </section>
      </div>
    </div>
  );
}

function SectionHeader({ title, link }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <h2 className="text-xl font-bold">{title}</h2>
      <Link to={link} className="text-primary-600 text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all">
        View All <FiArrowRight size={14} />
      </Link>
    </div>
  );
}

function ProductGrid({ products, loading }) {
  if (loading) return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array(8).fill(0).map((_, i) => <ProductSkeleton key={i} />)}
    </div>
  );
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map(p => <ProductCard key={p._id} product={p} />)}
    </div>
  );
}