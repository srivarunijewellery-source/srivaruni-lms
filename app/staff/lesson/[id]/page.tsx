'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LessonPage() {
  const router = useRouter()
  const { id: contentId } = useParams() as { id: string }
  const sp = useSearchParams()
  const assignmentId = sp.get('assignment') || ''
  const courseId     = sp.get('course')     || ''

  const [staff,    setStaff]    = useState<any>(null)
  const [content,  setContent]  = useState<any>(null)
  const [items,    setItems]    = useState<any[]>([])   // all course items in order
  const [quizCount,setQuizCount]= useState(0)
  const [lang,     setLang]     = useState<'en'|'te'>('en')
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [imgZoom,  setImgZoom]  = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [audioPlaying, setAudioPlaying] = useState(false)
  const [audioPct,     setAudioPct]     = useState(0)

  useEffect(() => {
    const s = localStorage.getItem('sv_staff')
    if (!s) { router.replace('/staff'); return }
    setStaff(JSON.parse(s))
    const l = localStorage.getItem('sv_lang') as 'en'|'te'
    if (l) setLang(l)
  }, [])

  useEffect(() => { if (staff) load() }, [staff, contentId])

  async function load() {
    setLoading(true)
    const [{ data: c }, { data: q }, { data: ci }] = await Promise.all([
      supabase.from('lms_content').select('*').eq('id', contentId).single(),
      supabase.from('lms_quizzes').select('id').eq('content_id', contentId),
      supabase.from('lms_course_items')
        .select('order_index, content_id')
        .eq('course_id', courseId)
        .order('order_index'),
    ])
    setContent(c)
    setQuizCount((q || []).length)
    setItems(ci || [])
    // Mark in progress
    await supabase.from('lms_progress').upsert({
      assignment_id: assignmentId, staff_id: staff.id, content_id: contentId,
      status: 'in_progress', started_at: new Date().toISOString(),
    }, { onConflict: 'assignment_id,content_id' })
    setLoading(false)
  }

  // prev / next content ids
  const currentIdx = items.findIndex(i => i.content_id === contentId)
  const prevItem   = currentIdx > 0 ? items[currentIdx - 1] : null
  const nextItem   = currentIdx < items.length - 1 ? items[currentIdx + 1] : null
  const isLast     = currentIdx === items.length - 1

  function toggleLang() {
    const nl = lang === 'en' ? 'te' : 'en'
    setLang(nl); localStorage.setItem('sv_lang', nl)
  }

  function toggleAudio() {
    const a = audioRef.current; if (!a) return
    if (audioPlaying) { a.pause(); setAudioPlaying(false) }
    else { a.play(); setAudioPlaying(true) }
  }

  async function markComplete() {
    setSaving(true)
    await supabase.from('lms_progress').upsert({
      assignment_id: assignmentId, staff_id: staff.id, content_id: contentId,
      status: 'completed', started_at: new Date().toISOString(), completed_at: new Date().toISOString(),
    }, { onConflict: 'assignment_id,content_id' })
    setSaving(false)
  }

  async function handleNext() {
    await markComplete()
    if (quizCount > 0) {
      router.push(`/staff/quiz/${contentId}?assignment=${assignmentId}&course=${courseId}`)
    } else if (nextItem) {
      router.push(`/staff/lesson/${nextItem.content_id}?assignment=${assignmentId}&course=${courseId}`)
    } else {
      router.push(`/staff/course/${courseId}?assignment=${assignmentId}`)
    }
  }

  const title = content ? (lang === 'te' ? content.title_te : content.title_en) : ''
  const body  = content ? (lang === 'te' ? content.body_te  : content.body_en)  : ''

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--ivory)' }}>
      <p style={{ color: 'var(--muted)', fontFamily: 'DM Sans,sans-serif' }}>Loading lesson...</p>
    </div>
  )

  return (
    <>
      {/* ── STICKY HEADER ── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'var(--plum)', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px' }}>
          {/* Left: back + title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
            <button onClick={() => router.push(`/staff/course/${courseId}?assignment=${assignmentId}`)}
              style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, padding: '6px 10px', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', flexShrink: 0 }}>
              ← Back
            </button>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentIdx + 1}/{items.length} · {title}
            </span>
          </div>
          {/* Right: lang toggle */}
          <button onClick={toggleLang}
            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid var(--gold-btn)', borderRadius: 20, padding: '5px 12px', color: 'var(--gold-btn)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', flexShrink: 0, marginLeft: 8 }}>
            {lang === 'en' ? 'తెలుగు' : 'English'}
          </button>
        </div>

        {/* Thin progress bar */}
        <div style={{ height: 3, background: 'rgba(255,255,255,0.15)' }}>
          <div style={{ height: 3, background: 'var(--gold-btn)', width: `${((currentIdx + 1) / items.length) * 100}%`, transition: 'width 0.3s' }} />
        </div>
      </div>

      {/* ── MAIN LAYOUT: split screen on wide, stacked on mobile ── */}
      <div style={{ minHeight: 'calc(100vh - 57px)', display: 'flex', flexDirection: 'column', background: 'var(--ivory)', paddingBottom: 80 }}>

        <div style={{
          display: 'flex',
          flexDirection: 'row',
          flex: 1,
          // On narrow screens flex wraps to column via media — we handle with min-width trick
        }}>

          {/* ── LEFT: Image panel ── */}
          {content?.photo_url && (
            <div style={{
              width: '45%',
              minWidth: 280,
              background: '#111',
              position: 'sticky',
              top: 57,
              height: 'calc(100vh - 57px)',
              overflow: 'hidden',
              flexShrink: 0,
              // On mobile this collapses — handled below via media
            }}
              className="lesson-image-panel"
            >
              <img
                src={content.photo_url}
                alt={title}
                onClick={() => setImgZoom(true)}
                style={{ width: '100%', height: '100%', objectFit: 'contain', cursor: 'zoom-in', display: 'block' }}
              />
              <div style={{ position: 'absolute', bottom: 12, right: 12, background: 'rgba(0,0,0,0.55)', borderRadius: 8, padding: '4px 10px', fontSize: 12, color: '#fff', cursor: 'pointer' }}
                onClick={() => setImgZoom(true)}>
                🔍 Tap to zoom
              </div>
            </div>
          )}

          {/* ── RIGHT: Content panel ── */}
          <div style={{ flex: 1, padding: '24px 20px', overflowY: 'auto', minWidth: 0 }}>
            {/* Category pill */}
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold)', marginBottom: 6 }}>
              {content?.category}
            </div>

            {/* Title */}
            <h1 style={{
              fontSize: 22, fontWeight: 700, color: 'var(--charcoal)', marginBottom: 16, lineHeight: 1.3,
              fontFamily: lang === 'te' ? 'Noto Sans Telugu, sans-serif' : 'DM Sans, sans-serif'
            }}>
              {title}
            </h1>

            {/* Audio player */}
            {content?.audio_url && (
              <div style={{ background: 'var(--plum)', borderRadius: 12, padding: '14px 16px', marginBottom: 20 }}>
                <audio ref={audioRef} src={content.audio_url}
                  onTimeUpdate={() => { const a = audioRef.current; if (a?.duration) setAudioPct((a.currentTime / a.duration) * 100) }}
                  onEnded={() => setAudioPlaying(false)} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button onClick={toggleAudio}
                    style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--gold-btn)', border: 'none', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {audioPlaying ? '⏸' : '▶'}
                  </button>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginBottom: 6 }}>
                      {lang === 'te' ? 'వివరణ వినండి' : 'Listen to explanation'}
                    </p>
                    <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 999, height: 4 }}>
                      <div style={{ height: 4, borderRadius: 999, background: 'var(--gold-btn)', width: `${audioPct}%`, transition: 'width 0.3s' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Lesson body */}
            {body && (
              <div style={{ fontSize: 15, lineHeight: lang === 'te' ? 2 : 1.75, color: 'var(--body)', marginBottom: 24,
                fontFamily: lang === 'te' ? 'Noto Sans Telugu, sans-serif' : 'DM Sans, sans-serif' }}>
                {body}
              </div>
            )}

            {/* Quiz notice */}
            {quizCount > 0 && (
              <div style={{ background: 'var(--warning-bg)', border: '1px solid #FDE68A', borderRadius: 10, padding: '12px 16px', marginBottom: 8 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--warning-text)',
                  fontFamily: lang === 'te' ? 'Noto Sans Telugu, sans-serif' : 'DM Sans, sans-serif' }}>
                  📝 {lang === 'te' ? `${quizCount} క్విజ్ ప్రశ్నలు` : `${quizCount} quiz questions follow`}
                </p>
                <p style={{ fontSize: 13, color: 'var(--warning-text)', marginTop: 3, opacity: 0.85,
                  fontFamily: lang === 'te' ? 'Noto Sans Telugu, sans-serif' : 'DM Sans, sans-serif' }}>
                  {lang === 'te' ? 'పోస్టర్ జాగ్రత్తగా చదివిన తర్వాత కొనసాగండి' : 'Study the poster carefully before continuing'}
                </p>
              </div>
            )}

            {/* Prev / Next inline nav */}
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              {prevItem && (
                <button onClick={() => router.push(`/staff/lesson/${prevItem.content_id}?assignment=${assignmentId}&course=${courseId}`)}
                  style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--white)', color: 'var(--body)', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}>
                  ← Previous
                </button>
              )}
              <button onClick={handleNext} disabled={saving}
                className={quizCount > 0 ? 'btn-gold' : 'btn-primary'}
                style={{ flex: 2, margin: 0 }}>
                {saving ? '...' : quizCount > 0
                  ? (lang === 'te' ? 'క్విజ్‌కి వెళ్ళు →' : 'Take Quiz →')
                  : isLast
                    ? (lang === 'te' ? 'పూర్తి చేయండి ✓' : 'Finish Course ✓')
                    : (lang === 'te' ? 'తదుపరి →' : 'Next →')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── ZOOM MODAL ── */}
      {imgZoom && (
        <div onClick={() => setImgZoom(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}>
          <img src={content?.photo_url} alt={title}
            style={{ maxWidth: '95vw', maxHeight: '95vh', objectFit: 'contain', borderRadius: 4 }} />
          <button onClick={() => setImgZoom(false)}
            style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, padding: '8px 14px', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}>
            ✕ Close
          </button>
        </div>
      )}

      {/* Mobile CSS — image stacks on top on small screens */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Telugu:wght@400;500;600;700&display=swap');
        @media (max-width: 640px) {
          .lesson-image-panel {
            width: 100% !important;
            min-width: unset !important;
            position: relative !important;
            top: unset !important;
            height: 260px !important;
          }
        }
      `}</style>
    </>
  )
}
