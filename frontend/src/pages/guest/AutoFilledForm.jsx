import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { writeIncident } from '../../services/firebase';
import SeverityBadge from '../../components/SeverityBadge';
import toast from 'react-hot-toast';
import { auth } from '../../services/firebase';

const AutoFilledForm = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { analysisResult, imageUrl, locationName, floorLabel } = location.state || {};

  const parts = roomId ? roomId.split('-') : ['000', '0'];
  const rawFloor = parts[1] || 'ground';
  const roomNumber = parts[0] || '000';
  const floor = rawFloor.toLowerCase().replace('floor', '') || 'Ground';

  const incidentTypes = ['Fire', 'Medical', 'Security', 'Flood', 'Electrical', 'Other'];
  const allRecipients = ['Nearest Staff', 'Duty Manager', 'Fire Brigade', 'Ambulance', 'Police'];

  const [formData, setFormData] = useState({
    incidentType: analysisResult?.incidentType || 'Other',
    severity: analysisResult?.severity || 'Medium',
    description: analysisResult?.description || '',
    immediateAction: analysisResult?.immediateAction || '',
    alertRecipients: analysisResult?.alertRecipients || ['Nearest Staff'],
    evacuationNeeded: analysisResult?.evacuationNeeded || false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refId] = useState(() => `SN-${Date.now().toString(36).toUpperCase()}`);
  const confidence = analysisResult?.confidence || 0;

  const toggleRecipient = (recipient) => {
    setFormData((prev) => ({
      ...prev,
      alertRecipients: prev.alertRecipients.includes(recipient)
        ? prev.alertRecipients.filter((r) => r !== recipient)
        : [...prev.alertRecipients, recipient],
    }));
  };

  const handleSubmit = async () => {
  const user = auth.currentUser;
  if (!user) {
    toast.error('Session expired. Please refresh.');
    return;
  }

  setIsSubmitting(true);
  try {
    const incidentId = await writeIncident({
      type: formData.incidentType,
      severity: formData.severity,
      description: formData.description,
      immediateAction: formData.immediateAction,
      roomNumber,
      floor,
      locationName: locationName || `Room ${roomNumber}`,
      floorLabel: floorLabel || `Floor ${floor}`,
      hotelName: 'Grand Hotel',
      imageUrl: imageUrl || null,
      alertRecipients: formData.alertRecipients,
      reportedBy: user.uid,
      isAnonymous: user.isAnonymous,
      aiAnalysis: analysisResult || null,
      evacuationNeeded: formData.evacuationNeeded,
    });

    toast.success('Alert sent successfully!');

    // ✅ Yeh 2 lines add karo
    sessionStorage.setItem('myIncidentId', incidentId);
    sessionStorage.setItem('myRoomId', roomId);

    navigate(`/guest/${roomId}/confirm`, {
      state: { incidentId, guestUid: user.uid },
    });
  } catch (error) {
    console.error('Submit error:', error);
    toast.error('Failed to send alert. Retrying...');
    setIsSubmitting(false);
  }
};

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col">

      {/* Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-border flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="text-text-secondary text-sm hover:text-white"
        >
          &lt; Back
        </button>
        <span className="text-white text-sm font-semibold uppercase tracking-wide">
          Incident Report
        </span>
        <div className="bg-accent-red px-2 py-1">
          <span className="text-white text-[10px] font-semibold">
            {locationName || `Room ${roomNumber}`} / {floorLabel || `Floor ${floor}`}
          </span>
        </div>
      </div>

      <div className="flex-1 px-4 sm:px-6 lg:px-12 py-6 max-w-2xl mx-auto w-full">

        {/* AI Analysis Banner */}
        <div className="bg-status-success bg-opacity-15 border border-green-800 px-4 py-3 mb-6 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500" />
            <span className="text-green-400 text-xs font-semibold uppercase tracking-wide">
              AI Analysis Complete
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-green-400 text-xs font-mono">
              {confidence}% Confidence
            </span>
            <span className="text-text-muted text-xs font-mono">{refId}</span>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-5">

          {/* Incident Type */}
          <div>
            <label className="text-text-muted text-[10px] uppercase tracking-wider font-medium block mb-2">
              Incident Type
            </label>
            <select
              value={formData.incidentType}
              onChange={(e) => setFormData({ ...formData, incidentType: e.target.value })}
              className="input-field"
            >
              {incidentTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Severity */}
          <div>
            <label className="text-text-muted text-[10px] uppercase tracking-wider font-medium block mb-2">
              Severity Level
            </label>
            <SeverityBadge severity={formData.severity} />
          </div>

          {/* Description */}
          <div>
            <label className="text-text-muted text-[10px] uppercase tracking-wider font-medium block mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field h-24 resize-none"
            />
          </div>

          {/* Alert Recipients */}
          <div>
            <label className="text-text-muted text-[10px] uppercase tracking-wider font-medium block mb-2">
              Alert Recipients
            </label>
            <div className="space-y-2">
              {allRecipients.map((recipient) => {
                const isChecked = formData.alertRecipients.includes(recipient);
                return (
                  <div
                    key={recipient}
                    onClick={() => toggleRecipient(recipient)}
                    className="flex items-center justify-between bg-navy-900 border border-border px-4 py-3 cursor-pointer hover:border-accent-red transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-4 h-4 border flex items-center justify-center transition-colors ${
                          isChecked
                            ? 'bg-accent-red border-accent-red'
                            : 'border-text-muted'
                        }`}
                      >
                        {isChecked && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                      <span className="text-white text-sm">{recipient}</span>
                    </div>
                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                      isChecked ? 'text-green-400' : 'text-text-muted'
                    }`}>
                      {isChecked ? 'Ready' : 'Standby'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Image Preview */}
          {imageUrl && (
            <div>
              <label className="text-text-muted text-[10px] uppercase tracking-wider font-medium block mb-2">
                Visual Evidence
              </label>
              <img
                src={imageUrl}
                alt="Evidence"
                className="w-full h-32 sm:h-48 object-cover border border-border"
              />
            </div>
          )}

          <p className="text-text-muted text-xs text-center">
            Edit details manually if AI analysis is incorrect
          </p>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`btn-primary w-full py-4 text-base ${
              isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? 'Sending Alert...' : 'Send Alert Now'}
          </button>

          <p className="text-text-muted text-xs text-center">
            Your alert will reach staff in under 4 seconds. GPS coordinates attached.
          </p>

        </div>
      </div>
    </div>
  );
};

export default AutoFilledForm;