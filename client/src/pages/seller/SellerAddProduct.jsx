import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiPlus, FiX, FiPackage } from 'react-icons/fi';
import API from '../../services/api';
import toast from 'react-hot-toast';

export default function SellerAddProduct() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const isEdit     = !!id;
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', price: '', originalPrice: '', discountPercent: 0,
    images: [''], category: '', brand: '', stock: '', tags: '',
    isFeatured: false, isBestSeller: false, isNewArrival: true,
    specifications: [{ key: '', value: '' }],
  });

  useEffect(() => {
    API.get('/categories').then(r => setCategories(r.data.categories));
    if (isEdit) {
      API.get(`/products/${id}`).then(r => {
        const p = r.data.product;
        setForm({
          ...p,
          tags:           p.tags?.join(', ') || '',
          images:         p.images?.length ? p.images : [''],
          specifications: p.specifications?.length ? p.specifications : [{ key: '', value: '' }],
        });
      });
    }
  }, [id]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        tags:           form.tags.split(',').map(t => t.trim()).filter(Boolean),
        images:         form.images.filter(Boolean),
        specifications: form.specifications.filter(s => s.key),
        price:          Number(form.price),
        originalPrice:  Number(form.originalPrice || form.price),
        stock:          Number(form.stock),
      };
      if (isEdit) await API.put(`/seller/products/${id}`, payload);
      else        await API.post('/seller/products', payload);
      toast.success(isEdit ? 'Product updated!' : 'Product created!');
      navigate('/seller/products');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  /* ── Small helpers for consistent styling ── */
  const Section = ({ title, children }) => (
    <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-5 space-y-4">
      <h2 className="font-semibold text-surface-800 dark:text-surface-200 text-sm uppercase tracking-wide">{title}</h2>
      {children}
    </div>
  );

  const Label = ({ children }) => (
    <label className="text-sm font-semibold mb-1.5 block text-surface-700 dark:text-surface-300">{children}</label>
  );

  const Input = props => (
    <input
      className="w-full px-3.5 py-2.5 border border-surface-300 dark:border-surface-600 rounded-xl bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm"
      {...props}
    />
  );

  return (
    <div className="p-6 max-w-3xl">
      <button
        onClick={() => navigate('/seller/products')}
        className="flex items-center gap-1.5 text-sm text-surface-500 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 mb-6 transition-colors"
      >
        <FiArrowLeft size={14} /> Back to Products
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/40 rounded-xl flex items-center justify-center">
          <FiPackage size={18} className="text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
            {isEdit ? 'Edit Product' : 'Add New Product'}
          </h1>
          <p className="text-sm text-surface-500 dark:text-surface-400">
            {isEdit ? 'Update product information' : 'Create a new product listing'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Basic info */}
        <Section title="Basic Information">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label>Product Name *</Label>
              <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Wireless Headphones" required />
            </div>
            <div className="sm:col-span-2">
              <Label>Description *</Label>
              <textarea
                value={form.description}
                onChange={e => set('description', e.target.value)}
                className="w-full px-3.5 py-2.5 border border-surface-300 dark:border-surface-600 rounded-xl bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm resize-none transition-all"
                rows={4}
                placeholder="Describe your product in detail..."
                required
              />
            </div>
            <div>
              <Label>Category *</Label>
              <select
                value={form.category?._id || form.category}
                onChange={e => set('category', e.target.value)}
                className="w-full px-3.5 py-2.5 border border-surface-300 dark:border-surface-600 rounded-xl bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm transition-all"
                required
              >
                <option value="">Select a category</option>
                {categories.map(c => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Brand</Label>
              <Input value={form.brand} onChange={e => set('brand', e.target.value)} placeholder="e.g. Sony, Apple" />
            </div>
          </div>
        </Section>

        {/* Pricing */}
        <Section title="Pricing & Inventory">
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <Label>Selling Price (₹) *</Label>
              <Input type="number" value={form.price} onChange={e => set('price', e.target.value)} placeholder="0" required min="0" />
            </div>
            <div>
              <Label>Original Price (₹)</Label>
              <Input type="number" value={form.originalPrice} onChange={e => set('originalPrice', e.target.value)} placeholder="0" min="0" />
            </div>
            <div>
              <Label>Stock Quantity *</Label>
              <Input type="number" value={form.stock} onChange={e => set('stock', e.target.value)} placeholder="0" required min="0" />
            </div>
          </div>
          {form.originalPrice && form.price && Number(form.originalPrice) > Number(form.price) && (
            <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2 rounded-xl">
              <span>✓</span>
              <span>{Math.round(((Number(form.originalPrice) - Number(form.price)) / Number(form.originalPrice)) * 100)}% discount will be shown to customers</span>
            </div>
          )}
        </Section>

        {/* Images */}
        <Section title="Product Images">
          <p className="text-xs text-surface-500 dark:text-surface-400 -mt-2">Add image URLs — the first image is the main display image</p>
          <div className="space-y-2">
            {form.images.map((img, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={img}
                  onChange={e => {
                    const imgs = [...form.images]; imgs[i] = e.target.value; set('images', imgs);
                  }}
                  placeholder="https://example.com/image.jpg"
                />
                {i === 0 && img && (
                  <div className="w-10 h-10 rounded-lg overflow-hidden border border-surface-200 dark:border-surface-600 flex-shrink-0">
                    <img src={img} alt="" className="w-full h-full object-cover" onError={e => e.target.style.display = 'none'} />
                  </div>
                )}
                {form.images.length > 1 && (
                  <button
                    type="button"
                    onClick={() => set('images', form.images.filter((_, j) => j !== i))}
                    className="p-2 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors flex-shrink-0"
                  >
                    <FiX size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => set('images', [...form.images, ''])}
            className="text-primary-600 dark:text-primary-400 text-sm flex items-center gap-1.5 hover:underline font-medium"
          >
            <FiPlus size={14} /> Add Another Image
          </button>
        </Section>

        {/* Tags & Labels */}
        <Section title="Tags & Labels">
          <div>
            <Label>Tags <span className="text-surface-400 font-normal">(comma separated)</span></Label>
            <Input value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="wireless, bluetooth, premium" />
          </div>
          <div>
            <Label>Product Labels</Label>
            <div className="flex flex-wrap gap-4 mt-1">
              {[
                ['isFeatured',   'Featured',    'Shown on homepage'],
                ['isBestSeller', 'Best Seller',  'Mark as best selling'],
                ['isNewArrival', 'New Arrival',  'Mark as recently added'],
              ].map(([k, l, desc]) => (
                <label key={k} className="flex items-start gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={form[k]}
                    onChange={e => set(k, e.target.checked)}
                    className="accent-primary-600 mt-0.5 w-4 h-4"
                  />
                  <div>
                    <p className="text-sm font-medium text-surface-700 dark:text-surface-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{l}</p>
                    <p className="text-xs text-surface-400 dark:text-surface-500">{desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </Section>

        {/* Specifications */}
        <Section title="Specifications">
          <p className="text-xs text-surface-500 dark:text-surface-400 -mt-2">Key-value pairs shown on the product page</p>
          <div className="space-y-2.5">
            {form.specifications.map((s, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={s.key}
                  onChange={e => {
                    const sp = [...form.specifications]; sp[i] = { ...sp[i], key: e.target.value }; set('specifications', sp);
                  }}
                  placeholder="e.g. Battery Life"
                />
                <Input
                  value={s.value}
                  onChange={e => {
                    const sp = [...form.specifications]; sp[i] = { ...sp[i], value: e.target.value }; set('specifications', sp);
                  }}
                  placeholder="e.g. 30 hours"
                />
                {form.specifications.length > 1 && (
                  <button
                    type="button"
                    onClick={() => set('specifications', form.specifications.filter((_, j) => j !== i))}
                    className="p-2 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors flex-shrink-0"
                  >
                    <FiX size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => set('specifications', [...form.specifications, { key: '', value: '' }])}
            className="text-primary-600 dark:text-primary-400 text-sm flex items-center gap-1.5 hover:underline font-medium"
          >
            <FiPlus size={14} /> Add Specification
          </button>
        </Section>

        {/* Actions */}
        <div className="flex gap-3 pb-6">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-3 rounded-xl transition-all disabled:opacity-50 shadow-sm"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              isEdit ? 'Update Product' : 'Create Product'
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate('/seller/products')}
            className="px-6 py-3 border-2 border-surface-300 dark:border-surface-600 text-surface-600 dark:text-surface-400 font-semibold rounded-xl hover:bg-surface-50 dark:hover:bg-surface-700 transition-all"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}