import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiPlus, FiX } from 'react-icons/fi';
import API from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminAddProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
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
        setForm({ ...p, tags: p.tags?.join(', ') || '', images: p.images?.length ? p.images : [''], specifications: p.specifications?.length ? p.specifications : [{ key: '', value: '' }] });
      });
    }
  }, [id]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async e => {
    e.preventDefault(); setLoading(true);
    try {
      const payload = { ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean), images: form.images.filter(Boolean), specifications: form.specifications.filter(s => s.key), price: Number(form.price), originalPrice: Number(form.originalPrice || form.price), stock: Number(form.stock) };
      if (isEdit) await API.put(`/products/${id}`, payload);
      else await API.post('/products', payload);
      toast.success(isEdit ? 'Product updated!' : 'Product created!');
      navigate('/admin/products');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="p-6 max-w-3xl">
      <button onClick={() => navigate('/admin/products')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 mb-6">
        <FiArrowLeft size={14} /> Back to Products
      </button>
      <h1 className="text-2xl font-bold mb-6">{isEdit ? 'Edit Product' : 'Add New Product'}</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold">Basic Info</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2"><label className="label">Product Name *</label><input value={form.name} onChange={e => set('name', e.target.value)} className="input text-sm" required /></div>
            <div className="sm:col-span-2"><label className="label">Description *</label><textarea value={form.description} onChange={e => set('description', e.target.value)} className="input text-sm resize-none" rows={4} required /></div>
            <div><label className="label">Category *</label>
              <select value={form.category?._id || form.category} onChange={e => set('category', e.target.value)} className="input text-sm" required>
                <option value="">Select category</option>
                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div><label className="label">Brand</label><input value={form.brand} onChange={e => set('brand', e.target.value)} className="input text-sm" /></div>
          </div>
        </div>

        <div className="card p-5 space-y-4">
          <h2 className="font-semibold">Pricing & Stock</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <div><label className="label">Selling Price (₹) *</label><input type="number" value={form.price} onChange={e => set('price', e.target.value)} className="input text-sm" required min="0" /></div>
            <div><label className="label">Original Price (₹)</label><input type="number" value={form.originalPrice} onChange={e => set('originalPrice', e.target.value)} className="input text-sm" min="0" /></div>
            <div><label className="label">Stock *</label><input type="number" value={form.stock} onChange={e => set('stock', e.target.value)} className="input text-sm" required min="0" /></div>
          </div>
        </div>

        <div className="card p-5 space-y-4">
          <h2 className="font-semibold">Images (URLs)</h2>
          {form.images.map((img, i) => (
            <div key={i} className="flex gap-2">
              <input value={img} onChange={e => { const imgs = [...form.images]; imgs[i] = e.target.value; set('images', imgs); }} placeholder="https://..." className="input text-sm flex-1" />
              {form.images.length > 1 && <button type="button" onClick={() => set('images', form.images.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600"><FiX /></button>}
            </div>
          ))}
          <button type="button" onClick={() => set('images', [...form.images, ''])} className="text-primary-600 text-sm flex items-center gap-1 hover:underline"><FiPlus size={14} /> Add Image</button>
        </div>

        <div className="card p-5 space-y-4">
          <h2 className="font-semibold">Tags & Flags</h2>
          <div><label className="label">Tags (comma separated)</label><input value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="phone, wireless, bluetooth" className="input text-sm" /></div>
          <div className="flex flex-wrap gap-4">
            {[['isFeatured', 'Featured'], ['isBestSeller', 'Best Seller'], ['isNewArrival', 'New Arrival']].map(([k, l]) => (
              <label key={k} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form[k]} onChange={e => set(k, e.target.checked)} className="accent-primary-600" /> {l}
              </label>
            ))}
          </div>
        </div>

        <div className="card p-5 space-y-4">
          <h2 className="font-semibold">Specifications</h2>
          {form.specifications.map((s, i) => (
            <div key={i} className="flex gap-2">
              <input value={s.key} onChange={e => { const sp = [...form.specifications]; sp[i] = { ...sp[i], key: e.target.value }; set('specifications', sp); }} placeholder="Key (e.g. Battery)" className="input text-sm flex-1" />
              <input value={s.value} onChange={e => { const sp = [...form.specifications]; sp[i] = { ...sp[i], value: e.target.value }; set('specifications', sp); }} placeholder="Value (e.g. 5000mAh)" className="input text-sm flex-1" />
              {form.specifications.length > 1 && <button type="button" onClick={() => set('specifications', form.specifications.filter((_, j) => j !== i))} className="text-red-400"><FiX /></button>}
            </div>
          ))}
          <button type="button" onClick={() => set('specifications', [...form.specifications, { key: '', value: '' }])} className="text-primary-600 text-sm flex items-center gap-1 hover:underline"><FiPlus size={14} /> Add Spec</button>
        </div>

        <button type="submit" disabled={loading} className="btn-primary px-8 py-2.5 text-base font-bold w-full">
          {loading ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
        </button>
      </form>
    </div>
  );
}