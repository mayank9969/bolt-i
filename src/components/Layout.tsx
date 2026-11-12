import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Link, NavLink as RouterNavLink, useLocation } from 'react-router-dom'
import { LogoMark, Wordmark } from './Logo'
import Background from './Background'
import ThemeSwitcher from './ThemeSwitcher'
import FieldGuide from './FieldGuide'
import Exhibit from './Exhibit'
import PortalStage from './three/PortalStage'

const NAV = [
  { to: '/', label: 'Home' },
  { to: '/play', label: 'Practice' },
  { to: '/history', label: 'History' },
  { to: '/about', label: 'About' },
]

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation()
  const inQuiz = location.pathname === '/quiz'
  const inPractice = location.pathname === '/play'

  return (
    <div className="min-h-screen flex flex-col relative">
      <Background />
      <FieldGuide />
      <Exhibit />
      <PortalStage />

      <header className="sticky top-0 z-50 bg-canvas/92 backdrop-blur-md border-b border-line">
        <div className="veyra-header max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 h-[5.25rem] flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 sm:gap-3.5 group shrink-0 rounded-lg" aria-label="VEYRA home">
            <span className="origin-left scale-[0.55] sm:scale-[0.85] lg:scale-100">
              <LogoMark size={72} />
            </span>
            <Wordmark className="veyra-wordmark text-[18px] sm:text-[22px]" />
          </Link>

          <nav className="veyra-nav desk-nav flex items-center gap-0.5 sm:gap-1 min-w-0 overflow-x-auto [scrollbar-width:none] [-webkit-overflow-scrolling:touch]">
            {NAV.map((item) => (
              <NavItem key={item.to} to={item.to} label={item.label} />
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <ThemeSwitcher />
            {!inQuiz && (
              <Link to="/setup" className="btn-primary btn-sm hidden md:inline-flex">
                Start Quiz
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 relative z-10 flex flex-col overflow-x-clip">{children}</main>

      {!inQuiz && (
        <nav className="phone-dock" aria-label="Mobile">
          {NAV.map((item) => (
            <RouterNavLink key={item.to} to={item.to} end={item.to === '/'} className="phone-dock-link">
              {item.label}
            </RouterNavLink>
          ))}
        </nav>
      )}

      {!inQuiz && !inPractice && <Footer />}
    </div>
  )
}

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <RouterNavLink to={to} end={to === '/'} className="relative px-2.5 sm:px-3.5 py-1.5 rounded-full t-nav">
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId="nav-active"
              className="absolute inset-0 rounded-full border border-line-strong"
              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            />
          )}
          <span className={`relative z-10 transition-colors ${isActive ? 'text-fg' : 'text-fg-2 hover:text-fg'}`}>
            {label}
          </span>
        </>
      )}
    </RouterNavLink>
  )
}

function Footer() {
  return (
    <footer className="nb-foot relative z-10 mt-auto">
      <div className="max-w-page mx-auto px-5 sm:px-8 lg:px-12 py-12 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <p className="figcap flex items-center gap-2">
            <LogoMark size={28} animated={false} />
            VEYRA
          </p>
          <p className="t-caption text-fg-2 mt-2 max-w-sm">
            A knowledge archipelago. Paper and Ink. Scores live on the server.
          </p>
        </div>
        <p className="t-caption text-fg-3">Mayank Sarwal</p>
      </div>
    </footer>
  )
}
