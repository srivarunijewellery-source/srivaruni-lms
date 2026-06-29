'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [admin, setAdmin] = useState<any>(null)
  const [checking, setChecking] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const a = localStorage.getItem('sv_admin')
    if (!a && pathname !== '/admin/login') {
      router.replace('/admin/login')
      return
    }
    if (a) setAdmin(JSON.parse(a))
    setChecking(false)
  }, [pathname])

  // Close sidebar on route change
  useEffect(() => { setSidebarOpen(false) }, [pathname])

  if (checking) return null
  if (pathname === '/admin/login') return <>{children}</>

  const navItems = [
    { href: '/admin/dashboard',   label: 'Dashboard',   icon: '📊' },
    { href: '/admin/courses',     label: 'Courses',      icon: '📚' },
    { href: '/admin/content',     label: 'Content',      icon: '📝' },
    { href: '/admin/assignments', label: 'Assignments',  icon: '📋' },
    { href: '/admin/staff',       label: 'Staff',        icon: '👥' },
  ]

  function NavLink({ item }: { item: typeof navItems[0] }) {
    const active = pathname.startsWith(item.href)
    return (
      <a href={item.href}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 12px', borderRadius: 8, marginBottom: 2,
          textDecoration: 'none', fontSize: 13, fontWeight: 500,
          background: active ? 'rgba(201,147,58,0.15)' : 'transparent',
          color: active ? '#C9933A' : 'rgba(255,255,255,0.65)',
          borderLeft: `2px solid ${active ? '#C9933A' : 'transparent'}`,
        }}>
        <span style={{ fontSize: 16 }}>{item.icon}</span>
        {item.label}
      </a>
    )
  }

  const SidebarContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Brand */}
      <div style={{ padding: '24px 20px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#C9933A', marginBottom: 4 }}>
            Sri Varuni
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Training Admin</div>
        </div>
        {/* Close button — mobile only */}
        <button onClick={() => setSidebarOpen(false)}
          style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, width: 32, height: 32, color: '#fff', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          className="sidebar-close-btn">
          ✕
        </button>
      </div>

      <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '0 20px' }} />

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 12px' }}>
        {navItems.map(item => <NavLink key={item.href} item={item} />)}
      </nav>

      {/* Admin info */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>Signed in as</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 10 }}>{admin?.name || 'Admin'}</div>
        <button onClick={() => { localStorage.removeItem('sv_admin'); router.replace('/admin/login') }}
          style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'DM Sans, sans-serif' }}>
          Sign out →
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F7F5F2', fontFamily: 'DM Sans, sans-serif' }}>

      {/* Desktop sidebar — always visible ≥ 768px */}
      <div className="admin-sidebar-desktop" style={{ width: 220, background: '#1E0A2E', flexShrink: 0, position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 40 }}>
        <SidebarContent />
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 45 }}
          className="admin-sidebar-overlay" />
      )}

      {/* Mobile sidebar — slides in */}
      <div className="admin-sidebar-mobile"
        style={{ width: 240, background: '#1E0A2E', position: 'fixed', top: 0, left: sidebarOpen ? 0 : -260, bottom: 0, zIndex: 50, transition: 'left 0.25s ease', boxShadow: sidebarOpen ? '4px 0 20px rgba(0,0,0,0.3)' : 'none' }}>
        <SidebarContent />
      </div>

      {/* Main area */}
      <div className="admin-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Mobile top bar */}
        <div className="admin-topbar" style={{ background: '#1E0A2E', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 30 }}>
          <button onClick={() => setSidebarOpen(true)}
            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, width: 36, height: 36, color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ☰
          </button>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#C9933A' }}>Sri Varuni</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Training Admin</div>
          </div>
        </div>

        {/* Page content */}
        <div className="admin-content" style={{ flex: 1, padding: '24px 16px' }}>
          {children}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

        /* Desktop: show fixed sidebar, hide mobile elements */
        @media (min-width: 768px) {
          .admin-sidebar-desktop { display: block !important; }
          .admin-sidebar-mobile  { display: none !important; }
          .admin-sidebar-overlay { display: none !important; }
          .admin-topbar          { display: none !important; }
          .admin-main            { margin-left: 220px; }
          .admin-content         { padding: 32px 32px !important; }
          .sidebar-close-btn     { display: none !important; }
        }

        /* Mobile: hide desktop sidebar, show topbar + slide-in sidebar */
        @media (max-width: 767px) {
          .admin-sidebar-desktop { display: none !important; }
          .admin-main            { margin-left: 0 !important; }
        }
      `}</style>
    </div>
  )
}
