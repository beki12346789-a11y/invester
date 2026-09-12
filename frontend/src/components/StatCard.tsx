interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'purple';
}

export default function StatCard({ title, value, subtitle, trend, icon, color = 'primary' }: StatCardProps) {
  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-600',
  };

  const colorClasses = {
    primary: 'bg-blue-100 text-blue-600',
    success: 'bg-green-100 text-green-600',
    warning: 'bg-yellow-100 text-yellow-600',
    danger: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  return (
    <div className="stat-card">
      <div className="flex items-start sm:items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="stat-label truncate">{title}</p>
          <p className="stat-value mt-1 sm:mt-2">{value}</p>
          {subtitle && (
            <p className={`mt-1 sm:mt-2 text-xs sm:text-sm font-medium ${trend ? trendColors[trend] : 'text-gray-500'}`}>
              {subtitle}
            </p>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0">
            <div className={`p-2 sm:p-3 rounded-lg text-xl sm:text-2xl ${colorClasses[color]}`}>
              {icon}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
