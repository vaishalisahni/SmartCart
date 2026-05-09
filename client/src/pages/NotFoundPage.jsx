import { Link } from 'react-router-dom';
export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <div className="text-8xl font-extrabold text-primary-200 dark:text-primary-900 mb-4">404</div>
      <h1 className="text-3xl font-bold mb-2">Page Not Found</h1>
      <p className="text-gray-500 mb-8 max-w-sm">The page you're looking for doesn't exist or has been moved.</p>
      <Link to="/" className="btn-primary px-8">Go Home</Link>
    </div>
  );
}