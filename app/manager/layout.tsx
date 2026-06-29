'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [manager, setManager] = useState<any>(null)
  const [checking, setChecking] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const m = localStorage.getItem('sv_manager')
    if (!m && pathname !== '/manager/login') { router.replace('/manager/login'); return }
    if (m) setManager(JSON.parse(m))
    setChecking(false)
  }, [pathname])

  useEffect(() => { setMenuOpen(false) }, [pathname])

  if (checking) return null
  if (pathname === '/manager/login') return <>{children}</>

  const nav = [
    { href: '/manager/dashboard', label: 'Overview',  icon: '📊' },
    { href: '/manager/staff',     label: 'My Team',   icon: '👥' },
  ]

  const Sidebar = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1E0A2E' }}>
      <div style={{ padding: '24px 20px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#C9933A', marginBottom: 4 }}>Sri Varuni</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Manager Portal</div>
        </div>
        <button onClick={() => setMenuOpen(false)} className="mgr-close-btn"
          style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, width: 32, height: 32, color: '#fff', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          ✕
        </button>
      </div>
      <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '0 20px' }} />
      <nav style={{ flex: 1, padding: '12px' }}>
        {nav.map(item => (
          <a key={item.href} href={item.href} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
            borderRadius: 8, marginBottom: 2, textDecoration: 'none', fontSize: 13, fontWeight: 500,
            background: pathname.startsWith(item.href) ? 'rgba(201,147,58,0.15)' : 'transparent',
            color: pathname.startsWith(item.href) ? '#C9933A' : 'rgba(255,255,255,0.65)',
            borderLeft: `2px solid ${pathname.startsWith(item.href) ? '#C9933A' : 'transparent'}`,
          }}>
            <span style={{ fontSize: 16 }}>{item.icon}</span>{item.label}
          </a>
        ))}
      </nav>
      <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>Manager</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 10 }}>{manager?.name}</div>
        <button onClick={() => { localStorage.removeItem('sv_manager'); router.replace('/manager/login') }}
          style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
          Sign out →
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F7F5F2', fontFamily: 'DM Sans, sans-serif' }}>
      {/* Desktop sidebar */}
      <div className="mgr-sidebar-desktop" style={{ width: 200, background: '#1E0A2E', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 40, flexShrink: 0 }}>
        <Sidebar />
      </div>

      {/* Mobile overlay */}
      {menuOpen && <div onClick={() => setMenuOpen(false)} className="mgr-overlay"
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 45 }} />}

      {/* Mobile sidebar */}
      <div className="mgr-sidebar-mobile"
        style={{ width: 220, background: '#1E0A2E', position: 'fixed', top: 0, left: menuOpen ? 0 : -240, bottom: 0, zIndex: 50, transition: 'left 0.25s ease' }}>
        <Sidebar />
      </div>

      {/* Main */}
      <div className="mgr-main" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Mobile topbar */}
        <div className="mgr-topbar" style={{ background: '#1E0A2E', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 30 }}>
          <button onClick={() => setMenuOpen(true)}
            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, width: 36, height: 36, color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ☰
          </button>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#C9933A' }}>Sri Varuni</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Manager Portal</div>
          </div>
        </div>
        <div className="mgr-content" style={{ flex: 1, padding: '24px 16px' }}>
          {children}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM Sans:wght@400;500;600;700&display=swap');
        @media (min-width: 768px) {
          .mgr-sidebar-desktop { display: block !important; }
          .mgr-sidebar-mobile  { display: none !important; }
          .mgr-overlay         { display: none !important; }
          .mgr-topbar          { display: none !important; }
          .mgr-main            { margin-left: 200px; }
          .mgr-content         { padding: 32px !important; }
          .mgr-close-btn       { display: none !important; }
        }
        @media (max-width: 767px) {
          .mgr-sidebar-desktop { display: none !important; }
          .mgr-main            { margin-left: 0 !important; }
        }
      `}</style>
    </div>
  )
}
