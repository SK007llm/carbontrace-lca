import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import { FALLBACK_EF } from '../lib/calculations.js'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const CONFIDENCE_COLOR = {
  High: 'tag-green',
  Medium: 'tag-yellow',
  Low: 'tag-red',
}

export default function EFTablePage() {
  const [efData, setEfData] = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  const [editRow, setEditRow] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newEF, setNewEF] = useState({ material_name: '', category: '', ef_value: '', unit: 'kg CO2e/tonne', source: '', confidence: 'Medium', notes: '' })

  useEffect(() => { loadEF() }, [])
  useEffect(() => { applyFilter() }, [search, catFilter, efData])

  async function loadEF() {
    setLoading(true)
    try {
      const { data } = await supabase.from('emission_factors').select('*').order('category')
      setEfData(data?.length > 0 ? data : FALLBACK_EF)
    } catch {
      setEfData(FALLBACK_EF)
    }
    setLoading(false)
  }

  function applyFilter() {
    let d = [...efData]
    if (catFilter !== 'All') d = d.filter(e => e.category === catFilter)
    if (search) d = d.filter(e =>
      e.material_name.toLowerCase().includes(search.toLowerCase()) ||
      e.source?.toLowerCase().includes(search.toLowerCase())
    )
    setFiltered(d)
  }

  const categories = ['All', ...new Set(efData.map(e => e.category))]

  async function saveEdit() {
    try {
      await supabase.from('emission_factors').update(editRow).eq('id', editRow.id)
    } catch {}
    setEfData(prev => prev.map(e => e.id === editRow.id ? editRow : e))
    setEditRow(null)
  }

  async function addEF() {
    const entry = { ...newEF, ef_value: parseFloat(newEF.ef_value) }
    try {
      const { data } = await supabase.from('emission_factors').insert([entry]).select().single()
      if (data) setEfData(prev => [...prev, data])
      else setEfData(prev => [...prev, { ...entry, id: Date.now() }])
    } catch {
      setEfData(prev => [...prev, { ...entry, id: Date.now() }])
    }
    setNewEF({ material_name: '', category: '', ef_value: '', unit: 'kg CO2e/tonne', source: '', confidence: 'Medium', notes: '' })
    setShowAdd(false)
  }

  function exportExcel() {
    const wb = XLSX.utils.book_new()
    const data = [
      ['CarbonTrace LCA — Emission Factor Master Table'],
      ['Generated:', new Date().toLocaleDateString()],
      [],
      ['Material Name', 'Category', 'EF Value', 'Unit', 'Source / Reference', 'Confidence', 'Notes'],
      ...filtered.map(e => [e.material_name, e.category, e.ef_value, e.unit, e.source, e.confidence, e.notes || ''])
    ]
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(data), 'EF Master Table')
    XLSX.writeFile(wb, 'CarbonTrace_EF_Master_Table.xlsx')
  }

  function exportPDF() {
    const doc = new jsPDF('landscape')
    doc.setFontSize(16)
    doc.text('CarbonTrace LCA — Emission Factor Master Table', 14, 16)
    doc.setFontSize(9)
    doc.text(`Generated: ${new Date().toLocaleDateString()} | ${filtered.length} materials`, 14, 24)
    autoTable(doc, {
      startY: 30,
      head: [['Material Name', 'Category', 'EF Value', 'Unit', 'Source', 'Confidence']],
      body: filtered.map(e => [e.material_name, e.category, e.ef_value, e.unit, e.source || '', e.confidence || '']),
      styles: { fontSize: 7.5 },
      headStyles: { fillColor: [26, 34, 53] },
    })
    doc.save('CarbonTrace_EF_Master_Table.pdf')
  }

  return (
    <div className="page-content fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text3)', marginBottom: '0.3rem' }}>
            PHASE 4 OUTPUT — ORIGINAL CAPSTONE CONTRIBUTION
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800 }}>
            EF Master Table
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Emission factors with source references, units, and confidence levels — for Indian construction materials
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowAdd(true)}>+ Add EF</button>
          <button className="btn btn-secondary btn-sm" onClick={exportExcel}>📊 Excel</button>
          <button className="btn btn-secondary btn-sm" onClick={exportPDF}>📄 PDF</button>
        </div>
      </div>

      <div className="alert alert-success mb-3">
        <span>📌</span>
        <span>This table is an <strong>original capstone contribution</strong>. Each entry includes a verified source, confidence level, and unit.
        EF values are curated specifically for the Indian construction context from ICE Database v3.0, BMTPC, IIT research, and other peer-reviewed sources.</span>
      </div>

      {/* Filters */}
      <div className="card mb-3" style={{ padding: '1rem 1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            style={{ maxWidth: '300px' }}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Search materials, sources..."
          />
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {categories.map(c => (
              <button
                key={c}
                className={`btn btn-sm ${catFilter === c ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setCatFilter(c)}
                style={{ fontSize: '0.78rem', padding: '0.3rem 0.75rem' }}
              >
                {c}
              </button>
            ))}
          </div>
          <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
            {filtered.length} entries
          </span>
        </div>
      </div>

      {/* Add EF form */}
      {showAdd && (
        <div className="card mb-3 fade-up" style={{ borderColor: 'var(--border-active)' }}>
          <div className="section-title mb-2">Add New Emission Factor</div>
          <div className="grid-3">
            <div><label>Material Name</label><input value={newEF.material_name} onChange={e => setNewEF(p => ({...p, material_name: e.target.value}))} /></div>
            <div><label>Category</label><input value={newEF.category} onChange={e => setNewEF(p => ({...p, category: e.target.value}))} /></div>
            <div><label>EF Value (kg CO₂e/tonne)</label><input type="number" value={newEF.ef_value} onChange={e => setNewEF(p => ({...p, ef_value: e.target.value}))} /></div>
            <div><label>Source / Reference</label><input value={newEF.source} onChange={e => setNewEF(p => ({...p, source: e.target.value}))} /></div>
            <div>
              <label>Confidence</label>
              <select value={newEF.confidence} onChange={e => setNewEF(p => ({...p, confidence: e.target.value}))}>
                <option>High</option><option>Medium</option><option>Low</option>
              </select>
            </div>
            <div><label>Notes</label><input value={newEF.notes} onChange={e => setNewEF(p => ({...p, notes: e.target.value}))} /></div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
            <button className="btn btn-primary btn-sm" onClick={addEF}>Save Entry</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowAdd(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Main table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto' }} />
            <p style={{ marginTop: '1rem', color: 'var(--text2)' }}>Loading emission factors...</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ minWidth: '900px' }}>
              <thead>
                <tr>
                  <th style={{ width: '22%' }}>Material Name</th>
                  <th style={{ width: '14%' }}>Category</th>
                  <th style={{ width: '10%', textAlign: 'right' }}>EF Value</th>
                  <th style={{ width: '12%' }}>Unit</th>
                  <th style={{ width: '25%' }}>Source / Reference</th>
                  <th style={{ width: '9%' }}>Confidence</th>
                  <th style={{ width: '8%' }}>Notes</th>
                  <th style={{ width: '4%' }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(ef => (
                  <tr key={ef.id}>
                    {editRow?.id === ef.id ? (
                      <>
                        <td><input value={editRow.material_name} onChange={e => setEditRow(p => ({...p, material_name: e.target.value}))} /></td>
                        <td><input value={editRow.category} onChange={e => setEditRow(p => ({...p, category: e.target.value}))} /></td>
                        <td><input type="number" value={editRow.ef_value} onChange={e => setEditRow(p => ({...p, ef_value: e.target.value}))} /></td>
                        <td><input value={editRow.unit} onChange={e => setEditRow(p => ({...p, unit: e.target.value}))} /></td>
                        <td><input value={editRow.source} onChange={e => setEditRow(p => ({...p, source: e.target.value}))} /></td>
                        <td>
                          <select value={editRow.confidence} onChange={e => setEditRow(p => ({...p, confidence: e.target.value}))}>
                            <option>High</option><option>Medium</option><option>Low</option>
                          </select>
                        </td>
                        <td><input value={editRow.notes || ''} onChange={e => setEditRow(p => ({...p, notes: e.target.value}))} /></td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.3rem' }}>
                            <button className="btn btn-primary btn-sm" onClick={saveEdit} style={{ padding: '0.3rem 0.5rem', fontSize: '0.72rem' }}>✓</button>
                            <button className="btn btn-ghost btn-sm" onClick={() => setEditRow(null)} style={{ padding: '0.3rem 0.5rem', fontSize: '0.72rem' }}>✕</button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td style={{ fontWeight: 500 }}>{ef.material_name}</td>
                        <td><span className="tag tag-blue" style={{ fontSize: '0.7rem' }}>{ef.category}</span></td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: ef.ef_value < 0 ? 'var(--accent)' : 'var(--text)' }}>
                          {ef.ef_value < 0 ? '(' : ''}{Math.abs(ef.ef_value).toLocaleString()}{ef.ef_value < 0 ? ')' : ''}
                        </td>
                        <td style={{ fontSize: '0.78rem', color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>{ef.unit}</td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text2)' }}>{ef.source || '—'}</td>
                        <td><span className={`tag ${CONFIDENCE_COLOR[ef.confidence] || 'tag-blue'}`}>{ef.confidence}</span></td>
                        <td style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>{ef.notes || '—'}</td>
                        <td>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setEditRow({ ...ef })}
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem' }}
                          >
                            ✏️
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="card mt-3" style={{ background: 'var(--bg2)', fontSize: '0.82rem' }}>
        <div className="section-title mb-2" style={{ fontSize: '0.9rem' }}>📚 Sources & Methodology</div>
        <div className="grid-2" style={{ color: 'var(--text2)', lineHeight: 1.8 }}>
          <div>
            <p><strong style={{ color: 'var(--text)' }}>ICE Database v3.0</strong> — Inventory of Carbon &amp; Energy, University of Bath. High confidence for most structural materials.</p>
            <p><strong style={{ color: 'var(--text)' }}>BMTPC India</strong> — Building Materials &amp; Technology Promotion Council. India-specific data for masonry.</p>
            <p><strong style={{ color: 'var(--text)' }}>IIT Bombay / NIT Calicut</strong> — Peer-reviewed research on Indian construction materials lifecycle.</p>
          </div>
          <div>
            <p><strong style={{ color: 'var(--text)' }}>Confidence levels:</strong> High = verified by multiple sources; Medium = single reliable source; Low = estimated or preliminary.</p>
            <p><strong style={{ color: 'var(--text)' }}>Negative EF values</strong> (shown in brackets) indicate carbon sequestration — e.g., timber and bamboo.</p>
            <p><strong style={{ color: 'var(--text)' }}>Unit:</strong> All values in kg CO₂e per tonne of material (cradle-to-gate, A1–A3 lifecycle stages).</p>
          </div>
        </div>
      </div>
    </div>
  )
}
