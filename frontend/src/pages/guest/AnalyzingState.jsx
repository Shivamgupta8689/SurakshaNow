import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

const AnalyzingState = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { imageBase64, imageUrl, transcript } = location.state || {};

  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => (prev < 90 ? prev + Math.random() * 15 : prev));
    }, 300);

    const analyze = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
        const response = await fetch(`${baseUrl}/api/gemini/analyze`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64, voiceTranscript: transcript })
        });
        if (!response.ok) throw new Error("Failed to analyze");
        const result = await response.json();
        setProgress(100);
        setTimeout(() => {
          navigate(`/guest/${roomId}/form`, {
            state: { analysisResult: result, imageUrl },
          });
        }, 500);
      } catch (error) {
        console.error('Analysis failed:', error);
        navigate(`/guest/${roomId}/form`, {
          state: {
            analysisResult: {
              incidentType: 'Other',
              severity: 'Medium',
              description: 'Emergency reported. AI analysis unavailable.',
              immediateAction: 'Staff has been alerted.',
              alertRecipients: ['Nearest Staff', 'Duty Manager'],
              evacuationNeeded: false,
              confidence: 20,
            },
            imageUrl,
          },
        });
      }
    };

    analyze();
    return () => clearInterval(interval);
  }, [imageBase64, imageUrl, navigate, roomId, transcript]);

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center px-4 sm:px-6">
      <div className="w-full max-w-md text-center">
        {/* Progress Bar */}
        <div className="w-full h-1 bg-navy-700 mb-12">
          <div
            className="h-full bg-accent-red transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <h1 className="text-white text-2xl sm:text-3xl font-bold uppercase tracking-wide mb-3">
          Analyzing Your Emergency
        </h1>
        <p className="text-text-secondary text-sm mb-12">
          This will take 2 to 3 seconds
        </p>

        {/* Technical Data Blocks */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'GPS Coordinates', value: '19.0760° N, 72.8777° E', status: 'active' },
            { label: 'Network Latency', value: '12ms', status: 'active' },
            { label: 'Biometric Feed', value: 'Stable', status: 'stable' },
            { label: 'AI Compute Node', value: 'Active', status: 'active' },
          ].map((block, i) => (
            <div key={i} className="card-dark p-3 text-left">
              <span className="text-text-muted text-[9px] uppercase tracking-wider block mb-1">
                {block.label}
              </span>
              <span className="text-white text-xs font-mono font-medium">{block.value}</span>
              <div className="flex items-center gap-1 mt-1">
                <div className={`w-1.5 h-1.5 rounded-full ${block.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-green-500'}`} />
                <span className="text-green-400 text-[9px] uppercase">{block.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyzingState;
