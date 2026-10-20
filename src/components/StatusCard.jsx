import React, { useState } from 'react';
import { 
  Droplets, 
  CheckCircle2, 
  Volume2, 
  VolumeX, 
  PhoneCall, 
  Clock, 
  Gauge, 
  Power,
  Waves
} from 'lucide-react';
import { translations } from '../utils/translations';

export default function StatusCard({
  result,
  currentLang,
  onTriggerTwilio,
  pumpActive,
  onTogglePump
}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const dict = translations[currentLang] || translations.en;
  const { 
    needsWater, 
    soilMoisturePercentage, 
    depletionPercentage, 
    recWaterLitersPerM2, 
    dripHours, 
    madPercent 
  } = result;

  // Web Speech API for low-literacy farmers
  const speakStatus = () => {
    if (isSpeaking) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const textToSpeak = `${needsWater ? dict.waterTodayTitle : dict.noWaterTitle}. ${needsWater ? dict.waterTodaySub : dict.noWaterSub}. ${dict.recWater}: ${recWaterLitersPerM2} liters per square meter. ${dict.dripRuntime}: ${dripHours} hours.`;
    
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = 0.88;
      const langCodes = { en: 'en-IN', hi: 'hi-IN', kn: 'kn-IN', ta: 'ta-IN', te: 'te-IN', mr: 'mr-IN' };
      utterance.lang = langCodes[currentLang] || 'en-IN';
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } else {
      alert(textToSpeak);
    }
  };

  // SVG Gauge calculations
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (soilMoisturePercentage / 100) * circumference;

  return (
    <section className="relative z-10 mb-8">
      {/* Massive Status Card Container */}
      <div
        className={`relative overflow-hidden rounded-[36px] p-6 sm:p-9 shadow-2xl transition-all duration-700 border-2 ${
          needsWater
            ? 'border-rose-500/70 bg-gradient-to-b from-rose-950/80 via-slate-900/95 to-slate-950 shadow-rose-950/50'
            : 'border-emerald-500/70 bg-gradient-to-b from-emerald-950/80 via-slate-900/95 to-slate-950 shadow-emerald-950/50'
        }`}
      >
        {/* Ambient Radial Background Light */}
        <div
          className={`absolute -top-24 -left-24 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-30 ${
            needsWater ? 'bg-rose-500' : 'bg-emerald-400'
          }`}
        />
        <div
          className={`absolute -bottom-24 -right-24 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-20 ${
            needsWater ? 'bg-amber-500' : 'bg-teal-400'
          }`}
        />

        {/* Top Floating Actions: Audio Assist & Valve State Pill */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 mb-6">
          {/* Smart Valve Directive Badge */}
          <div
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black tracking-wider uppercase border shadow-md ${
              needsWater
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${needsWater ? 'bg-rose-400 animate-ping' : 'bg-emerald-400'}`} />
            {needsWater ? dict.valveOpen : dict.valveKeepClosed}
          </div>

          {/* Voice Assist Button with animated sound wave bars */}
          <button
            onClick={speakStatus}
            className={`group inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs sm:text-sm backdrop-blur-md border shadow-lg transition active:scale-95 ${
              isSpeaking
                ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                : 'bg-slate-800/80 hover:bg-slate-700/80 text-white border-slate-700'
            }`}
          >
            {isSpeaking ? (
              <div className="flex items-center gap-1">
                <span className="w-1 h-3.5 bg-slate-950 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1 h-4 bg-slate-950 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1 h-2.5 bg-slate-950 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            )}
            <span>{isSpeaking ? dict.speaking : dict.listenBtn}</span>
          </button>
        </div>

        {/* Center Content: Circular Radial Gauge & Massive Status */}
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-center gap-6 sm:gap-8 my-3">
          
          {/* Radial Moisture Gauge */}
          <div className="relative flex-shrink-0 flex items-center justify-center">
            <svg className="w-36 h-36 sm:w-44 sm:h-44 transform -rotate-90">
              <circle
                cx="50%"
                cy="50%"
                r={radius}
                className="text-slate-800"
                strokeWidth="10"
                stroke="currentColor"
                fill="transparent"
              />
              <circle
                cx="50%"
                cy="50%"
                r={radius}
                className={`transition-all duration-1000 ease-out ${
                  needsWater ? 'text-rose-500' : 'text-emerald-400'
                }`}
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
              />
            </svg>

            {/* Inner Gauge Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                {soilMoisturePercentage}%
              </span>
              <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Soil Moisture
              </span>
            </div>
          </div>

          {/* Massive Verdict Text */}
          <div className="text-center md:text-left max-w-xl">
            <div className="inline-flex items-center gap-2 mb-2">
              {needsWater ? (
                <span className="text-3xl sm:text-4xl animate-bounce">💧</span>
              ) : (
                <span className="text-3xl sm:text-4xl">✅</span>
              )}
              <h2
                className={`text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight uppercase leading-none drop-shadow-lg ${
                  needsWater ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {needsWater ? dict.waterTodayTitle : dict.noWaterTitle}
              </h2>
            </div>

            <p className="text-slate-200 text-sm sm:text-lg font-medium leading-relaxed mb-4">
              {needsWater ? dict.waterTodaySub : dict.noWaterSub}
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-xs">
              <span className="px-3 py-1 rounded-lg bg-slate-900/80 border border-slate-700/80 text-slate-300 font-semibold">
                MAD Limit: <strong className="text-amber-400">{madPercent}%</strong>
              </span>
              <span className="px-3 py-1 rounded-lg bg-slate-900/80 border border-slate-700/80 text-slate-300 font-semibold">
                Current Depletion: <strong className={needsWater ? 'text-rose-400' : 'text-emerald-400'}>{depletionPercentage}%</strong>
              </span>
            </div>
          </div>

        </div>

        {/* Essential Farmer Metrics Grid */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 gap-3.5 max-w-2xl mx-auto text-left mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-950/70 backdrop-blur-md rounded-2xl p-3.5 sm:p-4 border border-slate-800/80 hover:border-slate-700 transition shadow-inner">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">
              <Droplets className="w-3.5 h-3.5 text-emerald-400" />
              {dict.recWater}
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-400">
              {needsWater ? `${recWaterLitersPerM2} L / m²` : '0 L / m²'}
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              {needsWater ? 'Target: ~180k L/ha' : 'Optimal Capacity'}
            </div>
          </div>

          <div className="bg-slate-950/70 backdrop-blur-md rounded-2xl p-3.5 sm:p-4 border border-slate-800/80 hover:border-slate-700 transition shadow-inner">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              {dict.dripRuntime}
            </div>
            <div className="text-xl sm:text-2xl font-black text-cyan-400">
              {needsWater ? `${dripHours} Hours` : '0 Hours'}
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              {needsWater ? 'Drip Emitter 4 LPH' : 'No runtime required'}
            </div>
          </div>

          <div className="bg-slate-950/70 backdrop-blur-md rounded-2xl p-3.5 sm:p-4 border border-slate-800/80 hover:border-slate-700 transition shadow-inner col-span-2 sm:col-span-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">
              <Gauge className="w-3.5 h-3.5 text-amber-300" />
              {dict.nextIrrigation}
            </div>
            <div className="text-base sm:text-lg font-bold text-amber-300">
              {needsWater ? dict.today5pm : dict.tomorrowMorning}
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Automated Check Cycle
            </div>
          </div>
        </div>

        {/* Action Buttons: Voice Call Simulation & IoT Smart Pump Controller */}
        <div className="relative z-10 mt-7 pt-5 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          {/* Twilio Voice Simulator Trigger */}
          <button
            onClick={onTriggerTwilio}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-xl shadow-emerald-950/50 transition transform active:scale-95 flex items-center justify-center gap-2.5"
          >
            <PhoneCall className="w-4 h-4 stroke-[2.5]" />
            <span>{dict.sendCallBtn}</span>
          </button>

          {/* Smart Pump Controller Switch */}
          <button
            onClick={onTogglePump}
            className={`w-full sm:w-auto px-5 py-3.5 rounded-2xl font-bold text-sm border transition flex items-center justify-center gap-2.5 shadow-lg active:scale-95 ${
              pumpActive
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 hover:bg-rose-500/30'
                : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border-slate-700'
            }`}
          >
            <Power className={`w-4 h-4 ${pumpActive ? 'text-rose-400 animate-spin' : 'text-slate-400'}`} />
            <span>{pumpActive ? dict.turnOff : dict.turnOn}</span>
          </button>
        </div>

      </div>
    </section>
  );
}
