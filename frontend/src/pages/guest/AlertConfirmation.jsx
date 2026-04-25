import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { listenToIncident, detachListener } from '../../services/firebase';

// Lightweight QR renderer using qrcode.react — install with:
// npm install qrcode.react
import { QRCodeSVG } from 'qrcode.react';

const AlertConfirmation = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { incidentId } = location.state || {};

  const parts = roomId ? roomId.split('-') : ['000', '0'];
  const roomNumber = parts[0] || '000';
  const floor = parts[1] || '0';

  const [incident, setIncident] = useState(null);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    if (!incidentId) return;
    const ref = listenToIncident(incidentId, (data) => setIncident(data));
    return () => detachListener(ref);
  }, [incidentId]);

  const status = incident?.status || 'active';
  const assignedStaff = incident?.assignedStaff;

  // QR encodes a deep link directly to this incident's chat
  const qrUrl = `${window.location.origin}/guest/${roomId}/chat/${incidentId}`;

  const steps = [
    {
      label: 'Alert Received',
      completed: true,
      active: status === 'active',
    },
    {
      label: 'Staff Responding',
      completed: status === 'inprogress' || status === 'resolved',
      active: status === 'inprogress',
    },
    {
      label: 'Help Arrived',
      completed: status === 'resolved',
      active: false,
    },
  ];

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center px-4 sm:px-6">
      <div className="w-full max-w-md text-center">

        {/* ── Success Icon ──────────────────────────────────────────────────── */}
        <div className="w-16 h-16 border-2 border-green-500 flex items-center justify-center mx-auto mb-6">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#2E7D32"
            strokeWidth="2.5"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h1 className="text-white text-2xl font-bold uppercase tracking-wide mb-2">
          Alert Sent Successfully
        </h1>
        <p className="text-text-secondary text-sm mb-8">
          Room {roomNumber}, Floor {floor}
        </p>

        {/* ── Progress Tracker ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, i) => (
            <div key={i} className="flex-1 flex flex-col items-center relative">
              <div
                className={`w-8 h-8 flex items-center justify-center border-2 mb-2 ${
                  step.completed
                    ? 'bg-accent-red border-accent-red'
                    : step.active
                    ? 'border-accent-red animate-pulse'
                    : 'border-text-muted'
                }`}
              >
                {step.completed && (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="3"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <span
                className={`text-[10px] uppercase tracking-wider ${
                  step.completed
                    ? 'text-white'
                    : step.active
                    ? 'text-accent-red'
                    : 'text-text-muted'
                }`}
              >
                {step.label}
              </span>
              {i < steps.length - 1 && (
                <div
                  className={`absolute top-4 left-[calc(50%+16px)] w-[calc(100%-32px)] h-0.5 ${
                    steps[i + 1].completed || steps[i + 1].active
                      ? 'bg-accent-red'
                      : 'bg-navy-700'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* ── Staff Card ────────────────────────────────────────────────────── */}
        {assignedStaff && (
          <div className="card-dark mb-6 text-left animate-fade-in">
            <span className="text-text-muted text-[10px] uppercase tracking-wider block mb-2">
              Responding Staff
            </span>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-navy-600 flex items-center justify-center">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#8A9BB0"
                  strokeWidth="1.5"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div>
                <p className="text-white text-sm font-semibold">{assignedStaff}</p>
                <p className="text-text-muted text-xs">
                  {incident?.assignedStaffPosition || 'Staff Member'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Chat Button ───────────────────────────────────────────────────── */}
        <button
          onClick={() => navigate(`/guest/${roomId}/chat/${incidentId}`)}
          className="btn-primary w-full py-4 text-base mb-3"
          disabled={!incidentId}
        >
          Open Emergency Chat
        </button>

        {/* ── Guest QR Code toggle ──────────────────────────────────────────── */}
        {incidentId && (
          <>
            <button
              onClick={() => setShowQR((v) => !v)}
              className="btn-outline w-full py-3 text-xs mb-1"
            >
              {showQR ? 'Hide My Incident QR' : 'Show My Incident QR'}
            </button>

            {showQR && (
              <div className="border border-border p-5 mt-3 animate-fade-in">
                <p className="text-text-muted text-[10px] uppercase tracking-wider mb-4">
                  Show this QR to staff to instantly access your incident
                </p>

                {/* White background needed so QR is scannable in dark UI */}
                <div className="flex justify-center mb-4">
                  <div className="bg-white p-3">
                    <QRCodeSVG
                      value={qrUrl}
                      size={160}
                      bgColor="#ffffff"
                      fgColor="#0A0F1E"
                      level="M"
                    />
                  </div>
                </div>

                {/* Incident details below QR */}
                <div className="text-left space-y-1">
                  <div className="flex justify-between">
                    <span className="text-text-muted text-[10px] uppercase tracking-wider">
                      Room
                    </span>
                    <span className="text-white text-xs font-semibold">{roomNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted text-[10px] uppercase tracking-wider">
                      Floor
                    </span>
                    <span className="text-white text-xs font-semibold">{floor}</span>
                  </div>
                  {incident?.type && (
                    <div className="flex justify-between">
                      <span className="text-text-muted text-[10px] uppercase tracking-wider">
                        Type
                      </span>
                      <span className="text-accent-red text-xs font-semibold">
                        {incident.type}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-text-muted text-[10px] uppercase tracking-wider">
                      Status
                    </span>
                    <span
                      className={`text-xs font-semibold uppercase ${
                        status === 'resolved'
                          ? 'text-green-400'
                          : status === 'inprogress'
                          ? 'text-yellow-400'
                          : 'text-accent-red'
                      }`}
                    >
                      {status}
                    </span>
                  </div>
                </div>

                <p className="text-text-muted text-[10px] mt-4 text-center">
                  Screenshot this QR code to keep it handy
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AlertConfirmation;
