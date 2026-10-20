import React, { useState, useEffect } from 'react';
import { Phone, PhoneOff, Volume2, Mic, Play, Pause, X } from 'lucide-react';
import { translations } from '../utils/translations';

export default function TwilioModal({ isOpen, onClose, result, currentLang }) {
  const [callState, setCallState] = useState('ringing'); // ringing, connected, ended
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const dict = translations[currentLang] || translations.en;
  const scriptText = result.needsWater ? dict.callScriptWater : dict.callScriptNoWater;

  useEffect(() => {
    if (isOpen) {
      setCallState('ringing');
      setIsPlayingAudio(false);
    } else {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAnswer = () => {
    setCallState('connected');
    playVoiceScript();
  };

  const handleHangup = () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setCallState('ended');
    setTimeout(() => {
      onClose();
    }, 800);
  };

  const playVoiceScript = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(scriptText);
      utterance.rate = 0.88;
      const langCodes = { en: 'en-IN', hi: 'hi-IN', kn: 'kn-IN', ta: 'ta-IN', te: 'te-IN', mr: 'mr-IN' };
      utterance.lang = langCodes[currentLang] || 'en-IN';
      utterance.onstart = () => setIsPlayingAudio(true);
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleAudio = () => {
    if (isPlayingAudio) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    } else {
      playVoiceScript();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-sm rounded-[32px] overflow-hidden bg-slate-900 border border-slate-700 shadow-2xl text-white">
        
        {/* Close Button */}
        <button
          onClick={handleHangup}
          className="absolute top-4 right-4 z-10 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Smartphone Screen Simulator */}
        <div className="p-6 pt-10 text-center flex flex-col items-center">
          
          {/* Avatar / Caller Badge */}
          <div className="relative mb-5">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl shadow-xl ${
              callState === 'ringing' 
                ? 'bg-gradient-to-tr from-emerald-600 to-teal-400 animate-pulse' 
                : 'bg-emerald-600'
            }`}>
              🌾
            </div>
            {callState === 'ringing' && (
              <span className="absolute -inset-2 rounded-full border-2 border-emerald-400/50 animate-ping pointer-events-none" />
            )}
          </div>

          {/* Caller Details */}
          <h3 className="text-xl font-bold tracking-tight text-white mb-1">
            Kisan JalDrishti
          </h3>
          <p className="text-xs text-emerald-400 font-medium tracking-wide uppercase mb-1">
            Twilio IVR Voice Advisory Line
          </p>
          <p className="text-xs text-slate-400 font-mono mb-6">
            +91 80 4719 3300 (Toll-Free)
          </p>

          {/* Call Status Banner */}
          {callState === 'ringing' && (
            <div className="text-sm font-semibold text-emerald-300 animate-pulse mb-8 flex items-center gap-2">
              <Phone className="w-4 h-4 animate-bounce" />
              Incoming Voice Call...
            </div>
          )}

          {callState === 'connected' && (
            <div className="w-full mb-6">
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-emerald-400 mb-3 bg-emerald-950/60 py-1 px-3 rounded-full border border-emerald-800/50">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Call Connected (00:24)
              </div>

              {/* Spoken Audio Script Bubble */}
              <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 text-left shadow-inner max-h-48 overflow-y-auto">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                    Spoken Audio Transcript
                  </span>
                  <button
                    onClick={toggleAudio}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400"
                    title={isPlayingAudio ? 'Pause Voice' : 'Play Voice'}
                  >
                    {isPlayingAudio ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                  "{scriptText}"
                </p>
              </div>
            </div>
          )}

          {callState === 'ended' && (
            <div className="text-sm font-semibold text-rose-400 mb-8 flex items-center gap-2">
              <PhoneOff className="w-4 h-4" />
              Call Disconnected
            </div>
          )}

          {/* Call Control Buttons */}
          <div className="w-full flex items-center justify-center gap-8 mt-2">
            {callState === 'ringing' ? (
              <>
                <button
                  onClick={handleHangup}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 flex items-center justify-center shadow-lg shadow-rose-900/40 text-white transition active:scale-95">
                    <PhoneOff className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-semibold text-slate-400">Decline</span>
                </button>

                <button
                  onClick={handleAnswer}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-900/40 text-slate-950 transition active:scale-95 animate-bounce">
                    <Phone className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-semibold text-emerald-400">Answer</span>
                </button>
              </>
            ) : (
              <button
                onClick={handleHangup}
                className="flex flex-col items-center gap-2 group"
              >
                <div className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 flex items-center justify-center shadow-xl shadow-rose-900/50 text-white transition active:scale-95">
                  <PhoneOff className="w-7 h-7" />
                </div>
                <span className="text-xs font-semibold text-rose-400">End Call</span>
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
