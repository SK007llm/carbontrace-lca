# CarbonTrace LCA — Embodied Carbon Calculator

A React + Vite + Supabase web app for calculating embodied carbon in Indian building construction.
Built as a capstone project tool for LCA (Life Cycle Assessment) methodology.

---

## 🚀 Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure Supabase
1. Go to [supabase.com](https://supabase.com) → Create new project
2. In Supabase dashboard → SQL Editor → paste the SQL from `src/lib/supabase.js` (all the commented SQL at the top)
3. Run the SQL to create tables and seed emission factors
4. Go to Settings → API → copy URL and anon key
5. Copy `.env.example` to `.env` and fill in your credentials:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

> **Note:** The app works without Supabase too — it falls back to built-in emission factors and local state. Supabase enables persistence across sessions.

### 3. Run locally
```bash
npm run dev
```

### 4. Build for production
```bash
npm run build
npm run preview
```

---

## 📁 Project Structure

```
src/
├── lib/
│   ├── supabase.js        # Supabase client + schema SQL (commented)
│   └── calculations.js    # LCA calculation engine, transport EFs, benchmarks
├── components/
│   └── TopBar.jsx         # Navigation header
├── pages/
│   ├── HomePage.jsx       # Landing page with formula reference
│   ├── InputPage.jsx      # Screen 1: Project info + BOQ entry
│   ├── ResultsPage.jsx    # Screen 2: Charts, benchmarks, export
│   └── EFTablePage.jsx    # Screen 3: EF Master Table (editable)
├── App.jsx                # Router + layout
├── main.jsx               # Entry point
└── index.css              # Global styles
```

---

## 🧮 Calculation Methodology

```
Material CO₂ (kg) = Quantity (tonnes) × Emission Factor (kg CO₂e/tonne)
Transport CO₂ (kg) = Quantity (tonnes) × Distance (km) × Transport EF

Transport EFs:
  Road: 0.085 kg CO₂e/tonne·km
  Rail: 0.030 kg CO₂e/tonne·km
  Sea:  0.012 kg CO₂e/tonne·km

Total Embodied Carbon = Σ Material CO₂ + Σ Transport CO₂
Benchmark Metric = Total CO₂ (kg) / Built-up Area (m²)
```

---

## 📊 Benchmarks

| Reference | Range |
|-----------|-------|
| Röck et al. (2020) — Global residential | 200–600 kg CO₂e/m² |
| Indian residential — Typical | 280–450 kg CO₂e/m² |
| Net-zero 2050 aligned target | < 300 kg CO₂e/m² |

---

## 🗄️ Supabase Tables

- `emission_factors` — EF master table (22 seed entries for Indian materials)
- `projects` — Project metadata (name, location, area)
- `boq_items` — Bill of quantities line items with calculated CO₂ values

---

## 📦 Dependencies

- **React 18** + **React Router** — UI and routing
- **Recharts** — Bar charts and pie charts
- **jsPDF + jspdf-autotable** — PDF export
- **XLSX (SheetJS)** — Excel export
- **@supabase/supabase-js** — Database persistence
- **Lucide React** — Icons

---

## 🚢 Deployment (Vercel / Netlify)

1. Push to GitHub
2. Connect to Vercel/Netlify
3. Add environment variables: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
4. Deploy!

---

## 📚 Data Sources

- **ICE Database v3.0** — University of Bath (primary)
- **BMTPC India** — Building Materials & Technology Promotion Council
- **IIT Bombay / NIT Calicut** — Indian construction research
- **World Steel Association 2022**
- **IPCC 2023**

---

*CarbonTrace LCA v1.0 — Capstone Project Tool*
