'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { supabase, type Content, type Quiz } from '@/lib/supabase'

export default function LessonPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const contentId = params.id as string
  const assignmentId = searchParams.get('assignment') || ''
  const courseId = searchParams.get('course') || ''

  const [staff, setStaff] = useState<any>(null)
  const [content, setContent] = useState<Content | null>(null)
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [audioPlaying, setAudioPlaying] = useState(false)
  const [audioProgress, setAudioProgress] = useState(0)
  const [saving, setSaving] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const s = localStorage.getItem('sv_staff')
    if (!s) { router.push('/staff'); return }
    setStaff(JSON.parse(s))
  }, [])

  useEffect(() => {
    if (!staff) return
    fetchContent()
    supabase.from('lms_progress').upsert({
      assignment_id: assignmentId, staff_id: staff.id, content_id: contentId,
      status: 'in_progress', started_at: new Date().toISOString(),
    }, { onConflict: 'assignment_id,content_id' })
  }, [staff])

  async function fetchContent() {
    const { data: c } = await supabase.from('lms_content').select('*').eq('id', contentId).single()
    setContent(c)
    if (c?.has_quiz) {
      const { data: q } = await supabase.from('lms_quizzes').select('*').eq('content_id', contentId).order('order_index')
      setQuizzes(q || [])
    }
    setLoading(false)
  }

  async function handleComplete() {
    setSaving(true)
    await supabase.from('lms_progress').upsert({
      assignment_id: assignmentId, staff_id: staff.id, content_id: contentId,
      status: 'completed', started_at: new Date().toISOString(), completed_at: new Date().toISOString(),
    }, { onConflict: 'assignment_id,content_id' })
    if (content?.has_quiz && quizzes.length > 0) {
      router.push(`/staff/quiz/${contentId}?assignment=${assignmentId}&course=${courseId}`)
    } else {
      router.push(`/staff/course/${courseId}?assignment=${assignmentId}`)
    }
  }

  function toggleAudio() {
    if (!audioRef.current) return
    if (audioPlaying) { audioRef.current.pause(); setAudioPlaying(false) }
    else { audioRef.current.play(); setAudioPlaying(true) }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ivory)', paddingBottom: 100 }}>
      <div className="nav-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.back()}
            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, padding: '7px 12px', color: '#FFFFFF', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
            ← Back
          </button>
          <span className="nav-title" style={{ fontSize: 15 }}>Lesson</span>
        </div>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--muted)', fontSize: 14 }}>Loading lesson...</div>}

      {!loading && content && (
        <>
          {content.photo_url && (
            <div style={{ position: 'relative' }}>
              <img src={content.photo_url} alt={content.title_en}
                style={{ width: '100%', maxHeight: 260, objectFit: 'cover', display: 'block' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 50%, var(--ivory) 100%)' }} />
            </div>
          )}

          <div style={{ padding: '20px 20px 0' }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold)', marginBottom: 6 }}>
              {content.category}
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--charcoal)', marginBottom: 20, lineHeight: 1.25 }}>
              {content.title_en}
            </h1>

            {content.audio_url && (
              <div style={{ background: 'var(--plum)', borderRadius: 14, padding: 16, marginBottom: 16 }}>
                <audio ref={audioRef} src={content.audio_url}
                  onTimeUpdate={() => { if (audioRef.current) setAudioProgress((audioRef.current.currentTime / audioRef.current.duration) * 100) }}
                  onEnded={() => setAudioPlaying(false)} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <button onClick={toggleAudio}
                    style={{ width: 46, height: 46, borderRadius: '50%', background: 'var(--gold-btn)', border: 'none', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {audioPlaying ? '⏸' : '▶'}
                  </button>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', marginBottom: 8, fontWeight: 500 }}>Listen to explanation</p>
                    <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 999, height: 4 }}>
                      <div style={{ height: 4, borderRadius: 999, background: 'var(--gold-btn)', width: `${audioProgress}%`, transition: 'width 0.2s' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {content.body_en && (
              <div className="card" style={{ padding: '16px 18px', marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gold)', marginBottom: 10 }}>Lesson</div>
                <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--body)' }}>{content.body_en}</p>
              </div>
            )}

            {content.transcript_en && (
              <div className="card" style={{ padding: '16px 18px', marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gold)', marginBottom: 10 }}>Explanation Script</div>
                <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--body)' }}>{content.transcript_en}</p>
              </div>
            )}

            {content.has_quiz && quizzes.length > 0 && (
              <div style={{ background: 'var(--warning-bg)', border: '1px solid #FDE68A', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--warning-text)' }}>📝 {quizzes.length} quiz questions follow this lesson</p>
                <p style={{ fontSize: 13, color: 'var(--warning-text)', marginTop: 3, opacity: 0.85 }}>Read carefully before continuing</p>
              </div>
            )}
          </div>
        </>
      )}

      {!loading && content && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--white)', borderTop: '1.5px solid var(--border)', padding: '16px 20px 28px' }}>
          <button className="btn-primary" onClick={handleComplete} disabled={saving}>
            {saving ? 'Saving...' : content.has_quiz ? 'Continue to Quiz →' : 'Mark as Complete ✓'}
          </button>
        </div>
      )}
    </div>
  )
}
