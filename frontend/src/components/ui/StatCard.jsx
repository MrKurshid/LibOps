const StatCard = ({ label, value, icon: Icon, color = 'blue', subtitle, onClick }) => {
  const colors = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    slate: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
  };

  return (
    <div
      className={`stat-card ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1 font-display">{value}</p>
          {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colors[color]}`}>
            <Icon size={20} />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
