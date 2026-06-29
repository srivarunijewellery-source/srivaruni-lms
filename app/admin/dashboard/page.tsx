'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

function StatCard({ icon, number, label, sub }: { icon: string; number: number | string; label: string; sub?: string }) {
  return (
    <div style={{ background: '#fff', border: '1.5px solid #E2D8E8', borderRadius: 14, padding: '20px 24px' }}>
      <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 32, fontWeight: 700, color: '#1E0A2E', lineHeight: 1 }}>{number}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#2C2C2C', marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: '#5A5A5A', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({ courses: 0, staff: 0, assignments: 0, completed: 0, quizResults: 0, certificates: 0 })
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    const [
      { count: courses },
      { count: staff },
      { count: assignments },
      { count: completed },
      { count: quizResults },
      { count: certificates },
      { data: recent }
    ] = await Promise.all([
      supabase.from('lms_courses').select('*', { count: 'exact', head: true }),
      supabase.from('staff').select('*', { count: 'exact', head: true }).eq('active', true),
      supabase.from('lms_assignments').select('*', { count: 'exact', head: true }),
      supabase.from('lms_assignments').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
      supabase.from('lms_module_quiz_results').select('*', { count: 'exact', head: true }),
      supabase.from('lms_certificates').select('*', { count: 'exact', head: true }),
      supabase.from('lms_module_quiz_results')
        .select('score, passed, completed_at, staff:staff(name), course:lms_courses(title_en)')
        .order('completed_at', { ascending: false })
        .limit(8)
    ])
    setStats({ courses: courses || 0, staff: staff || 0, assignments: assignments || 0, completed: completed || 0, quizResults: quizResults || 0, certificates: certificates || 0 })
    setRecentActivity(recent || [])
    setLoading(false)
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1E0A2E', margin: 0 }}>Dashboard</h1>
        <p style={{ color: '#5A5A5A', fontSize: 14, marginTop: 4 }}>Sri Varuni Training Overview</p>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        <StatCard icon="📚" number={stats.courses} label="Courses" sub="Total published" />
        <StatCard icon="👥" number={stats.staff} label="Active Staff" sub="Enrolled in training" />
        <StatCard icon="📋" number={stats.assignments} label="Assignments" sub="Total across all staff" />
        <StatCard icon="✅" number={stats.completed} label="Completed" sub="Course completions" />
        <StatCard icon="📝" number={stats.quizResults} label="Quiz Attempts" sub="Module quizzes taken" />
        <StatCard icon="🏆" number={stats.certificates} label="Certificates" sub="Issued to staff" />
      </div>

      {/* Recent quiz activity */}
      <div style={{ background: '#fff', border: '1.5px solid #E2D8E8', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #E2D8E8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1E0A2E', margin: 0 }}>Recent Quiz Activity</h2>
          <a href="/admin/staff" style={{ fontSize: 13, color: '#C9933A', textDecoration: 'none', fontWeight: 600 }}>View all →</a>
        </div>
        {loading ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#5A5A5A', fontSize: 14 }}>Loading...</div>
        ) : recentActivity.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#5A5A5A', fontSize: 14 }}>No quiz activity yet.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#FAF8F4' }}>
                {['Staff', 'Course', 'Score', 'Result', 'Date'].map(h => (
                  <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#5A5A5A', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentActivity.map((r, i) => (
                <tr key={i} style={{ borderTop: '1px solid #E2D8E8' }}>
                  <td style={{ padding: '12px 20px', fontSize: 14, fontWeight: 500, color: '#1E0A2E' }}>{(r.staff as any)?.name}</td>
                  <td style={{ padding: '12px 20px', fontSize: 13, color: '#5A5A5A' }}>{(r.course as any)?.title_en}</td>
                  <td style={{ padding: '12px 20px', fontSize: 14, fontWeight: 700, color: r.score >= 80 ? '#1A6B3C' : '#9B1C1C' }}>{r.score}%</td>
                  <td style={{ padding: '12px 20px' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: r.passed ? '#E8F5EE' : '#FDECEA', color: r.passed ? '#1A6B3C' : '#9B1C1C' }}>
                      {r.passed ? 'Passed' : 'Failed'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 20px', fontSize: 13, color: '#5A5A5A' }}>
                    {new Date(r.completed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
