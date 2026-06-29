'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ManagerDashboard() {
  const router = useRouter()
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const m = localStorage.getItem('sv_manager')
    if (!m) { router.replace('/manager/login'); return }
    load()
  }, [])

  async function load() {
    const { data: c } = await supabase
      .from('lms_courses')
      .select('id, title_en, pass_threshold')
      .eq('status', 'published')
      .order('created_at')

    const withStats = await Promise.all((c || []).map(async (course: any) => {
      const [
        { count: total },
        { count: completed },
        { count: inProgress },
        { data: scores }
      ] = await Promise.all([
        supabase.from('lms_assignments').select('*', { count: 'exact', head: true }).eq('course_id', course.id),
        supabase.from('lms_assignments').select('*', { count: 'exact', head: true }).eq('course_id', course.id).eq('status', 'completed'),
        supabase.from('lms_assignments').select('*', { count: 'exact', head: true }).eq('course_id', course.id).eq('status', 'in_progress'),
        supabase.from('lms_module_quiz_results').select('score').eq('course_id', course.id).eq('is_best_score', true).eq('passed', true),
      ])
      const avgScore = scores && scores.length > 0
        ? Math.round(scores.reduce((a: number, s: any) => a + s.score, 0) / scores.length)
        : null

      return { ...course, total: total || 0, completed: completed || 0, inProgress: inProgress || 0, pending: (total || 0) - (completed || 0) - (inProgress || 0), avgScore }
    }))

    setCourses(withStats)
    setLoading(false)
  }

  const totalStaff = courses[0]?.total || 0
  const totalCompleted = courses.reduce((a, c) => a + c.completed, 0)
  const totalInProgress = courses.reduce((a, c) => a + c.inProgress, 0)

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1E0A2E', margin: 0 }}>Store Overview</h1>
        <p style={{ color: '#5A5A5A', fontSize: 14, marginTop: 4 }}>Training progress across all staff</p>
      </div>

      {/* Top stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { icon: '👥', num: totalStaff, label: 'Total Staff', color: '#1E0A2E' },
          { icon: '✅', num: totalCompleted, label: 'Completions', color: '#1A6B3C' },
          { icon: '🔄', num: totalInProgress, label: 'In Progress', color: '#1A4A8A' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', border: '1.5px solid #E2D8E8', borderRadius: 12, padding: '16px' }}>
            <div style={{ fontSize: 22 }}>{s.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: s.color, lineHeight: 1, marginTop: 6 }}>{s.num}</div>
            <div style={{ fontSize: 12, color: '#5A5A5A', marginTop: 4, fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Per course cards */}
      {loading ? <p style={{ color: '#5A5A5A' }}>Loading...</p> : courses.map(course => {
        const pct = course.total > 0 ? Math.round((course.completed / course.total) * 100) : 0
        return (
          <div key={course.id} style={{ background: '#fff', border: '1.5px solid #E2D8E8', borderRadius: 14, padding: '20px', marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1E0A2E', margin: 0, marginBottom: 2 }}>{course.title_en}</h2>
                <span style={{ fontSize: 12, color: '#5A5A5A' }}>Pass mark: {course.pass_threshold}%</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#C9933A' }}>{pct}%</div>
                <div style={{ fontSize: 11, color: '#5A5A5A' }}>completion</div>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ height: 8, borderRadius: 999, background: '#F0EBF8', overflow: 'hidden', marginBottom: 14 }}>
              <div style={{ height: 8, borderRadius: 999, background: pct === 100 ? '#1A6B3C' : '#C9933A', width: `${pct}%`, transition: 'width 0.4s' }} />
            </div>

            {/* Breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {[
                { num: course.completed,  label: 'Completed', bg: '#E8F5EE', color: '#1A6B3C' },
                { num: course.inProgress, label: 'In Progress', bg: '#EAF1FB', color: '#1A4A8A' },
                { num: course.pending,    label: 'Pending', bg: '#FEF3DC', color: '#7A4D00' },
                { num: course.avgScore !== null ? `${course.avgScore}%` : '—', label: 'Avg Score', bg: '#F3E8FF', color: '#6B21A8' },
              ].map(s => (
                <div key={s.label} style={{ background: s.bg, borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: s.color }}>{s.num}</div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: s.color, marginTop: 2, opacity: 0.8 }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #E2D8E8' }}>
              <a href="/manager/staff" style={{ fontSize: 13, color: '#C9933A', textDecoration: 'none', fontWeight: 600 }}>
                View individual staff →
              </a>
            </div>
          </div>
        )
      })}
    </div>
  )
}
