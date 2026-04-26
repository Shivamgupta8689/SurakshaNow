import { useState } from 'react';

const locationMap = {
  lobby: 'Lobby',
  restaurant: 'Restaurant',
  pool: 'Swimming Pool',
  parking: 'Parking',
  gym: 'Gym',
  banquet: 'Banquet Hall',
  elevator: 'Elevator',
  garden: 'Garden',
  reception: 'Reception',
};

const emergencyContacts = [
  {
    type: 'Fire Brigade',
    name: 'Mumbai Fire Brigade - Fort Station',
    distance: '1.8 km',
    eta: '6 min',
    phone: '101',
  },
  {
    type: 'Hospital',
    name: 'CityCare Multispeciality Hospital',
    distance: '2.4 km',
    eta: '8 min',
    phone: '108',
  },
];

const getLocationLabel = (incident) => {
  const roomNumber = incident?.roomNumber;
  if (!roomNumber) return 'N/A';
  const isRoom = !Number.isNaN(Number(roomNumber));
  return isRoom
    ? `Room ${roomNumber}`
    : locationMap[String(roomNumber).toLowerCase()] || roomNumber;
};

const EscalationModal = ({ incident, onClose, onSend }) => {
  const contactsText = emergencyContacts
    .map((contact) => `${contact.type}: ${contact.name}, ${contact.phone}, ETA ${contact.eta}`)
    .join('\n');

  const defaultMessage = `EMERGENCY ALERT - ASAP Crisis Management System

Incident Type: ${incident?.type || incident?.incidentType || 'Unknown'}
Severity: ${incident?.severity || 'Unknown'}
Location: ${incident?.hotelName || 'Grand Hotel'}, Floor ${incident?.floor || 'N/A'}, ${getLocationLabel(incident)}
Reported At: ${incident?.reportedAt ? new Date(incident.reportedAt).toLocaleString() : 'Unknown'}
Status: No staff response received. Escalation required.

Contact: Front Desk +91-XXXXXXXXXX
Nearby Emergency Services:
${contactsText}

Please dispatch emergency services immediately.`;

  const [message, setMessage] = useState(defaultMessage);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-navy-900 border border-border w-full max-w-lg animate-fade-in">
        <div className="bg-accent-red px-4 py-3 flex items-center justify-between">
          <h3 className="text-white font-semibold text-sm uppercase tracking-wide">
            Contact Emergency Services
          </h3>
          <button
            onClick={onClose}
            className="text-white text-lg leading-none hover:opacity-70"
          >
            X
          </button>
        </div>

        <div className="p-4">
          <div className="bg-navy-950 border border-border p-3 mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-text-muted text-[10px] uppercase tracking-wider">
                Incident
              </span>
              <span className="text-accent-red text-[10px] font-mono">
                {incident?.id?.substring(0, 8)}
              </span>
            </div>
            <p className="text-white text-xs font-semibold">
              {incident?.type || incident?.incidentType || 'Unknown'} -{' '}
              {getLocationLabel(incident)}, Floor {incident?.floor || 'N/A'}
            </p>
            <p className="text-text-muted text-[10px] mt-0.5">
              Severity: {incident?.severity || 'Unknown'}
            </p>
          </div>

          <label className="text-text-muted text-[10px] uppercase tracking-wider font-medium block mb-2">
            Nearby Emergency Services
          </label>
          <div className="grid sm:grid-cols-2 gap-2 mb-4">
            {emergencyContacts.map((contact) => (
              <div key={contact.type} className="bg-navy-950 border border-border p-3">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-white text-xs font-semibold">{contact.type}</span>
                  <span className="text-accent-red text-[10px] font-mono">{contact.phone}</span>
                </div>
                <p className="text-text-secondary text-xs">{contact.name}</p>
                <p className="text-text-muted text-[10px] mt-1">
                  {contact.distance} away - ETA {contact.eta}
                </p>
              </div>
            ))}
          </div>

          <label className="text-text-muted text-[10px] uppercase tracking-wider font-medium block mb-2">
            Emergency Message - AI Drafted
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="input-field h-48 resize-none text-xs leading-relaxed"
          />

          <p className="text-text-muted text-[10px] mt-2 mb-4">
            Review and edit the message before sending. This will be logged in Firebase.
          </p>

          <div className="flex gap-3">
            <button onClick={onClose} className="btn-outline flex-1 text-xs">
              Cancel
            </button>
            <button onClick={() => onSend(message)} className="btn-primary flex-1 text-xs">
              Send Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EscalationModal;
