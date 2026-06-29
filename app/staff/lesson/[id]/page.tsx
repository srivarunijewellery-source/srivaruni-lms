'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LessonPage() {
  const router = useRouter()
  const { id: contentId } = useParams() as { id: string }
  const sp = useSearchParams()
  const assignmentId = sp.get('assignment') || ''
  const courseId     = sp.get('course') || ''

  const [staff, setStaff]     = useState<any>(null)
  const [content, setContent] = useState<any>(null)
  const [quizCount, setQuizCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [audioPlaying, setAudioPlaying] = useState(false)
  const [audioPct, setAudioPct] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const s = localStorage.getItem('sv_staff')
    if (!s) { router.replace('/staff'); return }
    setStaff(JSON.parse(s))
  }, [])

  useEffect(() => { if (staff) load() }, [staff])

  async function load() {
    const [{ data: c }, { data: q }] = await Promise.all([
      supabase.from('lms_content').select('*').eq('id', contentId).single(),
      supabase.from('lms_quizzes').select('id').eq('content_id', contentId),
    ])
    setContent(c)
    setQuizCount((q || []).length)

    // Mark in progress
    await supabase.from('lms_progress').upsert({
      assignment_id: assignmentId, staff_id: staff.id, content_id: contentId,
      status: 'in_progress', started_at: new Date().toISOString(),
    }, { onConflict: 'assignment_id,content_id' })

    setLoading(false)
  }

  async function handleContinue() {
    setSaving(true)
    // Mark this content as completed
    await supabase.from('lms_progress').upsert({
      assignment_id: assignmentId, staff_id: staff.id, content_id: contentId,
      status: 'completed',
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    }, { onConflict: 'assignment_id,content_id' })

    if (quizCount > 0) {
      router.push(`/staff/quiz/${contentId}?assignment=${assignmentId}&course=${courseId}`)
    } else {
      router.push(`/staff/course/${courseId}?assignment=${assignmentId}`)
    }
  }

  function toggleAudio() {
    const a = audioRef.current
    if (!a) return
    if (audioPlaying) { a.pause(); setAudioPlaying(false) }
    else { a.play(); setAudioPlaying(true) }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--ivory)' }}>
      <p style={{ color: 'var(--muted)' }}>Loading lesson...</p>
    </div>
  )

  if (!content) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--ivory)' }}>
      <p style={{ color: 'var(--danger-text)' }}>Lesson not found.</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ivory)', paddingBottom: 100 }}>
      {/* Nav */}
      <div className="nav-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.push(`/staff/course/${courseId}?assignment=${assignmentId}`)}
            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, padding: '7px 12px', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}>
            ← Lessons
          </button>
          <span className="nav-title" style={{ fontSize: 15 }}>Lesson</span>
        </div>
      </div>

      {/* Poster image — shown large, this IS the lesson */}
      {content.photo_url && (
        <div style={{ background: '#000', position: 'relative' }}>
          {!imgLoaded && (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Loading image...</p>
            </div>
          )}
          <img
            src={content.photo_url}
            alt={content.title_en}
            onLoad={() => setImgLoaded(true)}
            style={{ width: '100%', display: imgLoaded ? 'block' : 'none', maxHeight: 480, objectFit: 'contain' }}
          />
        </div>
      )}

      <div style={{ padding: '20px 20px 0' }}>
        {/* Category + title */}
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold)', marginBottom: 6 }}>
          {content.category}
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--charcoal)', marginBottom: 20, lineHeight: 1.3 }}>
          {content.title_en}
        </h1>

        {/* Audio player */}
        {content.audio_url && (
          <div style={{ background: 'var(--plum)', borderRadius: 14, padding: 16, marginBottom: 16 }}>
            <audio ref={audioRef} src={content.audio_url}
              onTimeUpdate={() => {
                const a = audioRef.current
                if (a && a.duration) setAudioPct((a.currentTime / a.duration) * 100)
              }}
              onEnded={() => setAudioPlaying(false)} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <button onClick={toggleAudio}
                style={{ width: 46, height: 46, borderRadius: '50%', background: 'var(--gold-btn)', border: 'none', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {audioPlaying ? '⏸' : '▶'}
              </button>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', marginBottom: 8, fontWeight: 500 }}>Listen to explanation</p>
                <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 999, height: 4 }}>
                  <div style={{ height: 4, borderRadius: 999, background: 'var(--gold-btn)', width: `${audioPct}%`, transition: 'width 0.3s' }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lesson body text */}
        {content.body_en && (
          <div className="card" style={{ padding: '16px 18px', marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gold)', marginBottom: 10 }}>
              About this lesson
            </div>
            <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--body)' }}>{content.body_en}</p>
          </div>
        )}

        {/* Transcript */}
        {content.transcript_en && (
          <div className="card" style={{ padding: '16px 18px', marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gold)', marginBottom: 10 }}>
              Explanation
            </div>
            <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--body)' }}>{content.transcript_en}</p>
          </div>
        )}

        {/* Quiz notice */}
        {quizCount > 0 && (
          <div style={{ background: 'var(--warning-bg)', border: '1px solid #FDE68A', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--warning-text)' }}>
              📝 {quizCount} quiz questions follow this lesson
            </p>
            <p style={{ fontSize: 13, color: 'var(--warning-text)', marginTop: 3, opacity: 0.85 }}>
              Study the poster above carefully before continuing
            </p>
          </div>
        )}
      </div>

      {/* Fixed bottom CTA */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--white)', borderTop: '1.5px solid var(--border)', padding: '16px 20px 28px' }}>
        <button className="btn-primary" onClick={handleContinue} disabled={saving}>
          {saving ? 'Saving...' : quizCount > 0 ? `Continue to Quiz (${quizCount} questions) →` : 'Mark as Complete ✓'}
        </button>
      </div>
    </div>
  )
}
