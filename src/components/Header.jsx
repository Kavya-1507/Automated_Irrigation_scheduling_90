import React from 'react';
import { Globe, Radio, Sparkles, Sprout } from 'lucide-react';
import { translations } from '../utils/translations';

const LANGUAGES = [
  { code: 'en', label: 'English', script: 'EN' },
  { code: 'hi', label: 'हिंदी', script: 'Hindi' },
  { code: 'kn', label: 'ಕನ್ನಡ', script: 'Kannada' },
  { code: 'ta', label: 'தமிழ்', script: 'Tamil' },
  { code: 'te', label: 'తెలుగు', script: 'Telugu' },
  { code: 'mr', label: 'मराठी', script: 'Marathi' }
];

export default function Header({ currentLang, setLanguage, selectedCity }) {
  const dict = translations[currentLang] || translations.en;

  return (
    <header className="relative z-20 mb-6 bg-slate-900/70 backdrop-blur-xl border border-slate-700/60 rounded-3xl p-4 sm:p-5 shadow-2xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        
        {/* Brand Identity */}
        <div className="flex items-center gap-3.5">
          <div className="relative group">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 flex items-center justify-center text-3xl shadow-lg shadow-emerald-950/60 p-2.5 transform transition-transform group-hover:scale-105">
              <Sprout className="w-8 h-8 text-slate-950 stroke-[2.5]" />
            </div>
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-slate-900 rounded-full animate-ping" />
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-1.5">
                {dict.appTitle}
              </h1>
              <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                <Sparkles className="w-3 h-3" /> Pro AgTech
              </span>
            </div>
            <p className="text-xs sm:text-sm text-emerald-400/90 font-medium">
              {dict.appSubtitle}
            </p>
          </div>
        </div>

        {/* Status Telemetry & Multi-Language Selector */}
        <div className="w-full sm:w-auto flex flex-wrap items-center justify-between sm:justify-end gap-2.5">
          
          {/* Live Engine Status Pill */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="font-semibold text-emerald-400">{dict.engineStatus}</span>
          </div>

          {/* Language Selector Dropdown */}
          <div className="flex items-center gap-2 bg-slate-950/80 hover:bg-slate-950 border border-slate-700/80 rounded-2xl px-3 py-2 shadow-inner transition-colors">
            <Globe className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <label htmlFor="lang-select" className="sr-only">Select Language</label>
            <select
              id="lang-select"
              value={currentLang}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-transparent text-white font-bold text-sm sm:text-base focus:outline-none cursor-pointer pr-2"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code} className="bg-slate-900 text-white py-1">
                  {lang.label} ({lang.script})
                </option>
              ))}
            </select>
          </div>

        </div>

      </div>
    </header>
  );
}
