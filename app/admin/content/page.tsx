'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AdminContent() {
  const router = useRouter()
  const [courses, setCourses] = useState<any[]>([])
  const [unlinked, setUnlinked] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'hierarchy' | 'flat'>('hierarchy')

  useEffect(() => { load() }, [])

  async function load() {
    const [{ data: allContent }, { data: allCourses }, { data: courseItems }] = await Promise.all([
      supabase.from('lms_content').select('id, title_en, title_te, type, category, status, has_quiz, draft_status, created_at'),
      supabase.from('lms_courses').select('id, title_en, status').order('created_at'),
      supabase.from('lms_course_items').select('course_id, content_id, order_index').order('order_index'),
    ])

    const contentMap = new Map((allContent || []).map((c: any) => [c.id, c]))
    const linkedContentIds = new Set((courseItems || []).map((ci: any) => ci.content_id))

    const coursesWithModules = (allCourses || []).map((course: any) => {
      const items = (courseItems || [])
        .filter((ci: any) => ci.course_id === course.id)
        .map((ci: any) => contentMap.get(ci.content_id))
        .filter(Boolean)
      const pendingCount = items.filter((m: any) => m.draft_status === 'pending_review').length
      const publishedCount = items.filter((m: any) => m.status === 'published').length
      return { ...course, modules: items, pendingCount, publishedCount, totalModules: items.length }
    })

    setCourses(coursesWithModules)
    setUnlinked((allContent || []).filter((c: any) => !linkedContentIds.has(c.id)))
    setExpandedCourse(coursesWithModules[0]?.id || null)
    setLoading(false)
  }

  async function toggleStatus(item: any) {
    setToggling(item.id)
    const newStatus = item.status === 'published' ? 'draft' : 'published'
    await supabase.from('lms_content').update({ status: newStatus }).eq('id', item.id)
    await load()
    setToggling(null)
  }

  const totalPending = courses.reduce((a, c) => a + c.pendingCount, 0) + unlinked.filter(c => c.draft_status === 'pending_review').length
  const typeIcon = (t: string) => ({ jewellery_piece: '💎', video: '🎥', document: '📋', text: '📝' }[t] || '📄')

  function ModuleRow({ item, idx }: { item: any; idx: number }) {
    const hasPendingDraft = item.draft_status === 'pending_review'
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderTop: idx > 0 ? '1px solid #E2D8E8' : 'none', background: hasPendingDraft ? '#FFFBF0' : '#fff' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#5A5A5A', width: 20, flexShrink: 0 }}>{idx + 1}</span>
        <span style={{ fontSize: 16, flexShrink: 0 }}>{typeIcon(item.type)}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1E0A2E' }}>{item.title_en}</div>
          <div style={{ fontSize: 12, color: '#5A5A5A' }}>{item.title_te}</div>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, flexShrink: 0,
          background: item.status === 'published' ? '#E8F5EE' : '#FEF3DC', color: item.status === 'published' ? '#1A6B3C' : '#7A4D00' }}>
          {item.status === 'published' ? 'Published' : 'Draft'}
        </span>
        {hasPendingDraft && (
          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: '#FEF3DC', color: '#7A4D00', flexShrink: 0 }}>⚠️ Review</span>
        )}
        {item.draft_status === 'approved' && (
          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: '#E8F5EE', color: '#1A6B3C', flexShrink: 0 }}>✓ Approved</span>
        )}
        <button onClick={() => router.push(`/admin/content/${item.id}`)}
          style={{ fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 6, border: `1.5px solid ${hasPendingDraft ? '#7A4D00' : '#D4CEC8'}`, background: hasPendingDraft ? '#FEF3DC' : '#fff', color: hasPendingDraft ? '#7A4D00' : '#5A5A5A', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', flexShrink: 0 }}>
          {hasPendingDraft ? 'Review →' : 'View'}
        </button>
        <button onClick={() => toggleStatus(item)} disabled={toggling === item.id}
          style={{ fontSize: 12, fontWeight: 600, padding: '5px 10px', borderRadius: 6, border: '1.5px solid', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', flexShrink: 0,
            borderColor: item.status === 'published' ? '#9B1C1C' : '#1A6B3C', background: item.status === 'published' ? '#FDECEA' : '#E8F5EE', color: item.status === 'published' ? '#9B1C1C' : '#1A6B3C' }}>
          {toggling === item.id ? '...' : item.status === 'published' ? 'Unpublish' : 'Publish'}
        </button>
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1E0A2E', margin: 0 }}>Content Library</h1>
          <p style={{ color: '#5A5A5A', fontSize: 14, marginTop: 4 }}>Organised by course and module</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {totalPending > 0 && (
            <div style={{ background: '#FEF3DC', border: '1.5px solid #FDE68A', borderRadius: 10, padding: '8px 14px' }}>
              <p style={{ fontSize: 13, color: '#7A4D00', fontWeight: 700, margin: 0 }}>⚠️ {totalPending} awaiting review</p>
            </div>
          )}
          <div style={{ display: 'flex', gap: 4, background: '#F0EBF8', borderRadius: 8, padding: 3 }}>
            <button onClick={() => setViewMode('hierarchy')}
              style={{ padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', background: viewMode === 'hierarchy' ? '#1E0A2E' : 'transparent', color: viewMode === 'hierarchy' ? '#fff' : '#5A5A5A' }}>
              By Course
            </button>
            <button onClick={() => setViewMode('flat')}
              style={{ padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', background: viewMode === 'flat' ? '#1E0A2E' : 'transparent', color: viewMode === 'flat' ? '#fff' : '#5A5A5A' }}>
              Flat List
            </button>
          </div>
        </div>
      </div>

      {loading ? <p style={{ color: '#5A5A5A' }}>Loading...</p> : viewMode === 'hierarchy' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {courses.map(course => (
            <div key={course.id} style={{ background: '#fff', border: '1.5px solid #E2D8E8', borderRadius: 14, overflow: 'hidden' }}>
              <button onClick={() => setExpandedCourse(expandedCourse === course.id ? null : course.id)}
                style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: '#FAF8F4', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'DM Sans, sans-serif' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 16, color: '#5A5A5A', transform: expandedCourse === course.id ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s', display: 'inline-block' }}>›</span>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#1E0A2E' }}>{course.title_en}</div>
                    <div style={{ fontSize: 12, color: '#5A5A5A', marginTop: 2 }}>
                      {course.totalModules} modules · {course.publishedCount} published
                      {course.pendingCount > 0 && <span style={{ color: '#7A4D00', fontWeight: 700 }}> · ⚠️ {course.pendingCount} pending review</span>}
                    </div>
                  </div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: course.status === 'published' ? '#E8F5EE' : '#FEF3DC', color: course.status === 'published' ? '#1A6B3C' : '#7A4D00' }}>
                  {course.status === 'published' ? 'Published' : 'Draft'}
                </span>
              </button>
              {expandedCourse === course.id && (
                <div>
                  {course.modules.map((m: any, i: number) => <ModuleRow key={m.id} item={m} idx={i} />)}
                </div>
              )}
            </div>
          ))}

          {unlinked.length > 0 && (
            <div style={{ background: '#fff', border: '1.5px solid #E2D8E8', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', background: '#FAF8F4' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1E0A2E' }}>Not linked to any course</div>
                <div style={{ fontSize: 12, color: '#5A5A5A', marginTop: 2 }}>{unlinked.length} items</div>
              </div>
              {unlinked.map((m, i) => <ModuleRow key={m.id} item={m} idx={i} />)}
            </div>
          )}
        </div>
      ) : (
        /* Flat list */
        <div style={{ background: '#fff', border: '1.5px solid #E2D8E8', borderRadius: 14, overflow: 'hidden' }}>
          {courses.flatMap(c => c.modules).concat(unlinked).map((m, i) => <ModuleRow key={m.id} item={m} idx={i} />)}
        </div>
      )}
    </div>
  )
}
