const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };
  return (
    <div className={`${sizes[size]} animate-spin rounded-full border-2 border-slate-200 dark:border-slate-700 border-t-primary-600 ${className}`} />
  );
};

export const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[300px]">
    <div className="flex flex-col items-center gap-3">
      <Spinner size="lg" />
      <p className="text-sm text-slate-500 dark:text-slate-400">Loading...</p>
    </div>
  </div>
);

export default Spinner;
