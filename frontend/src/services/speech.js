let recognition = null;

export const startListening = (onResult, onEnd) => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    console.error('Speech Recognition not supported in this browser.');
    if (onEnd) onEnd();
    return false;
  }

  recognition = new SpeechRecognition();
  recognition.lang = 'en-IN';
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onresult = (event) => {
    let transcript = '';
    for (let i = 0; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }
    if (onResult) onResult(transcript);
  };

  recognition.onend = () => {
    if (onEnd) onEnd();
  };

  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    if (onEnd) onEnd();
  };

  recognition.start();
  return true;
};

export const stopListening = () => {
  if (recognition) {
    recognition.stop();
    recognition = null;
  }
};

export const isSupported = () => {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
};
