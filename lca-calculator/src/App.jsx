import { useState } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import TopBar from './components/TopBar.jsx'
import HomePage from './pages/HomePage.jsx'
import InputPage from './pages/InputPage.jsx'
import ResultsPage from './pages/ResultsPage.jsx'
import EFTablePage from './pages/EFTablePage.jsx'
import ProjectsPage from './pages/ProjectsPage.jsx'

export default function App() {
  const [projectData, setProjectData] = useState(null)
  const [lcaResults, setLcaResults] = useState(null)

  return (
    <div className="app-shell">
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <TopBar projectData={projectData} lcaResults={lcaResults} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/input" element={
            <InputPage
              projectData={projectData}
              setProjectData={setProjectData}
              setLcaResults={setLcaResults}
            />
          } />
          <Route path="/results" element={
            <ResultsPage lcaResults={lcaResults} projectData={projectData} />
          } />
          <Route path="/ef-table" element={<EFTablePage />} />
          <Route path="/projects" element={
            <ProjectsPage
              setProjectData={setProjectData}
              setLcaResults={setLcaResults}
            />
          } />
        </Routes>
      </div>
    </div>
  )
}
