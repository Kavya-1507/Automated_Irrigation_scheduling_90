/**
 * Kisan JalDrishti - Vernacular Voice Synthesis Engine
 * 
 * Provides authentic, native-accent audio for all 12 major Indian languages:
 * 1. Primary Engine: Vite local backend proxy to streaming TTS (/api/tts)
 * 2. Secondary Engine: Cross-browser Web Speech API (SpeechSynthesis)
 */

let activeAudio = null;

export const GOOGLE_TTS_LANG_MAP = {
  en: 'en',
  hi: 'hi',
  pa: 'pa',
  kn: 'kn',
  te: 'te',
  ta: 'ta',
  mr: 'mr',
  gu: 'gu',
  bn: 'bn',
  ml: 'ml',
  as: 'bn', // Assamese phonetic engine mapped to Eastern Indo-Aryan
  or: 'hi'  // Odia phonetics fallback
};

export function stopVernacularVoice() {
  if (activeAudio) {
    try {
      activeAudio.pause();
      activeAudio.currentTime = 0;
    } catch (e) {
      console.warn('Error pausing audio:', e);
    }
    activeAudio = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      console.warn('Error canceling speechSynthesis:', e);
    }
  }
}

export function speakVernacularVoice({
  lang = 'en',
  text = '',
  voiceCode = 'en-IN',
  onStart,
  onEnd,
  onError
}) {
  // Always stop previous voice stream first
  stopVernacularVoice();

  if (!text || text.trim() === '') {
    if (onEnd) onEnd();
    return;
  }

  const ttsCode = GOOGLE_TTS_LANG_MAP[lang];
  const cleanText = text.slice(0, 180);

  // 1. Try Local Vite Streaming Proxy (/api/tts)
  if (ttsCode) {
    const proxyUrl = `/api/tts?tl=${encodeURIComponent(ttsCode)}&q=${encodeURIComponent(cleanText)}`;
    
    try {
      const audio = new Audio(proxyUrl);
      activeAudio = audio;

      audio.onplay = () => {
        if (onStart) onStart();
      };

      audio.onended = () => {
        activeAudio = null;
        if (onEnd) onEnd();
      };

      audio.onerror = (err) => {
        console.warn(`[VoiceEngine] /api/tts failed for '${lang}', attempting browser TTS fallback:`, err);
        activeAudio = null;
        fallbackBrowserTTS();
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((playErr) => {
          console.warn(`[VoiceEngine] Local audio play failed, falling back:`, playErr);
          activeAudio = null;
          fallbackBrowserTTS();
        });
      }
      return;
    } catch (err) {
      console.warn(`[VoiceEngine] Error initializing audio:`, err);
    }
  }

  // 2. Fallback to Web Speech API
  fallbackBrowserTTS();

  function fallbackBrowserTTS() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onError) onError();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.88;

      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        const matched = voices.find(v => {
          const vLang = v.lang.toLowerCase().replace('_', '-');
          const tCode = voiceCode.toLowerCase();
          return vLang.startsWith(tCode.slice(0, 2)) || vLang === tCode;
        });
        if (matched) {
          utterance.voice = matched;
          utterance.lang = matched.lang;
        } else {
          utterance.lang = voiceCode;
        }
      } else {
        utterance.lang = voiceCode;
      }

      utterance.onstart = () => {
        if (onStart) onStart();
      };

      utterance.onend = () => {
        if (onEnd) onEnd();
      };

      utterance.onerror = (e) => {
        console.warn('[VoiceEngine] Web Speech API error:', e);
        if (onEnd) onEnd();
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('[VoiceEngine] SpeechSynthesis exception:', e);
      if (onError) onError();
    }
  }
}
