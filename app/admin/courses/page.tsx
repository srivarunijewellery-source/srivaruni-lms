'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AdminCourses() {
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('lms_courses')
      .select(`id, title_en, title_te, status, pass_threshold, has_module_quiz, module_quiz_questions,
        items:lms_course_items(count), assignments:lms_assignments(count)`)
      .order('created_at')
    // Get real counts separately
    const withCounts = await Promise.all((data || []).map(async (c: any) => {
      const [{ count: items }, { count: assignments }, { count: completed }] = await Promise.all([
        supabase.from('lms_course_items').select('*', { count: 'exact', head: true }).eq('course_id', c.id),
        supabase.from('lms_assignments').select('*', { count: 'exact', head: true }).eq('course_id', c.id),
        supabase.from('lms_assignments').select('*', { count: 'exact', head: true }).eq('course_id', c.id).eq('status', 'completed'),
      ])
      return { ...c, itemCount: items || 0, assignmentCount: assignments || 0, completedCount: completed || 0 }
    }))
    setCourses(withCounts)
    setLoading(false)
  }

  async function toggleStatus(course: any) {
    setToggling(course.id)
    const newStatus = course.status === 'published' ? 'draft' : 'published'
    await supabase.from('lms_courses').update({ status: newStatus }).eq('id', course.id)
    await load()
    setToggling(null)
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1E0A2E', margin: 0 }}>Courses</h1>
        <p style={{ color: '#5A5A5A', fontSize: 14, marginTop: 4 }}>Manage and publish training courses</p>
      </div>

      {loading ? <p style={{ color: '#5A5A5A' }}>Loading...</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {courses.map(c => (
            <div key={c.id} style={{ background: '#fff', border: '1.5px solid #E2D8E8', borderRadius: 14, padding: '20px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1E0A2E', margin: 0 }}>{c.title_en}</h2>
                    <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: c.status === 'published' ? '#E8F5EE' : '#FEF3DC', color: c.status === 'published' ? '#1A6B3C' : '#7A4D00' }}>
                      {c.status === 'published' ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: '#5A5A5A' }}>{c.title_te}</div>
                </div>
                <button onClick={() => toggleStatus(c)} disabled={toggling === c.id}
                  style={{ padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', border: '1.5px solid', marginLeft: 16, flexShrink: 0, transition: 'all 0.15s',
                    borderColor: c.status === 'published' ? '#9B1C1C' : '#1A6B3C',
                    background: c.status === 'published' ? '#FDECEA' : '#E8F5EE',
                    color: c.status === 'published' ? '#9B1C1C' : '#1A6B3C' }}>
                  {toggling === c.id ? '...' : c.status === 'published' ? 'Unpublish' : 'Publish'}
                </button>
              </div>

              {/* Stats row */}
              <div style={{ display: 'flex', gap: 24 }}>
                {[
                  { label: 'Modules', value: c.itemCount },
                  { label: 'Pass mark', value: `${c.pass_threshold}%` },
                  { label: 'Quiz questions', value: c.has_module_quiz ? c.module_quiz_questions : 'None' },
                  { label: 'Assigned to', value: `${c.assignmentCount} staff` },
                  { label: 'Completed by', value: `${c.completedCount} staff` },
                ].map(s => (
                  <div key={s.label}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#5A5A5A', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{s.label}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#1E0A2E', marginTop: 2 }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Completion bar */}
              {c.assignmentCount > 0 && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: '#5A5A5A' }}>Completion</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#1E0A2E' }}>{Math.round((c.completedCount / c.assignmentCount) * 100)}%</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 999, background: '#F0EBF8', overflow: 'hidden' }}>
                    <div style={{ height: 6, borderRadius: 999, background: '#C9933A', width: `${(c.completedCount / c.assignmentCount) * 100}%`, transition: 'width 0.4s' }} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
