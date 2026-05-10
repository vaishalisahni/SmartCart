import { FiStar, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

// ── StarRating ────────────────────────────────────────────────
export function StarRating({ rating, size = 16, onChange }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          onClick={() => onChange?.(n)}
          type="button"
          className={onChange ? 'cursor-pointer' : 'cursor-default'}
        >
          <FiStar
            size={size}
            className={n <= rating ? 'text-amber-400 fill-amber-400' : 'text-surface-300 dark:text-surface-600'}
          />
        </button>
      ))}
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────
export function Spinner({ size = 'md' }) {
  const s = size === 'sm' ? 'w-5 h-5 border-2' : size === 'lg' ? 'w-12 h-12 border-4' : 'w-8 h-8 border-3';
  return (
    <div className={`${s} border-primary-200 border-t-primary-600 rounded-full animate-spin`} />
  );
}

export function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
      <Spinner size="lg" />
      <p className="text-sm text-surface-400 animate-pulse-soft">Loading...</p>
    </div>
  );
}

// ── Pagination ────────────────────────────────────────────────
export function Pagination({ page, pages, onPageChange }) {
  if (pages <= 1) return null;

  const getPageNumbers = () => {
    const nums = [];
    const delta = 2;
    for (let i = Math.max(1, page - delta); i <= Math.min(pages, page + delta); i++) {
      nums.push(i);
    }
    return nums;
  };

  return (
    <div className="flex items-center justify-center gap-1.5 mt-10">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="btn-outline px-3 py-2 text-sm disabled:opacity-40 gap-1"
      >
        <FiChevronLeft size={14} /> Prev
      </button>

      {page > 3 && (
        <>
          <PageBtn n={1} current={page} onClick={onPageChange} />
          {page > 4 && <span className="text-surface-400 px-1">…</span>}
        </>
      )}

      {getPageNumbers().map(n => (
        <PageBtn key={n} n={n} current={page} onClick={onPageChange} />
      ))}

      {page < pages - 2 && (
        <>
          {page < pages - 3 && <span className="text-surface-400 px-1">…</span>}
          <PageBtn n={pages} current={page} onClick={onPageChange} />
        </>
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === pages}
        className="btn-outline px-3 py-2 text-sm disabled:opacity-40 gap-1"
      >
        Next <FiChevronRight size={14} />
      </button>
    </div>
  );
}

function PageBtn({ n, current, onClick }) {
  return (
    <button
      onClick={() => onClick(n)}
      className={`w-9 h-9 rounded-xl text-sm font-semibold transition-all ${
        n === current
          ? 'bg-primary-600 text-white shadow-sm'
          : 'btn-ghost text-surface-600'
      }`}
    >
      {n}
    </button>
  );
}

// ── ProductSkeleton ───────────────────────────────────────────
export function ProductSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton aspect-square w-full rounded-none" />
      <div className="p-3.5 space-y-2.5">
        <div className="skeleton h-2.5 w-1/4 rounded-full" />
        <div className="skeleton h-4 w-full rounded-lg" />
        <div className="skeleton h-4 w-3/4 rounded-lg" />
        <div className="skeleton h-3 w-1/3 rounded-full mt-1" />
        <div className="skeleton h-6 w-1/2 rounded-lg mt-2" />
        <div className="skeleton h-9 w-full rounded-xl mt-2" />
      </div>
    </div>
  );
}

// ── EmptyState ────────────────────────────────────────────────
export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center px-4">
      <div className="text-6xl mb-5 select-none">{icon}</div>
      <h3 className="text-xl font-bold text-surface-700 dark:text-surface-300 mb-2">{title}</h3>
      <p className="text-surface-500 dark:text-surface-400 mb-8 max-w-sm text-sm leading-relaxed">
        {description}
      </p>
      {action}
    </div>
  );
}