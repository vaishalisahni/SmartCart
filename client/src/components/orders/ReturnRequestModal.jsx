import { useState } from 'react';
import { FiX, FiAlertCircle, FiCheckCircle, FiPackage } from 'react-icons/fi';
import API from '../../services/api';
import toast from 'react-hot-toast';

const REASONS = [
  { value: 'damaged_defective',  label: 'Damaged or Defective',      icon: '🔧' },
  { value: 'wrong_item',         label: 'Received Wrong Item',        icon: '📦' },
  { value: 'not_as_described',   label: 'Not as Described',           icon: '🖼️' },
  { value: 'changed_mind',       label: 'Changed My Mind',            icon: '💭' },
  { value: 'missing_parts',      label: 'Missing Parts / Incomplete', icon: '🧩' },
  { value: 'poor_quality',       label: 'Poor Quality',               icon: '⭐' },
  { value: 'other',              label: 'Other',                      icon: '📝' },
];

/**
 * ReturnRequestModal
 * Props:
 *   order        — the populated order object
 *   onClose()    — close the modal
 *   onSuccess()  — called after successful submission
 */
export default function ReturnRequestModal({ order, onClose, onSuccess }) {
  const [step, setStep]                 = useState(1); // 1=select items, 2=reason, 3=success
  const [selectedItems, setSelectedItems] = useState({}); // { productId: qty }
  const [reason, setReason]             = useState('');
  const [reasonDetails, setReasonDetails] = useState('');
  const [submitting, setSubmitting]     = useState(false);

  const orderItems = order?.items || [];

  // ── Step 1: Item selection ────────────────────────────────
  const toggleItem = (productId, maxQty) => {
    setSelectedItems(prev => {
      if (prev[productId]) {
        const updated = { ...prev };
        delete updated[productId];
        return updated;
      }
      return { ...prev, [productId]: maxQty };
    });
  };

  const setItemQty = (productId, qty, maxQty) => {
    const v = Math.max(1, Math.min(maxQty, Number(qty)));
    setSelectedItems(prev => ({ ...prev, [productId]: v }));
  };

  const selectedCount = Object.keys(selectedItems).length;

  // ── Step 2: Submit ────────────────────────────────────────
  const handleSubmit = async () => {
    if (!reason) { toast.error('Please select a reason'); return; }
    setSubmitting(true);
    try {
      const items = Object.entries(selectedItems).map(([productId, quantity]) => ({
        productId,
        quantity,
        reason,
      }));
      await API.post('/returns', {
        orderId: order._id,
        reason,
        reasonDetails,
        items,
      });
      setStep(3);
      onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit return request');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Refund estimate ───────────────────────────────────────
  const refundEstimate = orderItems
    .filter(i => selectedItems[i.product?._id || i.product])
    .reduce((sum, i) => {
      const pid = i.product?._id || i.product;
      return sum + i.price * (selectedItems[pid] || 0);
    }, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Scrim */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="relative w-full sm:max-w-lg bg-white dark:bg-surface-800 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100 dark:border-surface-700 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/40 rounded-xl flex items-center justify-center">
              <FiPackage size={15} className="text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h2 className="font-bold text-surface-900 dark:text-surface-100 text-sm">
                {step === 3 ? 'Request Submitted!' : 'Return Request'}
              </h2>
              {step < 3 && (
                <p className="text-xs text-surface-400 dark:text-surface-500">
                  Order #{order._id?.slice(-8).toUpperCase()} · Step {step} of 2
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-xl text-surface-400 transition"
          >
            <FiX size={17} />
          </button>
        </div>

        {/* Steps indicator */}
        {step < 3 && (
          <div className="px-5 pt-3 flex gap-2">
            {[1, 2].map(s => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-all ${
                  s <= step
                    ? 'bg-primary-500'
                    : 'bg-surface-200 dark:bg-surface-700'
                }`}
              />
            ))}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* ── Step 1: Select items ── */}
          {step === 1 && (
            <>
              <p className="text-sm text-surface-600 dark:text-surface-400">
                Select the items you want to return:
              </p>
              <div className="space-y-2.5">
                {orderItems.map(item => {
                  const pid = item.product?._id || item.product;
                  const selected = !!selectedItems[pid];
                  return (
                    <button
                      key={pid}
                      onClick={() => toggleItem(pid, item.quantity)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                        selected
                          ? 'border-primary-400 bg-primary-50 dark:bg-primary-950/30'
                          : 'border-surface-200 dark:border-surface-600 hover:border-primary-300 dark:hover:border-primary-700 bg-white dark:bg-surface-800'
                      }`}
                    >
                      {/* Checkbox */}
                      <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                        selected ? 'bg-primary-600 border-primary-600' : 'border-surface-300 dark:border-surface-500'
                      }`}>
                        {selected && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>

                      {/* Image */}
                      <img
                        src={item.image || 'https://via.placeholder.com/48'}
                        alt={item.name}
                        className="w-11 h-11 object-cover rounded-lg flex-shrink-0 bg-surface-100 dark:bg-surface-700"
                      />

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-surface-800 dark:text-surface-200 line-clamp-1">
                          {item.name}
                        </p>
                        <p className="text-xs text-surface-400 dark:text-surface-500 mt-0.5">
                          ₹{item.price?.toLocaleString('en-IN')} × {item.quantity}
                        </p>
                      </div>

                      {/* Qty spinner (only when selected) */}
                      {selected && item.quantity > 1 && (
                        <div
                          className="flex items-center gap-1 border border-surface-200 dark:border-surface-600 rounded-lg overflow-hidden bg-white dark:bg-surface-800"
                          onClick={e => e.stopPropagation()}
                        >
                          <button
                            className="px-2 py-1 hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-600 dark:text-surface-300 text-sm font-bold"
                            onClick={() => setItemQty(pid, (selectedItems[pid] || 1) - 1, item.quantity)}
                          >−</button>
                          <span className="px-1.5 text-sm font-semibold text-surface-800 dark:text-surface-200 min-w-[24px] text-center">
                            {selectedItems[pid]}
                          </span>
                          <button
                            className="px-2 py-1 hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-600 dark:text-surface-300 text-sm font-bold"
                            onClick={() => setItemQty(pid, (selectedItems[pid] || 1) + 1, item.quantity)}
                          >+</button>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Policy note */}
              <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
                <FiAlertCircle size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Returns must be raised within 7 days of delivery. Items must be unused, in original packaging.
                </p>
              </div>
            </>
          )}

          {/* ── Step 2: Reason ── */}
          {step === 2 && (
            <>
              <p className="text-sm text-surface-600 dark:text-surface-400">
                Why are you returning these items?
              </p>

              <div className="grid grid-cols-2 gap-2">
                {REASONS.map(r => (
                  <button
                    key={r.value}
                    onClick={() => setReason(r.value)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border-2 text-left transition-all ${
                      reason === r.value
                        ? 'border-primary-400 bg-primary-50 dark:bg-primary-950/30'
                        : 'border-surface-200 dark:border-surface-600 hover:border-primary-300 dark:hover:border-primary-700 bg-white dark:bg-surface-800'
                    }`}
                  >
                    <span className="text-lg flex-shrink-0">{r.icon}</span>
                    <span className="text-xs font-medium text-surface-700 dark:text-surface-300 leading-snug">
                      {r.label}
                    </span>
                  </button>
                ))}
              </div>

              <div>
                <label className="label text-xs">Additional details (optional)</label>
                <textarea
                  value={reasonDetails}
                  onChange={e => setReasonDetails(e.target.value)}
                  placeholder="Describe the issue in more detail..."
                  className="input text-sm resize-none"
                  rows={3}
                />
              </div>

              {/* Refund estimate */}
              <div className="bg-primary-50 dark:bg-primary-950/40 border border-primary-200 dark:border-primary-800 rounded-xl p-3.5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-primary-700 dark:text-primary-300">Estimated Refund</p>
                  <p className="text-xs text-primary-500 dark:text-primary-400 mt-0.5">
                    To original payment method in 5-7 business days
                  </p>
                </div>
                <p className="text-lg font-extrabold text-primary-700 dark:text-primary-300">
                  ₹{refundEstimate.toLocaleString('en-IN')}
                </p>
              </div>
            </>
          )}

          {/* ── Step 3: Success ── */}
          {step === 3 && (
            <div className="py-6 flex flex-col items-center text-center gap-3">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center">
                <FiCheckCircle size={32} className="text-emerald-500" />
              </div>
              <h3 className="text-lg font-bold text-surface-900 dark:text-surface-100">
                Return Request Submitted!
              </h3>
              <p className="text-sm text-surface-500 dark:text-surface-400 max-w-xs">
                We'll review your request within 24–48 hours. Once approved, a pickup will be scheduled.
              </p>
              <div className="bg-surface-50 dark:bg-surface-700/50 rounded-xl p-4 w-full text-left space-y-1.5 mt-2">
                <Row label="Estimated Refund"  value={`₹${refundEstimate.toLocaleString('en-IN')}`} />
                <Row label="Refund Method"     value="Original Payment Method" />
                <Row label="Processing Time"   value="5–7 Business Days" />
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        {step < 3 && (
          <div className="px-5 py-4 border-t border-surface-100 dark:border-surface-700 flex gap-3 flex-shrink-0">
            {step === 2 && (
              <button
                onClick={() => setStep(1)}
                className="btn-outline text-sm px-4 py-2.5"
              >
                ← Back
              </button>
            )}
            {step === 1 && (
              <button
                onClick={onClose}
                className="btn-outline text-sm px-4 py-2.5"
              >
                Cancel
              </button>
            )}
            <button
              onClick={step === 1 ? () => setStep(2) : handleSubmit}
              disabled={(step === 1 && selectedCount === 0) || (step === 2 && !reason) || submitting}
              className="btn-primary text-sm py-2.5 flex-1"
            >
              {submitting
                ? 'Submitting...'
                : step === 1
                ? `Continue with ${selectedCount} item${selectedCount !== 1 ? 's' : ''} →`
                : 'Submit Return Request'}
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="px-5 py-4 border-t border-surface-100 dark:border-surface-700 flex-shrink-0">
            <button onClick={onClose} className="btn-primary w-full text-sm py-2.5">
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-surface-500 dark:text-surface-400">{label}</span>
      <span className="font-semibold text-surface-800 dark:text-surface-200">{value}</span>
    </div>
  );
}