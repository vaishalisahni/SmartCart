import { useState, useEffect } from 'react';
import { FiRefreshCw, FiCheck, FiX, FiChevronDown } from 'react-icons/fi';
import API from '../../services/api';
import { PageLoader, Pagination } from '../../components/ui/index';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  requested: 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300',
  approved:  'bg-teal-100 text-teal-700 dark:bg-teal-900/60 dark:text-teal-300',
  rejected:  'bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300',
  picked_up: 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300',
  refunded:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300',
};

const REASON_LABELS = {
  damaged_defective:  'Damaged / Defective',
  wrong_item:         'Wrong Item',
  not_as_described:   'Not as Described',
  changed_mind:       'Changed Mind',
  missing_parts:      'Missing Parts',
  poor_quality:       'Poor Quality',
  other:              'Other',
};

const STATUSES = ['requested', 'approved', 'rejected', 'picked_up', 'refunded'];

const TH = ({ children }) => (
  <th className="px-4 py-3 text-left text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
    {children}
  </th>
);

export default function AdminReturns() {
  const [returns, setReturns]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage]                 = useState(1);
  const [total, setTotal]               = useState(0);
  const [expandedId, setExpandedId]     = useState(null);
  const [noteInputs, setNoteInputs]     = useState({});

  const fetchReturns = async () => {
    setLoading(true);
    const p = new URLSearchParams({ page, limit: 20 });
    if (statusFilter) p.set('status', statusFilter);
    const { data } = await API.get(`/returns?${p}`);
    setReturns(data.returns);
    setTotal(data.total);
    setLoading(false);
  };

  useEffect(() => { fetchReturns(); }, [page, statusFilter]);

  const updateStatus = async (id, status) => {
    try {
      await API.put(`/returns/${id}/status`, { status, adminNote: noteInputs[id] || '' });
      toast.success(`Return ${status}`);
      fetchReturns();
    } catch { toast.error('Failed to update'); }
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50 flex items-center gap-2">
            <FiRefreshCw size={20} className="text-primary-500" /> Returns & Refunds
          </h1>
          <p className="text-sm text-surface-500 dark:text-surface-400">{total} total requests</p>
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="input w-auto text-sm"
        >
          <option value="">All Statuses</option>
          {STATUSES.map(s => (
            <option key={s} value={s} className="capitalize">{s.replace('_', ' ')}</option>
          ))}
        </select>
      </div>

      {loading ? <PageLoader /> : (
        <div className="space-y-3">
          {returns.length === 0 && (
            <div className="card p-12 text-center">
              <FiRefreshCw size={28} className="mx-auto text-surface-300 dark:text-surface-600 mb-3" />
              <p className="text-surface-500 dark:text-surface-400">No return requests found</p>
            </div>
          )}

          {returns.map(ret => (
            <div key={ret._id} className="card overflow-hidden">
              {/* Row */}
              <div
                className="flex items-center gap-4 p-4 cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-700/30 transition-colors"
                onClick={() => setExpandedId(expandedId === ret._id ? null : ret._id)}
              >
                <div className="min-w-0 flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-surface-400 dark:text-surface-500 font-medium mb-0.5">Customer</p>
                    <p className="font-semibold text-surface-800 dark:text-surface-200 truncate">{ret.user?.name}</p>
                    <p className="text-xs text-surface-400 dark:text-surface-500 truncate">{ret.user?.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-surface-400 dark:text-surface-500 font-medium mb-0.5">Reason</p>
                    <p className="text-surface-700 dark:text-surface-300">{REASON_LABELS[ret.reason] || ret.reason}</p>
                  </div>
                  <div>
                    <p className="text-xs text-surface-400 dark:text-surface-500 font-medium mb-0.5">Refund</p>
                    <p className="font-bold text-primary-600 dark:text-primary-400">
                      ₹{ret.refundAmount?.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-surface-400 dark:text-surface-500 font-medium mb-0.5">Status</p>
                    <span className={`badge capitalize text-xs ${STATUS_COLORS[ret.status]}`}>
                      {ret.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <FiChevronDown
                  size={15}
                  className={`text-surface-400 transition-transform flex-shrink-0 ${expandedId === ret._id ? 'rotate-180' : ''}`}
                />
              </div>

              {/* Expanded detail */}
              {expandedId === ret._id && (
                <div className="border-t border-surface-100 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50 p-4 space-y-4">
                  {/* Items */}
                  <div>
                    <p className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-2">Return Items</p>
                    <div className="space-y-2">
                      {ret.items?.map((item, i) => (
                        <div key={i} className="flex items-center gap-3 bg-white dark:bg-surface-800 rounded-xl p-2.5 border border-surface-100 dark:border-surface-700">
                          <img src={item.image || 'https://via.placeholder.com/40'} alt={item.name}
                            className="w-10 h-10 object-cover rounded-lg flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-surface-800 dark:text-surface-200 truncate">{item.name}</p>
                            <p className="text-xs text-surface-400 dark:text-surface-500">Qty: {item.quantity}</p>
                          </div>
                          <p className="text-sm font-semibold text-surface-700 dark:text-surface-300">
                            ₹{(item.price * item.quantity)?.toLocaleString('en-IN')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {ret.reasonDetails && (
                    <div>
                      <p className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1">Customer Note</p>
                      <p className="text-sm text-surface-600 dark:text-surface-400 bg-white dark:bg-surface-800 rounded-xl p-2.5 border border-surface-100 dark:border-surface-700">
                        {ret.reasonDetails}
                      </p>
                    </div>
                  )}

                  {/* Admin note + quick actions */}
                  {ret.status === 'requested' && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">Admin Note (optional)</p>
                      <textarea
                        value={noteInputs[ret._id] || ''}
                        onChange={e => setNoteInputs(prev => ({ ...prev, [ret._id]: e.target.value }))}
                        placeholder="Add a note for the customer..."
                        className="input text-sm resize-none"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateStatus(ret._id, 'approved')}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-all"
                        >
                          <FiCheck size={13} /> Approve & Schedule Pickup
                        </button>
                        <button
                          onClick={() => updateStatus(ret._id, 'rejected')}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm border-2 border-red-400 text-red-600 dark:text-red-400 rounded-xl font-semibold hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
                        >
                          <FiX size={13} /> Reject
                        </button>
                      </div>
                    </div>
                  )}

                  {ret.status === 'approved' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateStatus(ret._id, 'picked_up')}
                        className="btn-primary text-sm px-4 py-2"
                      >
                        Mark as Picked Up
                      </button>
                    </div>
                  )}

                  {ret.status === 'picked_up' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateStatus(ret._id, 'refunded')}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-all"
                      >
                        <FiCheck size={13} /> Mark Refunded
                      </button>
                    </div>
                  )}

                  {ret.adminNote && (
                    <div className="text-xs text-surface-500 dark:text-surface-400 italic">
                      Admin note: "{ret.adminNote}"
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {Math.ceil(total / 20) > 1 && (
            <Pagination page={page} pages={Math.ceil(total / 20)} onPageChange={setPage} />
          )}
        </div>
      )}
    </div>
  );
}