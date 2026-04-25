import { useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { startListening, stopListening, isSupported } from '../../services/speech';
import { uploadImage, fileToBase64 } from '../../services/cloudinary';
import toast from 'react-hot-toast';

const SOSPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Mode from QRLanding — 'photo', 'voice', 'non-emergency'
  const initialMode = location.state?.mode || 'photo';
  const locationName = location.state?.locationName || 'Unknown Location';
  const floorLabel = location.state?.floorLabel || 'Unknown Floor';

  const [activeMode, setActiveMode] = useState(initialMode);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageCapture = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreview(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopListening();
      setIsRecording(false);
    } else {
      if (!isSupported()) {
        toast.error('Speech recognition not supported in this browser');
        return;
      }
      const started = startListening(
        (text) => setTranscript(text),
        () => setIsRecording(false)
      );
      if (started) setIsRecording(true);
    }
  };

  const handleAnalyze = async () => {
    if (!imageFile && !transcript) {
      toast.error('Please provide a photo or voice description');
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl = null;
      let imageBase64 = null;

      if (imageFile) {
        const [url, base64] = await Promise.all([
          uploadImage(imageFile),
          fileToBase64(imageFile),
        ]);
        imageUrl = url;
        imageBase64 = base64;
      }

      navigate(`/guest/${roomId}/analyzing`, {
        state: {
          imageUrl,
          imageBase64,
          transcript,
          locationName,
          floorLabel,
        },
      });
    } catch (error) {
      console.error('Upload error:', error);
      let imageBase64 = null;
      if (imageFile) {
        imageBase64 = await fileToBase64(imageFile);
      }
      navigate(`/guest/${roomId}/analyzing`, {
        state: {
          imageUrl: null,
          imageBase64,
          transcript,
          locationName,
          floorLabel,
        },
      });
    }
  };

  const canSubmit = imageFile || transcript;

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
          SOS Report
        </span>
        <div className="bg-accent-red px-2 py-1">
          <span className="text-white text-[10px] font-semibold">
            {locationName} / {floorLabel}
          </span>
        </div>
      </div>

      {/* Mode Selector Tabs — only show if mode is not pre-selected */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveMode('photo')}
          className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wide transition-colors ${
            activeMode === 'photo'
              ? 'text-white border-b-2 border-accent-red'
              : 'text-text-muted hover:text-white'
          }`}
        >
          Photo
        </button>
        <button
          onClick={() => setActiveMode('voice')}
          className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wide transition-colors ${
            activeMode === 'voice'
              ? 'text-white border-b-2 border-accent-red'
              : 'text-text-muted hover:text-white'
          }`}
        >
          Voice
        </button>
        <button
          onClick={() => setActiveMode('both')}
          className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wide transition-colors ${
            activeMode === 'both'
              ? 'text-white border-b-2 border-accent-red'
              : 'text-text-muted hover:text-white'
          }`}
        >
          Both
        </button>
      </div>

      <div className="flex-1 px-4 sm:px-6 lg:px-12 py-6 flex flex-col gap-6 max-w-2xl mx-auto w-full">

        {/* PHOTO SECTION — show if mode is photo or both */}
        {(activeMode === 'photo' || activeMode === 'both') && (
          <div className="card-dark">
            <div className="flex items-center gap-2 mb-4">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D32F2F" strokeWidth="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              <h3 className="text-white font-semibold text-sm uppercase tracking-wide">
                Photo Evidence
              </h3>
            </div>

            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Emergency"
                  className="w-full h-48 sm:h-64 object-cover border border-border"
                />
                <button
                  onClick={() => { setImageFile(null); setImagePreview(null); }}
                  className="absolute top-2 right-2 bg-navy-950 bg-opacity-80 text-white px-2 py-1 text-xs border border-border hover:border-accent-red"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3">

                {/* Take Photo — opens camera directly */}
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex-1 h-32 border border-dashed border-border hover:border-accent-red flex flex-col items-center justify-center gap-2 bg-navy-900 transition-colors"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8A9BB0" strokeWidth="1.5">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  <span className="text-text-secondary text-xs">Take Photo</span>
                  <span className="text-text-muted text-[10px]">Opens Camera</span>
                </button>

                {/* Upload Photo — opens file picker */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 h-32 border border-dashed border-border hover:border-accent-red flex flex-col items-center justify-center gap-2 bg-navy-900 transition-colors"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8A9BB0" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                  <span className="text-text-secondary text-xs">Upload Photo</span>
                  <span className="text-text-muted text-[10px]">From Gallery</span>
                </button>

              </div>
            )}

            {/* Camera input — capture="environment" opens rear camera */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageCapture}
              className="hidden"
            />

            {/* File input — no capture, opens gallery/file picker */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageCapture}
              className="hidden"
            />

          </div>
        )}

        {/* VOICE SECTION — show if mode is voice or both */}
        {(activeMode === 'voice' || activeMode === 'both') && (
          <div className="card-dark">
            <div className="flex items-center gap-2 mb-4">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D32F2F" strokeWidth="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
              <h3 className="text-white font-semibold text-sm uppercase tracking-wide">
                Voice Description
              </h3>
            </div>

            <button
              onClick={toggleRecording}
              className={`w-full py-4 flex items-center justify-center gap-3 border transition-colors ${
                isRecording
                  ? 'bg-accent-red bg-opacity-20 border-accent-red'
                  : 'bg-navy-900 border-border hover:border-accent-red'
              }`}
            >
              <div className={`w-4 h-4 rounded-full ${isRecording ? 'bg-accent-red animate-pulse' : 'bg-text-muted'}`} />
              <span className={`text-sm font-semibold uppercase tracking-wide ${isRecording ? 'text-accent-red' : 'text-text-secondary'}`}>
                {isRecording ? 'Recording... Tap to Stop' : 'Tap to Start Recording'}
              </span>
            </button>

            {transcript && (
              <div className="mt-4 bg-navy-900 border border-border p-3">
                <span className="text-text-muted text-[10px] uppercase tracking-wider block mb-2">
                  Live Transcript
                </span>
                <p className="text-white text-sm leading-relaxed">{transcript}</p>
                <button
                  onClick={() => setTranscript('')}
                  className="text-text-muted text-[10px] hover:text-accent-red mt-2"
                >
                  Clear
                </button>
              </div>
            )}

          </div>
        )}

        {/* NON EMERGENCY SECTION */}
        {activeMode === 'non-emergency' && (
          <div className="card-dark">
            <h3 className="text-white font-semibold text-sm uppercase tracking-wide mb-4">
              Report Non-Emergency Issue
            </h3>
            <p className="text-text-muted text-xs mb-4">
              Use this for maintenance requests, complaints, or general assistance. This will not trigger an emergency alert.
            </p>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Describe the issue..."
              className="input-field h-32 resize-none text-sm"
            />
          </div>
        )}

        {/* Status indicator */}
        <div className="flex items-center gap-3">
          {imageFile && (
            <div className="flex items-center gap-2 bg-navy-900 border border-border px-3 py-1.5">
              <div className="w-2 h-2 bg-green-500" />
              <span className="text-text-secondary text-[10px] uppercase tracking-wider">
                Photo Ready
              </span>
            </div>
          )}
          {transcript && (
            <div className="flex items-center gap-2 bg-navy-900 border border-border px-3 py-1.5">
              <div className="w-2 h-2 bg-green-500" />
              <span className="text-text-secondary text-[10px] uppercase tracking-wider">
                Voice Ready
              </span>
            </div>
          )}
        </div>

        {/* Analyze Button */}
        <button
          onClick={handleAnalyze}
          disabled={isSubmitting || !canSubmit}
          className={`btn-primary w-full py-4 text-base ${
            isSubmitting || !canSubmit ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isSubmitting ? 'Processing...' : 'Analyze Emergency'}
        </button>

        <p className="text-text-muted text-[10px] text-center">
          Your alert will reach staff in under 4 seconds
        </p>

      </div>
    </div>
  );
};

export default SOSPage;