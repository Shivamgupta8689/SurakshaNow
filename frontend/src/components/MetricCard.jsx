const MetricCard = ({ label, value, icon, pulse = false, trend }) => {
  return (
    <div className={`metric-card ${pulse ? 'animate-pulse-red border-accent-red' : ''}`}>
      <div className="flex items-center justify-between">
        <span className="text-text-muted text-[10px] uppercase tracking-wider font-medium">{label}</span>
        {icon && <span className="text-text-muted text-sm">{icon}</span>}
      </div>
      <span className="text-white text-2xl font-bold tracking-tight mt-1">{value}</span>
      {trend && (
        <span className={`text-[10px] font-medium ${trend > 0 ? 'text-red-400' : 'text-green-400'}`}>
          {trend > 0 ? '+' : ''}{trend}% vs last period
        </span>
      )}
    </div>
  );
};

export default MetricCard;
