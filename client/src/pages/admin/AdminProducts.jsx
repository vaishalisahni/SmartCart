import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiPackage, FiStar } from 'react-icons/fi';
import API from '../../services/api';
import { PageLoader, Pagination } from '../../components/ui/index';
import toast from 'react-hot-toast';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchProducts = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 15 });
    if (search) params.set('search', search);
    try {
      const { data } = await API.get(`/products?${params}`);
      setProducts(data.products);
      setPages(data.pages);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, [page, search]);

  const handleDelete = async id => {
    if (!confirm('Delete this product? This action cannot be undone.')) return;
    try {
      await API.delete(`/products/${id}`);
      toast.success('Product deleted successfully');
      fetchProducts();
    } catch {
      toast.error('Failed to delete product');
    }
  };

  const stockBadge = (stock) => {
    if (stock === 0) return 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300';
    if (stock < 10) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300';
    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300';
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">Products</h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5">
            {total} total products in your catalog
          </p>
        </div>
        <Link
          to="/admin/products/add"
          className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md text-sm"
        >
          <FiPlus size={15} /> Add Product
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" size={15} />
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search products..."
          className="w-full pl-10 pr-4 py-2.5 border border-surface-300 dark:border-surface-600 rounded-xl bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm"
        />
      </div>

      {loading ? <PageLoader /> : (
        <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-50 dark:bg-surface-700/50 border-b border-surface-200 dark:border-surface-700">
                <tr>
                  {['Product', 'Category', 'Price', 'Stock', 'Rating', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-surface-700">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 bg-surface-100 dark:bg-surface-700 rounded-xl flex items-center justify-center">
                          <FiPackage size={20} className="text-surface-400" />
                        </div>
                        <p className="text-surface-500 dark:text-surface-400">No products found</p>
                        <Link to="/admin/products/add" className="text-sm text-primary-600 dark:text-primary-400 font-medium hover:underline">
                          Add your first product →
                        </Link>
                      </div>
                    </td>
                  </tr>
                ) : products.map(p => (
                  <tr key={p._id} className="hover:bg-surface-50 dark:hover:bg-surface-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl overflow-hidden bg-surface-100 dark:bg-surface-700 flex-shrink-0 border border-surface-200 dark:border-surface-600">
                          {p.images?.[0] ? (
                            <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FiPackage size={16} className="text-surface-400" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-surface-800 dark:text-surface-200 truncate max-w-[180px]">{p.name}</p>
                          {p.brand && (
                            <p className="text-xs text-primary-600 dark:text-primary-400 font-semibold mt-0.5">{p.brand}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-surface-600 dark:text-surface-400 text-sm">
                      {p.category?.name || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-semibold text-surface-800 dark:text-surface-200">₹{p.price?.toLocaleString()}</p>
                        {p.originalPrice > p.price && (
                          <p className="text-xs text-surface-400 dark:text-surface-500 line-through">₹{p.originalPrice?.toLocaleString()}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${stockBadge(p.stock)}`}>
                        {p.stock} units
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <FiStar size={12} className="text-amber-400 fill-amber-400" />
                        <span className="text-sm text-surface-700 dark:text-surface-300 font-medium">
                          {p.ratings?.toFixed(1) || '—'}
                        </span>
                        <span className="text-xs text-surface-400 dark:text-surface-500">
                          ({p.numReviews || 0})
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Link
                          to={`/admin/products/edit/${p._id}`}
                          className="p-2 text-primary-500 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/40 rounded-lg transition-colors"
                          title="Edit product"
                        >
                          <FiEdit2 size={14} />
                        </Link>
                        <button
                          onClick={() => handleDelete(p._id)}
                          className="p-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                          title="Delete product"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pages > 1 && (
            <div className="px-4 py-3 border-t border-surface-100 dark:border-surface-700">
              <Pagination page={page} pages={pages} onPageChange={setPage} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}