import { useNavigate } from 'react-router-dom'

export default function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="page-content">
      <div className="hero fade-up">
        <div className="hero-badge">
          <span>🌿</span> LCA Embodied Carbon Calculator — India
        </div>
        <h1>
          Measure the <span className="hl">Carbon Footprint</span><br />
          of Your Building
        </h1>
        <p>
          A Life Cycle Assessment tool built for Indian construction projects.
          Calculate embodied carbon from materials + transport, benchmark against
          global standards, and identify emission hotspots instantly.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => navigate('/input')}>
            Start New Assessment →
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/ef-table')}>
            View EF Master Table
          </button>
        </div>
      </div>

      {/* Feature cards */}
      <div className="grid-3 mt-4" style={{ animationDelay: '0.1s' }}>
        {[
          {
            icon: '🏗️',
            title: 'Bill of Quantities Input',
            desc: 'Enter materials manually or import from BOQ. Auto-lookup emission factors from the Indian EF database.',
          },
          {
            icon: '⚡',
            title: 'Instant Calculation',
            desc: 'CO₂ from materials (Qty × EF) + transport (Qty × Distance × Transport EF). Full formula transparency.',
          },
          {
            icon: '📊',
            title: 'Results Dashboard',
            desc: 'Bar charts by material category, benchmark comparison vs Röck et al. 2020, export to PDF/Excel.',
          },
        ].map(f => (
          <div key={f.title} className="card fade-up">
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{f.icon}</div>
            <div className="section-title" style={{ marginBottom: '0.5rem' }}>{f.title}</div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text2)', lineHeight: 1.6 }}>{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Formula box */}
      <div className="card mt-3 fade-up" style={{ background: 'var(--bg2)' }}>
        <div className="section-title mb-2">📐 Calculation Formula</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'var(--accent)', background: 'var(--bg)', padding: '1.25rem', borderRadius: 'var(--radius)', lineHeight: 2 }}>
          <div>Material CO₂ = Quantity (tonnes) × Emission Factor (kg CO₂e/tonne)</div>
          <div>Transport CO₂ = Quantity × Distance (km) × Transport EF (kg CO₂e/tonne·km)</div>
          <div style={{ color: 'var(--accent2)', fontWeight: 600 }}>Total Embodied Carbon = Σ Material CO₂ + Σ Transport CO₂</div>
          <div style={{ color: 'var(--text2)' }}>Benchmark Metric = Total CO₂ (kg) ÷ Built-up Area (m²)</div>
        </div>
        <div style={{ fontSize: '0.82rem', color: 'var(--text3)', marginTop: '0.75rem' }}>
          Transport EFs: Road = 0.085 kg CO₂e/t·km | Rail = 0.030 | Sea = 0.012 &nbsp;|&nbsp; Reference: Röck et al. 2020 — Residential: 200–600 kg CO₂e/m²
        </div>
      </div>

      {/* Benchmark reference */}
      <div className="grid-2 mt-3">
        <div className="card fade-up">
          <div className="section-title mb-2">🌍 Global Benchmarks</div>
          {[
            { label: 'Röck et al. (2020) — Global residential range', range: '200–600 kg CO₂e/m²', tag: 'tag-blue' },
            { label: 'Indian residential — Typical range', range: '280–450 kg CO₂e/m²', tag: 'tag-yellow' },
            { label: 'Net-zero target (2050 aligned)', range: '< 300 kg CO₂e/m²', tag: 'tag-green' },
          ].map(b => (
            <div key={b.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.84rem', color: 'var(--text2)' }}>{b.label}</span>
              <span className={`tag ${b.tag}`}>{b.range}</span>
            </div>
          ))}
        </div>
        <div className="card fade-up">
          <div className="section-title mb-2">🇮🇳 India-Specific Context</div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text2)', lineHeight: 1.8 }}>
            <p>• <strong style={{ color: 'var(--text)' }}>Masonry-dominant</strong> construction: more brick/block, less structural steel than Europe → typically lower embodied carbon</p>
            <p className="mt-1">• <strong style={{ color: 'var(--text)' }}>Fly ash bricks</strong> (78 kg CO₂e/t) significantly lower than clay bricks (240 kg CO₂e/t)</p>
            <p className="mt-1">• <strong style={{ color: 'var(--text)' }}>Transportation</strong> distances in India often 100–300 km by road for aggregate materials</p>
            <p className="mt-1">• EF values from <strong style={{ color: 'var(--text)' }}>ICE Database v3.0, BMTPC, IIT research</strong></p>
          </div>
        </div>
      </div>
    </div>
  )
}
