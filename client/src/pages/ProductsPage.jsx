import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiFilter, FiX, FiChevronDown } from 'react-icons/fi';
import API from '../services/api';
import ProductCard from '../components/product/ProductCard';
import { ProductSkeleton, Pagination, EmptyState } from '../components/ui/index';

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    brand: '',
    minPrice: '',
    maxPrice: '',
    rating: '',
    sort: 'createdAt',
  });

  useEffect(() => {
    API.get('/categories').then(r => setCategories(r.data.categories));
    API.get('/products/brands').then(r => setBrands(r.data.brands));
  }, []);

  useEffect(() => {
    setFilters(f => ({ ...f, search: searchParams.get('search') || '', category: searchParams.get('category') || '' }));
    setPage(1);
  }, [searchParams.toString()]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    params.set('page', page);
    params.set('limit', 12);
    try {
      const { data } = await API.get(`/products?${params}`);
      setProducts(data.products);
      setTotal(data.total);
      setPages(data.pages);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const updateFilter = (key, val) => { setFilters(f => ({ ...f, [key]: val })); setPage(1); };
  const clearFilters = () => { setFilters({ search: '', category: '', brand: '', minPrice: '', maxPrice: '', rating: '', sort: 'createdAt' }); setPage(1); };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            {filters.search ? `Results for "${filters.search}"` : 'All Products'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{total} products found</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={filters.sort} onChange={e => updateFilter('sort', e.target.value)} className="input w-auto text-sm py-1.5">
            <option value="createdAt">Newest First</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating">Top Rated</option>
            <option value="popularity">Most Popular</option>
          </select>
          <button onClick={() => setShowFilters(!showFilters)} className="btn-outline flex items-center gap-2 text-sm py-1.5">
            <FiFilter size={14} /> Filters
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Filters */}
        <aside className={`flex-shrink-0 w-60 space-y-6 ${showFilters ? 'block' : 'hidden md:block'}`}>
          <div className="card p-4 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Filters</h3>
              <button onClick={clearFilters} className="text-xs text-primary-600 hover:underline">Clear All</button>
            </div>

            {/* Category */}
            <FilterSection title="Category">
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" name="cat" checked={!filters.category} onChange={() => updateFilter('category', '')} className="accent-primary-600" />
                  All Categories
                </label>
                {categories.map(c => (
                  <label key={c._id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name="cat" checked={filters.category === c._id} onChange={() => updateFilter('category', c._id)} className="accent-primary-600" />
                    {c.name}
                  </label>
                ))}
              </div>
            </FilterSection>

            {/* Price */}
            <FilterSection title="Price Range">
              <div className="flex items-center gap-2">
                <input type="number" placeholder="Min" value={filters.minPrice} onChange={e => updateFilter('minPrice', e.target.value)} className="input text-sm py-1.5" />
                <span className="text-gray-400">—</span>
                <input type="number" placeholder="Max" value={filters.maxPrice} onChange={e => updateFilter('maxPrice', e.target.value)} className="input text-sm py-1.5" />
              </div>
            </FilterSection>

            {/* Rating */}
            <FilterSection title="Min Rating">
              <div className="space-y-1.5">
                {[4, 3, 2].map(r => (
                  <label key={r} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name="rat" checked={filters.rating === String(r)} onChange={() => updateFilter('rating', String(r))} className="accent-primary-600" />
                    {'⭐'.repeat(r)} & above
                  </label>
                ))}
              </div>
            </FilterSection>

            {/* Brand */}
            {brands.length > 0 && (
              <FilterSection title="Brand">
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {brands.map(b => (
                    <label key={b} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={filters.brand === b} onChange={() => updateFilter('brand', filters.brand === b ? '' : b)} className="accent-primary-600" />
                      {b}
                    </label>
                  ))}
                </div>
              </FilterSection>
            )}
          </div>
        </aside>

        {/* Products Grid */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {Array(12).fill(0).map((_, i) => <ProductSkeleton key={i} />)}
            </div>
          ) : products.length === 0 ? (
            <EmptyState icon="🔍" title="No products found" description="Try adjusting your filters or search terms." action={<button onClick={clearFilters} className="btn-primary">Clear Filters</button>} />
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map(p => <ProductCard key={p._id} product={p} />)}
              </div>
              <Pagination page={page} pages={pages} onPageChange={setPage} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterSection({ title, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <button onClick={() => setOpen(!open)} className="flex items-center justify-between w-full text-sm font-semibold mb-2">
        {title} <FiChevronDown size={14} className={`transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && children}
    </div>
  );
}