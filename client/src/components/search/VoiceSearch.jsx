import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMic, FiMicOff } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function VoiceSearch() {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const navigate = useNavigate();

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice search not supported in this browser');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => { setListening(false); toast.error('Voice search failed'); };
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      toast.success(`Searching: "${transcript}"`);
      navigate(`/products?search=${encodeURIComponent(transcript)}`);
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  return (
    <button
      onClick={listening ? stopListening : startListening}
      className={`p-2 rounded-lg transition ${listening ? 'bg-red-100 text-red-500 animate-pulse' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500'}`}
      title="Voice search"
    >
      {listening ? <FiMicOff size={18} /> : <FiMic size={18} />}
    </button>
  );
}