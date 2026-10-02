const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    {Icon && (
      <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-4">
        <Icon size={28} className="text-slate-400 dark:text-slate-500" />
      </div>
    )}
    <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-1">{title}</h3>
    {description && <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mb-4">{description}</p>}
    {action}
  </div>
);

export default EmptyState;
