import { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiMic, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';

// ── Waveform bars ─────────────────────────────────────────────
function WaveBars({ active, darkMode }) {
  const [h, setH] = useState([5, 12, 8, 18, 6, 22, 9, 15, 5, 19]);
  const timerRef = useRef(null);

  useEffect(() => {
    if (active) {
      timerRef.current = setInterval(() => {
        setH(prev => prev.map(v => Math.max(4, Math.min(28, v + (Math.random() * 14 - 7)))));
      }, 80);
    } else {
      clearInterval(timerRef.current);
      setH([5, 12, 8, 18, 6, 22, 9, 15, 5, 19]);
    }
    return () => clearInterval(timerRef.current);
  }, [active]);

  // Teal-themed colors
  const COLORS = ['#247370', '#2e8f8a', '#4aaaa5', '#7cc7c3'];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: 32 }}>
      {h.map((height, i) => (
        <div key={i} style={{
          width: 4,
          height: active ? height : 3,
          borderRadius: 2,
          background: active ? COLORS[i % 4] : (darkMode ? '#2a5250' : '#bdd4d3'),
          transition: active ? 'height 0.08s ease' : 'height 0.4s ease, background 0.3s',
        }} />
      ))}
    </div>
  );
}

// ── Modal (bottom sheet via portal) ──────────────────────────────────────────
function VoiceModal({ state, transcript, onClose, darkMode }) {
  const isListening = state === 'listening';
  const isDone = state === 'done';

  const bg = darkMode ? '#122828' : '#ffffff';
  const handleColor = darkMode ? '#2a5250' : '#ddeaea';
  const closeBg = darkMode ? '#1c3836' : '#eef7f6';
  const closeColor = darkMode ? '#5f9290' : '#3d706e';
  const textPrimary = darkMode ? '#f1f5f9' : '#0a1f1e';
  const textMuted = darkMode ? '#5f9290' : '#5f9290';
  const dotColor = darkMode ? '#2a5250' : '#bdd4d3';
  const scrim = darkMode ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.45)';
  const micBg = isListening ? '#ef4444' : isDone ? '#247370' : (darkMode ? '#1c3836' : '#eef7f6');
  const micIconColor = (isListening || isDone) ? '#fff' : (darkMode ? '#5f9290' : '#8fb5b3');

  return createPortal(
    <>
      <style>{`
        @keyframes vsIn{from{opacity:0}to{opacity:1}}
        @keyframes vsSheet{from{transform:translate(-50%,110%)}to{transform:translate(-50%,0)}}
        @keyframes vsPing{0%{transform:scale(1);opacity:.6}100%{transform:scale(2.8);opacity:0}}
        @keyframes vsDot{0%,80%,100%{transform:scale(.5);opacity:.25}40%{transform:scale(1);opacity:1}}
      `}</style>

      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          background: scrim,
          animation: 'vsIn .15s ease',
        }}
      />

      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'fixed', bottom: 0, left: '50%',
          transform: 'translateX(-50%)',
          width: '100%', maxWidth: 500,
          background: bg,
          borderRadius: '24px 24px 0 0',
          padding: '18px 28px 52px',
          zIndex: 9999,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          animation: 'vsSheet .22s cubic-bezier(.32,.72,0,1)',
          boxShadow: '0 -4px 32px rgba(0,0,0,0.2)',
          borderTop: `1px solid ${darkMode ? '#1c3836' : '#ddeaea'}`,
        }}
      >
        {/* Handle */}
        <div style={{ width: 40, height: 4, borderRadius: 2, background: handleColor, marginBottom: 24 }} />

        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute', top: 16, right: 16,
            width: 32, height: 32, borderRadius: '50%',
            background: closeBg, border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: closeColor,
          }}
          aria-label="Close voice search"
        >
          <FiX size={15} />
        </button>

        {/* Mic + pulse rings */}
        <div style={{ position: 'relative', width: 72, height: 72, marginBottom: 24 }}>
          {isListening && (
            <div style={{
              position: 'absolute',
              top: '-50%', left: '-50%',
              width: '200%', height: '200%',
              borderRadius: '50%',
              background: 'rgba(239,68,68,0.15)',
              animation: 'vsPing 1.4s ease-out infinite',
            }} />
          )}
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: micBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.25s ease',
            position: 'relative', zIndex: 1,
            boxShadow: isListening
              ? '0 0 0 8px rgba(239,68,68,0.1)'
              : isDone
              ? '0 0 0 8px rgba(36,115,112,0.15)'
              : 'none',
          }}>
            <FiMic size={28} color={micIconColor} />
          </div>
        </div>

        {/* Waveform */}
        <div style={{ marginBottom: 20, opacity: isListening ? 1 : 0.2, transition: 'opacity 0.3s' }}>
          <WaveBars active={isListening} darkMode={darkMode} />
        </div>

        {/* Live transcript */}
        <div style={{ minHeight: 60, width: '100%', textAlign: 'center', marginBottom: 12, padding: '0 8px' }}>
          {transcript ? (
            <p style={{
              fontSize: 20, fontWeight: 600,
              color: textPrimary,
              lineHeight: 1.4, margin: 0,
              wordBreak: 'break-word',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              letterSpacing: '-0.01em',
            }}>
              {transcript}
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
              <p style={{ fontSize: 15, color: textMuted, margin: 0, fontWeight: 400 }}>
                {isListening ? 'Listening…' : isDone ? 'Done' : 'Starting…'}
              </p>
              {isListening && (
                <div style={{ display: 'flex', gap: 6 }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: dotColor,
                      animation: 'vsDot 1.1s ease-in-out infinite',
                      animationDelay: `${i * 0.18}s`,
                    }} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <p style={{ fontSize: 12, color: textMuted, margin: 0 }}>
          {isDone ? 'Searching…' : 'Tap anywhere outside to cancel'}
        </p>
      </div>
    </>,
    document.body
  );
}

// ── Main export ───────────────────────────────────────────────
export default function VoiceSearch({ onTranscript }) {
  const { darkMode } = useSelector(s => s.ui);
  const [state, setState] = useState('idle');
  const [transcript, setTranscript] = useState('');
  const recRef = useRef(null);
  const finalRef = useRef('');
  const autoStopRef = useRef(null);

  const cleanup = useCallback(() => {
    clearTimeout(autoStopRef.current);
    if (recRef.current) {
      try { recRef.current.abort(); } catch (_) {}
      recRef.current = null;
    }
  }, []);

  const close = useCallback(() => {
    cleanup();
    setState('idle');
    setTranscript('');
    finalRef.current = '';
  }, [cleanup]);

  const start = useCallback(async (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      toast.error('Voice search not supported. Please use Chrome or Edge.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        toast.error('Mic blocked. Click the 🔒 in the address bar → allow Microphone.', { duration: 6000 });
      } else {
        toast.error('Microphone unavailable. Check your device settings.');
      }
      return;
    }

    cleanup();
    finalRef.current = '';
    setTranscript('');
    setState('listening');

    const rec = new SR();
    rec.lang = 'en-IN';
    rec.interimResults = true;
    rec.continuous = true;
    rec.maxAlternatives = 1;
    recRef.current = rec;

    rec.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const chunk = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalRef.current += chunk + ' ';
        } else {
          interim += chunk;
        }
      }
      const display = (finalRef.current + interim).trim();
      if (display) setTranscript(display);
    };

    rec.onerror = (event) => {
      if (event.error === 'aborted') return;
      if (event.error === 'no-speech') { close(); return; }
      if (event.error === 'not-allowed') {
        toast.error('Mic access denied. Allow microphone in browser settings.', { duration: 5000 });
      } else if (event.error === 'network') {
        toast.error('Network error with voice recognition.');
      } else {
        console.warn('[VoiceSearch] unhandled error:', event.error);
      }
      close();
    };

    rec.onend = () => {
      clearTimeout(autoStopRef.current);
      const result = finalRef.current.trim();
      const best = result || transcript.trim();
      if (best) {
        setState('done');
        setTranscript(best);
        setTimeout(() => {
          onTranscript(best);
          close();
        }, 500);
      } else {
        close();
      }
    };

    try {
      rec.start();
    } catch (err) {
      console.error('[VoiceSearch] rec.start() threw:', err);
      close();
      return;
    }

    autoStopRef.current = setTimeout(() => {
      if (recRef.current) {
        try { recRef.current.stop(); } catch (_) {}
      }
    }, 10000);
  }, [cleanup, close, onTranscript, transcript]);

  const handleMicClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (state !== 'idle') {
      close();
    } else {
      start(e);
    }
  }, [state, close, start]);

  useEffect(() => () => cleanup(), [cleanup]);

  const isActive = state !== 'idle';

  return (
    <>
      <button
        type="button"
        onClick={handleMicClick}
        aria-label={isActive ? 'Stop voice search' : 'Search by voice'}
        className={`
          relative flex items-center justify-center w-9 h-9 rounded-lg
          transition-colors duration-150 flex-shrink-0 cursor-pointer
          ${isActive
            ? 'text-red-500 bg-red-50 dark:bg-red-950/30 dark:text-red-400'
            : 'text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/30'
          }
        `}
        style={{ border: 'none', outline: 'none' }}
      >
        <FiMic size={16} />
        {state === 'listening' && (
          <span style={{
            position: 'absolute', inset: 0, borderRadius: 8,
            background: 'rgba(239,68,68,0.15)',
            animation: 'vsPing 1.4s ease-out infinite',
          }} />
        )}
      </button>

      {isActive && (
        <VoiceModal
          state={state}
          transcript={transcript}
          onClose={close}
          darkMode={darkMode}
        />
      )}
    </>
  );
}