import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { BENCHMARKS } from '../lib/calculations.js'

function fmt(n) { return isNaN(n) ? '0' : Number(n).toLocaleString('en-IN', { maximumFractionDigits: 1 }) }

const STATUS_CONFIG = {
  excellent: { label: 'Excellent', color: 'var(--accent)', bg: 'rgba(99,200,130,0.1)' },
  good:      { label: 'Good',      color: 'var(--accent)', bg: 'rgba(99,200,130,0.08)' },
  typical:   { label: 'Typical',   color: 'var(--warn)',   bg: 'rgba(245,158,11,0.1)' },
  high:      { label: 'High',      color: '#f97316',       bg: 'rgba(249,115,22,0.1)' },
  very_high: { label: 'Very High', color: 'var(--danger)', bg: 'rgba(239,68,68,0.1)' },
}

function buildResults(project, boqItems) {
  if (!boqItems || boqItems.length === 0) return null

  const lineItems = boqItems.map(item => ({
    ...item,
    qty_tonnes: item.ef_value > 0 ? item.material_co2 / item.ef_value : item.quantity,
  }))

  const total_co2_kg     = lineItems.reduce((s, r) => s + (r.total_co2 || 0), 0)
  const total_co2_tonnes = total_co2_kg / 1000
  const co2_per_m2       = project.built_up_area > 0 ? total_co2_kg / project.built_up_area : 0

  const byCategory = lineItems.reduce((acc, r) => {
    const cat = r.category || 'Other'
    if (!acc[cat]) acc[cat] = { category: cat, material_co2: 0, transport_co2: 0, total_co2: 0 }
    acc[cat].material_co2  += r.material_co2  || 0
    acc[cat].transport_co2 += r.transport_co2 || 0
    acc[cat].total_co2     += r.total_co2     || 0
    return acc
  }, {})

  const categoryBreakdown = Object.values(byCategory).sort((a, b) => b.total_co2 - a.total_co2)
  const topEmitter = lineItems.reduce((max, r) => (r.total_co2 || 0) > (max?.total_co2 || 0) ? r : max, null)

  const benchmarkStatus =
    co2_per_m2 < BENCHMARKS.rock_low            ? 'excellent' :
    co2_per_m2 <= BENCHMARKS.india_typical_low  ? 'good' :
    co2_per_m2 <= BENCHMARKS.india_typical_high ? 'typical' :
    co2_per_m2 <= BENCHMARKS.rock_high          ? 'high' : 'very_high'

  return {
    lineItems,
    total_co2_kg,
    total_co2_tonnes,
    co2_per_m2,
    categoryBreakdown,
    topEmitter,
    benchmarkStatus,
    material_total:  lineItems.reduce((s, r) => s + (r.material_co2  || 0), 0),
    transport_total: lineItems.reduce((s, r) => s + (r.transport_co2 || 0), 0),
  }
}

export default function ProjectsPage({ setProjectData, setLcaResults }) {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  useEffect(() => { loadProjects() }, [])

  async function loadProjects() {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*, boq_items(*)')
        .order('created_at', { ascending: false })
      if (error) throw error
      setProjects(data || [])
    } catch {
      setError('Could not load projects. Check your Supabase connection.')
    }
    setLoading(false)
  }

  function handleNew() {
    setProjectData(null)
    setLcaResults(null)
    navigate('/input')
  }

  function handleView(project) {
    const results = buildResults(project, project.boq_items)
    setProjectData(project)
    setLcaResults(results)
    navigate('/results')
  }

  function handleEdit(project) {
    setProjectData(project)
    navigate('/input')
  }

  if (loading) return (
    <div className="page-content" style={{ textAlign: 'center', paddingTop: '4rem' }}>
      <span className="spinner" style={{ width: 32, height: 32 }} />
      <div style={{ color: 'var(--text2)', marginTop: '1rem' }}>Loading projects...</div>
    </div>
  )

  return (
    <div className="page-content fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text3)', fontFamily: 'var(--font-mono)', marginBottom: '0.3rem' }}>
            ALL PROJECTS
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800 }}>
            Project Library
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            {projects.length} project{projects.length !== 1 ? 's' : ''} saved
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleNew}>+ New Project</button>
      </div>

      {error && <div className="alert alert-warn mb-3">{error}</div>}

      {!error && projects.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '3rem' }}>🏗️</div>
          <div className="section-title mt-2">No projects yet</div>
          <p style={{ color: 'var(--text2)', marginTop: '0.5rem' }}>
            Create your first LCA assessment to see it here.
          </p>
          <button className="btn btn-primary mt-3" onClick={handleNew}>
            Start New Project →
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
        {projects.map(project => {
          const results   = buildResults(project, project.boq_items)
          const status    = results ? STATUS_CONFIG[results.benchmarkStatus] : null
          const itemCount = project.boq_items?.length || 0
          const date      = new Date(project.created_at).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric',
          })

          return (
            <div key={project.id} className="card fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Card header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {project.project_name}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text3)', marginTop: '0.25rem' }}>
                    {[project.location, project.building_type].filter(Boolean).join(' · ')}
                    {project.num_floors ? ` · ${project.num_floors}F` : ''}
                  </div>
                </div>
                {status && (
                  <span style={{
                    flexShrink: 0,
                    marginLeft: '0.75rem',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    padding: '0.25rem 0.65rem',
                    borderRadius: '20px',
                    background: status.bg,
                    color: status.color,
                    border: `1px solid ${status.color}40`,
                  }}>
                    {status.label}
                  </span>
                )}
              </div>

              {/* Metric tiles */}
              {results ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                  {[
                    { value: fmt(results.total_co2_tonnes), label: 'tCO₂e', color: 'var(--text)' },
                    { value: fmt(results.co2_per_m2),       label: 'kg/m²', color: status?.color || 'var(--text)' },
                    { value: project.built_up_area ? fmt(project.built_up_area) : '—', label: 'm² area', color: 'var(--text)' },
                  ].map(({ value, label, color }) => (
                    <div key={label} style={{ padding: '0.6rem', background: 'var(--bg2)', borderRadius: 'var(--radius)', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.05rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color }}>{value}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text3)', marginTop: '0.1rem' }}>{label}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '0.75rem', background: 'var(--bg2)', borderRadius: 'var(--radius)', fontSize: '0.82rem', color: 'var(--text3)', textAlign: 'center' }}>
                  No BOQ items — incomplete calculation
                </div>
              )}

              {/* Card footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>
                  {itemCount} material{itemCount !== 1 ? 's' : ''} · {date}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(project)}>Edit</button>
                  {results && (
                    <button className="btn btn-primary btn-sm" onClick={() => handleView(project)}>
                      View Results →
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}