'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

/* ── Structured content renderer ── */
function ContentBlock({ block, lang }: { block: any; lang: 'en' | 'te' }) {
  const tf = (s: string) => ({ fontFamily: lang === 'te' ? 'Noto Sans Telugu,sans-serif' : 'DM Sans,sans-serif', lineHeight: lang === 'te' ? 1.9 : 1.5 })

  if (block.type === 'steps') return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 18 }}>{block.icon}</span>
        <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--gold)' }}>
          {block.label}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {block.items.map((item: any, i: number) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: 'var(--white)', border: '1.5px solid var(--border)', borderRadius: 12, padding: '12px 14px' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--plum)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>
              {item.step}
            </div>
            <span style={{ fontSize: 14, color: 'var(--body)', ...tf(item.text) }}>{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  )

  if (block.type === 'rule') return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 18 }}>{block.icon}</span>
        <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--gold)' }}>
          {block.label}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {block.items.map((item: any, i: number) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, borderRadius: 10, padding: '10px 14px',
            background: item.do ? 'var(--success-bg)' : 'var(--danger-bg)',
            border: `1px solid ${item.do ? '#A7F3D0' : '#FECACA'}` }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0, marginTop: 1,
              background: item.do ? '#16A34A' : '#DC2626', color: '#fff' }}>
              {item.do ? '✓' : '✗'}
            </div>
            <span style={{ fontSize: 14, color: item.do ? 'var(--success-text)' : 'var(--danger-text)', ...tf(item.text) }}>
              {item.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  )

  return null
}

export default function LessonPage() {
  const router = useRouter()
  const { id: contentId } = useParams() as { id: string }
  const sp = useSearchParams()
  const assignmentId = sp.get('assignment') || ''
  const courseId     = sp.get('course')     || ''

  const [staff,   setStaff]   = useState<any>(null)
  const [content, setContent] = useState<any>(null)
  const [items,   setItems]   = useState<any[]>([])
  const [lang,    setLang]    = useState<'en'|'te'>('en')
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [isDone,  setIsDone]  = useState(false)
  const [imgZoom, setImgZoom] = useState(false)
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
    const [{ data: c }, { data: ci }, { data: prog }] = await Promise.all([
      supabase.from('lms_content').select('*').eq('id', contentId).single(),
      supabase.from('lms_course_items').select('order_index,content_id').eq('course_id', courseId).order('order_index'),
      supabase.from('lms_progress').select('status').eq('assignment_id', assignmentId).eq('staff_id', staff.id).eq('content_id', contentId).maybeSingle(),
    ])
    setContent(c)
    setItems(ci || [])
    setIsDone(prog?.status === 'completed')
    if (prog?.status !== 'completed') {
      await supabase.from('lms_progress').upsert({
        assignment_id: assignmentId, staff_id: staff.id, content_id: contentId,
        status: 'in_progress', started_at: new Date().toISOString(),
      }, { onConflict: 'assignment_id,content_id' })
    }
    setLoading(false)
  }

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

  async function handleNext() {
    setSaving(true)
    await supabase.from('lms_progress').upsert({
      assignment_id: assignmentId, staff_id: staff.id, content_id: contentId,
      status: 'completed', started_at: new Date().toISOString(), completed_at: new Date().toISOString(),
    }, { onConflict: 'assignment_id,content_id' })
    setIsDone(true)
    setSaving(false)
    if (nextItem) {
      router.push(`/staff/lesson/${nextItem.content_id}?assignment=${assignmentId}&course=${courseId}`)
    } else {
      router.push(`/staff/course/${courseId}?assignment=${assignmentId}`)
    }
  }

  const title    = content ? (lang === 'te' && content.title_te ? content.title_te : content.title_en) : ''
  const bodyJson = content ? (lang === 'te' && content.body_json_te ? content.body_json_te : content.body_json) : null
  const bodyText = content ? (lang === 'te' && content.body_te ? content.body_te : content.body_en) : ''

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--ivory)' }}>
      <p style={{ color: 'var(--muted)' }}>Loading...</p>
    </div>
  )

  return (
    <>
      {/* Sticky header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'var(--plum)', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
            <button onClick={() => router.push(`/staff/course/${courseId}?assignment=${assignmentId}`)}
              style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, padding: '6px 10px', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', flexShrink: 0 }}>
              ← Lessons
            </button>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentIdx + 1}/{items.length} · {title}
            </span>
            {isDone && <span style={{ fontSize: 11, background: 'var(--success-bg)', color: 'var(--success-text)', borderRadius: 20, padding: '2px 8px', fontWeight: 700, flexShrink: 0 }}>✓</span>}
          </div>
          <button onClick={toggleLang}
            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid var(--gold-btn)', borderRadius: 20, padding: '5px 12px', color: 'var(--gold-btn)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', flexShrink: 0, marginLeft: 8 }}>
            {lang === 'en' ? 'తెలుగు' : 'English'}
          </button>
        </div>
        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 3, padding: '0 16px 8px' }}>
          {items.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 3, borderRadius: 999,
              background: i < currentIdx ? 'var(--gold-btn)' : i === currentIdx ? 'rgba(201,147,58,0.6)' : 'rgba(255,255,255,0.2)' }} />
          ))}
        </div>
      </div>

      {/* Split layout */}
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 61px)', paddingBottom: 80 }}>

        {/* Image panel */}
        {content?.photo_url && (
          <div className="lesson-image-panel"
            style={{ width: '45%', minWidth: 280, background: '#111', position: 'sticky', top: 61, height: 'calc(100vh - 61px)', overflow: 'hidden', flexShrink: 0 }}>
            <img src={content.photo_url} alt={title} onClick={() => setImgZoom(true)}
              style={{ width: '100%', height: '100%', objectFit: 'contain', cursor: 'zoom-in', display: 'block' }} />
            <button onClick={() => setImgZoom(true)}
              style={{ position: 'absolute', bottom: 12, right: 12, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: 8, padding: '5px 10px', color: '#fff', fontSize: 12, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}>
              🔍 Zoom
            </button>
          </div>
        )}

        {/* Content panel */}
        <div style={{ flex: 1, padding: '20px 16px', overflowY: 'auto', minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold)', marginBottom: 6 }}>
            {content?.category}
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--charcoal)', marginBottom: 16, lineHeight: 1.3,
            fontFamily: lang === 'te' ? 'Noto Sans Telugu,sans-serif' : 'DM Sans,sans-serif' }}>
            {title}
          </h1>

          {/* Audio */}
          {content?.audio_url && (
            <div style={{ background: 'var(--plum)', borderRadius: 12, padding: '12px 14px', marginBottom: 16 }}>
              <audio ref={audioRef} src={content.audio_url}
                onTimeUpdate={() => { const a = audioRef.current; if (a?.duration) setAudioPct((a.currentTime / a.duration) * 100) }}
                onEnded={() => setAudioPlaying(false)} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button onClick={toggleAudio}
                  style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--gold-btn)', border: 'none', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {audioPlaying ? '⏸' : '▶'}
                </button>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginBottom: 5 }}>
                    {lang === 'te' ? 'వివరణ వినండి' : 'Listen to explanation'}
                  </p>
                  <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 999, height: 3 }}>
                    <div style={{ height: 3, borderRadius: 999, background: 'var(--gold-btn)', width: `${audioPct}%`, transition: 'width 0.3s' }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Structured blocks — primary display */}
          {bodyJson && Array.isArray(bodyJson) && bodyJson.map((block: any, i: number) => (
            <ContentBlock key={i} block={block} lang={lang} />
          ))}

          {/* Fallback to plain text if no JSON */}
          {!bodyJson && bodyText && (
            <p style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--body)',
              fontFamily: lang === 'te' ? 'Noto Sans Telugu,sans-serif' : 'DM Sans,sans-serif' }}>
              {bodyText}
            </p>
          )}

          {/* Last lesson notice */}
          {isLast && (
            <div style={{ background: 'var(--info-bg)', border: '1px solid #BFDBFE', borderRadius: 10, padding: '12px 14px', marginBottom: 4, marginTop: 8 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--info-text)',
                fontFamily: lang === 'te' ? 'Noto Sans Telugu,sans-serif' : 'DM Sans,sans-serif' }}>
                🎯 {lang === 'te' ? 'చివరి పాఠం! తర్వాత మాడ్యూల్ క్విజ్ అన్‌లాక్ అవుతుంది.' : 'Last lesson! Module quiz unlocks after this.'}
              </p>
            </div>
          )}

          {/* Prev / Next */}
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            {prevItem && (
              <button onClick={() => router.push(`/staff/lesson/${prevItem.content_id}?assignment=${assignmentId}&course=${courseId}`)}
                style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--white)', color: 'var(--body)', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}>
                ← Prev
              </button>
            )}
            <button onClick={handleNext} disabled={saving} className="btn-primary" style={{ flex: 2, margin: 0 }}>
              {saving ? '...' : isLast
                ? (lang === 'te' ? 'పూర్తి → క్విజ్ అన్‌లాక్' : 'Done — Unlock Quiz →')
                : (lang === 'te' ? 'తదుపరి →' : 'Next →')}
            </button>
          </div>
        </div>
      </div>

      {/* Zoom modal */}
      {imgZoom && (
        <div onClick={() => setImgZoom(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.93)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}>
          <img src={content?.photo_url} alt={title}
            style={{ maxWidth: '95vw', maxHeight: '95vh', objectFit: 'contain', borderRadius: 4 }} />
          <button onClick={() => setImgZoom(false)}
            style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, padding: '8px 14px', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}>
            ✕ Close
          </button>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Telugu:wght@400;500;600;700&display=swap');
        @media (max-width: 640px) {
          .lesson-image-panel { width: 100% !important; min-width: unset !important; position: relative !important; top: unset !important; height: 240px !important; }
        }
      `}</style>
    </>
  )
}
