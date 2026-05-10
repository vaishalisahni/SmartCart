// StarRating.jsx
import { FiStar } from 'react-icons/fi';

export function StarRating({ rating, size = 16, onChange }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} onClick={() => onChange?.(n)} className={onChange ? 'cursor-pointer' : 'cursor-default'} type="button">
          <FiStar size={size} className={n <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
        </button>
      ))}
    </div>
  );
}

// Spinner.jsx
export function Spinner({ size = 'md' }) {
  const s = size === 'sm' ? 'w-5 h-5' : size === 'lg' ? 'w-12 h-12' : 'w-8 h-8';
  return <div className={`${s} border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin`} />;
}

export function PageLoader() {
  return <div className="flex items-center justify-center min-h-[50vh]"><Spinner size="lg" /></div>;
}

// Pagination.jsx
export function Pagination({ page, pages, onPageChange }) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button onClick={() => onPageChange(page - 1)} disabled={page === 1} className="btn-outline px-3 py-1.5 text-sm disabled:opacity-40">Prev</button>
      {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
        <button key={p} onClick={() => onPageChange(p)} className={`w-9 h-9 rounded-lg text-sm font-medium transition ${p === page ? 'bg-primary-600 text-white' : 'btn-outline'}`}>{p}</button>
      ))}
      <button onClick={() => onPageChange(page + 1)} disabled={page === pages} className="btn-outline px-3 py-1.5 text-sm disabled:opacity-40">Next</button>
    </div>
  );
}

// ProductSkeleton.jsx
export function ProductSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton aspect-square w-full" />
      <div className="p-3 space-y-2">
        <div className="skeleton h-3 w-1/3 rounded" />
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-4 w-2/3 rounded" />
        <div className="skeleton h-6 w-1/2 rounded mt-2" />
        <div className="skeleton h-8 w-full rounded mt-2" />
      </div>
    </div>
  );
}

// EmptyState.jsx
export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">{title}</h3>
      <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm">{description}</p>
      {action}
    </div>
  );
}