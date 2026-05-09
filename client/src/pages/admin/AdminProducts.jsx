import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiEdit2, FiTrash2, FiSearch } from 'react-icons/fi';
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
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchProducts(); }, [page, search]);

  const handleDelete = async id => {
    if (!confirm('Delete this product?')) return;
    try {
      await API.delete(`/products/${id}`);
      toast.success('Product deleted');
      fetchProducts();
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-sm text-gray-500">{total} total products</p>
        </div>
        <Link to="/admin/products/add" className="btn-primary flex items-center gap-2"><FiPlus /> Add Product</Link>
      </div>

      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search products..." className="input pl-9 max-w-sm text-sm" />
      </div>

      {loading ? <PageLoader /> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>{['Product', 'Category', 'Price', 'Stock', 'Rating', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {products.map(p => (
                  <tr key={p._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img src={p.images?.[0]} alt={p.name} className="w-10 h-10 object-cover rounded-lg flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium truncate max-w-[200px]">{p.name}</p>
                          <p className="text-xs text-gray-400">{p.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{p.category?.name}</td>
                    <td className="px-4 py-3 font-semibold">₹{p.price?.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${p.stock === 0 ? 'bg-red-100 text-red-700' : p.stock < 10 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3">⭐ {p.ratings?.toFixed(1)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link to={`/admin/products/edit/${p._id}`} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition"><FiEdit2 size={15} /></Link>
                        <button onClick={() => handleDelete(p._id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded transition"><FiTrash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
            <Pagination page={page} pages={pages} onPageChange={setPage} />
          </div>
        </div>
      )}
    </div>
  );
}