'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AdminAssignments() {
  const [courses, setCourses] = useState<any[]>([])
  const [staff, setStaff] = useState<any[]>([])
  const [assignments, setAssignments] = useState<any[]>([])
  const [selectedCourse, setSelectedCourse] = useState('')
  const [assignTarget, setAssignTarget] = useState<'all' | 'individual'>('all')
  const [selectedStaff, setSelectedStaff] = useState<string[]>([])
  const [dueDate, setDueDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [filterCourse, setFilterCourse] = useState('all')

  useEffect(() => { load() }, [])

  async function load() {
    const [{ data: c }, { data: s }, { data: a }] = await Promise.all([
      supabase.from('lms_courses').select('id, title_en, status').order('created_at'),
      supabase.from('staff').select('id, name, role').eq('active', true).order('name'),
      supabase.from('lms_assignments')
        .select('id, status, due_date, assigned_at, course:lms_courses(id,title_en), staff:staff(id,name,role)')
        .order('assigned_at', { ascending: false }),
    ])
    setCourses(c || [])
    setStaff(s || [])
    setAssignments(a || [])
    setLoading(false)
  }

  async function handleAssign() {
    if (!selectedCourse) { setMessage('Please select a course.'); return }
    setSaving(true)
    setMessage('')

    const targets = assignTarget === 'all'
      ? staff.map(s => s.id)
      : selectedStaff

    if (targets.length === 0) { setMessage('Please select at least one staff member.'); setSaving(false); return }

    const rows = targets.map(staffId => ({
      course_id: selectedCourse,
      staff_id: staffId,
      assigned_at: new Date().toISOString(),
      due_date: dueDate || null,
      status: 'pending',
    }))

    const { error } = await supabase.from('lms_assignments')
      .upsert(rows, { onConflict: 'course_id,staff_id', ignoreDuplicates: true })

    if (error) { setMessage('Error assigning: ' + error.message); setSaving(false); return }

    setMessage(`✓ Assigned to ${targets.length} staff member${targets.length > 1 ? 's' : ''} successfully.`)
    setSaving(false)
    setSelectedCourse('')
    setSelectedStaff([])
    setDueDate('')
    load()
  }

  async function handleUnassign(assignmentId: string) {
    if (!confirm('Remove this assignment?')) return
    await supabase.from('lms_assignments').delete().eq('id', assignmentId)
    load()
  }

  const filtered = filterCourse === 'all' ? assignments : assignments.filter(a => (a.course as any)?.id === filterCourse)

  const statusBadge = (s: string) => {
    const map: Record<string, [string, string]> = {
      pending:     ['Pending',     '#FEF3DC|#7A4D00'],
      in_progress: ['In Progress', '#EAF1FB|#1A4A8A'],
      completed:   ['Completed',   '#E8F5EE|#1A6B3C'],
      overdue:     ['Overdue',     '#FDECEA|#9B1C1C'],
    }
    const [label, colors] = map[s] || map.pending
    const [bg, color] = colors.split('|')
    return <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: bg, color }}>{label}</span>
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1E0A2E', margin: 0 }}>Assignments</h1>
        <p style={{ color: '#5A5A5A', fontSize: 14, marginTop: 4 }}>Assign courses to staff and track progress</p>
      </div>

      {/* Assign form */}
      <div style={{ background: '#fff', border: '1.5px solid #E2D8E8', borderRadius: 14, padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1E0A2E', marginBottom: 20, marginTop: 0 }}>Assign a Course</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          {/* Course select */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#5A5A5A', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Course</label>
            <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}
              style={{ width: '100%', padding: '11px 14px', fontSize: 14, border: '1.5px solid #D4CEC8', borderRadius: 10, background: '#fff', fontFamily: 'DM Sans, sans-serif', color: '#111', outline: 'none' }}>
              <option value="">Select a course...</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.title_en} {c.status === 'draft' ? '(Draft)' : ''}</option>
              ))}
            </select>
          </div>

          {/* Due date */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#5A5A5A', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Due Date (optional)</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
              style={{ width: '100%', padding: '11px 14px', fontSize: 14, border: '1.5px solid #D4CEC8', borderRadius: 10, background: '#fff', fontFamily: 'DM Sans, sans-serif', color: '#111', outline: 'none', boxSizing: 'border-box' }} />
          </div>
        </div>

        {/* Assign target */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#5A5A5A', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Assign To</label>
          <div style={{ display: 'flex', gap: 10 }}>
            {(['all', 'individual'] as const).map(t => (
              <button key={t} onClick={() => setAssignTarget(t)}
                style={{ padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', border: '1.5px solid', borderColor: assignTarget === t ? '#1E0A2E' : '#D4CEC8', background: assignTarget === t ? '#1E0A2E' : '#fff', color: assignTarget === t ? '#fff' : '#5A5A5A', transition: 'all 0.15s' }}>
                {t === 'all' ? 'All Active Staff' : 'Individual Staff'}
              </button>
            ))}
          </div>
        </div>

        {/* Individual selection */}
        {assignTarget === 'individual' && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#5A5A5A', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Select Staff Members</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {staff.map(s => (
                <button key={s.id} onClick={() => setSelectedStaff(prev => prev.includes(s.id) ? prev.filter(x => x !== s.id) : [...prev, s.id])}
                  style={{ padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', border: '1.5px solid', transition: 'all 0.15s', borderColor: selectedStaff.includes(s.id) ? '#1E0A2E' : '#D4CEC8', background: selectedStaff.includes(s.id) ? '#1E0A2E' : '#fff', color: selectedStaff.includes(s.id) ? '#fff' : '#2C2C2C' }}>
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {message && (
          <div style={{ padding: '10px 14px', borderRadius: 8, fontSize: 14, fontWeight: 500, marginBottom: 16, background: message.startsWith('✓') ? '#E8F5EE' : '#FDECEA', color: message.startsWith('✓') ? '#1A6B3C' : '#9B1C1C' }}>
            {message}
          </div>
        )}

        <button onClick={handleAssign} disabled={saving}
          style={{ padding: '12px 28px', background: saving ? '#9A9A9A' : '#1E0A2E', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
          {saving ? 'Assigning...' : 'Assign Course →'}
        </button>
      </div>

      {/* Existing assignments */}
      <div style={{ background: '#fff', border: '1.5px solid #E2D8E8', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #E2D8E8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1E0A2E', margin: 0 }}>All Assignments ({filtered.length})</h2>
          <select value={filterCourse} onChange={e => setFilterCourse(e.target.value)}
            style={{ padding: '7px 12px', fontSize: 13, border: '1.5px solid #D4CEC8', borderRadius: 8, fontFamily: 'DM Sans, sans-serif', outline: 'none' }}>
            <option value="all">All Courses</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.title_en}</option>)}
          </select>
        </div>

        {loading ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#5A5A5A' }}>Loading...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#FAF8F4' }}>
                {['Staff', 'Role', 'Course', 'Status', 'Due Date', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#5A5A5A', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((a, i) => (
                <tr key={i} style={{ borderTop: '1px solid #E2D8E8' }}>
                  <td style={{ padding: '12px 20px', fontSize: 14, fontWeight: 600, color: '#1E0A2E' }}>{(a.staff as any)?.name}</td>
                  <td style={{ padding: '12px 20px', fontSize: 13, color: '#5A5A5A' }}>{(a.staff as any)?.role}</td>
                  <td style={{ padding: '12px 20px', fontSize: 13, color: '#2C2C2C' }}>{(a.course as any)?.title_en}</td>
                  <td style={{ padding: '12px 20px' }}>{statusBadge(a.status)}</td>
                  <td style={{ padding: '12px 20px', fontSize: 13, color: '#5A5A5A' }}>
                    {a.due_date ? new Date(a.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td style={{ padding: '12px 20px' }}>
                    <button onClick={() => handleUnassign(a.id)}
                      style={{ fontSize: 12, color: '#9B1C1C', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 600 }}>
                      Remove
                    </button>
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
