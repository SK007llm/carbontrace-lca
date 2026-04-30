import { useLocation, useNavigate } from 'react-router-dom'

const steps = [
  { path: '/input', label: 'Data Input', num: '1' },
  { path: '/results', label: 'Results', num: '2' },
  { path: '/ef-table', label: 'EF Master Table', num: '3' },
]

export default function TopBar({ projectData, lcaResults }) {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <header className="topbar">
      <a className="logo" href="/" onClick={e => { e.preventDefault(); navigate('/') }}>
        <div className="logo-icon">🌿</div>
        Carbon<span>Trace</span> LCA
      </a>

      <nav className="nav-steps">
        {steps.map((s, i) => {
          const isActive = location.pathname === s.path
          const isDone =
            (s.path === '/input' && (location.pathname === '/results' || location.pathname === '/ef-table')) ||
            (s.path === '/results' && location.pathname === '/ef-table')
          return (
            <button
              key={s.path}
              className={`step-btn ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}
              onClick={() => navigate(s.path)}
            >
              <span className="step-num">{isDone ? '✓' : s.num}</span>
              {s.label}
            </button>
          )
        })}
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {projectData && (
          <span style={{ fontSize: '0.8rem', color: 'var(--text2)', fontFamily: 'var(--font-mono)' }}>
            {projectData.project_name}
          </span>
        )}
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: '0.8rem', color: 'var(--text3)', textDecoration: 'none' }}
        >
          v1.0
        </a>
      </div>
    </header>
  )
}
