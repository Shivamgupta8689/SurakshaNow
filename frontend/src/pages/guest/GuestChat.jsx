import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { listenToIncident, listenToChat, writeMessage, detachListener } from '../../services/firebase';
import { startListening, stopListening, isSupported } from '../../services/speech';
import ChatMessage from '../../components/ChatMessage';
import toast from 'react-hot-toast';
import { auth } from '../../services/firebase.js';

const GuestChat = () => {
  const { roomId, incidentId } = useParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  const parts = roomId ? roomId.split('-') : ['000', '0'];
  const roomNumber = parts[0];
  const floor = parts[1];
 const guestId = auth.currentUser?.uid || `guest-${roomId}`;

  const [messages, setMessages] = useState([]);
  const [incident, setIncident] = useState(null);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showSafeModal, setShowSafeModal] = useState(false);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'status'

  useEffect(() => {
    if (!incidentId) return;
    const incRef = listenToIncident(incidentId, setIncident);
    const chatRef = listenToChat(incidentId, setMessages);
    return () => {
      detachListener(incRef);
      detachListener(chatRef);
    };
  }, [incidentId]);

  useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    await writeMessage(incidentId, {
      senderId: guestId,
      senderName: `Guest Room ${roomNumber}`,
      senderRole: 'Guest',
      senderPosition: `Floor ${floor}`,
      message: text.trim(),
      isAIMessage: false,
    });

    if (text.includes('@AI') || text.includes('@ai')) {
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
        const response = await fetch(`${baseUrl}/api/gemini/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            incidentContext: {
              type: incident?.type,
              severity: incident?.severity,
              roomNumber,
              floor,
              userRole: 'Guest',
            },
          }),
        });
        if (!response.ok) throw new Error('Failed to get crisis response');
        const data = await response.json();
        await writeMessage(incidentId, {
          senderId: 'crisisbot',
          senderName: 'CrisisBot',
          senderRole: 'AI',
          senderPosition: 'AI Assistant',
          message: data.reply,
          isAIMessage: true,
        });
      } catch (err) {
        console.error('CrisisBot error:', err);
      }
    }

    setInputText('');
  };

  const handleSafe = async () => {
    setShowSafeModal(false);
    await writeMessage(incidentId, {
      senderId: guestId,
      senderName: `Guest Room ${roomNumber}`,
      senderRole: 'Guest',
      senderPosition: `Floor ${floor}`,
      message: 'I am safe now. Thank you for your assistance.',
      isAIMessage: false,
    });
    toast.success('Thank you! Stay safe.');
  };

  const toggleVoice = () => {
    if (isRecording) {
      stopListening();
      setIsRecording(false);
    } else {
      if (!isSupported()) { toast.error('Speech not supported'); return; }
      startListening(
        (text) => setInputText(text),
        () => setIsRecording(false)
      );
      setIsRecording(true);
    }
  };

  const isResolved = incident?.status === 'resolved';
  const isInProgress = incident?.status === 'inprogress';
  const participantCount = new Set(messages.map(m => m.senderId)).size;

  // ── Status tab timeline ──────────────────────────────────────────────────
  const formatTime = (ts) => {
    if (!ts) return null;
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const timelineSteps = [
    {
      key: 'sent',
      label: 'Alert Sent',
      sublabel: 'Your emergency report was received',
      time: formatTime(incident?.reportedAt),
      done: true,
    },
    {
      key: 'notified',
      label: 'Staff Notified',
      sublabel: 'Alert broadcast to all available staff',
      time: formatTime(incident?.reportedAt),
      done: true,
    },
    {
      key: 'responding',
      label: 'Staff Responding',
      sublabel: incident?.assignedStaff
        ? `${incident.assignedStaff} is on the way`
        : 'Awaiting staff acceptance',
      time: isInProgress || isResolved ? formatTime(incident?.reportedAt) : null,
      done: isInProgress || isResolved,
      active: !isInProgress && !isResolved,
    },
    {
      key: 'resolved',
      label: 'Incident Resolved',
      sublabel: 'Emergency has been handled',
      time: formatTime(incident?.resolvedAt),
      done: isResolved,
    },
  ];

  return (
    <div className="h-screen bg-navy-950 flex flex-col">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate(-1)}
            className="text-text-secondary text-sm hover:text-white shrink-0"
          >
            &lt;
          </button>
          <div className="min-w-0">
            <h2 className="text-white text-sm font-semibold truncate">
              {incident?.type || 'Emergency'} — Room {roomNumber}
            </h2>
            <p className="text-text-muted text-[10px]">
              {participantCount} participant{participantCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        {!isResolved && (
          <span className="bg-accent-red px-2 py-0.5 text-[10px] text-white font-semibold uppercase shrink-0">
            Active
          </span>
        )}
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <div className="flex border-b border-border">
        {['chat', 'status'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-widest transition-colors ${
              activeTab === tab
                ? 'text-white border-b-2 border-accent-red'
                : 'text-text-secondary hover:text-white'
            }`}
          >
            {tab === 'chat' ? 'Chat' : 'My Status'}
          </button>
        ))}
      </div>

      {/* ── Alert Banner (chat tab only) ────────────────────────────────────── */}
      {activeTab === 'chat' && !isResolved && (
        <div className="bg-accent-red bg-opacity-15 border-b border-accent-red px-4 py-2">
          <p className="text-accent-red text-xs text-center font-medium">
            Your alert has been received. Staff is responding.
          </p>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          CHAT TAB
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'chat' && (
        <>
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
            {messages.map((msg, i) => (
              <ChatMessage key={i} message={msg} currentUserId={guestId} />
            ))}
            <div ref={messagesEndRef} />
          </div>

          {isResolved && (
            <div className="bg-status-success bg-opacity-15 border-t border-green-800 px-4 py-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className="w-2 h-2 bg-green-500" />
                <span className="text-green-400 text-sm font-semibold uppercase">
                  Incident Resolved
                </span>
              </div>
              <p className="text-green-300 text-xs">
                The emergency has been resolved. Thank you for your cooperation.
              </p>
            </div>
          )}

          {!isResolved && (
            <>
              <div className="px-4 sm:px-6 py-2 flex gap-2 border-t border-border overflow-x-auto">
                <button
                  onClick={() => sendMessage('I Need More Help')}
                  className="btn-outline text-[10px] px-3 py-1.5 whitespace-nowrap shrink-0"
                >
                  I Need More Help
                </button>
                <button
                  onClick={() => setShowSafeModal(true)}
                  className="bg-status-success bg-opacity-20 border border-green-800 text-green-400 text-[10px] px-3 py-1.5 font-semibold uppercase tracking-wide whitespace-nowrap shrink-0"
                >
                  I Am Safe Now
                </button>
              </div>
              <div className="px-4 sm:px-6 py-3 border-t border-border flex items-center gap-2">
                <button
                  onClick={toggleVoice}
                  className={`w-10 h-10 flex items-center justify-center border shrink-0 ${
                    isRecording
                      ? 'bg-accent-red border-accent-red'
                      : 'border-border hover:border-text-secondary'
                  }`}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={isRecording ? 'white' : '#8A9BB0'}
                    strokeWidth="2"
                  >
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  </svg>
                </button>
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage(inputText)}
                  placeholder="Type message... use @AI for help"
                  className="input-field flex-1 py-2.5 text-sm"
                />
                <button
                  onClick={() => sendMessage(inputText)}
                  className="btn-primary px-4 py-2.5 text-xs shrink-0"
                >
                  Send
                </button>
              </div>
            </>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          STATUS TAB
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'status' && (
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
          {/* Incident summary card */}
          <div className="border border-border p-4 mb-6">
            <p className="text-text-muted text-[10px] uppercase tracking-wider mb-1">
              Incident Reference
            </p>
            <p className="text-white text-sm font-semibold mb-0.5">
              {incident?.type || 'Emergency'} — Room {roomNumber}, Floor {floor}
            </p>
            <p className="text-text-secondary text-xs">
              Severity:{' '}
              <span
                className={
                  incident?.severity === 'High'
                    ? 'text-accent-red'
                    : incident?.severity === 'Medium'
                    ? 'text-orange-400'
                    : 'text-yellow-400'
                }
              >
                {incident?.severity || 'Unknown'}
              </span>
            </p>
            {incident?.reportedAt && (
              <p className="text-text-muted text-[10px] mt-1">
                Reported at {formatTime(incident.reportedAt)}
              </p>
            )}
          </div>

          {/* Timeline */}
          <p className="text-text-muted text-[10px] uppercase tracking-wider mb-4">
            Response Timeline
          </p>
          <div className="relative pl-6">
            {/* Vertical line */}
            <div className="absolute left-2.5 top-2 bottom-2 w-px bg-border" />

            {timelineSteps.map((step) => (
              <div key={step.key} className="relative mb-6 last:mb-0">
                {/* Dot */}
                <div
                  className={`absolute -left-6 top-1 w-5 h-5 flex items-center justify-center border-2 ${
                    step.done
                      ? 'bg-accent-red border-accent-red'
                      : step.active
                      ? 'border-accent-red animate-pulse bg-transparent'
                      : 'border-border bg-transparent'
                  }`}
                >
                  {step.done && (
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="3"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>

                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p
                      className={`text-sm font-semibold ${
                        step.done
                          ? 'text-white'
                          : step.active
                          ? 'text-accent-red'
                          : 'text-text-muted'
                      }`}
                    >
                      {step.label}
                    </p>
                    <p className="text-text-secondary text-xs mt-0.5">{step.sublabel}</p>
                  </div>
                  {step.time && (
                    <span className="text-text-muted text-[10px] shrink-0 mt-0.5">
                      {step.time}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Assigned staff card */}
          {incident?.assignedStaff && (
            <div className="border border-border p-4 mt-6">
              <p className="text-text-muted text-[10px] uppercase tracking-wider mb-3">
                Responding Staff
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-navy-600 flex items-center justify-center shrink-0">
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
                  <p className="text-white text-sm font-semibold">{incident.assignedStaff}</p>
                  <p className="text-text-muted text-xs">
                    {incident.assignedStaffPosition || 'Staff Member'}
                  </p>
                </div>
                <div
                  className={`ml-auto px-2 py-0.5 text-[10px] font-semibold uppercase ${
                    isResolved
                      ? 'bg-green-900 text-green-400'
                      : 'bg-accent-red bg-opacity-20 text-accent-red'
                  }`}
                >
                  {isResolved ? 'Resolved' : 'En Route'}
                </div>
              </div>
            </div>
          )}

          {/* Switch to chat nudge */}
          {!isResolved && (
            <button
              onClick={() => setActiveTab('chat')}
              className="btn-outline w-full mt-6 py-3 text-xs"
            >
              Go to Chat
            </button>
          )}
        </div>
      )}

      {/* ── Safe Modal ──────────────────────────────────────────────────────── */}
      {showSafeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-navy-900 border border-border w-full max-w-sm p-6 text-center animate-fade-in">
            <h3 className="text-white font-semibold text-lg mb-3">Confirm Safety</h3>
            <p className="text-text-secondary text-sm mb-6">
              Are you sure you are safe? This will notify the response team.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSafeModal(false)}
                className="btn-outline flex-1 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleSafe}
                className="bg-status-success text-white px-6 py-3 font-semibold uppercase text-xs flex-1"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuestChat;
