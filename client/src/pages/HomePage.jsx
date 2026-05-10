import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  FiArrowRight, FiZap, FiTruck, FiShield, FiHeadphones, FiStar,
} from 'react-icons/fi';
import API from '../services/api';
import ProductCard from '../components/product/ProductCard';
import { ProductSkeleton } from '../components/ui/index';

const FEATURES = [
  { icon: <FiTruck className="text-primary-500" size={20} />,    title: 'Free Delivery',         desc: 'On orders above ₹499',       bg: 'bg-primary-50 dark:bg-primary-950/40' },
  { icon: <FiShield className="text-emerald-500" size={20} />,   title: 'Secure Payments',        desc: 'Razorpay + COD available',   bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
  { icon: <FiZap className="text-amber-500" size={20} />,        title: 'AI Recommendations',     desc: 'Personalised just for you',  bg: 'bg-amber-50 dark:bg-amber-950/40' },
  { icon: <FiHeadphones className="text-blue-500" size={20} />,  title: '24/7 Support',           desc: 'Live chat always available', bg: 'bg-blue-50 dark:bg-blue-950/40' },
];

export default function HomePage() {
  const { user }            = useSelector(s => s.auth);
  const [featured, setFeatured]           = useState([]);
  const [bestSellers, setBestSellers]     = useState([]);
  const [categories, setCategories]       = useState([]);
  const [recommended, setRecommended]     = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [loading, setLoading]             = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [featRes, bsRes, catRes] = await Promise.all([
          API.get('/products?featured=true&limit=8'),
          API.get('/products?sort=popularity&limit=8'),
          API.get('/categories'),
        ]);
        setFeatured(featRes.data.products   || []);
        setBestSellers(bsRes.data.products  || []);
        setCategories(catRes.data.categories || []);

        if (user) {
          const [recRes, rvRes] = await Promise.all([
            API.get('/ai/recommendations').catch(() => ({ data: { productIds: [] } })),
            API.get('/users/recently-viewed').catch(() => ({ data: { products: [] } })),
          ]);
          if (recRes.data.productIds?.length) {
            const ids = recRes.data.productIds.slice(0, 8).join(',');
            const prods = await API.get(`/products?ids=${ids}&limit=8`).catch(() => ({ data: { products: [] } }));
            setRecommended(prods.data.products || []);
          }
          setRecentlyViewed(rvRes.data.products?.slice(0, 4) || []);
        }
      } catch (err) {
        console.error('HomePage load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  return (
    <div>
      {/* ── Hero Banner ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-800 via-primary-700 to-primary-600">
        {/* decorative circles */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 rounded-full" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-white/5 rounded-full" />

        <div className="page-container py-16 md:py-24 flex flex-col md:flex-row items-center gap-12 relative z-10">
          <div className="flex-1 space-y-6">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-full text-sm font-semibold text-white/90">
              <FiZap size={14} className="text-amber-300" />
              AI-Powered Shopping Experience
            </div>

            <h1 className="font-display text-4xl md:text-6xl font-black text-white leading-[1.05] tracking-tight">
              Shop Smarter<br />
              with <span className="text-amber-300">SmartCart</span>
            </h1>

            <p className="text-primary-100 text-lg max-w-lg leading-relaxed">
              Personalised AI picks, real-time sentiment analysis, and seamless checkout — all in one platform.
            </p>

            <div className="flex gap-4 flex-wrap pt-2">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 bg-white text-primary-700 font-bold px-7 py-3.5 rounded-xl hover:bg-primary-50 transition-all shadow-sm hover:shadow-md active:scale-[.98]"
              >
                Shop Now <FiArrowRight size={16} />
              </Link>
              {!user && (
                <Link
                  to="/login?mode=register"
                  className="inline-flex items-center gap-2 border-2 border-white/50 text-white font-bold px-7 py-3.5 rounded-xl hover:bg-white/10 transition-all"
                >
                  Create Account
                </Link>
              )}
            </div>

            {/* Stats */}
            <div className="flex gap-8 pt-4">
              {[['50K+', 'Happy Customers'], ['1K+', 'Products'], ['100%', 'Secure']].map(([val, lbl]) => (
                <div key={lbl}>
                  <p className="font-display text-2xl font-black text-white">{val}</p>
                  <p className="text-primary-200 text-xs font-medium">{lbl}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Hero image */}
          <div className="flex-1 flex justify-center">
            <div className="relative">
              <div className="w-72 h-72 md:w-[380px] md:h-[380px] bg-white/10 rounded-3xl rotate-3 flex items-center justify-center overflow-hidden border border-white/20">
                <img
                  src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600"
                  alt="Shopping"
                  className="w-full h-full object-cover -rotate-3 scale-105"
                />
              </div>
              <div className="absolute -top-4 -right-4 bg-amber-400 text-amber-900 font-bold px-4 py-2.5 rounded-2xl shadow-lg text-sm animate-bounce">
                🤖 AI Picks For You!
              </div>
              <div className="absolute -bottom-4 -left-4 bg-white dark:bg-surface-800 px-4 py-2.5 rounded-2xl shadow-lg text-sm font-semibold text-surface-800 dark:text-white flex items-center gap-2">
                <FiStar className="text-amber-400 fill-amber-400" size={14} />
                4.8 · 50K+ Reviews
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature strip ── */}
      <section className="bg-white dark:bg-surface-900 border-b border-surface-100 dark:border-surface-800 shadow-sm">
        <div className="page-container py-5 grid grid-cols-2 md:grid-cols-4 gap-4">
          {FEATURES.map(f => (
            <div key={f.title} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors">
              <div className={`w-10 h-10 ${f.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                {f.icon}
              </div>
              <div>
                <p className="font-bold text-sm text-surface-800 dark:text-surface-200">{f.title}</p>
                <p className="text-xs text-surface-500">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Main content ── */}
      <div className="page-container py-12 space-y-16">

        {/* Categories */}
        {categories.length > 0 && (
          <section>
            <SectionHeader title="Shop by Category" link="/products" />
            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-10 gap-3 mt-5">
              {categories.slice(0, 10).map(cat => (
                <Link
                  key={cat._id}
                  to={`/products?search=${encodeURIComponent(cat.name)}`}
                  className="card-hover p-3 flex flex-col items-center gap-2.5 group"
                >
                  <div className="w-12 h-12 rounded-xl overflow-hidden ring-2 ring-transparent group-hover:ring-primary-300 transition-all">
                    <img
                      src={cat.image || 'https://via.placeholder.com/80'}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <span className="text-[10px] font-bold text-center text-surface-600 dark:text-surface-400 leading-tight">{cat.name}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* AI Recommendations */}
        {user && recommended.length > 0 && (
          <section>
            <SectionHeader title="🤖 AI Picks For You" link="/products" badge="Personalised" />
            <ProductGrid products={recommended} loading={false} />
          </section>
        )}

        {/* Recently Viewed */}
        {user && recentlyViewed.length > 0 && (
          <section>
            <SectionHeader title="👁️ Recently Viewed" link="/products" />
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

        {/* CTA Banner */}
        {!user && (
          <section className="card overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-primary-800" />
            <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h2 className="font-display text-3xl font-black text-white mb-2">Join SmartCart Today</h2>
                <p className="text-primary-200 max-w-md">Get personalised AI recommendations, exclusive deals, and earn rewards on every purchase.</p>
              </div>
              <Link
                to="/login?mode=register"
                className="flex-shrink-0 bg-white text-primary-700 font-bold px-8 py-3.5 rounded-xl hover:bg-primary-50 transition-all shadow-sm hover:shadow-md active:scale-[.98] inline-flex items-center gap-2"
              >
                Get Started Free <FiArrowRight size={16} />
              </Link>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function SectionHeader({ title, link, badge }) {
  return (
    <div className="flex items-center justify-between mb-1">
      <div className="flex items-center gap-3">
        <h2 className="section-title text-xl">{title}</h2>
        {badge && (
          <span className="badge-primary text-[10px]">{badge}</span>
        )}
      </div>
      <Link
        to={link}
        className="text-primary-600 dark:text-primary-400 text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all group"
      >
        View All
        <FiArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
      </Link>
    </div>
  );
}

function ProductGrid({ products, loading }) {
  if (loading) return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
      {Array(8).fill(0).map((_, i) => <ProductSkeleton key={i} />)}
    </div>
  );

  if (!products?.length) return (
    <p className="text-surface-400 text-sm mt-4">No products to show right now.</p>
  );

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
      {products.map(p => <ProductCard key={p._id} product={p} />)}
    </div>
  );
}