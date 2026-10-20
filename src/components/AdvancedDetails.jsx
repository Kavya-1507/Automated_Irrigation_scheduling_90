import React, { useState } from 'react';
import { 
  ChevronDown, 
  BarChart3, 
  Binary, 
  Droplet, 
  Compass, 
  Layers, 
  Sun, 
  Wind, 
  Thermometer, 
  Gauge 
} from 'lucide-react';
import { translations } from '../utils/translations';

export default function AdvancedDetails({ result, currentLang }) {
  const [isOpen, setIsOpen] = useState(false);
  const dict = translations[currentLang] || translations.en;
  const { 
    etc, 
    et0, 
    kc, 
    awc, 
    fc, 
    wp, 
    rootDepth, 
    taw, 
    raw, 
    depletionPercentage, 
    soilMoisturePercentage, 
    madPercent, 
    weather, 
    trendData 
  } = result;

  return (
    <section className="relative z-10 mb-8">
      {/* Collapsible Trigger Card */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-slate-900/70 hover:bg-slate-900 backdrop-blur-xl border border-slate-700/60 text-slate-300 hover:text-white p-4 sm:p-5 rounded-[28px] font-bold flex items-center justify-between transition-all duration-300 shadow-xl group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div className="text-left">
            <div className="text-sm sm:text-base font-black text-white">
              {isOpen ? dict.advToggleHide : dict.advToggleShow}
            </div>
            <div className="text-[11px] sm:text-xs text-slate-400 font-medium">
              Penman-Monteith $ET_c$ breakdown, root zone soil profile & 7-day model
            </div>
          </div>
        </div>

        <div
          className={`w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center transition-transform duration-300 ${
            isOpen ? 'rotate-180 bg-emerald-500/20 text-emerald-400' : 'text-slate-400'
          }`}
        >
          <ChevronDown className="w-5 h-5" />
        </div>
      </button>

      {/* Expanded Technical Details Panel */}
      {isOpen && (
        <div className="mt-3.5 bg-slate-900/90 backdrop-blur-2xl border border-slate-700/80 p-5 sm:p-7 rounded-[32px] shadow-2xl space-y-7 animate-fadeIn">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h4 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <Binary className="w-5 h-5 text-emerald-400" />
                {dict.advHeading}
              </h4>
              <p className="text-xs text-slate-400">
                {dict.advSub}
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              FAO Paper 56
            </span>
          </div>

          {/* 1. Live FAO-56 Penman-Monteith Formula Card */}
          <div className="bg-slate-950/90 rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-inner">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Evapotranspiration Transfer Equation
            </div>
            <div className="font-mono text-xs sm:text-sm text-slate-200 bg-slate-900 p-3.5 rounded-xl border border-slate-800/80 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-slate-400">ETc = ET₀ × Kc :</span>
              <span className="text-amber-400 font-bold">{et0.toFixed(2)} mm/day</span>
              <span className="text-slate-500">×</span>
              <span className="text-cyan-400 font-bold">{kc.toFixed(2)}</span>
              <span className="text-slate-500">=</span>
              <span className="text-emerald-400 font-black text-sm sm:text-base">
                {etc.toFixed(2)} mm/day
              </span>
              <span className="text-[11px] text-slate-500 ml-auto font-sans">
                (Crop Evapotranspiration Rate)
              </span>
            </div>
          </div>

          {/* 2. Key Agronomic Parameters Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800">
              <div className="text-[11px] text-slate-400 uppercase font-semibold mb-0.5">Reference ET₀</div>
              <div className="text-lg font-black text-white">{et0} mm/d</div>
              <div className="text-[10px] text-slate-500">Grass reference</div>
            </div>

            <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800">
              <div className="text-[11px] text-slate-400 uppercase font-semibold mb-0.5">Crop Factor (Kc)</div>
              <div className="text-lg font-black text-emerald-400">{kc}</div>
              <div className="text-[10px] text-slate-500">Growth coefficient</div>
            </div>

            <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800">
              <div className="text-[11px] text-slate-400 uppercase font-semibold mb-0.5">Root Depth (Zr)</div>
              <div className="text-lg font-black text-cyan-400">{rootDepth} m</div>
              <div className="text-[10px] text-slate-500">Active root zone</div>
            </div>

            <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800">
              <div className="text-[11px] text-slate-400 uppercase font-semibold mb-0.5">Readily Water (RAW)</div>
              <div className="text-lg font-black text-amber-400">{raw} mm</div>
              <div className="text-[10px] text-slate-500">50% MAD fraction</div>
            </div>
          </div>

          {/* 3. Soil Moisture Architecture Schematic */}
          <div>
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              {dict.soilProfileTitle}
            </div>

            <div className="bg-slate-950/90 rounded-2xl p-4 sm:p-5 border border-slate-800">
              {/* Stacked Soil Moisture Bar */}
              <div className="relative w-full h-8 bg-slate-900 rounded-xl overflow-hidden border border-slate-700/80 mb-3">
                {/* Available Water portion */}
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 transition-all duration-700"
                  style={{ width: `${soilMoisturePercentage}%` }}
                />
                {/* 50% MAD Threshold Marker */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-10 shadow-[0_0_8px_#f43f5e]"
                  style={{ left: `${madPercent}%` }}
                >
                  <span className="absolute -top-1 -translate-x-1/2 px-1 rounded bg-rose-600 text-[8px] font-black text-white uppercase">
                    MAD
                  </span>
                </div>
              </div>

              {/* Moisture Bar Legend */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400">{dict.fieldCapacity}</div>
                  <div className="font-bold text-white">{fc}% Vol</div>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400">{dict.currentMoisture}</div>
                  <div className={`font-bold ${soilMoisturePercentage < 50 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {soilMoisturePercentage}%
                  </div>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400">{dict.madThreshold}</div>
                  <div className="font-bold text-amber-400">{madPercent}%</div>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400">{dict.wiltingPoint}</div>
                  <div className="font-bold text-slate-400">{wp}% Vol</div>
                </div>
              </div>
            </div>
          </div>

          {/* 4. 7-Day Root Zone Depletion Timeline Chart */}
          <div>
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
                {dict.chartTitle}
              </span>
              <span className="text-[11px] text-slate-500 font-normal">
                Depletion $\ge 50\%$ triggers watering
              </span>
            </div>

            <div className="bg-slate-950/90 rounded-2xl p-4 sm:p-5 border border-slate-800">
              <div className="flex items-end justify-between h-44 gap-2 sm:gap-4 pt-6 pb-2">
                {trendData.map((item) => (
                  <div key={item.day} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <span className="text-[10px] sm:text-xs font-bold text-slate-300">
                      {item.depletion}%
                    </span>
                    
                    <div className="w-full max-w-[42px] bg-slate-900 rounded-t-xl h-28 flex items-end overflow-hidden p-1 border border-slate-800/80">
                      <div
                        className={`w-full rounded-t-lg transition-all duration-700 ${
                          item.isExceeded
                            ? 'bg-gradient-to-t from-rose-600 to-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.4)]'
                            : 'bg-gradient-to-t from-emerald-600 to-emerald-400'
                        }`}
                        style={{ height: `${item.depletion}%` }}
                      />
                    </div>

                    <span className="text-[10px] sm:text-xs font-semibold text-slate-400 truncate max-w-full">
                      {item.day}
                    </span>
                  </div>
                ))}
              </div>

              {/* Chart Legend */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-5 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm" />
                  <span>Adequate Root Zone Moisture (&lt;50% Depletion)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm" />
                  <span>Depletion &ge; 50% MAD (Water Needed)</span>
                </div>
              </div>
            </div>
          </div>

          {/* 5. Ag-Sensors Microclimate Weather Feed Grid */}
          <div>
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              {dict.weatherTitle}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
                <span className="text-slate-400 font-medium">Ambient Temp</span>
                <span className="text-base font-bold text-white mt-1">{weather.temp}°C</span>
              </div>
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
                <span className="text-slate-400 font-medium">Relative Humidity</span>
                <span className="text-base font-bold text-white mt-1">{weather.hum}%</span>
              </div>
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
                <span className="text-slate-400 font-medium">Wind Speed (2m)</span>
                <span className="text-base font-bold text-white mt-1">{weather.wind} m/s</span>
              </div>
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
                <span className="text-slate-400 font-medium">Solar Radiation ($R_s$)</span>
                <span className="text-base font-bold text-white mt-1">{weather.rad} MJ/m²</span>
              </div>
            </div>
          </div>

        </div>
      )}
    </section>
  );
}
