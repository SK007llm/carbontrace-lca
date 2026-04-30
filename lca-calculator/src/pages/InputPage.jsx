import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { FALLBACK_EF, calculateLCA, TRANSPORT_EF } from '../lib/calculations.js'

const BUILDING_TYPES = ['Residential Apartment', 'Individual House/Villa', 'Commercial Office', 'Mixed-Use', 'Industrial', 'Institutional']
const TRANSPORT_MODES = ['Road', 'Rail', 'Sea']
const UNITS = ['tonne', 'kg', 'm3', 'm²', 'nos', 'bags', 'ltr']

const emptyRow = () => ({
  id: crypto.randomUUID(),
  material_name: '',
  category: '',
  quantity: '',
  unit: 'tonne',
  supplier_city: '',
  transport_mode: 'Road',
  distance_km: '150',
  ef_value: '',
  source: '',
})

export default function InputPage({ projectData, setProjectData, setLcaResults }) {
  const navigate = useNavigate()
  const [step, setStep] = useState(projectData ? 2 : 1)

  // Step 1: Project info
  const [project, setProject] = useState(projectData || {
    project_name: '',
    location: '',
    building_type: 'Residential Apartment',
    built_up_area: '',
    num_floors: '',
  })

  // Step 2: BOQ
  const [rows, setRows] = useState([emptyRow(), emptyRow(), emptyRow()])
  const [efList, setEfList] = useState([])
  const [loading, setLoading] = useState(false)
  const [calculating, setCalculating] = useState(false)
  const [efSearch, setEfSearch] = useState({})

  useEffect(() => {
    loadEF()
  }, [])

  async function loadEF() {
    try {
      const { data, error } = await supabase.from('emission_factors').select('*').order('category')
      if (data && data.length > 0) setEfList(data)
      else setEfList(FALLBACK_EF)
    } catch {
      setEfList(FALLBACK_EF)
    }
  }

  function updateRow(id, field, value) {
    setRows(prev => prev.map(r => {
      if (r.id !== id) return r
      const updated = { ...r, [field]: value }
      // Auto-fill EF when material selected
      if (field === 'material_name') {
        const ef = efList.find(e => e.material_name === value)
        if (ef) {
          updated.ef_value = String(ef.ef_value)
          updated.category = ef.category
          updated.source = ef.source
        }
      }
      return updated
    }))
  }

  function addRow() { setRows(prev => [...prev, emptyRow()]) }

  function removeRow(id) { setRows(prev => prev.filter(r => r.id !== id)) }

  async function handleSaveProject() {
    if (!project.project_name || !project.built_up_area) {
      alert('Please fill in Project Name and Built-up Area.')
      return
    }
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([project])
        .select()
        .single()
      if (data) {
        setProjectData({ ...project, id: data.id })
      } else {
        // Supabase not configured yet — continue locally
        setProjectData({ ...project, id: crypto.randomUUID() })
      }
    } catch {
      setProjectData({ ...project, id: crypto.randomUUID() })
    }
    setLoading(false)
    setStep(2)
  }

  async function handleCalculate() {
    const validRows = rows.filter(r => r.material_name && r.quantity && r.ef_value)
    if (validRows.length === 0) {
      alert('Please add at least one material with quantity and emission factor.')
      return
    }
    setCalculating(true)

    const builtUpArea = parseFloat(project.built_up_area || projectData?.built_up_area || 0)
    const results = calculateLCA(validRows, builtUpArea)

    try {
      // Save BOQ items to Supabase
      const proj = projectData || project
      if (proj?.id) {
        await supabase.from('boq_items').insert(
          validRows.map(r => ({
            project_id: proj.id,
            material_name: r.material_name,
            category: r.category || '',
            quantity: parseFloat(r.quantity),
            unit: r.unit,
            supplier_city: r.supplier_city,
            transport_mode: r.transport_mode,
            distance_km: parseFloat(r.distance_km),
            ef_value: parseFloat(r.ef_value),
            material_co2: results.lineItems.find(l => l.id === r.id)?.material_co2,
            transport_co2: results.lineItems.find(l => l.id === r.id)?.transport_co2,
            total_co2: results.lineItems.find(l => l.id === r.id)?.total_co2,
          }))
        )
      }
    } catch { /* continue without saving */ }

    setLcaResults(results)
    setCalculating(false)
    navigate('/results')
  }

  function handleBOQUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    // Simple CSV parser
    const reader = new FileReader()
    reader.onload = (ev) => {
      const lines = ev.target.result.split('\n').filter(Boolean)
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
      const newRows = lines.slice(1).map(line => {
        const vals = line.split(',')
        const obj = emptyRow()
        headers.forEach((h, i) => {
          if (h.includes('material')) obj.material_name = vals[i]?.trim() || ''
          if (h.includes('qty') || h === 'quantity') obj.quantity = vals[i]?.trim() || ''
          if (h === 'unit') obj.unit = vals[i]?.trim() || 'tonne'
          if (h.includes('city') || h.includes('supplier')) obj.supplier_city = vals[i]?.trim() || ''
          if (h.includes('distance')) obj.distance_km = vals[i]?.trim() || '150'
          if (h.includes('transport')) obj.transport_mode = vals[i]?.trim() || 'Road'
        })
        // Auto-fill EF
        const ef = efList.find(e => e.material_name.toLowerCase() === obj.material_name.toLowerCase())
        if (ef) { obj.ef_value = String(ef.ef_value); obj.category = ef.category }
        return obj
      }).filter(r => r.material_name)
      if (newRows.length > 0) setRows(newRows)
    }
    reader.readAsText(file)
  }

  return (
    <div className="page-content">
      <div className="progress-steps mb-3">
        <div className={`progress-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'done' : ''}`}>
          <div className="progress-step-num">{step > 1 ? '✓' : '1'}</div>
          <div className="progress-step-label">Project Details</div>
        </div>
        <div className={`progress-line ${step > 1 ? 'done' : ''}`} />
        <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>
          <div className="progress-step-num">2</div>
          <div className="progress-step-label">Bill of Quantities</div>
        </div>
      </div>

      {step === 1 && (
        <div className="card card-lg fade-up">
          <div className="section-header">
            <div>
              <div className="section-title">📋 Project Details</div>
              <div className="section-sub">Enter basic information about your building project</div>
            </div>
          </div>

          <div className="grid-2 mt-3">
            <div>
              <label>Project Name *</label>
              <input
                value={project.project_name}
                onChange={e => setProject(p => ({ ...p, project_name: e.target.value }))}
                placeholder="e.g. Prestige Green Valley Block A"
              />
            </div>
            <div>
              <label>Project Location</label>
              <input
                value={project.location}
                onChange={e => setProject(p => ({ ...p, location: e.target.value }))}
                placeholder="e.g. Bengaluru, Karnataka"
              />
            </div>
            <div>
              <label>Building Type</label>
              <select value={project.building_type} onChange={e => setProject(p => ({ ...p, building_type: e.target.value }))}>
                {BUILDING_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label>Built-up Area (m²) *</label>
              <input
                type="number"
                value={project.built_up_area}
                onChange={e => setProject(p => ({ ...p, built_up_area: e.target.value }))}
                placeholder="e.g. 2400"
              />
            </div>
            <div>
              <label>Number of Floors</label>
              <input
                type="number"
                value={project.num_floors}
                onChange={e => setProject(p => ({ ...p, num_floors: e.target.value }))}
                placeholder="e.g. 4"
              />
            </div>
          </div>

          <div className="mt-4" style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn btn-primary" onClick={handleSaveProject} disabled={loading}>
              {loading ? <><span className="spinner" /> Saving...</> : 'Continue to BOQ →'}
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="fade-up">
          <div className="card card-lg mb-2">
            <div className="section-header">
              <div>
                <div className="section-title">🧱 Bill of Quantities</div>
                <div className="section-sub">
                  Enter each material, its quantity, supplier location, and transport mode.
                  EF values are auto-filled from the database.
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', marginBottom: 0 }}>
                  📎 Upload CSV BOQ
                  <input type="file" accept=".csv" onChange={handleBOQUpload} style={{ display: 'none' }} />
                </label>
                <button className="btn btn-ghost btn-sm" onClick={addRow}>+ Add Row</button>
              </div>
            </div>

            <div className="alert alert-info mt-2">
              💡 Select a material from the dropdown to auto-fill the Emission Factor. 
              Adjust Distance based on your actual supplier location.
              Quantities in non-tonne units are automatically converted.
            </div>

            <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
              <table className="data-table" style={{ minWidth: '1100px' }}>
                <thead>
                  <tr>
                    <th style={{ width: '22%' }}>Material Name</th>
                    <th style={{ width: '10%' }}>Qty</th>
                    <th style={{ width: '7%' }}>Unit</th>
                    <th style={{ width: '12%' }}>Supplier City</th>
                    <th style={{ width: '9%' }}>Transport</th>
                    <th style={{ width: '9%' }}>Distance (km)</th>
                    <th style={{ width: '10%' }}>EF (kg CO₂e/t)</th>
                    <th style={{ width: '14%' }}>Source</th>
                    <th style={{ width: '4%' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(row => (
                    <tr key={row.id}>
                      <td>
                        <select
                          value={row.material_name}
                          onChange={e => updateRow(row.id, 'material_name', e.target.value)}
                          style={{ fontSize: '0.82rem' }}
                        >
                          <option value="">— Select material —</option>
                          {efList.map(ef => (
                            <option key={ef.id} value={ef.material_name}>{ef.material_name}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          value={row.quantity}
                          onChange={e => updateRow(row.id, 'quantity', e.target.value)}
                          placeholder="0"
                          style={{ fontSize: '0.82rem' }}
                        />
                      </td>
                      <td>
                        <select value={row.unit} onChange={e => updateRow(row.id, 'unit', e.target.value)} style={{ fontSize: '0.82rem' }}>
                          {UNITS.map(u => <option key={u}>{u}</option>)}
                        </select>
                      </td>
                      <td>
                        <input
                          value={row.supplier_city}
                          onChange={e => updateRow(row.id, 'supplier_city', e.target.value)}
                          placeholder="e.g. Mysuru"
                          style={{ fontSize: '0.82rem' }}
                        />
                      </td>
                      <td>
                        <select value={row.transport_mode} onChange={e => updateRow(row.id, 'transport_mode', e.target.value)} style={{ fontSize: '0.82rem' }}>
                          {TRANSPORT_MODES.map(m => <option key={m}>{m}</option>)}
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          value={row.distance_km}
                          onChange={e => updateRow(row.id, 'distance_km', e.target.value)}
                          style={{ fontSize: '0.82rem' }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={row.ef_value}
                          onChange={e => updateRow(row.id, 'ef_value', e.target.value)}
                          placeholder="auto"
                          style={{ fontSize: '0.82rem', color: row.ef_value ? 'var(--accent)' : 'var(--text3)' }}
                        />
                      </td>
                      <td>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>{row.source || '—'}</span>
                      </td>
                      <td>
                        <button className="btn btn-danger btn-sm" onClick={() => removeRow(row.id)} style={{ padding: '0.3rem 0.5rem' }}>✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button className="btn btn-ghost" onClick={() => setStep(1)}>← Edit Project</button>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn btn-ghost btn-sm" onClick={addRow}>+ Add Row</button>
                <button className="btn btn-primary" onClick={handleCalculate} disabled={calculating}>
                  {calculating ? <><span className="spinner" /> Calculating...</> : '⚡ Calculate Embodied Carbon →'}
                </button>
              </div>
            </div>
          </div>

          {/* Quick EF reference */}
          <div className="card mt-2" style={{ background: 'var(--bg2)' }}>
            <div className="section-title mb-2" style={{ fontSize: '0.9rem' }}>⚡ Quick EF Reference (top materials)</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {FALLBACK_EF.slice(0, 8).map(ef => (
                <div key={ef.id} style={{
                  padding: '0.35rem 0.75rem',
                  background: 'var(--surface)',
                  borderRadius: '20px',
                  fontSize: '0.78rem',
                  border: '1px solid var(--border)',
                  cursor: 'pointer',
                }}>
                  <span style={{ color: 'var(--text2)' }}>{ef.material_name}: </span>
                  <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{ef.ef_value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
