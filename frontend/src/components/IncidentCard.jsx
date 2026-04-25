import { formatDistanceToNow } from 'date-fns';
import SeverityBadge from './SeverityBadge';

const IncidentCard = ({ incident, onAccept, onViewMap, isStaff = false }) => {
  const severityColors = {
    Critical: 'border-l-4 border-l-accent-red',
    High: 'border-l-4 border-l-orange-600',
    Medium: 'border-l-4 border-l-yellow-600',
    Low: 'border-l-4 border-l-text-secondary',
  };

  const borderClass = severityColors[incident.severity] || severityColors.Low;
  const timeAgo = incident.reportedAt ? formatDistanceToNow(new Date(incident.reportedAt), { addSuffix: true }) : 'Unknown';

  return (
    <div className={`card ${borderClass} animate-fade-in`}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-white font-semibold text-sm uppercase tracking-wide">
              {incident.type || incident.incidentType || 'Unknown'}
            </h3>
            <SeverityBadge severity={incident.severity} />
          </div>
          <p className="text-text-secondary text-xs mt-1">
            Room {incident.roomNumber}, Floor {incident.floor}
          </p>
          <p className="text-text-muted text-xs mt-1">{timeAgo}</p>
          {incident.description && (
            <p className="text-text-secondary text-xs mt-2 line-clamp-2">{incident.description}</p>
          )}
        </div>
        {isStaff && (
          <div className="flex gap-2 sm:flex-col">
            {onViewMap && (
              <button
                onClick={() => onViewMap(incident)}
                className="btn-outline text-xs px-3 py-2 whitespace-nowrap"
              >
                View Map
              </button>
            )}
            {onAccept && incident.status === 'active' && (
              <button
                onClick={() => onAccept(incident)}
                className="btn-primary text-xs px-3 py-2 whitespace-nowrap"
              >
                Accept
              </button>
            )}
          </div>
        )}
      </div>
      {incident.assignedStaff && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-text-muted text-xs">
            Assigned: <span className="text-text-secondary">{incident.assignedStaff}</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default IncidentCard;
