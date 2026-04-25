import { useState, useEffect, useRef } from 'react';
import { listenToChat, writeMessage, detachListener } from '../../services/firebase';
import { startListening, stopListening, isSupported } from '../../services/speech';
import ChatMessage from '../../components/ChatMessage';
import toast from 'react-hot-toast';

const TeamChat = ({ incidents = [] }) => {
  const staffId = 'staff-001';
  const staffName = 'Staff Member';
  const messagesEndRef = useRef(null);

  const activeIncidents = incidents.filter((i) => i.status === 'active' || i.status === 'inprogress');
  const [selectedIncidentId, setSelectedIncidentId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const effectiveSelectedIncidentId = selectedIncidentId || activeIncidents[0]?.id || null;

  useEffect(() => {
    if (!effectiveSelectedIncidentId) return;
    const ref = listenToChat(effectiveSelectedIncidentId, setMessages);
    return () => detachListener(ref);
  }, [effectiveSelectedIncidentId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectedIncident = incidents.find((i) => i.id === effectiveSelectedIncidentId);

  const sendMessage = async (text) => {
    if (!text.trim() || !effectiveSelectedIncidentId) return;
    await writeMessage(effectiveSelectedIncidentId, {
      senderId: staffId,
      senderName: staffName,
      senderRole: 'Staff',
      senderPosition: 'Response Team',
      message: text.trim(),
      isAIMessage: false,
    });

    if (text.includes('@AI') || text.includes('@ai')) {
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
        const response = await fetch(`${baseUrl}/api/gemini/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            incidentContext: {
              type: selectedIncident?.type,
              severity: selectedIncident?.severity,
              roomNumber: selectedIncident?.roomNumber,
              floor: selectedIncident?.floor,
              userRole: 'Staff',
            }
          })
        });
        if (!response.ok) throw new Error("Failed to get crisis response");
        const data = await response.json();
        const aiResponse = data.reply;
        await writeMessage(effectiveSelectedIncidentId, {
          senderId: 'crisisbot',
          senderName: 'CrisisBot',
          senderRole: 'AI',
          senderPosition: 'AI Assistant',
          message: aiResponse,
          isAIMessage: true,
        });
      } catch (err) {
        console.error('CrisisBot error:', err);
      }
    }
    setInputText('');
  };

  const quickReplies = ['On My Way', 'Need Backup', 'Need 5 Minutes', 'Resolved'];

  const toggleVoice = () => {
    if (isRecording) { stopListening(); setIsRecording(false); }
    else {
      if (!isSupported()) { toast.error('Speech not supported'); return; }
      startListening((text) => setInputText(text), () => setIsRecording(false));
      setIsRecording(true);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-200px)]">
        {/* Chat Room List */}
        <div className="lg:w-72 shrink-0 overflow-y-auto">
          <h3 className="text-text-muted text-[10px] uppercase tracking-wider font-medium mb-3">Active Chat Rooms</h3>
          <div className="space-y-1">
            {activeIncidents.length > 0 ? activeIncidents.map((inc) => (
              <button
                key={inc.id}
                onClick={() => setSelectedIncidentId(inc.id)}
                className={`w-full text-left px-3 py-3 border transition-colors ${
                  effectiveSelectedIncidentId === inc.id
                    ? 'bg-navy-750 border-l-2 border-l-accent-red border-t-border border-r-border border-b-border'
                    : 'border-transparent hover:bg-navy-800'
                }`}
              >
                <span className="text-white text-xs font-semibold block truncate">
                  {inc.type || inc.incidentType} — Room {inc.roomNumber}
                </span>
                <span className="text-text-muted text-[10px]">Floor {inc.floor}</span>
              </button>
            )) : (
              <p className="text-text-muted text-xs px-3">No active chats</p>
            )}
          </div>
        </div>

        {/* Chat Panel */}
        <div className="flex-1 flex flex-col bg-navy-900 border border-border min-h-0">
          {effectiveSelectedIncidentId ? (
            <>
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="text-white text-sm font-semibold">
                    {selectedIncident?.type} — Room {selectedIncident?.roomNumber}
                  </h3>
                  <p className="text-text-muted text-[10px]">
                    {new Set(messages.map(m => m.senderId)).size} participants
                  </p>
                </div>
                <span className={`px-2 py-0.5 text-[10px] font-semibold uppercase ${
                  selectedIncident?.status === 'active' ? 'bg-accent-red text-white' : 'bg-orange-900 text-orange-300'
                }`}>
                  {selectedIncident?.status}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
                {messages.map((msg, i) => (
                  <ChatMessage key={i} message={msg} currentUserId={staffId} />
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="px-4 py-2 flex gap-2 border-t border-border overflow-x-auto">
                {quickReplies.map((reply) => (
                  <button
                    key={reply}
                    onClick={() => sendMessage(reply)}
                    className="btn-outline text-[10px] px-3 py-1.5 whitespace-nowrap shrink-0"
                  >
                    {reply}
                  </button>
                ))}
              </div>

              <div className="px-4 py-3 border-t border-border flex items-center gap-2">
                <button
                  onClick={toggleVoice}
                  className={`w-10 h-10 flex items-center justify-center border shrink-0 ${
                    isRecording ? 'bg-accent-red border-accent-red' : 'border-border hover:border-text-secondary'
                  }`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isRecording ? 'white' : '#8A9BB0'} strokeWidth="2">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
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
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-text-muted text-sm">Select a chat room to begin</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamChat;
