'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { supabase, type Content, type Progress } from '@/lib/supabase'

export default function CoursePage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const courseId = params.id as string
  const assignmentId = searchParams.get('assignment') || ''

  const [staff, setStaff] = useState<any>(null)
  const [lang, setLang] = useState<'en' | 'te'>('te')
  const [course, setCourse] = useState<any>(null)
  const [items, setItems] = useState<Content[]>([])
  const [progress, setProgress] = useState<Progress[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const s = localStorage.getItem('sv_staff')
    const l = localStorage.getItem('sv_lang') as 'en' | 'te'
    if (!s) { router.push('/staff'); return }
    setStaff(JSON.parse(s))
    if (l) setLang(l)
  }, [])

  useEffect(() => {
    if (!staff) return
    fetchCourse()
  }, [staff])

  async function fetchCourse() {
    const { data: c } = await supabase
      .from('lms_courses')
      .select('*')
      .eq('id', courseId)
      .single()
    setCourse(c)

    const { data: ci } = await supabase
      .from('lms_course_items')
      .select('*, content:lms_content(*)')
      .eq('course_id', courseId)
      .order('order_index')

    const contentList = (ci || []).map((i: any) => i.content).filter(Boolean)
    setItems(contentList)

    const { data: prog } = await supabase
      .from('lms_progress')
      .select('*')
      .eq('assignment_id', assignmentId)
      .eq('staff_id', staff.id)

    setProgress(prog || [])
    setLoading(false)
  }

  function getItemProgress(contentId: string) {
    return progress.find(p => p.content_id === contentId)
  }

  function getIcon(type: string) {
    return { jewellery_piece: '💎', video: '🎥', document: '📄', text: '📝' }[type] || '📄'
  }

  const completedCount = items.filter(i => getItemProgress(i.id)?.status === 'completed').length
  const totalPercent = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0

  return (
    <div className="min-h-screen" style={{ background: 'var(--ivory)' }}>
      {/* Header */}
      <div className="px-4 pt-6 pb-5" style={{ background: 'var(--plum)' }}>
        <button onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm mb-4"
          style={{ color: 'rgba(255,255,255,0.7)' }}>
          ← {lang === 'te' ? 'వెనక్కి' : 'Back'}
        </button>
        {course && (
          <>
            <div className="text-xs tracking-widest uppercase mb-1" style={{ color: 'var(--gold)' }}>
              {lang === 'te' ? 'కోర్సు' : 'Course'}
            </div>
            <h1 className="text-white text-xl font-bold mb-3"
              style={{ fontFamily: lang === 'te' ? 'Tiro Telugu, serif' : 'DM Sans, sans-serif' }}>
              {lang === 'te' ? course.title_te : course.title_en}
            </h1>
            {/* Progress bar */}
            <div className="flex items-center gap-3">
              <div className="flex-1 rounded-full h-2" style={{ background: 'rgba(255,255,255,0.15)' }}>
                <div className="h-2 rounded-full transition-all"
                  style={{ width: `${totalPercent}%`, background: 'var(--gold)' }} />
              </div>
              <div className="text-sm font-semibold" style={{ color: 'var(--gold)' }}>
                {completedCount}/{items.length}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Pass threshold note */}
      {course && (
        <div className="mx-4 mt-4 px-4 py-2.5 rounded-xl text-sm flex items-center gap-2"
          style={{ background: 'white', border: '1px solid var(--border)' }}>
          <span>🎯</span>
          <span style={{ color: 'var(--muted)',
            fontFamily: lang === 'te' ? 'Tiro Telugu, serif' : 'DM Sans, sans-serif' }}>
            {lang === 'te'
              ? `పాస్ కావాలంటే ${course.pass_threshold}% కావాలి`
              : `Pass mark: ${course.pass_threshold}%`}
          </span>
        </div>
      )}

      {/* Items list */}
      <div className="p-4 space-y-3">
        {loading && (
          <div className="text-center py-12" style={{ color: 'var(--muted)' }}>
            <div className="text-2xl mb-2">⏳</div>
            <div className="text-sm">{lang === 'te' ? 'లోడ్ అవుతోంది...' : 'Loading...'}</div>
          </div>
        )}

        {!loading && items.map((item, idx) => {
          const prog = getItemProgress(item.id)
          const isCompleted = prog?.status === 'completed'
          const isLocked = idx > 0 && !getItemProgress(items[idx - 1].id)?.status

          return (
            <div key={item.id}
              className={`bg-white rounded-2xl p-4 ${!isLocked ? 'card-hover cursor-pointer' : 'opacity-60'}`}
              style={{ border: `1.5px solid ${isCompleted ? '#6EE7B7' : 'var(--border)'}` }}
              onClick={() => {
                if (isLocked) return
                router.push(`/staff/lesson/${item.id}?assignment=${assignmentId}&course=${courseId}`)
              }}>
              <div className="flex items-center gap-3">
                {/* Step number / check */}
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                  style={{
                    background: isCompleted ? '#D1FAE5' : isLocked ? 'var(--rose)' : 'rgba(45,27,53,0.08)',
                    color: isCompleted ? '#065F46' : isLocked ? 'var(--muted)' : 'var(--plum)'
                  }}>
                  {isCompleted ? '✓' : isLocked ? '🔒' : idx + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-sm">{getIcon(item.type)}</span>
                    <span className="text-xs font-medium uppercase tracking-wide"
                      style={{ color: 'var(--gold)' }}>
                      {item.type === 'jewellery_piece' ? (lang === 'te' ? 'నగ పాఠం' : 'Jewellery') :
                       item.type === 'video' ? (lang === 'te' ? 'వీడియో' : 'Video') :
                       item.type === 'document' ? (lang === 'te' ? 'పోస్టర్' : 'Guide') : 'Text'}
                    </span>
                    {item.has_quiz && (
                      <span className="text-xs px-1.5 py-0.5 rounded"
                        style={{ background: '#FEF3C7', color: '#92400E' }}>
                        {lang === 'te' ? 'క్విజ్ ఉంది' : 'Has Quiz'}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-sm leading-snug" style={{ color: 'var(--charcoal)',
                    fontFamily: lang === 'te' ? 'Tiro Telugu, serif' : 'DM Sans, sans-serif' }}>
                    {lang === 'te' ? item.title_te : item.title_en}
                  </h3>
                </div>

                {!isLocked && (
                  <div className="text-lg" style={{ color: isCompleted ? '#10B981' : 'var(--muted)' }}>
                    {isCompleted ? '✅' : '→'}
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {/* All done — take final quiz or certificate */}
        {!loading && items.length > 0 && completedCount === items.length && (
          <div className="rounded-2xl p-5 text-center mt-2"
            style={{ background: 'linear-gradient(135deg, var(--plum), #4A2558)',
              border: '1.5px solid var(--gold)' }}>
            <div className="text-3xl mb-2">🎊</div>
            <h3 className="text-white font-bold text-lg mb-1"
              style={{ fontFamily: lang === 'te' ? 'Tiro Telugu, serif' : 'DM Sans, sans-serif' }}>
              {lang === 'te' ? 'అభినందనలు!' : 'Congratulations!'}
            </h3>
            <p className="text-sm mb-4"
              style={{ color: 'rgba(255,255,255,0.75)',
                fontFamily: lang === 'te' ? 'Tiro Telugu, serif' : 'DM Sans, sans-serif' }}>
              {lang === 'te'
                ? 'మీరు అన్ని పాఠాలు పూర్తి చేశారు'
                : 'You have completed all lessons'}
            </p>
            <button
              onClick={() => router.push(`/staff/certificate/${courseId}?assignment=${assignmentId}`)}
              className="px-6 py-2.5 rounded-xl font-semibold text-sm"
              style={{ background: 'var(--gold)', color: 'white',
                fontFamily: lang === 'te' ? 'Tiro Telugu, serif' : 'DM Sans, sans-serif' }}>
              {lang === 'te' ? 'సర్టిఫికెట్ తీసుకో' : 'Get Certificate'} 🏆
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
