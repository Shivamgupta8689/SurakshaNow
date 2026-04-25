import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listenToAllIncidents, detachListener } from '../../services/firebase';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import toast from 'react-hot-toast';

const Analytics = () => {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState([]);
  const [dateRange, setDateRange] = useState('7d');
  const [report, setReport] = useState('');
  const [generating, setGenerating] = useState(false);
  const [now] = useState(() => Date.now());

  useEffect(() => {
    const ref = listenToAllIncidents(setIncidents);
    return () => detachListener(ref);
  }, []);

  const filteredIncidents = incidents.filter((i) => {
    if (!i.reportedAt) return true;
    const ranges = { '24h': 86400000, '7d': 604800000, '30d': 2592000000 };
    return now - i.reportedAt < (ranges[dateRange] || ranges['30d']);
  });

  const floorData = [1, 2, 3, 4, 5].map((f) => ({
    floor: `F${f}`,
    incidents: filteredIncidents.filter((i) => i.floor === String(f)).length,
  }));

  const typeData = ['Fire', 'Medical', 'Security', 'Flood', 'Electrical', 'Other'].map((t) => ({
    name: t,
    value: filteredIncidents.filter((i) => (i.type || i.incidentType) === t).length,
  })).filter((d) => d.value > 0);

  const COLORS = ['#D32F2F', '#E65100', '#8A9BB0', '#FFFFFF', '#2E7D32', '#1565C0'];

  const responseData = [
    { time: 'Mon', avg: 3.2 }, { time: 'Tue', avg: 4.1 }, { time: 'Wed', avg: 2.8 },
    { time: 'Thu', avg: 3.5 }, { time: 'Fri', avg: 5.0 }, { time: 'Sat', avg: 2.1 }, { time: 'Sun', avg: 3.8 },
  ];

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${baseUrl}/api/gemini/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ incidents: filteredIncidents })
      });
      if (!response.ok) throw new Error("Failed to generate report");
      const data = await response.json();
      setReport(data.report);
      toast.success('Report generated');
    } catch { toast.error('Failed to generate report'); }
    setGenerating(false);
  };

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col">
      <nav className="px-4 sm:px-6 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/manager/dashboard')} className="text-text-secondary hover:text-white text-sm">&lt; Back</button>
          <span className="text-white font-bold text-sm tracking-wider uppercase">Analytics & Reporting</span>
        </div>
      </nav>

      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto w-full">
        {/* Date Range */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[{ id: '24h', label: 'Last 24 Hours' }, { id: '7d', label: '7 Days' }, { id: '30d', label: '30 Days' }].map((r) => (
            <button key={r.id} onClick={() => setDateRange(r.id)}
              className={`px-4 py-2 text-xs font-semibold uppercase tracking-wide whitespace-nowrap ${dateRange === r.id ? 'bg-accent-red text-white' : 'bg-navy-750 text-text-secondary border border-border'}`}
            >{r.label}</button>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* Bar Chart */}
          <div className="card-dark p-4">
            <h3 className="text-text-muted text-[10px] uppercase tracking-wider font-medium mb-4">Incidents by Floor</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={floorData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2A3A" />
                <XAxis dataKey="floor" stroke="#8A9BB0" fontSize={10} />
                <YAxis stroke="#8A9BB0" fontSize={10} />
                <Tooltip contentStyle={{ background: '#0D1526', border: '1px solid #1E2A3A', color: '#fff', fontSize: 12 }} />
                <Bar dataKey="incidents" fill="#D32F2F" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Line Chart */}
          <div className="card-dark p-4">
            <h3 className="text-text-muted text-[10px] uppercase tracking-wider font-medium mb-4">Avg Response Time</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={responseData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2A3A" />
                <XAxis dataKey="time" stroke="#8A9BB0" fontSize={10} />
                <YAxis stroke="#8A9BB0" fontSize={10} />
                <Tooltip contentStyle={{ background: '#0D1526', border: '1px solid #1E2A3A', color: '#fff', fontSize: 12 }} />
                <Line type="monotone" dataKey="avg" stroke="#FFFFFF" dot={{ fill: '#D32F2F', r: 4 }} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart */}
          <div className="card-dark p-4">
            <h3 className="text-text-muted text-[10px] uppercase tracking-wider font-medium mb-4">Incident Distribution</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={typeData.length > 0 ? typeData : [{ name: 'None', value: 1 }]} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name }) => name}>
                  {(typeData.length > 0 ? typeData : [{ name: 'None', value: 1 }]).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#0D1526', border: '1px solid #1E2A3A', color: '#fff', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Generate Report */}
        <div className="card-dark p-6">
          <h3 className="text-white font-semibold text-sm uppercase tracking-wide mb-2">Generate Incident Report</h3>
          <p className="text-text-secondary text-xs mb-4">AI-powered analysis of all incidents in the selected period with actionable recommendations.</p>
          <button onClick={handleGenerate} disabled={generating} className={`btn-primary text-xs ${generating ? 'opacity-50' : ''}`}>
            {generating ? 'Generating...' : 'Generate Report'}
          </button>
          {report && (
            <div className="mt-4 bg-navy-900 border border-border p-4 text-text-secondary text-xs leading-relaxed whitespace-pre-wrap">
              {report}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
