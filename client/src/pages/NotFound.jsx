import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-50 text-brand-700">
        <Compass size={36} />
      </span>
      <h1 className="mt-6 font-display text-5xl font-semibold">404</h1>
      <p className="mt-2 max-w-sm text-sm text-ink-faint">
        This aisle doesn't exist. The shelves you're looking for may have been moved.
      </p>
      <Link to="/" className="btn-primary mt-6 px-7 py-3 text-sm">Back to the storefront</Link>
    </div>
  );
}
