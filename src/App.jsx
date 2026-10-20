import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Droplets, 
  Sparkles, 
  Globe, 
  Volume2, 
  VolumeX,
  PhoneCall, 
  Power, 
  Layers, 
  BarChart3, 
  ChevronDown, 
  Wind, 
  Thermometer, 
  Activity, 
  CloudRain, 
  Sun,
  Radio,
  RefreshCw,
  MapPin,
  Check,
  Navigation,
  ArrowUpRight,
  Cpu,
  Clock,
  Mic,
  LogOut
} from 'lucide-react';
import { calculateFAO56Irrigation } from './utils/fao56Engine';
import { translations } from './utils/translations';
import { getDeviceCoordinates, fetchLiveWeatherData, detectUserLocationAndWeather } from './services/weatherService';
import { speakVernacularVoice, stopVernacularVoice } from './services/voiceService';
import TwilioModal from './components/TwilioModal';
import LoginPage from './components/LoginPage';

// 12 Major Indian Languages with Web Speech API voice synthesis codes
export const LANGUAGES = [
  { code: 'hi', label: 'हिंदी', script: 'Hindi', voiceCode: 'hi-IN', flag: '🇮🇳' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ', script: 'Punjabi', voiceCode: 'pa-IN', flag: '🌾' },
  { code: 'kn', label: 'ಕನ್ನಡ', script: 'Kannada', voiceCode: 'kn-IN', flag: '🌿' },
  { code: 'te', label: 'తెలుగు', script: 'Telugu', voiceCode: 'te-IN', flag: '🌱' },
  { code: 'ta', label: 'தமிழ்', script: 'Tamil', voiceCode: 'ta-IN', flag: '🪴' },
  { code: 'mr', label: 'मराठी', script: 'Marathi', voiceCode: 'mr-IN', flag: '🚜' },
  { code: 'gu', label: 'ગુજરાતી', script: 'Gujarati', voiceCode: 'gu-IN', flag: '💧' },
  { code: 'bn', label: 'বাংলা', script: 'Bengali', voiceCode: 'bn-IN', flag: '🌊' },
  { code: 'ml', label: 'മലയാളം', script: 'Malayalam', voiceCode: 'ml-IN', flag: '🌴' },
  { code: 'or', label: 'ଓଡ଼ିଆ', script: 'Odia', voiceCode: 'or-IN', flag: '☀️' },
  { code: 'as', label: 'অসমীয়া', script: 'Assamese', voiceCode: 'as-IN', flag: '🍃' },
  { code: 'en', label: 'English', script: 'EN', voiceCode: 'en-IN', flag: '🌐' }
];

// Spotlight Hover Card Wrapper for Linear/Stripe aesthetic
function SpotlightCard({ children, className = "", onClick }) {
  const cardRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      className={`relative overflow-hidden bento-card ${className}`}
    >
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(450px circle at ${mousePos.x}px ${mousePos.y}px, rgba(16, 185, 129, 0.12), transparent 80%)`,
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export default function VercelStyleIrrigationDashboard() {
  const [config, setConfig] = useState({
    crop: 'Tomato',
    soil: 'Red',
    stage: 'MidSeason',
    lang: 'en'
  });

  const [simulatedRain, setSimulatedRain] = useState(0);
  const [isTwilioModalOpen, setIsTwilioModalOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [pumpActive, setPumpActive] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Authentication State
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('kisan_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const handleLogin = (farmer) => {
    setCurrentUser(farmer);
    try {
      localStorage.setItem('kisan_user', JSON.stringify(farmer));
    } catch (e) {}
    setConfig(prev => ({
      ...prev,
      crop: farmer.crop || prev.crop,
      soil: farmer.soil || prev.soil,
      lang: farmer.lang || prev.lang
    }));
    setToastMessage(`Welcome back, ${farmer.name}!`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleLogout = () => {
    stopVernacularVoice();
    setIsSpeaking(false);
    setCurrentUser(null);
    try {
      localStorage.removeItem('kisan_user');
    } catch (e) {}
  };

  // Live Weather API State
  const [liveWeather, setLiveWeather] = useState(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [gpsLocationName, setGpsLocationName] = useState(null);

  // Initial mount: Auto-detect real-time location & satellite microclimate
  useEffect(() => {
    let active = true;
    async function autoSyncLocalWeather() {
      setIsLoadingWeather(true);
      try {
        const { locationName, weatherData } = await detectUserLocationAndWeather();
        if (active && weatherData) {
          setLiveWeather(weatherData);
          setGpsLocationName(locationName);
          setToastMessage(`📍 Live Microclimate Auto-Detected: ${locationName}`);
          setTimeout(() => setToastMessage(null), 3500);
        }
      } catch (e) {
        console.warn("Initial location detection failed:", e);
      } finally {
        if (active) setIsLoadingWeather(false);
      }
    }
    autoSyncLocalWeather();
    return () => { active = false; };
  }, []);

  // Real-Time Location & Microclimate Detection (Zero-Friction Dual Engine)
  const handleDetectGPS = async () => {
    setIsLoadingWeather(true);
    try {
      const { locationName, weatherData } = await detectUserLocationAndWeather();
      if (weatherData) {
        setLiveWeather(weatherData);
        setGpsLocationName(locationName);
        setToastMessage(`📍 Live Microclimate Synced: ${locationName}`);
        setTimeout(() => setToastMessage(null), 3500);
      }
    } catch (err) {
      console.warn("Location detection error:", err);
      setToastMessage("⚠️ Unable to refresh live telemetry");
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setIsLoadingWeather(false);
    }
  };

  const handleRefreshWeather = async () => {
    await handleDetectGPS();
  };

  // Dynamic FAO-56 Engine calculation
  const result = useMemo(() => {
    return calculateFAO56Irrigation({
      crop: config.crop,
      soil: config.soil,
      stage: config.stage,
      simulatedRainfall: simulatedRain,
      liveWeather
    });
  }, [config.crop, config.soil, config.stage, simulatedRain, liveWeather]);

  const dict = translations[config.lang] || translations.en;
  const activeWeather = liveWeather || {
    temp: 28.0,
    hum: 60,
    wind: 2.5,
    et0: 4.8,
    rainToday: 0.0,
    lat: 12.97,
    lon: 77.59
  };
  const { needsWater, soilMoisturePercentage, depletionPercentage, recWaterLitersPerM2, dripHours, etc, et0, kc, awc, raw, fc, wp, madPercent, trendData } = result;

  // 🔊 Multi-lingual Voice Speech Output (Dual-Engine: Natural Google TTS + Web Speech API)
  const handleSpeak = (targetLang = config.lang) => {
    if (isSpeaking) {
      stopVernacularVoice();
      setIsSpeaking(false);
      return;
    }

    const activeDict = translations[targetLang] || translations.en;
    const spokenText = needsWater 
      ? (activeDict.callScriptWater || `${activeDict.waterTodayTitle}. ${activeDict.waterTodaySub}`)
      : (activeDict.callScriptNoWater || `${activeDict.noWaterTitle}. ${activeDict.noWaterSub}`);

    const langObj = LANGUAGES.find(l => l.code === targetLang);

    speakVernacularVoice({
      lang: targetLang,
      text: spokenText,
      voiceCode: langObj ? langObj.voiceCode : 'en-IN',
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false)
    });
  };

  const handleTogglePump = () => {
    const next = !pumpActive;
    setPumpActive(next);
    setToastMessage(next ? dict.pumpOn : dict.pumpOff);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const cropKeys = ['Tomato', 'Rice', 'Corn', 'Wheat', 'Sugarcane', 'Cotton', 'Chili'];
  const soilKeys = ['Red', 'Black', 'Loam', 'Sandy', 'Clay'];
  const stageKeys = ['Initial', 'Development', 'MidSeason', 'Late'];

  // Gauge calculations
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (soilMoisturePercentage / 100) * circumference;

  // Unauthenticated Farmer View: Render World-Class Login Page
  if (!currentUser) {
    return (
      <LoginPage 
        onLogin={handleLogin} 
        currentLang={config.lang} 
        onLangChange={(l) => setConfig(prev => ({ ...prev, lang: l }))} 
      />
    );
  }

  return (
    <div className="relative min-h-screen bg-[#000000] text-zinc-100 selection:bg-emerald-500 selection:text-black font-sans antialiased overflow-x-hidden">
      
      {/* ⚡ Linear/Stripe Dot Grid & Single High-Vibrancy Top Aurora Beam */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-dot-grid opacity-30" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[350px] bg-gradient-to-b from-emerald-500/20 via-teal-500/10 to-transparent blur-[140px] rounded-full" />
      </div>

      {/* 🧭 Minimalist Top Header */}
      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-black/60 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          
          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center text-lg shadow-sm">
              🌾
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-extrabold text-base tracking-tight text-white font-sans">
                Kisan JalDrishti
              </span>
              <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 hidden sm:inline">
                FAO-56 Precision Engine
              </span>
            </div>
          </div>

          {/* Status & 12 Indian Languages Selector */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/80 border border-white/[0.08] text-xs font-mono text-zinc-300">
              <span className={`w-2 h-2 rounded-full ${isLoadingWeather ? 'bg-amber-400 animate-spin' : 'bg-emerald-400 animate-pulse'}`} />
              <span className="text-zinc-400">API:</span>
              <span className="text-emerald-400 font-semibold">Open-Meteo Live</span>
              <button onClick={handleRefreshWeather} className="hover:text-white transition ml-1" title="Refresh Live Satellite Weather">
                <RefreshCw className={`w-3 h-3 ${isLoadingWeather ? 'animate-spin text-amber-400' : 'text-zinc-500'}`} />
              </button>
            </div>

            {/* Global Language Selector */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-white/[0.08] hover:border-white/20 transition text-xs font-semibold text-zinc-300">
              <Globe className="w-3.5 h-3.5 text-zinc-400" />
              <select
                value={config.lang}
                onChange={(e) => setConfig({ ...config, lang: e.target.value })}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer pr-1"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code} className="bg-zinc-950 text-white">
                    {l.label} ({l.script})
                  </option>
                ))}
              </select>
            </div>

            {/* Farmer Profile Badge & Logout */}
            <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-white/10">
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-zinc-900 border border-white/10 text-xs">
                <span className="text-base select-none">{currentUser.avatar || '👨‍🌾'}</span>
                <div className="hidden sm:block text-left">
                  <div className="font-bold text-white text-[11px] leading-tight truncate max-w-[100px]">{currentUser.name}</div>
                  <div className="text-[10px] font-mono text-emerald-400 leading-none">{currentUser.city}</div>
                </div>
              </div>
              <button 
                onClick={handleLogout} 
                className="p-1.5 rounded-xl bg-zinc-900 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 border border-white/10 hover:border-rose-500/30 transition text-xs flex items-center gap-1"
                title="Log Out of Portal"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline text-[11px] font-semibold">Exit</span>
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* 🍱 Main Bento Box Architecture */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-14 space-y-6">
        
        {/* Row 1: The Massive Hero Bento & Weather Capsule (2:1 Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* BENTO 1: Massive Primary Status Card (Col Span 2) */}
          <SpotlightCard className={`lg:col-span-2 p-6 sm:p-10 ${
            needsWater 
              ? 'border-rose-500/30 hover:border-rose-500/60 shadow-[0_0_60px_-15px_rgba(244,63,94,0.15)]' 
              : 'border-emerald-500/30 hover:border-emerald-500/60 shadow-[0_0_60px_-15px_rgba(16,185,129,0.15)]'
          }`}>
            
            {/* Top Bar with Valve Status & Complete Indian Languages Speak Capsule */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              
              {/* Valve Action Pill */}
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-md text-[11px] font-mono tracking-wider uppercase font-bold border ${
                needsWater
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${needsWater ? 'bg-rose-400 animate-ping' : 'bg-emerald-400'}`} />
                {needsWater ? dict.valveOpen : dict.valveKeepClosed}
              </div>

              {/* 🔊 MULTI-LANGUAGE SPEAK BUTTON CAPSULE WITH DIRECT INDIAN LANGUAGE SWITCHER */}
              <div className="flex items-center bg-zinc-900 border border-white/10 rounded-xl p-1 shadow-sm">
                
                {/* Audio Play/Stop Trigger */}
                <button
                  onClick={() => handleSpeak(config.lang)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition active:scale-95 ${
                    isSpeaking
                      ? 'bg-emerald-500 text-black font-bold animate-pulse'
                      : 'hover:bg-zinc-800 text-zinc-200'
                  }`}
                  title="Click to Listen"
                >
                  <Volume2 className={`w-3.5 h-3.5 ${isSpeaking ? 'animate-bounce' : 'text-emerald-400'}`} />
                  <span>{isSpeaking ? dict.speaking : "Listen"}</span>
                </button>

                <div className="w-px h-4 bg-white/10 mx-1" />

                {/* Speak in ANY Indian Language Dropdown */}
                <div className="flex items-center gap-1 px-2 text-xs font-medium text-zinc-300">
                  <span className="text-[11px] text-zinc-500 font-mono hidden sm:inline">Voice:</span>
                  <select
                    value={config.lang}
                    onChange={(e) => {
                      const newLang = e.target.value;
                      setConfig({ ...config, lang: newLang });
                      handleSpeak(newLang);
                    }}
                    className="bg-transparent text-emerald-400 font-semibold text-xs focus:outline-none cursor-pointer pr-1"
                    title="Select Spoken Language"
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code} className="bg-zinc-950 text-white py-1">
                        {l.label} ({l.script})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

            </div>

            {/* Quick 1-Tap Voice Chips for Most Important Indian Languages */}
            <div className="relative mb-5">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2.5 pt-0.5 scrollbar-blend scroll-smooth">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 flex-shrink-0 mr-1 flex items-center gap-1 bg-zinc-900/80 px-2.5 py-1 rounded-md border border-white/5">
                  <Mic className="w-3 h-3 text-emerald-400" /> Tap to Hear:
                </span>
                {LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setConfig({ ...config, lang: l.code });
                      handleSpeak(l.code);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all duration-200 active:scale-95 flex items-center gap-1.5 border ${
                      config.lang === l.code
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 shadow-[0_0_12px_rgba(16,185,129,0.25)] font-semibold'
                        : 'bg-zinc-900/60 border-white/[0.08] text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }`}
                  >
                    <span className="text-xs">{l.flag}</span>
                    <span>{l.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Verdict Core */}
            <div className="flex flex-col sm:flex-row items-center gap-8 my-4">
              
              {/* Circular Gauge */}
              <div className="relative flex-shrink-0 flex items-center justify-center">
                <svg className="w-40 h-40 sm:w-44 sm:h-44 transform -rotate-90">
                  <circle
                    cx="50%"
                    cy="50%"
                    r={radius}
                    className="text-zinc-900"
                    strokeWidth="10"
                    stroke="currentColor"
                    fill="transparent"
                  />
                  <circle
                    cx="50%"
                    cy="50%"
                    r={radius}
                    className={`transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      needsWater ? 'text-rose-500' : 'text-emerald-400'
                    }`}
                    strokeWidth="10"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-4xl font-extrabold tracking-tighter text-white font-sans">
                    {soilMoisturePercentage}%
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-0.5">
                    Moisture
                  </span>
                </div>
              </div>

              {/* Massive Bold Headline */}
              <div className="text-center sm:text-left flex-1">
                <div className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-1">
                  Automated FAO-56 Verdict
                </div>
                <h2 className={`text-3xl sm:text-5xl font-black tracking-tighter uppercase leading-none mb-3 ${
                  needsWater ? 'text-rose-400 text-glow-rose' : 'text-emerald-400 text-glow-emerald'
                }`}>
                  {needsWater ? dict.waterTodayTitle : dict.noWaterTitle}
                </h2>
                <p className="text-sm sm:text-base text-zinc-400 font-normal leading-relaxed max-w-lg mb-4">
                  {needsWater ? dict.waterTodaySub : dict.noWaterSub}
                </p>
                
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs font-mono">
                  <span className="px-2.5 py-1 rounded bg-zinc-900 border border-white/10 text-zinc-400">
                    MAD Threshold: <strong className="text-amber-400">{madPercent}%</strong>
                  </span>
                  <span className="px-2.5 py-1 rounded bg-zinc-900 border border-white/10 text-zinc-400">
                    Depletion: <strong className={needsWater ? 'text-rose-400' : 'text-emerald-400'}>{depletionPercentage}%</strong>
                  </span>
                </div>
              </div>

            </div>

            {/* Quick Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-6 mt-6 border-t border-white/[0.08]">
              <div className="p-3.5 rounded-xl bg-zinc-900/50 border border-white/[0.06]">
                <div className="text-[11px] font-mono uppercase text-zinc-500 mb-1">{dict.recWater}</div>
                <div className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono">
                  {needsWater ? `${recWaterLitersPerM2} L/m²` : '0 L/m²'}
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-zinc-900/50 border border-white/[0.06]">
                <div className="text-[11px] font-mono uppercase text-zinc-500 mb-1">{dict.dripRuntime}</div>
                <div className="text-xl sm:text-2xl font-bold tracking-tight text-cyan-400 font-mono">
                  {needsWater ? `${dripHours} Hours` : '0 Hours'}
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-zinc-900/50 border border-white/[0.06] col-span-2 sm:col-span-1">
                <div className="text-[11px] font-mono uppercase text-zinc-500 mb-1">{dict.nextIrrigation}</div>
                <div className="text-sm sm:text-base font-bold text-amber-300">
                  {needsWater ? dict.today5pm : dict.tomorrowMorning}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 mt-6">
              <button
                onClick={() => setIsTwilioModalOpen(true)}
                className="w-full sm:w-auto px-5 py-3 rounded-xl font-bold text-xs sm:text-sm bg-white hover:bg-zinc-200 text-black transition active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg"
              >
                <PhoneCall className="w-4 h-4" />
                <span>{dict.sendCallBtn}</span>
              </button>

              <button
                onClick={handleTogglePump}
                className={`w-full sm:w-auto px-5 py-3 rounded-xl font-semibold text-xs sm:text-sm border transition active:scale-[0.98] flex items-center justify-center gap-2 ${
                  pumpActive
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/40 hover:bg-rose-500/20'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-white/10'
                }`}
              >
                <Power className={`w-3.5 h-3.5 ${pumpActive ? 'text-rose-400 animate-spin' : 'text-zinc-500'}`} />
                <span>{pumpActive ? dict.turnOff : dict.turnOn}</span>
              </button>
            </div>
          </SpotlightCard>

          {/* BENTO 2: Weather & Microclimate Capsule (Col Span 1) */}
          <SpotlightCard className="p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                  <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  Live Satellite Telemetry
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-white/10 text-zinc-400">
                  Open-Meteo
                </span>
              </div>

              <div className="mb-6">
                <div className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  <span className="truncate">{gpsLocationName || 'Detecting Live Microclimate...'}</span>
                </div>
                <div className="text-xs font-mono text-emerald-400 mt-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Real-Time Local Weather Active ({activeWeather?.lat ? `${activeWeather.lat}° N, ${activeWeather.lon}° E` : 'Live Satellite Feed'})</span>
                </div>
              </div>

              {/* Weather Data Matrix */}
              <div className="grid grid-cols-2 gap-3 mb-4 font-mono text-xs">
                <div className="p-3 rounded-xl bg-zinc-900/60 border border-white/[0.06]">
                  <div className="text-zinc-500 mb-1 flex items-center gap-1.5">
                    <Thermometer className="w-3.5 h-3.5 text-amber-400" /> Temp
                  </div>
                  <div className="text-lg font-bold text-white">{activeWeather.temp}°C</div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-900/60 border border-white/[0.06]">
                  <div className="text-zinc-500 mb-1 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-cyan-400" /> Humidity
                  </div>
                  <div className="text-lg font-bold text-white">{activeWeather.hum}%</div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-900/60 border border-white/[0.06]">
                  <div className="text-zinc-500 mb-1 flex items-center gap-1.5">
                    <Wind className="w-3.5 h-3.5 text-zinc-400" /> Wind Speed
                  </div>
                  <div className="text-lg font-bold text-white">{activeWeather.wind} m/s</div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-900/60 border border-white/[0.06]">
                  <div className="text-zinc-500 mb-1 flex items-center gap-1.5">
                    <Droplets className="w-3.5 h-3.5 text-emerald-400" /> Live ET₀
                  </div>
                  <div className="text-lg font-bold text-emerald-400">{activeWeather.et0} mm/d</div>
                </div>
              </div>

              {/* Real-time Rainfall Inflow & Scenario Testing */}
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-white/[0.06] mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CloudRain className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-xs font-mono text-zinc-400">Rainfall Inflow:</span>
                    <span className="text-xs font-bold text-white">{activeWeather.rainToday || 0}mm Today</span>
                  </div>
                  <span className="text-[11px] font-mono text-cyan-400 font-bold">{simulatedRain}mm Active</span>
                </div>
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/[0.04]">
                  <span className="text-[10px] font-mono uppercase text-zinc-500">Test Rainfall:</span>
                  <div className="flex items-center gap-1.5">
                    {[0, 15, 40].map((mm) => (
                      <button
                        key={mm}
                        type="button"
                        onClick={() => setSimulatedRain(mm)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition ${
                          simulatedRain === mm
                            ? 'bg-cyan-500 text-black font-bold'
                            : 'bg-zinc-800/80 border border-white/10 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {mm}mm
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* GPS Detection Button */}
            <div className="pt-4 border-t border-white/[0.08] flex items-center gap-2">
              <button
                onClick={handleDetectGPS}
                disabled={isLoadingWeather}
                className="flex-1 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-semibold text-zinc-200 transition active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Navigation className={`w-3.5 h-3.5 ${isLoadingWeather ? 'animate-spin text-amber-400' : 'text-cyan-400'}`} />
                <span>{isLoadingWeather ? 'Detecting Local Microclimate...' : 'Sync Live Local Weather'}</span>
              </button>
            </div>
          </SpotlightCard>

        </div>

        {/* Row 2: Farm Configuration Bento Grid (2-Column Layout) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* BENTO 3: Crop Type Selection */}
          <SpotlightCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono uppercase tracking-widest text-zinc-500">
                🌱 01 / {dict.lblCrop}
              </span>
              <span className="text-xs font-mono text-emerald-400 font-bold">Kc: {kc}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {cropKeys.map((cKey) => {
                const active = config.crop === cKey;
                const cInfo = dict.crops[cKey] || { name: cKey, emoji: '🌱' };
                return (
                  <button
                    key={cKey}
                    type="button"
                    onClick={() => setConfig({ ...config, crop: cKey })}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition active:scale-95 ${
                      active
                        ? 'bg-emerald-500/10 border-emerald-500/60 text-white'
                        : 'bg-zinc-900/60 border-white/[0.06] text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }`}
                  >
                    <span className="text-xl">{cInfo.emoji}</span>
                    <span className="font-semibold text-xs truncate text-white">{cInfo.name}</span>
                  </button>
                );
              })}
            </div>
          </SpotlightCard>

          {/* BENTO 4: Growth Stage & Soil Profile */}
          <SpotlightCard className="p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono uppercase tracking-widest text-zinc-500">
                  📅 02 / {dict.lblStage}
                </span>
                <span className="text-xs font-mono text-zinc-400">{dict.lblSoil}</span>
              </div>

              {/* Stage selector pills */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-1.5 mb-5">
                {stageKeys.map((sKey) => {
                  const active = config.stage === sKey;
                  const sInfo = dict.stages[sKey];
                  return (
                    <button
                      key={sKey}
                      onClick={() => setConfig({ ...config, stage: sKey })}
                      className={`w-full px-3 py-2 rounded-xl text-left border flex items-center justify-between text-xs font-semibold transition active:scale-[0.98] ${
                        active
                          ? 'bg-emerald-500/10 border-emerald-500/60 text-white'
                          : 'bg-zinc-900/50 border-white/[0.06] text-zinc-400 hover:text-white'
                      }`}
                    >
                      <span className="truncate">{sInfo.name}</span>
                      <span className="font-mono text-[11px] text-emerald-400">Kc {sInfo.kc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Soil Quick Dropdown */}
            <div className="pt-3 border-t border-white/[0.08]">
              <label className="block text-[11px] font-mono uppercase text-zinc-500 mb-1.5">
                Soil Profile & Retention
              </label>
              <select
                value={config.soil}
                onChange={(e) => setConfig({ ...config, soil: e.target.value })}
                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs font-medium text-white focus:outline-none cursor-pointer"
              >
                {soilKeys.map((sKey) => (
                  <option key={sKey} value={sKey} className="bg-zinc-950 text-white">
                    {dict.soils[sKey].name} ({dict.soils[sKey].retention})
                  </option>
                ))}
              </select>
            </div>
          </SpotlightCard>

        </div>

        {/* Row 3: Advanced FAO-56 Penman-Monteith Bento Deck */}
        <SpotlightCard className="p-6 sm:p-8">
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center text-emerald-400">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white tracking-tight">
                  FAO-56 Penman-Monteith Evapotranspiration Architecture
                </h4>
                <p className="text-xs text-zinc-500 font-mono">
                  UN FAO Irrigation & Drainage Paper No. 56 Mathematical Verification
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-mono text-zinc-300 flex items-center gap-1.5 transition"
            >
              <span>{showAdvanced ? "Collapse" : "Expand Model"}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Equation Ribbon */}
          <div className="mt-5 p-4 rounded-xl bg-black/60 border border-white/[0.08] font-mono text-xs sm:text-sm text-zinc-300 flex flex-wrap items-center gap-3">
            <span className="text-zinc-500">Live Equation:</span>
            <span className="px-2 py-0.5 rounded bg-zinc-900 border border-white/10 text-amber-400 font-bold">
              ET₀ {activeWeather.et0.toFixed(2)} mm/d
            </span>
            <span className="text-zinc-500">×</span>
            <span className="px-2 py-0.5 rounded bg-zinc-900 border border-white/10 text-cyan-400 font-bold">
              Kc {kc.toFixed(2)}
            </span>
            <span className="text-zinc-500">=</span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 font-black">
              ETc {etc.toFixed(2)} mm/day
            </span>
            <span className="text-xs text-zinc-500 ml-auto font-sans">
              (Live Open-Meteo Satellite Feed)
            </span>
          </div>

          {/* 7-Day Chart & Root Moisture Stack */}
          {showAdvanced && (
            <div className="mt-6 pt-6 border-t border-white/[0.08] space-y-6 animate-fadeIn">
              <div>
                <div className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-3">
                  7-Day Root Zone Depletion (%) vs 50% Management Allowable Depletion (MAD)
                </div>
                <div className="bg-black/40 rounded-2xl p-5 border border-white/[0.06]">
                  <div className="flex items-end justify-between h-40 gap-2 sm:gap-4 pt-4 pb-2">
                    {trendData.map((t) => (
                      <div key={t.day} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                        <span className="text-[10px] font-mono font-bold text-zinc-400">{t.depletion}%</span>
                        <div className="w-full max-w-[42px] bg-zinc-950 rounded-t-xl h-28 flex items-end overflow-hidden p-1 border border-white/[0.06]">
                          <div
                            className={`w-full rounded-t-lg transition-all duration-700 ${
                              t.isExceeded
                                ? 'bg-gradient-to-t from-rose-600 to-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.4)]'
                                : 'bg-gradient-to-t from-emerald-600 to-emerald-400'
                            }`}
                            style={{ height: `${t.depletion}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-zinc-500">{t.day}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/[0.06] flex justify-center gap-6 text-xs text-zinc-500 font-mono">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Depletion &lt; 50% (Adequate)</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500" /> Depletion &ge; 50% (Irrigate)</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </SpotlightCard>

      </main>

      {/* 📞 Floating Twilio Modal */}
      <TwilioModal
        isOpen={isTwilioModalOpen}
        onClose={() => setIsTwilioModalOpen(false)}
        result={result}
        currentLang={config.lang}
      />

      {/* Floating Spring Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl bg-zinc-900 border border-white/20 text-white font-mono text-xs font-bold backdrop-blur-2xl shadow-2xl flex items-center gap-2 animate-bounce">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-white/[0.08] py-8 text-center text-xs text-zinc-600 font-mono">
        Kisan JalDrishti • FAO-56 Penman-Monteith Precision Engine • Built for 140M+ Indian Farmers
      </footer>

    </div>
  );
}
