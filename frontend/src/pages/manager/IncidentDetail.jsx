import { useState, useEffect } from 'react';
import { listenToChat, listenToIncident, updateIncident, detachListener } from '../../services/firebase';
import SeverityBadge from '../../components/SeverityBadge';
import ChatMessage from '../../components/ChatMessage';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const IncidentDetail = ({ incident: init, onClose }) => {
  const [incident, setIncident] = useState(init);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!init?.id) return;
    const r1 = listenToIncident(init.id, setIncident);
    const r2 = listenToChat(init.id, setMessages);
    return () => { detachListener(r1); detachListener(r2); };
  }, [init?.id]);

  const handleResolve = async () => {
    try {
      await updateIncident(incident.id, { status: 'resolved', resolvedAt: Date.now() });
      toast.success('Incident resolved');
    } catch { toast.error('Failed to resolve'); }
  };

  if (!incident) return null;

  return (
    <div className="fixed inset-0 lg:relative lg:inset-auto lg:w-[480px] bg-navy-900 border-l border-border z-40 flex flex-col animate-slide-in">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
        <div>
          <span className="text-text-muted text-[10px] font-mono block">{incident.id?.substring(0, 12)}</span>
          <span className="text-text-muted text-[10px]">{incident.reportedAt ? format(new Date(incident.reportedAt), 'yyyy-MM-dd HH:mm:ss') : ''}</span>
        </div>
        <div className="flex items-center gap-3">
          {incident.status !== 'resolved' && <button onClick={handleResolve} className="btn-primary text-[10px] px-3 py-1.5">Resolve</button>}
          <button onClick={onClose} className="text-text-secondary hover:text-white text-lg">X</button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <div>
          <h3 className="text-text-muted text-[10px] uppercase tracking-wider font-medium mb-2">AI Analysis</h3>
          <div className="card-dark space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-white text-sm font-semibold">{incident.type || incident.incidentType}</span>
              <SeverityBadge severity={incident.severity} />
            </div>
            <p className="text-text-secondary text-xs">{incident.description}</p>
            {incident.aiAnalysis && <p className="text-text-muted text-xs">Confidence: <span className="text-accent-red font-mono">{incident.aiAnalysis.confidence}%</span></p>}
          </div>
        </div>
        {incident.imageUrl && (
          <div>
            <h3 className="text-text-muted text-[10px] uppercase tracking-wider font-medium mb-2">Visual Evidence</h3>
            <img src={incident.imageUrl} alt="Evidence" className="w-full h-40 object-cover border border-border" />
          </div>
        )}
        <div>
          <h3 className="text-text-muted text-[10px] uppercase tracking-wider font-medium mb-2">Chat Log ({messages.length})</h3>
          <div className="bg-navy-950 border border-border p-3 max-h-60 overflow-y-auto">
            {messages.length > 0 ? messages.map((m, i) => <ChatMessage key={i} message={m} currentUserId="manager" />) : <p className="text-text-muted text-xs text-center py-4">No messages</p>}
          </div>
        </div>
        <div>
          <h3 className="text-text-muted text-[10px] uppercase tracking-wider font-medium mb-2">Summary</h3>
          <div className="card-dark space-y-2 text-xs">
            <div className="flex justify-between"><span className="text-text-muted">Status</span><span className={incident.status === 'resolved' ? 'text-green-400' : 'text-accent-red'}>{incident.status}</span></div>
            <div className="flex justify-between"><span className="text-text-muted">Staff</span><span className="text-white">{incident.assignedStaff || 'None'}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncidentDetail;
