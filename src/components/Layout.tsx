import { useEffect, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link, NavLink as RouterNavLink, useLocation } from 'react-router-dom'
import { LogoMark, Wordmark } from './Logo'
import Background from './Background'

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

      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled || open
            ? 'bg-ink-975/80 backdrop-blur-xl border-b border-ink-800/60'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 group shrink-0" aria-label="NEXUSQuiz home">
            <LogoMark size={32} className="transition-transform duration-300 group-hover:scale-105 group-hover:rotate-[-3deg]" />
            <Wordmark className="text-[17px]" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 p-1 rounded-xl bg-ink-900/40 border border-ink-800/60">
            {NAV.map((item) => (
              <NavItem key={item.to} to={item.to} label={item.label} />
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {!inQuiz && (
              <Link to="/setup" className="btn-primary !px-4 !py-2 !text-sm">
                Start Quiz
              </Link>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="md:hidden w-10 h-10 rounded-xl flex items-center justify-center text-ink-200 hover:bg-ink-800/60 transition-colors"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {open ? <path d="M6 6l12 12M6 18L18 6" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {open && (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="md:hidden overflow-hidden border-t border-ink-800/60"
            >
              <div className="px-5 py-4 flex flex-col gap-1">
                {NAV.map((item) => (
                  <RouterNavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      `px-4 py-3 rounded-xl text-[15px] font-medium transition-colors ${
                        isActive ? 'bg-accent-400/10 text-accent-200' : 'text-ink-200 hover:bg-ink-800/60'
                      }`
                    }
                  >
                    {item.label}
                  </RouterNavLink>
                ))}
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
    <RouterNavLink to={to} end={to === '/'} className="relative px-3.5 py-1.5 rounded-lg text-sm font-medium">
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId="nav-active"
              className="absolute inset-0 rounded-lg bg-ink-800/80 border border-ink-700/60"
              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            />
          )}
          <span className={`relative z-10 transition-colors ${isActive ? 'text-ink-50' : 'text-ink-300 hover:text-ink-100'}`}>
            {label}
          </span>
        </>
      )}
    </RouterNavLink>
  )
}

function Footer() {
  return (
    <footer className="relative z-10 mt-auto border-t border-ink-800/60">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <LogoMark size={22} />
          <Wordmark className="text-sm" />
          <span className="text-ink-600 text-sm hidden sm:inline">·</span>
          <span className="text-xs text-ink-500 hidden sm:inline">Test your knowledge. Build your mastery.</span>
        </div>
        <p className="text-xs text-ink-500">
          Built by <span className="text-ink-300 font-medium">Mayank Sarwal</span>
        </p>
      </div>
    </footer>
  )
}
