import { AnimatePresence, MotionConfig } from 'framer-motion'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import Layout from './components/Layout'
import PageTransition from './components/PageTransition'
import CustomCursor from './components/CustomCursor'
import Home from './pages/Home'
import Setup from './pages/Setup'
import Quiz from './pages/Quiz'
import Result from './pages/Result'
import History from './pages/History'
import About from './pages/About'
import Play from './pages/Play'
import Concepts from './pages/Concepts'
import Progress from './pages/Progress'
import Take from './pages/Take'
import Lab from './pages/Lab'

export default function App() {
  const location = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [location.pathname])

  return (
    <MotionConfig reducedMotion="user">
      <CustomCursor />
      <Layout>
        <AnimatePresence mode="wait" initial={false}>
          <PageTransition key={location.pathname}>
            <Routes location={location}>
              <Route path="/" element={<Home />} />
              <Route path="/setup" element={<Setup />} />
              <Route path="/quiz" element={<Quiz />} />
              <Route path="/result" element={<Result />} />
              <Route path="/history" element={<History />} />
              <Route path="/about" element={<About />} />
              <Route path="/play" element={<Play />} />
              <Route path="/concepts" element={<Concepts />} />
              <Route path="/progress" element={<Progress />} />
              <Route path="/take" element={<Take />} />
              <Route path="/lab" element={<Lab />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </PageTransition>
        </AnimatePresence>
      </Layout>
    </MotionConfig>
  )
}
