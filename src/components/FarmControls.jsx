import React from 'react';
import { 
  Sliders, 
  MapPin, 
  CloudRain, 
  Sun, 
  Wind, 
  Layers, 
  Check, 
  Thermometer, 
  Activity 
} from 'lucide-react';
import { translations } from '../utils/translations';
import { CITY_WEATHER_DATABASE } from '../utils/fao56Engine';

export default function FarmControls({
  config,
  onChangeConfig,
  simulatedRain,
  setSimulatedRain
}) {
  const { city, crop, soil, stage } = config;
  const dict = translations[config.lang] || translations.en;
  const currentWeather = CITY_WEATHER_DATABASE[city] || CITY_WEATHER_DATABASE.Mandya;

  const handleChange = (field, value) => {
    onChangeConfig({ ...config, [field]: value });
  };

  const cropKeys = ['Tomato', 'Rice', 'Corn', 'Wheat', 'Sugarcane', 'Cotton', 'Chili'];
  const soilKeys = ['Red', 'Black', 'Loam', 'Sandy', 'Clay'];
  const stageKeys = ['Initial', 'Development', 'MidSeason', 'Late'];

  return (
    <section className="relative z-10 mb-8 bg-slate-900/70 backdrop-blur-xl border border-slate-700/60 p-5 sm:p-7 rounded-[32px] shadow-2xl">
      
      {/* Title & Microclimate weather strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sliders className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
              {dict.farmConfigTitle}
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            {dict.farmConfigSub}
          </p>
        </div>

        {/* Live Weather Capsule for the selected location */}
        <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-2.5 shadow-inner">
          <div className="flex items-center gap-1.5 text-xs text-amber-300 font-bold">
            <Thermometer className="w-3.5 h-3.5 text-amber-400" />
            {currentWeather.temp}°C
          </div>
          <div className="w-px h-3.5 bg-slate-800" />
          <div className="flex items-center gap-1.5 text-xs text-cyan-300 font-bold">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            {currentWeather.hum}% RH
          </div>
          <div className="w-px h-3.5 bg-slate-800" />
          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-bold">
            <Wind className="w-3.5 h-3.5 text-slate-400" />
            {currentWeather.wind} m/s
          </div>
        </div>
      </div>

      <div className="space-y-6">
        
        {/* 1. Location / Weather Station Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            {dict.lblCity}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Object.keys(dict.cities).map((cityKey) => {
              const isSelected = city === cityKey;
              return (
                <button
                  key={cityKey}
                  type="button"
                  onClick={() => handleChange('city', cityKey)}
                  className={`p-2.5 rounded-xl text-left border text-xs sm:text-sm font-semibold transition active:scale-95 ${
                    isSelected
                      ? 'bg-emerald-500/20 border-emerald-500/80 text-white shadow-md shadow-emerald-950/40'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold truncate text-white">{cityKey}</div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {dict.cities[cityKey].split(',')[1] || dict.cities[cityKey]}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Visual Crop Type Selector Cards */}
        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <span>🌱</span>
            {dict.lblCrop}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {cropKeys.map((cropKey) => {
              const isSelected = crop === cropKey;
              const cropInfo = dict.crops[cropKey] || { name: cropKey, emoji: '🌱' };
              return (
                <button
                  key={cropKey}
                  type="button"
                  onClick={() => handleChange('crop', cropKey)}
                  className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1 active:scale-95 ${
                    isSelected
                      ? 'bg-gradient-to-b from-emerald-500/20 to-teal-500/10 border-emerald-500 text-white shadow-lg shadow-emerald-950/40'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <span className="text-2xl transform transition-transform group-hover:scale-110">
                    {cropInfo.emoji}
                  </span>
                  <span className="font-bold text-xs truncate max-w-full text-white">
                    {cropInfo.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Crop Growth Stage Interactive Stepper */}
        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <span>📅</span>
            {dict.lblStage}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {stageKeys.map((stageKey) => {
              const isSelected = stage === stageKey;
              const stageInfo = dict.stages[stageKey];
              return (
                <button
                  key={stageKey}
                  type="button"
                  onClick={() => handleChange('stage', stageKey)}
                  className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between active:scale-95 ${
                    isSelected
                      ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-md shadow-emerald-950/40'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white truncate">
                      {stageInfo.name}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Kc: <strong className="text-emerald-400">{stageInfo.kc}</strong></span>
                    <span className="text-[10px] text-slate-500">{stageInfo.desc.split('(')[1]?.replace(')', '') || ''}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Soil Profile Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            {dict.lblSoil}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {soilKeys.map((soilKey) => {
              const isSelected = soil === soilKey;
              const soilInfo = dict.soils[soilKey];
              return (
                <button
                  key={soilKey}
                  type="button"
                  onClick={() => handleChange('soil', soilKey)}
                  className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between active:scale-95 ${
                    isSelected
                      ? 'bg-cyan-500/20 border-cyan-500 text-white shadow-md shadow-cyan-950/40'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-xs text-white mb-0.5 truncate">
                    {soilInfo.name}
                  </div>
                  <div className="text-[10px] text-cyan-400/90 font-medium">
                    {soilInfo.retention.split('(')[1]?.replace(')', '') || soilInfo.retention}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. Interactive Rainfall Simulation Bar */}
        <div className="pt-4 border-t border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CloudRain className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                {dict.simRain}: <strong className="text-cyan-400">{simulatedRain} mm</strong>
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setSimulatedRain(0)}
                className={`flex-1 sm:flex-initial px-3.5 py-2 text-xs rounded-xl font-bold transition ${
                  simulatedRain === 0
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-950/40'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                ☀️ 0mm (Dry)
              </button>
              <button
                type="button"
                onClick={() => setSimulatedRain(15)}
                className={`flex-1 sm:flex-initial px-3.5 py-2 text-xs rounded-xl font-bold transition ${
                  simulatedRain === 15
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-950/40'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                🌦️ 15mm (Rain)
              </button>
              <button
                type="button"
                onClick={() => setSimulatedRain(40)}
                className={`flex-1 sm:flex-initial px-3.5 py-2 text-xs rounded-xl font-bold transition ${
                  simulatedRain === 40
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950/40'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                🌧️ 40mm (Heavy)
              </button>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
