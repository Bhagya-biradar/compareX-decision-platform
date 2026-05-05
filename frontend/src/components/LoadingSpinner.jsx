const LoadingSpinner = ({ className = 'h-6 w-6' }) => (
  <div
    className={`${className} animate-spin rounded-full border-4 border-slate-300 border-t-sky-500 dark:border-slate-700 dark:border-t-sky-400`}
    aria-label="Loading"
  />
);

export default LoadingSpinner;
