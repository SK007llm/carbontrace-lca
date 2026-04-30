// Transport emission factors (kg CO2e / tonne-km)
export const TRANSPORT_EF = {
  Road: 0.085,
  Rail: 0.030,
  Sea: 0.012,
}

// Default distances from major Indian cities to project site (km) - rough average
export const DEFAULT_DISTANCES = {
  Road: 150,
  Rail: 400,
  Sea: 800,
}

// Global benchmarks (kg CO2e/m²)
export const BENCHMARKS = {
  rock_low: 200,
  rock_high: 600,
  india_typical_low: 280,
  india_typical_high: 450,
  india_label: 'Indian Residential Typical (280–450)',
  rock_label: 'Röck et al. 2020 (200–600)',
  net_zero_target: 300,
}

// Fallback emission factors (used if Supabase is unavailable)
export const FALLBACK_EF = [
  { id: 1, material_name: 'Portland Cement (OPC)', category: 'Concrete & Cement', ef_value: 830, unit: 'kg CO2e/tonne', source: 'IPCC 2023 / ICE Database v3.0', confidence: 'High' },
  { id: 2, material_name: 'Ready-Mix Concrete M25', category: 'Concrete & Cement', ef_value: 135, unit: 'kg CO2e/tonne', source: 'ICE Database v3.0 / BRE', confidence: 'High' },
  { id: 3, material_name: 'Ready-Mix Concrete M30', category: 'Concrete & Cement', ef_value: 152, unit: 'kg CO2e/tonne', source: 'ICE Database v3.0', confidence: 'High' },
  { id: 4, material_name: 'Reinforcement Steel (TMT)', category: 'Steel & Metal', ef_value: 1990, unit: 'kg CO2e/tonne', source: 'World Steel Association 2022', confidence: 'High' },
  { id: 5, material_name: 'Structural Steel Sections', category: 'Steel & Metal', ef_value: 2500, unit: 'kg CO2e/tonne', source: 'ICE Database v3.0', confidence: 'High' },
  { id: 6, material_name: 'Fly Ash Brick (Class F)', category: 'Masonry', ef_value: 78, unit: 'kg CO2e/tonne', source: 'NIT Calicut Study 2021', confidence: 'Medium' },
  { id: 7, material_name: 'Clay Burnt Brick', category: 'Masonry', ef_value: 240, unit: 'kg CO2e/tonne', source: 'BMTPC India / ICE Database', confidence: 'Medium' },
  { id: 8, material_name: 'AAC Block (Autoclaved)', category: 'Masonry', ef_value: 350, unit: 'kg CO2e/tonne', source: 'IIT Bombay Research 2020', confidence: 'Medium' },
  { id: 9, material_name: 'Sand (River/M-Sand)', category: 'Aggregates', ef_value: 5, unit: 'kg CO2e/tonne', source: 'ICE Database v3.0', confidence: 'High' },
  { id: 10, material_name: 'Coarse Aggregate (20mm)', category: 'Aggregates', ef_value: 7, unit: 'kg CO2e/tonne', source: 'ICE Database v3.0', confidence: 'High' },
  { id: 11, material_name: 'Ceramic Floor Tiles', category: 'Finishes', ef_value: 680, unit: 'kg CO2e/tonne', source: 'EPD Europe / ICE Database', confidence: 'Medium' },
  { id: 12, material_name: 'Vitrified Tiles', category: 'Finishes', ef_value: 790, unit: 'kg CO2e/tonne', source: 'EPD Europe', confidence: 'Medium' },
  { id: 13, material_name: 'Plaster (Gypsum)', category: 'Finishes', ef_value: 120, unit: 'kg CO2e/tonne', source: 'ICE Database v3.0', confidence: 'High' },
  { id: 14, material_name: 'Aluminium (Window frames)', category: 'Windows & Doors', ef_value: 8700, unit: 'kg CO2e/tonne', source: 'ICE Database v3.0 — primary', confidence: 'High' },
  { id: 15, material_name: 'uPVC Window Profile', category: 'Windows & Doors', ef_value: 2800, unit: 'kg CO2e/tonne', source: 'ICE Database v3.0', confidence: 'Medium' },
  { id: 16, material_name: 'Float Glass (Clear 6mm)', category: 'Windows & Doors', ef_value: 760, unit: 'kg CO2e/tonne', source: 'ICE Database v3.0', confidence: 'High' },
  { id: 17, material_name: 'Copper Wire & Cables', category: 'MEP Services', ef_value: 2700, unit: 'kg CO2e/tonne', source: 'ICE Database v3.0', confidence: 'Medium' },
  { id: 18, material_name: 'GI Pipe (MS ERW)', category: 'MEP Services', ef_value: 2300, unit: 'kg CO2e/tonne', source: 'World Steel Association', confidence: 'Medium' },
  { id: 19, material_name: 'Bitumen (Waterproofing)', category: 'Waterproofing', ef_value: 380, unit: 'kg CO2e/tonne', source: 'ICE Database v3.0', confidence: 'Medium' },
  { id: 20, material_name: 'EPS Insulation Board', category: 'Insulation', ef_value: 3300, unit: 'kg CO2e/tonne', source: 'ICE Database v3.0', confidence: 'Medium' },
  { id: 21, material_name: 'Wood (Softwood Timber)', category: 'Wood & Bamboo', ef_value: -1600, unit: 'kg CO2e/tonne', source: 'ICE Database v3.0 (biogenic)', confidence: 'Medium' },
  { id: 22, material_name: 'Bamboo (Structural)', category: 'Wood & Bamboo', ef_value: -1800, unit: 'kg CO2e/tonne', source: 'LCA literature (India)', confidence: 'Low' },
]

// Convert quantity to tonnes based on unit
export function toTonnes(quantity, unit) {
  const conversions = {
    tonne: 1, t: 1, T: 1,
    kg: 0.001,
    m3: 2.4, // avg density ~2400 kg/m³ (varies per material)
    'm²': 0.025, // rough slab/tile thickness ~10mm
    nos: 0.003, // bricks ~3 kg each
    bags: 0.05, // 50 kg cement bag
    ltr: 0.001,
  }
  return quantity * (conversions[unit] || 1)
}

// Main calculation engine
export function calculateLCA(boqItems, builtUpArea) {
  const results = boqItems.map(item => {
    const qty_tonnes = toTonnes(item.quantity, item.unit)
    const ef = parseFloat(item.ef_value) || 0
    const dist = parseFloat(item.distance_km) || DEFAULT_DISTANCES[item.transport_mode] || 150
    const transportEF = TRANSPORT_EF[item.transport_mode] || TRANSPORT_EF.Road

    const material_co2 = qty_tonnes * ef
    const transport_co2 = qty_tonnes * dist * transportEF
    const total_co2 = material_co2 + transport_co2

    return {
      ...item,
      qty_tonnes,
      material_co2,
      transport_co2,
      total_co2,
    }
  })

  const total_co2_kg = results.reduce((sum, r) => sum + r.total_co2, 0)
  const total_co2_tonnes = total_co2_kg / 1000
  const co2_per_m2 = builtUpArea > 0 ? total_co2_kg / builtUpArea : 0

  // Group by category
  const byCategory = results.reduce((acc, r) => {
    const cat = r.category || 'Other'
    if (!acc[cat]) acc[cat] = { category: cat, material_co2: 0, transport_co2: 0, total_co2: 0 }
    acc[cat].material_co2 += r.material_co2
    acc[cat].transport_co2 += r.transport_co2
    acc[cat].total_co2 += r.total_co2
    return acc
  }, {})

  const categoryBreakdown = Object.values(byCategory).sort((a, b) => b.total_co2 - a.total_co2)

  // Top emitter
  const topEmitter = results.reduce((max, r) => r.total_co2 > (max?.total_co2 || 0) ? r : max, null)

  // Benchmark comparison
  const benchmarkStatus =
    co2_per_m2 < BENCHMARKS.rock_low ? 'excellent' :
    co2_per_m2 <= BENCHMARKS.india_typical_low ? 'good' :
    co2_per_m2 <= BENCHMARKS.india_typical_high ? 'typical' :
    co2_per_m2 <= BENCHMARKS.rock_high ? 'high' : 'very_high'

  return {
    lineItems: results,
    total_co2_kg,
    total_co2_tonnes,
    co2_per_m2,
    categoryBreakdown,
    topEmitter,
    benchmarkStatus,
    transport_total: results.reduce((s, r) => s + r.transport_co2, 0),
    material_total: results.reduce((s, r) => s + r.material_co2, 0),
  }
}

export const CATEGORY_COLORS = {
  'Concrete & Cement': '#ef4444',
  'Steel & Metal': '#f97316',
  'Masonry': '#eab308',
  'Aggregates': '#84cc16',
  'Finishes': '#06b6d4',
  'Windows & Doors': '#8b5cf6',
  'MEP Services': '#ec4899',
  'Waterproofing': '#14b8a6',
  'Insulation': '#a78bfa',
  'Wood & Bamboo': '#22c55e',
  'Other': '#94a3b8',
}
