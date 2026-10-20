# 🌾 Kisan JalDrishti — FAO-56 Precision Irrigation System

> **An automated, AI & Penman-Monteith evapotranspiration irrigation scheduling engine tailored for Indian farmers with high-contrast visual accessibility, 12 regional voice engines, and real-time satellite telemetry.**

---

## ⚡ Quick Start for Reviewers

### 1. Requirements
* **Node.js**: v18.0.0 or higher (v20+ recommended)
* **npm**: v9.0.0 or higher
* **Browser**: Chrome, Edge, Brave, or Firefox

### 2. Run in 2 Simple Steps

```bash
# 1. Install dependencies (if opening on a fresh machine)
npm install

# 2. Launch development server with HMR and audio proxy
npm run dev
```

Open your browser and navigate to:
👉 **`http://localhost:5173/`**

---

## 🏗️ Architecture & Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18 (JSX, Hooks) | Reactive state, Bento Grid layout, component modularity |
| **Build Tool & Server** | Vite 5 | Sub-second HMR, Rollup bundler, custom TTS streaming proxy |
| **Styling & UI** | Tailwind CSS v3 + PostCSS | Dark Antigravity aesthetic, glassmorphism, blended scrollbars |
| **Weather & $ET_0$ Telemetry** | Open-Meteo API | Free global satellite feeds for temperature, humidity, wind & FAO-56 $ET_0$ |
| **Geolocation** | W3C Geolocation API | Precise farm GPS auto-detection |
| **Voice & Multilingual** | Local `/api/tts` Proxy + Web Speech API | Authentic native audio streaming in 12 Indian languages |
| **Mathematical Engine** | UN FAO-56 Penman-Monteith | Crop water requirement ($ET_c$), 50% MAD soil moisture threshold |

---

## 📂 Project Structure

```text
irrigation-app/
├── index.html                   # HTML entry point with Google Fonts (Geist & JetBrains Mono)
├── package.json                 # Project dependencies and npm scripts
├── postcss.config.js            # PostCSS configuration for Tailwind & Autoprefixer
├── tailwind.config.js           # Tailwind design tokens and responsive breakpoints
├── vite.config.js               # Vite config + native /api/tts streaming proxy middleware
│
├── src/
│   ├── App.jsx                  # Main application: state, Bento layout, gauge & header
│   ├── main.jsx                 # React root rendering entry point
│   ├── index.css                # Custom blended scrollbars (.scrollbar-blend) & dot-grid
│   │
│   ├── components/
│   │   ├── LoginPage.jsx        # Farmer auth portal (Mobile OTP, Kisan ID, 1-tap demo personas)
│   │   ├── TwilioModal.jsx      # Simulated Twilio IVR voice call modal
│   │   ├── StatusCard.jsx       # Centerpiece verdict hero card
│   │   ├── FarmControls.jsx     # Soil, crop, and growth stage selectors
│   │   ├── AdvancedDetails.jsx  # FAO-56 math formula breakdown & 7-day depletion chart
│   │   └── Header.jsx           # Global navigation with language selector & user badge
│   │
│   ├── services/
│   │   ├── voiceService.js      # Dual-engine voice audio controller (/api/tts + Web Speech)
│   │   └── weatherService.js    # Open-Meteo API integration & GPS auto-detection
│   │
│   └── utils/
│       ├── fao56Engine.js       # Core FAO-56 Penman-Monteith mathematics & crop coefficients
│       └── translations.js      # Full localization dictionary for 12 Indian languages
```

---

## 🧪 Demonstration Flow for Reviewers

Follow this sequence to showcase the system to your reviewer:

1. **Farmer Authentication (`LoginPage.jsx`):**
   - Click any **1-Tap Demo Farmer** (e.g., **👨‍🌾 Ramesh Patel — Mandya, Karnataka**).
   - Alternatively, test **Mobile OTP** by entering any 10-digit number and clicking **Auto-fill 1234**.

2. **The FAO-56 Core Verdict:**
   - Observe the massive color-coded centerpiece card:
     - 🔴 **WATER YOUR CROP TODAY** (Depletion $> 50\%$ MAD threshold)
     - 🟢 **NO NEED TO WATER TODAY** (Moisture is optimal)
   - Toggle **Simulate Rain (25mm)** to see the verdict dynamically turn green.

3. **12 Indian Regional Voices ("🎙️ Tap to Hear"):**
   - Click **`[🌿 ಕನ್ನಡ]`**, **`[🌱 తెలుగు]`**, **`[🪴 தமிழ்]`**, **`[🌾 ਪੰਜਾਬੀ]`**, **`[🚜 मराठी]`**, or **`[💧 ગુજરાતી]`**.
   - Notice the authentic native accent streamed via `/api/tts` with zero CORS or hotlink blocks.
   - Note the **ultra-thin emerald scrollbar** seamlessly blended into the dark card.

4. **Live Satellite Weather & GPS:**
   - Click **"Auto-Detect Farm GPS"** to fetch live weather telemetry from your actual device coordinates via Open-Meteo.
   - Switch between farming hubs (Mandya, Nashik, Ludhiana, Pune, Anantapur) to see live satellite $ET_0$ values recalculate.

5. **Twilio Voice Call Simulation:**
   - Click **"Simulate Twilio Voice Call"** to view the outbound IVR speech script in the farmer's selected language.

6. **Logout & Session:**
   - Click the **`Exit`** button in the top right to smoothly return to the Login portal.
