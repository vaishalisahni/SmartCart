import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FiUser, FiMapPin, FiPlus, FiTrash2, FiSave } from 'react-icons/fi';
import { loadUser } from '../store/slices/authSlice';
import API from '../services/api';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);
  const [tab, setTab] = useState('profile');
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [saving, setSaving] = useState(false);
  const [addrForm, setAddrForm] = useState({ fullName: '', phone: '', street: '', city: '', state: '', pincode: '', isDefault: false });
  const [showAddrForm, setShowAddrForm] = useState(false);

  const saveProfile = async e => {
    e.preventDefault(); setSaving(true);
    try {
      await API.put('/users/profile', form);
      await dispatch(loadUser());
      toast.success('Profile updated!');
    } catch { toast.error('Failed to update'); } finally { setSaving(false); }
  };

  const addAddress = async e => {
    e.preventDefault();
    try {
      await API.post('/users/address', addrForm);
      await dispatch(loadUser());
      setShowAddrForm(false);
      setAddrForm({ fullName: '', phone: '', street: '', city: '', state: '', pincode: '', isDefault: false });
      toast.success('Address added!');
    } catch { toast.error('Failed'); }
  };

  const deleteAddress = async id => {
    try { await API.delete(`/users/address/${id}`); await dispatch(loadUser()); toast.success('Address removed'); }
    catch { toast.error('Failed'); }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/60 flex items-center justify-center text-primary-600 dark:text-primary-300 text-2xl font-bold ring-4 ring-primary-200 dark:ring-primary-800">
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">{user?.name}</h1>
          <p className="text-surface-500 dark:text-surface-400 text-sm">{user?.email}</p>
          <span className="badge badge-primary mt-1 capitalize">{user?.role}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-surface-200 dark:border-surface-700 mb-6 gap-1">
        {[
          { id: 'profile', label: 'Profile', icon: <FiUser size={14} /> },
          { id: 'addresses', label: 'Addresses', icon: <FiMapPin size={14} /> },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                : 'border-transparent text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300'
            }`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <form onSubmit={saveProfile} className="card p-6 space-y-4 max-w-lg">
          <h2 className="font-bold text-lg text-surface-900 dark:text-surface-50">Personal Information</h2>
          <div>
            <label className="label">Full Name</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input" required />
          </div>
          <div>
            <label className="label">Email</label>
            <input value={user?.email} className="input opacity-60 cursor-not-allowed" disabled />
          </div>
          <div>
            <label className="label">Phone Number</label>
            <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 XXXXXXXXXX" className="input" />
          </div>
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 px-6">
            <FiSave size={14} /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      )}

      {tab === 'addresses' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg text-surface-900 dark:text-surface-50">Saved Addresses</h2>
            <button onClick={() => setShowAddrForm(!showAddrForm)} className="btn-primary text-sm flex items-center gap-1.5 px-4">
              <FiPlus size={14} /> Add Address
            </button>
          </div>

          {showAddrForm && (
            <form onSubmit={addAddress} className="card p-5 space-y-3">
              <h3 className="font-semibold text-surface-800 dark:text-surface-200">New Address</h3>
              <div className="grid grid-cols-2 gap-3">
                <input value={addrForm.fullName} onChange={e => setAddrForm(a => ({ ...a, fullName: e.target.value }))} placeholder="Full Name *" className="input text-sm" required />
                <input value={addrForm.phone} onChange={e => setAddrForm(a => ({ ...a, phone: e.target.value }))} placeholder="Phone *" className="input text-sm" required />
                <input value={addrForm.street} onChange={e => setAddrForm(a => ({ ...a, street: e.target.value }))} placeholder="Street Address *" className="input text-sm col-span-2" required />
                <input value={addrForm.city} onChange={e => setAddrForm(a => ({ ...a, city: e.target.value }))} placeholder="City *" className="input text-sm" required />
                <input value={addrForm.state} onChange={e => setAddrForm(a => ({ ...a, state: e.target.value }))} placeholder="State *" className="input text-sm" required />
                <input value={addrForm.pincode} onChange={e => setAddrForm(a => ({ ...a, pincode: e.target.value }))} placeholder="Pincode *" className="input text-sm col-span-2" required />
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer text-surface-700 dark:text-surface-300">
                <input type="checkbox" checked={addrForm.isDefault} onChange={e => setAddrForm(a => ({ ...a, isDefault: e.target.checked }))} className="accent-primary-600" />
                Set as default address
              </label>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary text-sm px-5">Save Address</button>
                <button type="button" onClick={() => setShowAddrForm(false)} className="btn-outline text-sm px-5">Cancel</button>
              </div>
            </form>
          )}

          {user?.addresses?.length === 0 && (
            <p className="text-surface-500 dark:text-surface-400 text-sm">No saved addresses yet.</p>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            {user?.addresses?.map(a => (
              <div key={a._id} className={`card p-4 relative ${a.isDefault ? 'border-primary-300 dark:border-primary-700 ring-1 ring-primary-200 dark:ring-primary-800' : ''}`}>
                {a.isDefault && (
                  <span className="badge badge-primary text-xs absolute top-3 right-3">Default</span>
                )}
                <p className="font-semibold text-sm text-surface-800 dark:text-surface-200">{a.fullName}</p>
                <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">{a.street}</p>
                <p className="text-sm text-surface-500 dark:text-surface-400">{a.city}, {a.state} - {a.pincode}</p>
                <p className="text-sm text-surface-500 dark:text-surface-400">{a.phone}</p>
                <button onClick={() => deleteAddress(a._id)} className="mt-3 text-red-400 hover:text-red-500 dark:text-red-400 dark:hover:text-red-300 text-xs flex items-center gap-1 transition-colors">
                  <FiTrash2 size={12} /> Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}