import { useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, LabelList
} from 'recharts'
import { BENCHMARKS, CATEGORY_COLORS } from '../lib/calculations.js'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

function fmt(n) { return isNaN(n) ? '0' : Number(n).toLocaleString('en-IN', { maximumFractionDigits: 1 }) }

const STATUS_CONFIG = {
  excellent: { label: '🏆 Excellent — Below Global Low', color: 'var(--accent)', bg: 'rgba(99,200,130,0.1)' },
  good: { label: '✅ Good — Below Indian Typical', color: 'var(--accent)', bg: 'rgba(99,200,130,0.08)' },
  typical: { label: '📊 Typical — Within Indian Range', color: 'var(--warn)', bg: 'rgba(245,158,11,0.1)' },
  high: { label: '⚠️ High — Above Indian Typical', color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
  very_high: { label: '🔴 Very High — Above Global Range', color: 'var(--danger)', bg: 'rgba(239,68,68,0.1)' },
}

export default function ResultsPage({ lcaResults, projectData }) {
  const navigate = useNavigate()

  if (!lcaResults) {
    return (
      <div className="page-content" style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <div style={{ fontSize: '3rem' }}>📊</div>
        <div className="section-title mt-2">No results yet</div>
        <p style={{ color: 'var(--text2)', marginTop: '0.5rem' }}>Please complete the Data Input step first.</p>
        <button className="btn btn-primary mt-3" onClick={() => navigate('/input')}>Go to Input →</button>
      </div>
    )
  }

  const {
    total_co2_kg, total_co2_tonnes, co2_per_m2,
    categoryBreakdown, lineItems, topEmitter,
    material_total, transport_total, benchmarkStatus
  } = lcaResults

  const status = STATUS_CONFIG[benchmarkStatus] || STATUS_CONFIG.typical

  // Chart data
  const barData = categoryBreakdown.map(c => ({
    name: c.category.replace(' & ', ' &\n'),
    'Material CO₂': Math.round(c.material_co2),
    'Transport CO₂': Math.round(c.transport_co2),
    total: Math.round(c.total_co2),
  }))

  const pieData = categoryBreakdown.filter(c => c.total_co2 > 0).map(c => ({
    name: c.category,
    value: Math.round(c.total_co2),
  }))

  // Benchmark comparison bar
  const maxBenchmark = 700
  const yourPct = Math.min((co2_per_m2 / maxBenchmark) * 100, 100)
  const indiaTypicalPct = (BENCHMARKS.india_typical_high / maxBenchmark) * 100
  const rockHighPct = (BENCHMARKS.rock_high / maxBenchmark) * 100

  function exportPDF() {
    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text('CarbonTrace LCA — Embodied Carbon Report', 14, 20)
    doc.setFontSize(11)
    doc.text(`Project: ${projectData?.project_name || 'N/A'}  |  Location: ${projectData?.location || 'N/A'}`, 14, 30)
    doc.text(`Total Embodied Carbon: ${fmt(total_co2_tonnes)} tCO₂e  |  Per m²: ${fmt(co2_per_m2)} kg CO₂e/m²`, 14, 38)

    autoTable(doc, {
      startY: 48,
      head: [['Material', 'Qty (t)', 'EF', 'Material CO₂ (kg)', 'Transport CO₂ (kg)', 'Total CO₂ (kg)']],
      body: lineItems.map(r => [
        r.material_name, fmt(r.qty_tonnes), r.ef_value,
        fmt(r.material_co2), fmt(r.transport_co2), fmt(r.total_co2)
      ]),
      styles: { fontSize: 8 },
    })

    doc.save(`CarbonTrace_${projectData?.project_name || 'Report'}.pdf`)
  }

  function exportExcel() {
    const wb = XLSX.utils.book_new()

    const summaryData = [
      ['CarbonTrace LCA — Embodied Carbon Report'],
      ['Project', projectData?.project_name],
      ['Location', projectData?.location],
      ['Building Type', projectData?.building_type],
      ['Built-up Area (m²)', projectData?.built_up_area],
      [],
      ['SUMMARY'],
      ['Total Embodied Carbon (kg CO₂e)', fmt(total_co2_kg)],
      ['Total Embodied Carbon (tCO₂e)', fmt(total_co2_tonnes)],
      ['CO₂ per m² (kg CO₂e/m²)', fmt(co2_per_m2)],
      ['Material CO₂ (kg)', fmt(material_total)],
      ['Transport CO₂ (kg)', fmt(transport_total)],
      ['Benchmark Status', status.label],
    ]
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryData), 'Summary')

    const boqData = [
      ['Material', 'Category', 'Qty (t)', 'EF (kg CO₂e/t)', 'Distance (km)', 'Transport Mode', 'Material CO₂ (kg)', 'Transport CO₂ (kg)', 'Total CO₂ (kg)', '% of Total'],
      ...lineItems.map(r => [
        r.material_name, r.category, r.qty_tonnes?.toFixed(3), r.ef_value, r.distance_km, r.transport_mode,
        r.material_co2?.toFixed(1), r.transport_co2?.toFixed(1), r.total_co2?.toFixed(1),
        total_co2_kg > 0 ? ((r.total_co2 / total_co2_kg) * 100).toFixed(1) + '%' : '0%'
      ])
    ]
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(boqData), 'BOQ Calculations')

    const catData = [
      ['Category', 'Material CO₂ (kg)', 'Transport CO₂ (kg)', 'Total CO₂ (kg)', '% of Total'],
      ...categoryBreakdown.map(c => [
        c.category, c.material_co2?.toFixed(1), c.transport_co2?.toFixed(1), c.total_co2?.toFixed(1),
        total_co2_kg > 0 ? ((c.total_co2 / total_co2_kg) * 100).toFixed(1) + '%' : '0%'
      ])
    ]
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(catData), 'Category Breakdown')

    XLSX.writeFile(wb, `CarbonTrace_${projectData?.project_name || 'Report'}.xlsx`)
  }

  const topPct = total_co2_kg > 0 && topEmitter ? ((topEmitter.total_co2 / total_co2_kg) * 100).toFixed(1) : 0
  const concreteSteel = categoryBreakdown
    .filter(c => c.category === 'Concrete & Cement' || c.category === 'Steel & Metal')
    .reduce((s, c) => s + c.total_co2, 0)
  const csPct = total_co2_kg > 0 ? ((concreteSteel / total_co2_kg) * 100).toFixed(0) : 0

  return (
    <div className="page-content fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text3)', fontFamily: 'var(--font-mono)', marginBottom: '0.3rem' }}>
            RESULTS — {projectData?.project_name || 'LCA Assessment'}
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800 }}>
            Embodied Carbon Analysis
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            {projectData?.building_type} · {projectData?.location} · {projectData?.built_up_area} m²
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={exportExcel}>📊 Export Excel</button>
          <button className="btn btn-secondary btn-sm" onClick={exportPDF}>📄 Export PDF</button>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/input')}>← Edit Input</button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid-4 mb-3">
        <div className="stat-card">
          <div className="stat-label">Total Embodied Carbon</div>
          <div className="stat-value">{fmt(total_co2_tonnes)}</div>
          <div className="stat-unit">tonnes CO₂e</div>
          <div className="stat-sub">{fmt(total_co2_kg)} kg total</div>
        </div>
        <div className="stat-card" style={{ borderColor: co2_per_m2 < 300 ? 'rgba(99,200,130,0.3)' : co2_per_m2 > 500 ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)' }}>
          <div className="stat-label">CO₂ Intensity</div>
          <div className="stat-value" style={{ color: co2_per_m2 < 300 ? 'var(--accent)' : co2_per_m2 > 500 ? 'var(--danger)' : 'var(--warn)' }}>
            {fmt(co2_per_m2)}
          </div>
          <div className="stat-unit">kg CO₂e / m²</div>
          <div className="stat-sub">Benchmark metric</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Material CO₂</div>
          <div className="stat-value" style={{ fontSize: '1.5rem' }}>{fmt(material_total / 1000)}</div>
          <div className="stat-unit">tCO₂e ({total_co2_kg > 0 ? ((material_total / total_co2_kg) * 100).toFixed(0) : 0}%)</div>
          <div className="stat-sub">From material production</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Transport CO₂</div>
          <div className="stat-value" style={{ fontSize: '1.5rem' }}>{fmt(transport_total / 1000)}</div>
          <div className="stat-unit">tCO₂e ({total_co2_kg > 0 ? ((transport_total / total_co2_kg) * 100).toFixed(0) : 0}%)</div>
          <div className="stat-sub">From logistics</div>
        </div>
      </div>

      {/* Benchmark comparison */}
      <div className="card mb-3" style={{ background: status.bg, borderColor: status.color + '30' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <div className="section-title">{status.label}</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text2)', marginTop: '0.3rem' }}>
              Your result: <strong style={{ color: status.color }}>{fmt(co2_per_m2)} kg CO₂e/m²</strong> compared against global and Indian benchmarks
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--text3)' }}>
            <div>Röck et al. 2020: 200–600 kg/m²</div>
            <div>India typical: 280–450 kg/m²</div>
          </div>
        </div>

        {/* Visual benchmark bar */}
        <div style={{ position: 'relative', marginTop: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text3)', marginBottom: '0.3rem' }}>
            <span>0</span>
            <span>200 (Röck low)</span>
            <span>300 (Net-zero)</span>
            <span>450 (India high)</span>
            <span>600 (Röck high)</span>
            <span>700+</span>
          </div>
          <div style={{ height: '12px', background: 'var(--bg2)', borderRadius: '6px', position: 'relative', overflow: 'visible' }}>
            {/* India range */}
            <div style={{
              position: 'absolute',
              left: `${(BENCHMARKS.india_typical_low / maxBenchmark) * 100}%`,
              width: `${((BENCHMARKS.india_typical_high - BENCHMARKS.india_typical_low) / maxBenchmark) * 100}%`,
              height: '100%',
              background: 'rgba(245,158,11,0.2)',
              borderRadius: '4px',
            }} />
            {/* Your result */}
            <div style={{
              position: 'absolute',
              left: `${Math.min(yourPct, 96)}%`,
              transform: 'translateX(-50%)',
              width: '4px',
              height: '20px',
              top: '-4px',
              background: status.color,
              borderRadius: '2px',
            }}>
              <div style={{
                position: 'absolute',
                bottom: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: '0.7rem',
                color: status.color,
                fontWeight: 700,
                whiteSpace: 'nowrap',
                paddingBottom: '2px',
              }}>
                Your: {fmt(co2_per_m2)}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem', fontSize: '0.75rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: 12, height: 12, background: 'rgba(245,158,11,0.4)', borderRadius: 2, display: 'inline-block' }} />
              India typical range (280–450)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: 4, height: 14, background: status.color, borderRadius: 2, display: 'inline-block' }} />
              Your result
            </span>
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid-2 mb-3">
        <div className="card">
          <div className="section-title mb-3">CO₂ by Material Category</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData} margin={{ top: 5, right: 10, bottom: 40, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="name"
                tick={{ fill: 'var(--text3)', fontSize: 10 }}
                angle={-30}
                textAnchor="end"
                interval={0}
              />
              <YAxis tick={{ fill: 'var(--text3)', fontSize: 10 }} />
              <Tooltip
                contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                formatter={(v) => [`${fmt(v)} kg`, undefined]}
              />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              <Bar dataKey="Material CO₂" stackId="a" fill="var(--accent)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Transport CO₂" stackId="a" fill="rgba(99,200,130,0.4)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="section-title mb-3">Carbon Share by Category</div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}
                labelLine={{ stroke: 'var(--text3)' }}
                fontSize={10}
              >
                {pieData.map((entry, idx) => (
                  <Cell key={idx} fill={CATEGORY_COLORS[entry.name] || `hsl(${idx * 40}, 60%, 55%)`} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                formatter={(v) => [`${fmt(v)} kg CO₂e`, undefined]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Hotspot analysis */}
      <div className="grid-2 mb-3">
        <div className="card">
          <div className="section-title mb-2">🔥 Emission Hotspots</div>
          {categoryBreakdown.slice(0, 5).map((c, i) => {
            const pct = total_co2_kg > 0 ? (c.total_co2 / total_co2_kg) * 100 : 0
            return (
              <div key={c.category} style={{ marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.3rem' }}>
                  <span style={{ color: 'var(--text2)' }}>{i + 1}. {c.category}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>
                    {fmt(c.total_co2 / 1000)} t · <span style={{ color: 'var(--accent)' }}>{pct.toFixed(1)}%</span>
                  </span>
                </div>
                <div style={{ height: '6px', background: 'var(--bg2)', borderRadius: '3px' }}>
                  <div style={{
                    width: `${pct}%`,
                    height: '100%',
                    background: CATEGORY_COLORS[c.category] || 'var(--accent)',
                    borderRadius: '3px',
                    transition: 'width 1s ease'
                  }} />
                </div>
              </div>
            )
          })}
          {csPct > 0 && (
            <div className="alert alert-warn mt-2" style={{ fontSize: '0.8rem' }}>
              ⚡ Concrete + Steel together: <strong>{csPct}%</strong> of total (typical range 60–70%)
            </div>
          )}
        </div>

        <div className="card">
          <div className="section-title mb-2">🔍 Key Findings</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
            {topEmitter && (
              <div style={{ padding: '0.75rem', background: 'var(--bg2)', borderRadius: 'var(--radius)', borderLeft: '3px solid var(--danger)' }}>
                <div style={{ fontWeight: 600, color: 'var(--text)' }}>Top emitting material</div>
                <div style={{ color: 'var(--text2)', marginTop: '0.2rem' }}>
                  {topEmitter.material_name} — {fmt(topEmitter.total_co2)} kg CO₂e ({topPct}% of total)
                </div>
              </div>
            )}
            <div style={{ padding: '0.75rem', background: 'var(--bg2)', borderRadius: 'var(--radius)', borderLeft: '3px solid var(--accent)' }}>
              <div style={{ fontWeight: 600, color: 'var(--text)' }}>Transport contribution</div>
              <div style={{ color: 'var(--text2)', marginTop: '0.2rem' }}>
                {total_co2_kg > 0 ? ((transport_total / total_co2_kg) * 100).toFixed(0) : 0}% of total carbon comes from logistics.
                {transport_total / total_co2_kg > 0.15 ? ' Consider sourcing locally to reduce this.' : ' Within typical range.'}
              </div>
            </div>
            <div style={{ padding: '0.75rem', background: 'var(--bg2)', borderRadius: 'var(--radius)', borderLeft: `3px solid ${status.color}` }}>
              <div style={{ fontWeight: 600, color: 'var(--text)' }}>Benchmark position</div>
              <div style={{ color: 'var(--text2)', marginTop: '0.2rem' }}>
                At {fmt(co2_per_m2)} kg CO₂e/m², this building is {
                  co2_per_m2 < BENCHMARKS.india_typical_low ? 'below the Indian typical range — good performance' :
                  co2_per_m2 <= BENCHMARKS.india_typical_high ? 'within the typical Indian residential range' :
                  'above the Indian typical range — consider low-carbon alternatives'
                }.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Line items table */}
      <div className="card mb-3">
        <div className="section-header">
          <div className="section-title">📋 Detailed Material CO₂ Breakdown</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text3)' }}>
            Formula: CO₂ = (Qty × EF) + (Qty × Distance × Transport EF)
          </div>
        </div>
        <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
          <table className="data-table" style={{ minWidth: '900px' }}>
            <thead>
              <tr>
                <th>Material</th>
                <th>Category</th>
                <th>Qty (t)</th>
                <th>EF</th>
                <th>Distance</th>
                <th>Material CO₂ (kg)</th>
                <th>Transport CO₂ (kg)</th>
                <th>Total CO₂ (kg)</th>
                <th>% Share</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map(r => {
                const share = total_co2_kg > 0 ? (r.total_co2 / total_co2_kg) * 100 : 0
                return (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 500 }}>{r.material_name}</td>
                    <td><span className="tag tag-blue" style={{ fontSize: '0.7rem' }}>{r.category || '—'}</span></td>
                    <td className="text-mono">{r.qty_tonnes?.toFixed(3)}</td>
                    <td className="text-mono" style={{ color: 'var(--accent)' }}>{r.ef_value}</td>
                    <td className="text-mono">{r.distance_km} km ({r.transport_mode})</td>
                    <td className="text-mono">{fmt(r.material_co2)}</td>
                    <td className="text-mono">{fmt(r.transport_co2)}</td>
                    <td className="text-mono" style={{ fontWeight: 600 }}>{fmt(r.total_co2)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: 40, height: 6, background: 'var(--bg2)', borderRadius: 3 }}>
                          <div style={{ width: `${Math.min(share, 100)}%`, height: '100%', background: 'var(--accent)', borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}>{share.toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
              <tr style={{ background: 'var(--bg2)', fontWeight: 700 }}>
                <td colSpan={5} style={{ textAlign: 'right', color: 'var(--text2)' }}>TOTAL</td>
                <td className="text-mono" style={{ color: 'var(--accent)' }}>{fmt(material_total)}</td>
                <td className="text-mono" style={{ color: 'var(--accent)' }}>{fmt(transport_total)}</td>
                <td className="text-mono" style={{ color: 'var(--accent)', fontSize: '1rem' }}>{fmt(total_co2_kg)}</td>
                <td className="text-mono">100%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', paddingBottom: '2rem' }}>
        <button className="btn btn-secondary" onClick={exportExcel}>📊 Export to Excel</button>
        <button className="btn btn-secondary" onClick={exportPDF}>📄 Export to PDF</button>
        <button className="btn btn-primary" onClick={() => navigate('/ef-table')}>View EF Master Table →</button>
      </div>
    </div>
  )
}
