import { Link } from 'react-router-dom';

const NotFoundPage = () => (
  <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center text-center">
    <p className="text-sm font-semibold uppercase tracking-[0.35em] text-sky-500">404</p>
    <h1 className="mt-4 text-4xl font-bold text-slate-950 dark:text-white">Page not found</h1>
    <p className="mt-4 text-slate-600 dark:text-slate-300">The page you are looking for does not exist or has been moved.</p>
    <Link to="/" className="comparex-button-primary mt-8">
      Back to home
    </Link>
  </div>
);

export default NotFoundPage;
