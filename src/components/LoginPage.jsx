import React, { useState, useRef } from 'react';
import { 
  Phone, 
  ShieldCheck, 
  ArrowRight, 
  Volume2, 
  User, 
  Key, 
  CheckCircle2, 
  Sparkles,
  Leaf,
  Globe,
  RefreshCw
} from 'lucide-react';
import { LANGUAGES } from '../App';
import { speakVernacularVoice, stopVernacularVoice } from '../services/voiceService';

const DEMO_FARMERS = [
  {
    name: 'Ramesh Patel',
    phone: '98450 12345',
    kisanId: 'KA-MND-4029',
    city: 'Mandya',
    crop: 'Tomato',
    soil: 'Red',
    acres: '4.5 Acres',
    avatar: '👨‍🌾',
    lang: 'kn'
  },
  {
    name: 'Gurpreet Singh',
    phone: '98140 54321',
    kisanId: 'PB-LDH-8102',
    city: 'Ludhiana',
    crop: 'Wheat',
    soil: 'Loam',
    acres: '8.0 Acres',
    avatar: '🌾',
    lang: 'pa'
  },
  {
    name: 'Anand Deshmukh',
    phone: '94220 98765',
    kisanId: 'MH-NSK-1944',
    city: 'Nashik',
    crop: 'Sugarcane',
    soil: 'Black',
    acres: '5.2 Acres',
    avatar: '🚜',
    lang: 'mr'
  }
];

const LOGIN_VOICE_PROMPTS = {
  en: "Welcome to Kisan JalDrishti. Enter your 10 digit mobile number or select a demo farmer profile to log in.",
  hi: "किसान जलदृष्टी में आपका स्वागत है। अपना 10 अंकों का मोबाइल नंबर दर्ज करें या डेमो किसान चुनकर लॉगिन करें।",
  kn: "ಕಿಸಾನ್ ಜಲದೃಷ್ಟಿಗೆ ಸುಸ್ವಾಗತ. ನಿಮ್ಮ 10 ಅಂಕಿಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ ಅಥವಾ ಡೆಮೊ ರೈತರನ್ನು ಆರಿಸಿ ಲಾಗಿನ್ ಮಾಡಿ.",
  te: "కిసాన్ జలదృష్టికి స్వాగతం. మీ 10 అంకెల మొబైల్ నంబర్‌ను నమోదు చేయండి లేదా డెమో ప్రొఫైల్‌తో లాగిన్ అవ్వండి.",
  ta: "கிசான் ஜலதிருஷ்டிக்கு வரவேற்கிறோம். உங்கள் 10 இலக்க மொபைல் எண்ணை உள்ளிடவும் அல்லது டெமோ மூலம் உள்நுழையவும்.",
  mr: "किसान जलदृष्टी मध्ये आपले स्वागत आहे. आपला 10 अंकी मोबाईल नंबर टाका किंवा डेमो प्रोफाइल निवडून लॉगिन करा.",
  pa: "ਕਿਸਾਨ ਜਲਦ੍ਰਿਸ਼ਟੀ ਵਿੱਚ ਜੀ ਆਇਆਂ ਨੂੰ। ਆਪਣਾ 10 ਅੰਕਾਂ ਦਾ ਮੋਬਾਈਲ ਨੰਬਰ ਦਰਜ ਕਰੋ ਜਾਂ ਡੈਮੋ ਚੁਣ ਕੇ ਲੌਗਇਨ ਕਰੋ।",
  gu: "કિસાન જલદ્રષ્ટિમાં આપનું સ્વાગત છે. તમારો 10 અંકનો મોબાઈલ નંબર દાખલ કરો અથવા ડેમો પસંદ કરી લોગિન કરો.",
  bn: "কিসান জলদৃষ্টিতে স্বাগতম। আপনার ১০ সংখ্যার মোবাইল নম্বর লিখুন অথবা ডেমো বেছে লগইন করুন।",
  ml: "കിസാൻ ജലദൃഷ്ടിയിലേക്ക് സ്വാഗതം. നിങ്ങളുടെ 10 അക്ക മൊബൈൽ നമ്പർ നൽകുക അല്ലെങ്കിൽ ഡെമോ വഴി ലോഗിൻ ചെയ്യുക.",
  or: "କିସାନ ଜଳଦୃଷ୍ଟିକୁ ସ୍ୱାଗତ। ଆପଣଙ୍କ ୧୦ ଅଙ୍କ ବିଶିଷ୍ଟ ମୋବାଇଲ୍ ନମ୍ବର ଦିଅନ୍ତୁ କିମ୍ବା ଡେମୋ ବାଛି ଲଗଇନ୍ କରନ୍ତୁ।",
  as: "কিষাণ জলদৃষ্টিলৈ স্বাগতম। আপোনাৰ ১০টা সংখ্যাৰ মোবাইল নম্বৰ দিয়ক বা ডেম' বাচি লগইন কৰক।"
};

export default function LoginPage({ onLogin, currentLang = 'en', onLangChange }) {
  const [authMode, setAuthMode] = useState('otp'); // 'otp' | 'kisanId'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [kisanId, setKisanId] = useState('');
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '']);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Spotlight card mouse tracking
  const cardRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleVoiceHelp = () => {
    if (isSpeaking) {
      stopVernacularVoice();
      setIsSpeaking(false);
      return;
    }
    const prompt = LOGIN_VOICE_PROMPTS[currentLang] || LOGIN_VOICE_PROMPTS.en;
    const langObj = LANGUAGES.find(l => l.code === currentLang);
    speakVernacularVoice({
      lang: currentLang,
      text: prompt,
      voiceCode: langObj ? langObj.voiceCode : 'en-IN',
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false)
    });
  };

  const handleSendOtp = (e) => {
    e.preventDefault();
    setError('');
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit Indian mobile number');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setOtpStep(true);
      // Pre-fill demo OTP 1-2-3-4 after short animation
      setTimeout(() => setOtp(['1', '2', '3', '4']), 600);
    }, 800);
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    const enteredOtp = otp.join('');
    if (enteredOtp.length < 4) {
      setError('Please enter the 4-digit verification code');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin({
        name: 'Ramesh Patel',
        phone: '+91 ' + phoneNumber,
        kisanId: 'KA-MND-4029',
        city: 'Mandya',
        crop: 'Tomato',
        soil: 'Red',
        acres: '4.5 Acres',
        avatar: '👨‍🌾'
      });
    }, 700);
  };

  const handleKisanIdLogin = (e) => {
    e.preventDefault();
    if (!kisanId.trim()) {
      setError('Please enter your Kisan Registration ID');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin({
        name: 'Kisan Beneficiary',
        phone: '+91 98450 12345',
        kisanId: kisanId.toUpperCase(),
        city: 'Nashik',
        crop: 'Sugarcane',
        soil: 'Black',
        acres: '5 Acres',
        avatar: '🚜'
      });
    }, 700);
  };

  const handleDemoSelect = (farmer) => {
    setLoading(true);
    if (onLangChange && farmer.lang) {
      onLangChange(farmer.lang);
    }
    setTimeout(() => {
      setLoading(false);
      onLogin(farmer);
    }, 400);
  };

  return (
    <div className="relative min-h-screen bg-[#000000] text-zinc-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-black overflow-x-hidden">
      
      {/* ⚡ Linear/Stripe Dot Grid & Glowing Aurora */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-dot-grid opacity-30" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[850px] h-[350px] bg-gradient-to-b from-emerald-500/25 via-teal-500/10 to-transparent blur-[140px] rounded-full" />
      </div>

      {/* Top Floating Mini Header */}
      <header className="relative z-10 max-w-6xl mx-auto w-full px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center text-xl shadow-lg shadow-emerald-500/10">
            🌾
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-white block leading-tight">
              Kisan JalDrishti
            </span>
            <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-400 font-semibold">
              FAO-56 Autonomous Irrigation
            </span>
          </div>
        </div>

        {/* Language & Voice Help */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={handleVoiceHelp}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 border ${
              isSpeaking
                ? 'bg-emerald-500 text-black border-emerald-400 font-bold animate-pulse'
                : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 border-white/10'
            }`}
            title="Listen to Voice Guide"
          >
            <Volume2 className={`w-3.5 h-3.5 ${isSpeaking ? 'animate-bounce' : 'text-emerald-400'}`} />
            <span className="hidden sm:inline">{isSpeaking ? 'Speaking...' : 'Voice Help'}</span>
          </button>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/80 border border-white/10 text-xs font-semibold text-zinc-300">
            <Globe className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={currentLang}
              onChange={(e) => onLangChange && onLangChange(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer pr-1"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code} className="bg-zinc-950 text-white">
                  {l.label} ({l.script})
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Main Login Card Section */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          
          {/* Spotlight Card */}
          <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="relative overflow-hidden bento-card p-6 sm:p-8 border border-white/10 shadow-2xl rounded-3xl bg-zinc-950/70 backdrop-blur-2xl"
          >
            {/* Spotlight Radial Glow */}
            <div
              className="pointer-events-none absolute -inset-px transition-opacity duration-300"
              style={{
                opacity: isHovered ? 1 : 0,
                background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, rgba(16, 185, 129, 0.15), transparent 80%)`,
              }}
            />

            <div className="relative z-10">
              
              {/* Card Title & Icon */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-2xl mb-3 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                  💧
                </div>
                <h1 className="text-2xl font-black tracking-tight text-white">
                  Farmer Portal Login
                </h1>
                <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
                  Access your automated FAO-56 irrigation schedule & live soil moisture status.
                </p>
              </div>

              {/* Mode Switcher Tabs */}
              <div className="grid grid-cols-2 p-1 rounded-xl bg-zinc-900 border border-white/10 mb-6 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => { setAuthMode('otp'); setOtpStep(false); setError(''); }}
                  className={`py-2 rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 ${
                    authMode === 'otp'
                      ? 'bg-emerald-500 text-black font-bold shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Mobile OTP</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode('kisanId'); setError(''); }}
                  className={`py-2 rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 ${
                    authMode === 'kisanId'
                      ? 'bg-emerald-500 text-black font-bold shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Kisan ID</span>
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {/* AUTH FORM: Mobile OTP Mode */}
              {authMode === 'otp' && (
                <div>
                  {!otpStep ? (
                    <form onSubmit={handleSendOtp} className="space-y-4">
                      <div>
                        <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">
                          Indian Mobile Number
                        </label>
                        <div className="relative flex items-center">
                          <span className="absolute left-3.5 text-xs font-mono font-semibold text-zinc-400 select-none">
                            +91
                          </span>
                          <input
                            type="tel"
                            maxLength={10}
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                            placeholder="98450 12345"
                            className="w-full pl-14 pr-4 py-3 rounded-xl bg-zinc-900/80 border border-white/10 text-white font-mono text-sm placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                            autoFocus
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-white hover:bg-zinc-200 text-black transition active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                      >
                        {loading ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Sending OTP...</span>
                          </>
                        ) : (
                          <>
                            <span>Get Verification Code</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyOtp} className="space-y-4 animate-in fade-in duration-300">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-medium">
                            Enter 4-Digit Code
                          </label>
                          <button
                            type="button"
                            onClick={() => setOtpStep(false)}
                            className="text-[11px] text-emerald-400 hover:underline font-mono"
                          >
                            Change Number
                          </button>
                        </div>
                        <p className="text-xs text-zinc-500 mb-3">
                          Code sent to <span className="text-zinc-300 font-mono">+91 {phoneNumber}</span>
                        </p>

                        <div className="grid grid-cols-4 gap-2.5">
                          {otp.map((digit, idx) => (
                            <input
                              key={idx}
                              id={`otp-${idx}`}
                              type="text"
                              maxLength={1}
                              value={digit}
                              onChange={(e) => {
                                const val = e.target.value.slice(-1);
                                const newOtp = [...otp];
                                newOtp[idx] = val;
                                setOtp(newOtp);
                                if (val && idx < 3) {
                                  const nextInput = document.getElementById(`otp-${idx + 1}`);
                                  if (nextInput) nextInput.focus();
                                }
                              }}
                              className="w-full text-center py-3 rounded-xl bg-zinc-900 border border-white/10 text-xl font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                            />
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-zinc-500 font-mono">Demo OTP: <strong className="text-emerald-400">1234</strong></span>
                        <button
                          type="button"
                          onClick={() => setOtp(['1', '2', '3', '4'])}
                          className="text-zinc-400 hover:text-white underline text-[11px]"
                        >
                          Auto-fill 1234
                        </button>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-emerald-500 hover:bg-emerald-400 text-black transition active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                      >
                        {loading ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Verifying...</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-4 h-4" />
                            <span>Verify & Enter Dashboard</span>
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* AUTH FORM: Kisan ID Mode */}
              {authMode === 'kisanId' && (
                <form onSubmit={handleKisanIdLogin} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">
                      Government Kisan Registration ID
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        value={kisanId}
                        onChange={(e) => setKisanId(e.target.value)}
                        placeholder="e.g. KA-MND-4029"
                        className="w-full px-4 py-3 rounded-xl bg-zinc-900/80 border border-white/10 text-white font-mono text-sm placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 uppercase transition"
                        autoFocus
                      />
                    </div>
                    <span className="text-[11px] text-zinc-500 mt-1 block">
                      Found on your PM-Kisan or Soil Health Card documentation.
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-white hover:bg-zinc-200 text-black transition active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Validating ID...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify Kisan ID</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/[0.08]" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-mono tracking-widest text-zinc-500">
                  <span className="bg-zinc-950 px-2">or 1-Tap Demo Farmer</span>
                </div>
              </div>

              {/* Quick Preset Demo Farmer Profiles */}
              <div className="space-y-2">
                {DEMO_FARMERS.map((farmer, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleDemoSelect(farmer)}
                    className="w-full p-2.5 rounded-xl border border-white/[0.06] bg-zinc-900/40 hover:bg-zinc-900 hover:border-emerald-500/40 transition active:scale-[0.98] flex items-center justify-between text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl p-1.5 rounded-lg bg-zinc-950 border border-white/5">
                        {farmer.avatar}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-zinc-200 group-hover:text-emerald-400 transition flex items-center gap-1.5">
                          <span>{farmer.name}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">
                            {farmer.city}
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-500 font-mono">
                          {farmer.crop} • {farmer.acres}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-zinc-500 group-hover:text-white transition flex items-center gap-1">
                      <span className="text-[10px] font-mono">Quick In</span>
                      <span>→</span>
                    </div>
                  </button>
                ))}
              </div>

            </div>
          </div>

          {/* Trust badge */}
          <div className="flex items-center justify-center gap-4 mt-6 text-zinc-500 text-[11px] font-mono">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> UN FAO-56 Standard
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Real-time Satellite
            </span>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-4 text-center text-xs text-zinc-600 font-mono border-t border-white/[0.04]">
        Kisan JalDrishti Precision Irrigation Engine • Open-Meteo & Twilio Architecture
      </footer>

    </div>
  );
}
