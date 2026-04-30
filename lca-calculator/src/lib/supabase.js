import { createClient } from '@supabase/supabase-js'

// Replace these with your actual Supabase project credentials
// Go to: https://supabase.com → Your Project → Settings → API
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://YOUR_PROJECT.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_ANON_KEY'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ─── SUPABASE SCHEMA (run this SQL in your Supabase SQL editor) ───────────────
//
// -- Emission factors master table
// CREATE TABLE emission_factors (
//   id SERIAL PRIMARY KEY,
//   material_name TEXT NOT NULL,
//   category TEXT NOT NULL,
//   ef_value NUMERIC NOT NULL,
//   unit TEXT NOT NULL DEFAULT 'kg CO2e/tonne',
//   source TEXT,
//   confidence TEXT CHECK (confidence IN ('High','Medium','Low')),
//   notes TEXT,
//   created_at TIMESTAMPTZ DEFAULT NOW()
// );
//
// -- Projects table
// CREATE TABLE projects (
//   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//   project_name TEXT NOT NULL,
//   location TEXT,
//   building_type TEXT,
//   built_up_area NUMERIC,
//   num_floors INTEGER,
//   created_at TIMESTAMPTZ DEFAULT NOW()
// );
//
// -- BOQ line items
// CREATE TABLE boq_items (
//   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//   project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
//   material_name TEXT NOT NULL,
//   quantity NUMERIC NOT NULL,
//   unit TEXT NOT NULL,
//   supplier_city TEXT,
//   transport_mode TEXT DEFAULT 'Road',
//   distance_km NUMERIC DEFAULT 100,
//   ef_value NUMERIC,
//   material_co2 NUMERIC,
//   transport_co2 NUMERIC,
//   total_co2 NUMERIC,
//   created_at TIMESTAMPTZ DEFAULT NOW()
// );
//
// -- Seed emission factors
// INSERT INTO emission_factors (material_name, category, ef_value, unit, source, confidence) VALUES
// ('Portland Cement (OPC)', 'Concrete & Cement', 830, 'kg CO2e/tonne', 'IPCC 2023 / ICE Database v3.0', 'High'),
// ('Ready-Mix Concrete M25', 'Concrete & Cement', 135, 'kg CO2e/tonne', 'ICE Database v3.0 / BRE', 'High'),
// ('Ready-Mix Concrete M30', 'Concrete & Cement', 152, 'kg CO2e/tonne', 'ICE Database v3.0', 'High'),
// ('Reinforcement Steel (TMT)', 'Steel & Metal', 1990, 'kg CO2e/tonne', 'World Steel Association 2022', 'High'),
// ('Structural Steel Sections', 'Steel & Metal', 2500, 'kg CO2e/tonne', 'ICE Database v3.0', 'High'),
// ('Fly Ash Brick (Class F)', 'Masonry', 78, 'kg CO2e/tonne', 'NIT Calicut Study 2021', 'Medium'),
// ('Clay Burnt Brick', 'Masonry', 240, 'kg CO2e/tonne', 'BMTPC India / ICE Database', 'Medium'),
// ('AAC Block (Autoclaved)', 'Masonry', 350, 'kg CO2e/tonne', 'IIT Bombay Research 2020', 'Medium'),
// ('Sand (River/M-Sand)', 'Aggregates', 5, 'kg CO2e/tonne', 'ICE Database v3.0', 'High'),
// ('Coarse Aggregate (20mm)', 'Aggregates', 7, 'kg CO2e/tonne', 'ICE Database v3.0', 'High'),
// ('Ceramic Floor Tiles', 'Finishes', 680, 'kg CO2e/tonne', 'EPD Europe / ICE Database', 'Medium'),
// ('Vitrified Tiles', 'Finishes', 790, 'kg CO2e/tonne', 'EPD Europe', 'Medium'),
// ('Plaster (Gypsum)', 'Finishes', 120, 'kg CO2e/tonne', 'ICE Database v3.0', 'High'),
// ('Aluminium (Window frames)', 'Windows & Doors', 8700, 'kg CO2e/tonne', 'ICE Database v3.0 — primary', 'High'),
// ('uPVC Window Profile', 'Windows & Doors', 2800, 'kg CO2e/tonne', 'ICE Database v3.0', 'Medium'),
// ('Float Glass (Clear 6mm)', 'Windows & Doors', 760, 'kg CO2e/tonne', 'ICE Database v3.0', 'High'),
// ('Copper Wire & Cables', 'MEP Services', 2700, 'kg CO2e/tonne', 'ICE Database v3.0', 'Medium'),
// ('GI Pipe (MS ERW)', 'MEP Services', 2300, 'kg CO2e/tonne', 'World Steel Association', 'Medium'),
// ('Bitumen (Waterproofing)', 'Waterproofing', 380, 'kg CO2e/tonne', 'ICE Database v3.0', 'Medium'),
// ('EPS Insulation Board', 'Insulation', 3300, 'kg CO2e/tonne', 'ICE Database v3.0', 'Medium'),
// ('Wood (Softwood Timber)', 'Wood & Bamboo', -1600, 'kg CO2e/tonne', 'ICE Database v3.0 (biogenic)', 'Medium'),
// ('Bamboo (Structural)', 'Wood & Bamboo', -1800, 'kg CO2e/tonne', 'LCA literature (India)', 'Low');
//
// ─────────────────────────────────────────────────────────────────────────────
