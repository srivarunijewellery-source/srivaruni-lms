'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [admin, setAdmin] = useState<any>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const a = localStorage.getItem('sv_admin')
    if (!a && pathname !== '/admin/login') {
      router.replace('/admin/login')
      return
    }
    if (a) setAdmin(JSON.parse(a))
    setChecking(false)
  }, [pathname])

  if (checking) return null
  if (pathname === '/admin/login') return <>{children}</>

  const navItems = [
    { href: '/admin/dashboard',   label: 'Dashboard',   icon: '📊' },
    { href: '/admin/courses',     label: 'Courses',      icon: '📚' },
    { href: '/admin/content',     label: 'Content',      icon: '📝' },
    { href: '/admin/assignments', label: 'Assignments',  icon: '📋' },
    { href: '/admin/staff',       label: 'Staff',        icon: '👥' },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F7F5F2', fontFamily: 'DM Sans, sans-serif' }}>
      {/* Sidebar */}
      <div style={{ width: 220, background: '#1E0A2E', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 40 }}>
        {/* Brand */}
        <div style={{ padding: '24px 20px 20px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#C9933A', marginBottom: 4 }}>Sri Varuni</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Training Admin</div>
        </div>
        <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '0 20px' }} />

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 12px' }}>
          {navItems.map(item => (
            <a key={item.href} href={item.href}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                borderRadius: 8, marginBottom: 2, textDecoration: 'none', fontSize: 13, fontWeight: 500,
                background: pathname.startsWith(item.href) ? 'rgba(201,147,58,0.15)' : 'transparent',
                color: pathname.startsWith(item.href) ? '#C9933A' : 'rgba(255,255,255,0.65)',
                borderLeft: pathname.startsWith(item.href) ? '2px solid #C9933A' : '2px solid transparent',
                transition: 'all 0.15s',
              }}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
            </a>
          ))}
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

      {/* Main content */}
      <div style={{ marginLeft: 220, flex: 1, padding: '32px 32px' }}>
        {children}
      </div>
    </div>
  )
}
