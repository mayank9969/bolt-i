import { useEffect, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link, NavLink as RouterNavLink, useLocation } from 'react-router-dom'
import { LogoMark, Wordmark } from './Logo'
import Background from './Background'
import ThemeSwitcher from './ThemeSwitcher'
import NexusStage from './three/NexusStage'

const NAV = [
  { to: '/', label: 'Home' },
  { to: '/setup', label: 'Start Quiz' },
  { to: '/history', label: 'History' },
  { to: '/about', label: 'About' },
]

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const inQuiz = location.pathname === '/quiz'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => setOpen(false), [location.pathname])

  return (
    <div className="min-h-screen flex flex-col relative">
      <Background />
      <NexusStage />

      <header
        className={`sticky top-0 z-50 transition-colors duration-300 border-b ${
          scrolled || open ? 'bg-canvas/85 backdrop-blur-md border-line' : 'bg-transparent border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 group shrink-0 rounded-lg" aria-label="NEXUSQuiz home">
            <LogoMark size={32} className="transition-transform duration-300 group-hover:scale-105 group-hover:rotate-[-3deg]" />
            <Wordmark className="text-[17px]" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV.map((item) => (
              <NavItem key={item.to} to={item.to} label={item.label} />
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <ThemeSwitcher />
            {!inQuiz && (
              <Link to="/setup" className="btn-primary !px-4 !py-2 !text-sm">
                Start Quiz
              </Link>
            )}
          </div>

          {/* Mobile: theme + menu */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeSwitcher />
            <button
            onClick={() => setOpen((v) => !v)}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-fg-2 hover:text-fg hover:bg-card transition-colors"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {open ? <path d="M6 6l12 12M6 18L18 6" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {open && (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="md:hidden overflow-hidden border-t border-line"
            >
              <div className="px-5 py-4 flex flex-col gap-1">
                {NAV.map((item) => (
                  <RouterNavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-medium transition-colors ${
                        isActive ? 'bg-accent/10 text-fg' : 'text-fg-2 hover:bg-card hover:text-fg'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span className={`w-1 h-4 rounded-full ${isActive ? 'bg-accent' : 'bg-transparent'}`} aria-hidden="true" />
                        {item.label}
                      </>
                    )}
                  </RouterNavLink>
                ))}
                {!inQuiz && (
                  <Link to="/setup" className="btn-primary mt-3">
                    Start Quiz
                  </Link>
                )}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-1 relative z-10 flex flex-col">{children}</main>

      {!inQuiz && <Footer />}
    </div>
  )
}

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <RouterNavLink to={to} end={to === '/'} className="relative px-3.5 py-1.5 rounded-full text-sm font-medium">
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
    <footer className="relative z-10 mt-auto border-t border-line-strong bg-canvas/70 backdrop-blur-sm">
      <div className="max-w-page mx-auto px-5 sm:px-6 lg:px-8 py-10 grid sm:grid-cols-12 gap-6 items-end">
        <div className="sm:col-span-6 flex items-center gap-3">
          <LogoMark size={24} />
          <Wordmark className="text-base" />
        </div>
        <p className="sm:col-span-3 font-mono text-[11px] tracking-[0.18em] uppercase text-fg-3">
          Living knowledge network · build v2 paper
        </p>
        <p className="sm:col-span-3 sm:text-right text-xs text-fg-3">
          Built by <span className="text-fg-2 font-medium">Mayank Sarwal</span>
        </p>
      </div>
    </footer>
  )
}
