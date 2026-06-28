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
  const [lang, setLang] = useState<'en' | 'te'>('te')
  const [content, setContent] = useState<Content | null>(null)
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [audioPlaying, setAudioPlaying] = useState(false)
  const [audioProgress, setAudioProgress] = useState(0)
  const [markingDone, setMarkingDone] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const s = localStorage.getItem('sv_staff')
    const l = localStorage.getItem('sv_lang') as 'en' | 'te'
    if (!s) { router.push('/staff'); return }
    setStaff(JSON.parse(s))
    if (l) setLang(l)
  }, [])

  useEffect(() => {
    if (!staff) return
    fetchContent()
    markInProgress()
  }, [staff])

  async function fetchContent() {
    const { data: c } = await supabase
      .from('lms_content')
      .select('*')
      .eq('id', contentId)
      .single()
    setContent(c)

    if (c?.has_quiz) {
      const { data: q } = await supabase
        .from('lms_quizzes')
        .select('*')
        .eq('content_id', contentId)
        .order('order_index')
      setQuizzes(q || [])
    }
    setLoading(false)
  }

  async function markInProgress() {
    await supabase.from('lms_progress').upsert({
      assignment_id: assignmentId,
      staff_id: staff.id,
      content_id: contentId,
      status: 'in_progress',
      started_at: new Date().toISOString(),
    }, { onConflict: 'assignment_id,content_id' })
  }

  async function markComplete() {
    setMarkingDone(true)
    await supabase.from('lms_progress').upsert({
      assignment_id: assignmentId,
      staff_id: staff.id,
      content_id: contentId,
      status: 'completed',
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
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
    <div className="min-h-screen pb-24" style={{ background: 'var(--ivory)' }}>
      {/* Nav */}
      <div className="flex items-center justify-between px-4 pt-6 pb-4"
        style={{ background: 'var(--plum)' }}>
        <button onClick={() => router.back()}
          className="flex items-center gap-1 text-sm"
          style={{ color: 'rgba(255,255,255,0.7)' }}>
          ← {lang === 'te' ? 'వెనక్కి' : 'Back'}
        </button>
        <button onClick={() => {
          const nl = lang === 'en' ? 'te' : 'en'
          setLang(nl); localStorage.setItem('sv_lang', nl)
        }}
          className="text-xs px-2.5 py-1 rounded-full border"
          style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>
          {lang === 'en' ? 'తెలుగు' : 'English'}
        </button>
      </div>

      {loading && (
        <div className="text-center py-20" style={{ color: 'var(--muted)' }}>
          <div className="text-3xl mb-2">⏳</div>
        </div>
      )}

      {!loading && content && (
        <>
          {/* Photo */}
          {content.photo_url && (
            <div className="relative">
              <img src={content.photo_url} alt={content.title_en}
                className="w-full object-cover" style={{ maxHeight: 280 }} />
              <div className="absolute inset-0"
                style={{ background: 'linear-gradient(to bottom, transparent 60%, var(--ivory))' }} />
            </div>
          )}

          <div className="px-4 py-4">
            {/* Title */}
            <div className="text-xs tracking-widest uppercase mb-1" style={{ color: 'var(--gold)' }}>
              {content.category}
            </div>
            <h1 className="text-xl font-bold mb-4" style={{ color: 'var(--plum)',
              fontFamily: lang === 'te' ? 'Tiro Telugu, serif' : 'DM Sans, sans-serif' }}>
              {lang === 'te' ? content.title_te : content.title_en}
            </h1>

            {/* Audio player */}
            {content.audio_url && (
              <div className="rounded-2xl p-4 mb-4 flex items-center gap-4"
                style={{ background: 'var(--plum)' }}>
                <audio ref={audioRef} src={content.audio_url}
                  onTimeUpdate={() => {
                    if (audioRef.current) {
                      setAudioProgress((audioRef.current.currentTime / audioRef.current.duration) * 100)
                    }
                  }}
                  onEnded={() => setAudioPlaying(false)} />
                <button onClick={toggleAudio}
                  className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-xl"
                  style={{ background: 'var(--gold)' }}>
                  {audioPlaying ? '⏸' : '▶'}
                </button>
                <div className="flex-1">
                  <div className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.7)',
                    fontFamily: lang === 'te' ? 'Tiro Telugu, serif' : 'DM Sans, sans-serif' }}>
                    {lang === 'te' ? 'వివరణ వినండి' : 'Listen to explanation'}
                  </div>
                  <div className="rounded-full h-1.5 w-full" style={{ background: 'rgba(255,255,255,0.2)' }}>
                    <div className="h-1.5 rounded-full transition-all"
                      style={{ width: `${audioProgress}%`, background: 'var(--gold)' }} />
                  </div>
                </div>
              </div>
            )}

            {/* Lesson body */}
            {(content.body_en || content.body_te) && (
              <div className="rounded-2xl p-4 mb-4"
                style={{ background: 'white', border: '1px solid var(--border)' }}>
                <div className="text-xs font-semibold uppercase tracking-wide mb-3"
                  style={{ color: 'var(--gold)' }}>
                  {lang === 'te' ? 'పాఠం' : 'Lesson'}
                </div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--charcoal)',
                  fontFamily: lang === 'te' ? 'Tiro Telugu, serif' : 'DM Sans, sans-serif',
                  lineHeight: lang === 'te' ? '2' : '1.7' }}>
                  {lang === 'te' ? content.body_te : content.body_en}
                </p>
              </div>
            )}

            {/* Transcript */}
            {(content.transcript_en || content.transcript_te) && (
              <div className="rounded-2xl p-4 mb-4"
                style={{ background: 'white', border: '1px solid var(--border)' }}>
                <div className="text-xs font-semibold uppercase tracking-wide mb-3"
                  style={{ color: 'var(--gold)' }}>
                  {lang === 'te' ? 'వివరణ స్క్రిప్ట్' : 'Explanation Script'}
                </div>
                <p className="text-sm" style={{ color: 'var(--charcoal)',
                  fontFamily: lang === 'te' ? 'Tiro Telugu, serif' : 'DM Sans, sans-serif',
                  lineHeight: lang === 'te' ? '2' : '1.7' }}>
                  {lang === 'te' ? content.transcript_te : content.transcript_en}
                </p>
              </div>
            )}

            {/* Quiz preview */}
            {content.has_quiz && quizzes.length > 0 && (
              <div className="rounded-2xl p-4 mb-4"
                style={{ background: '#FEF3C7', border: '1px solid #FDE68A' }}>
                <div className="flex items-center gap-2">
                  <span className="text-xl">📝</span>
                  <div>
                    <div className="font-semibold text-sm" style={{ color: '#92400E',
                      fontFamily: lang === 'te' ? 'Tiro Telugu, serif' : 'DM Sans, sans-serif' }}>
                      {lang === 'te' ? `${quizzes.length} ప్రశ్నలు ఉన్నాయి` : `${quizzes.length} quiz questions`}
                    </div>
                    <div className="text-xs" style={{ color: '#B45309',
                      fontFamily: lang === 'te' ? 'Tiro Telugu, serif' : 'DM Sans, sans-serif' }}>
                      {lang === 'te' ? 'పాఠం చదివిన తర్వాత క్విజ్ వస్తుంది' : 'Quiz follows after this lesson'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Fixed bottom CTA */}
      {!loading && content && (
        <div className="fixed bottom-0 left-0 right-0 p-4"
          style={{ background: 'var(--ivory)', borderTop: '1px solid var(--border)' }}>
          <button
            onClick={markComplete}
            disabled={markingDone}
            className="w-full py-4 rounded-2xl font-semibold text-white text-base"
            style={{ background: markingDone ? 'var(--muted)' : 'var(--plum)',
              fontFamily: lang === 'te' ? 'Tiro Telugu, serif' : 'DM Sans, sans-serif' }}>
            {markingDone
              ? (lang === 'te' ? 'సేవ్ అవుతోంది...' : 'Saving...')
              : content.has_quiz
                ? (lang === 'te' ? 'క్విజ్ కి వెళ్ళు →' : 'Go to Quiz →')
                : (lang === 'te' ? 'పూర్తయింది ✓' : 'Mark Complete ✓')}
          </button>
        </div>
      )}
    </div>
  )
}
