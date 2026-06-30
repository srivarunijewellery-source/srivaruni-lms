'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ModuleQuizPage() {
  const router = useRouter()
  const { id: courseId } = useParams() as { id: string }
  const sp = useSearchParams()
  const assignmentId = sp.get('assignment') || ''

  const [staff,      setStaff]      = useState<any>(null)
  const [course,     setCourse]     = useState<any>(null)
  const [questions,  setQuestions]  = useState<any[]>([])
  const [current,    setCurrent]    = useState(0)
  const [selected,   setSelected]   = useState<string|null>(null)
  const [submitted,  setSubmitted]  = useState(false)
  const [answers,    setAnswers]    = useState<{qid:string;chosen:string;correct:boolean;score_label:string}[]>([])
  const [done,       setDone]       = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [loading,    setLoading]    = useState(true)
  const [finalScore, setFinalScore] = useState(0)
  const [lang,       setLang]       = useState<'en'|'te'>('en')
  const [attemptNum, setAttemptNum] = useState(1)
  const [locked,     setLocked]     = useState(false)
  const [lockMessage, setLockMessage] = useState('')

  useEffect(() => {
    const s = localStorage.getItem('sv_staff')
    if (!s) { router.replace('/staff'); return }
    setStaff(JSON.parse(s))
    const l = localStorage.getItem('sv_lang') as 'en'|'te'
    if (l) setLang(l)
  }, [])

  useEffect(() => { if (staff) load() }, [staff])

  async function load() {
    // Get course
    const { data: c } = await supabase.from('lms_courses').select('*').eq('id', courseId).single()
    setCourse(c)

    // Get all content IDs for this course
    const { data: ci } = await supabase
      .from('lms_course_items')
      .select('content_id')
      .eq('course_id', courseId)

    const contentIds = (ci || []).map((i:any) => i.content_id)

    // SERVER-SIDE LOCK CHECK — verify all lessons are actually completed
    // before allowing the quiz to load, regardless of how the page was reached
    const { data: progress } = await supabase
      .from('lms_progress')
      .select('content_id, status')
      .eq('assignment_id', assignmentId)
      .eq('staff_id', staff.id)

    const completedIds = new Set((progress || []).filter((p: any) => p.status === 'completed').map((p: any) => p.content_id))
    const allDone = contentIds.length > 0 && contentIds.every((cid: string) => completedIds.has(cid))

    if (!allDone) {
      setLocked(true)
      setLockMessage(lang === 'te'
        ? 'క్విజ్ తీసుకునే ముందు అన్ని పాఠాలు పూర్తి చేయాలి.'
        : 'You must complete all lessons before taking this quiz.')
      setLoading(false)
      return
    }

    // Pull ALL questions from the quiz banks for this course
    const { data: q } = await supabase
      .from('lms_quizzes')
      .select('*')
      .in('content_id', contentIds)
      .order('content_id')
      .order('order_index')

    // Shuffle and limit to 10
    const shuffled = (q || []).sort(() => Math.random() - 0.5).slice(0, 10)
    setQuestions(shuffled)

    // Get attempt number
    const { data: prev } = await supabase
      .from('lms_module_quiz_results')
      .select('attempt_number')
      .eq('assignment_id', assignmentId)
      .order('attempt_number', { ascending: false })
      .limit(1)
    setAttemptNum((prev?.[0]?.attempt_number || 0) + 1)

    setLoading(false)
  }

  function toggleLang() {
    const nl = lang === 'en' ? 'te' : 'en'
    setLang(nl); localStorage.setItem('sv_lang', nl)
  }

  const q = questions[current]
  const options = q ? [
    { key:'a', en:q.option_a_en, te:q.option_a_te },
    { key:'b', en:q.option_b_en, te:q.option_b_te },
    ...(q.option_c_en ? [{ key:'c', en:q.option_c_en, te:q.option_c_te }] : []),
    ...(q.option_d_en ? [{ key:'d', en:q.option_d_en, te:q.option_d_te }] : []),
  ] : []

  function submitAnswer() {
    if (!selected || !q) return
    const correct = selected === q.correct_option
    setAnswers(prev => [...prev, {
      qid: q.id, chosen: selected, correct,
      score_label: correct ? '✓' : '✗'
    }])
    setSubmitted(true)
  }

  async function next() {
    if (current + 1 < questions.length) {
      setCurrent(c => c + 1); setSelected(null); setSubmitted(false); return
    }

    // All questions done — calculate and save
    setSaving(true)
    const all = [...answers]
    const score = Math.round((all.filter(a => a.correct).length / questions.length) * 100)
    setFinalScore(score)
    const passed = score >= (course?.pass_threshold || 80)

    // Save module quiz result
    await supabase.from('lms_module_quiz_results').insert({
      assignment_id: assignmentId,
      staff_id: staff.id,
      course_id: courseId,
      score,
      passed,
      attempt_number: attemptNum,
      answers_json: all,
      completed_at: new Date().toISOString(),
    })

    // If passed, mark assignment as completed
    if (passed) {
      await supabase.from('lms_assignments')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', assignmentId)
    }

    setSaving(false)
    setDone(true)
  }

  const passed = finalScore >= (course?.pass_threshold || 80)

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--ivory)' }}>
      <p style={{ color:'var(--muted)' }}>Loading quiz...</p>
    </div>
  )

  // Locked screen — all lessons not yet completed
  if (locked) return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 24px', background:'var(--ivory)' }}>
      <div style={{ fontSize:56, marginBottom:16 }}>🔒</div>
      <h1 style={{ fontSize:22, fontWeight:700, color:'var(--charcoal)', textAlign:'center', marginBottom:10,
        fontFamily: lang === 'te' ? 'Noto Sans Telugu,sans-serif' : 'DM Sans,sans-serif' }}>
        {lang === 'te' ? 'క్విజ్ లాక్ చేయబడింది' : 'Quiz Locked'}
      </h1>
      <p style={{ textAlign:'center', fontSize:15, lineHeight:1.6, marginBottom:28, color:'var(--muted)', maxWidth:340,
        fontFamily: lang === 'te' ? 'Noto Sans Telugu,sans-serif' : 'DM Sans,sans-serif' }}>
        {lockMessage}
      </p>
      <button className="btn-primary" style={{ maxWidth:320 }}
        onClick={() => router.push(`/staff/course/${courseId}?assignment=${assignmentId}`)}>
        {lang === 'te' ? 'పాఠాలకు వెళ్ళు →' : 'Go to Lessons →'}
      </button>
    </div>
  )

  // Results screen
  if (done) return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 24px', background: passed ? 'var(--plum)' : 'var(--ivory)' }}>
      <div style={{ fontSize:60, marginBottom:16 }}>{passed ? '🏆' : '📚'}</div>

      <h1 style={{ fontSize:26, fontWeight:700, color: passed ? '#fff' : 'var(--charcoal)', textAlign:'center', marginBottom:8,
        fontFamily: lang === 'te' ? 'Noto Sans Telugu,sans-serif' : 'DM Sans,sans-serif' }}>
        {lang === 'te' ? (passed ? 'అభినందనలు!' : 'మళ్ళీ ప్రయత్నించండి') : (passed ? 'Congratulations!' : 'Not quite yet')}
      </h1>

      {/* Score circle */}
      <div style={{ width:120, height:120, borderRadius:'50%', margin:'20px 0',
        border:`3px solid ${passed ? 'var(--gold-btn)' : 'var(--border-dark)'}`,
        background: passed ? 'rgba(255,255,255,0.1)' : 'var(--white)',
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
        <span style={{ fontSize:32, fontWeight:700, color: passed ? 'var(--gold-btn)' : 'var(--plum)' }}>{finalScore}%</span>
        <span style={{ fontSize:12, marginTop:2, color: passed ? 'rgba(255,255,255,0.7)' : 'var(--muted)',
          fontFamily: lang === 'te' ? 'Noto Sans Telugu,sans-serif' : 'DM Sans,sans-serif' }}>
          {lang === 'te' ? 'స్కోర్' : 'Your score'}
        </span>
      </div>

      {/* Score breakdown */}
      <div style={{ background: passed ? 'rgba(255,255,255,0.1)' : 'var(--white)', borderRadius:12, padding:'12px 20px', marginBottom:20, width:'100%', maxWidth:340,
        border: passed ? '1px solid rgba(255,255,255,0.2)' : '1px solid var(--border)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:14, color: passed ? 'rgba(255,255,255,0.85)' : 'var(--body)' }}>
          <span>{lang === 'te' ? 'సరైన సమాధానాలు' : 'Correct'}</span>
          <span style={{ fontWeight:700, color: passed ? 'var(--gold-btn)' : 'var(--success-text)' }}>
            {answers.filter(a=>a.correct).length} / {questions.length}
          </span>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:14, marginTop:6, color: passed ? 'rgba(255,255,255,0.85)' : 'var(--body)' }}>
          <span>{lang === 'te' ? 'పాస్ మార్క్' : 'Pass mark'}</span>
          <span style={{ fontWeight:700 }}>{course?.pass_threshold || 80}%</span>
        </div>
      </div>

      <p style={{ textAlign:'center', fontSize:15, lineHeight:1.7, marginBottom:28, color: passed ? 'rgba(255,255,255,0.85)' : 'var(--muted)',
        fontFamily: lang === 'te' ? 'Noto Sans Telugu,sans-serif' : 'DM Sans,sans-serif' }}>
        {lang === 'te'
          ? (passed ? 'మీరు మాడ్యూల్ పూర్తి చేశారు! సర్టిఫికెట్ తీసుకోండి.' : `పాస్ కావాలంటే ${course?.pass_threshold || 80}% కావాలి. పాఠాలు మళ్ళీ చదివి ప్రయత్నించండి.`)
          : (passed ? 'You completed the module! Collect your certificate.' : `You need ${course?.pass_threshold || 80}% to pass. Review the lessons and try again.`)}
      </p>

      <div style={{ width:'100%', maxWidth:360, display:'flex', flexDirection:'column', gap:10 }}>
        {passed ? (
          <button className="btn-gold"
            onClick={() => router.push(`/staff/certificate/${courseId}?assignment=${assignmentId}`)}>
            {lang === 'te' ? 'సర్టిఫికెట్ తీసుకో 🏆' : 'Get Certificate 🏆'}
          </button>
        ) : (
          <button className="btn-primary"
            onClick={() => router.push(`/staff/course/${courseId}?assignment=${assignmentId}`)}>
            {lang === 'te' ? 'పాఠాలు మళ్ళీ చదువు →' : 'Review lessons first →'}
          </button>
        )}
        <button onClick={() => router.push('/staff/dashboard')}
          style={{ background:'transparent', border:`1.5px solid ${passed ? 'rgba(255,255,255,0.3)' : 'var(--border-dark)'}`, borderRadius:10, padding:14, fontSize:15, fontWeight:600, color: passed ? '#fff' : 'var(--body)', cursor:'pointer', fontFamily:'DM Sans,sans-serif', textAlign:'center' }}>
          {lang === 'te' ? 'డాష్‌బోర్డ్‌కి వెళ్ళు' : 'Go to Dashboard'}
        </button>
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Telugu:wght@400;600;700&display=swap');`}</style>
    </div>
  )

  // Quiz screen
  return (
    <div style={{ minHeight:'100vh', background:'var(--ivory)', paddingBottom:100 }}>
      {/* Sticky header */}
      <div style={{ position:'sticky', top:0, zIndex:50, background:'var(--plum)', boxShadow:'0 2px 8px rgba(0,0,0,0.3)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <button onClick={() => router.push(`/staff/course/${courseId}?assignment=${assignmentId}`)}
              style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:8, padding:'6px 10px', color:'#fff', fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>
              ← Back
            </button>
            <div>
              <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--gold-btn)' }}>
                {lang === 'te' ? 'మాడ్యూల్ క్విజ్' : 'Module Quiz'}
              </div>
              <div style={{ fontSize:13, fontWeight:600, color:'#fff' }}>
                {lang === 'te' ? `ప్రశ్న ${current + 1} / ${questions.length}` : `Question ${current + 1} of ${questions.length}`}
              </div>
            </div>
          </div>
          <button onClick={toggleLang}
            style={{ background:'rgba(255,255,255,0.15)', border:'1px solid var(--gold-btn)', borderRadius:20, padding:'5px 12px', color:'var(--gold-btn)', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>
            {lang === 'en' ? 'తెలుగు' : 'English'}
          </button>
        </div>
        {/* Progress bar */}
        <div style={{ display:'flex', gap:2, padding:'0 16px 10px' }}>
          {questions.map((_, i) => (
            <div key={i} style={{ flex:1, height:4, borderRadius:999,
              background: i < current ? 'var(--gold-btn)' : i === current ? 'rgba(201,147,58,0.5)' : 'rgba(255,255,255,0.2)' }} />
          ))}
        </div>
      </div>

      {q && (
        <div style={{ padding:'20px 16px 0', maxWidth:680, margin:'0 auto' }}>
          {/* Question */}
          <div className="card" style={{ padding:'18px 20px', marginBottom:16 }}>
            <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--gold)', marginBottom:8 }}>
              {lang === 'te' ? `ప్రశ్న ${current + 1}` : `Question ${current + 1}`}
            </div>
            <p style={{ fontSize:16, fontWeight:600, color:'var(--charcoal)', lineHeight: lang === 'te' ? 2.1 : 1.55,
              fontFamily: lang === 'te' ? 'Noto Sans Telugu,sans-serif' : 'DM Sans,sans-serif' }}>
              {lang === 'te' ? q.question_te : q.question_en}
            </p>
          </div>

          {/* Options */}
          {options.map(opt => {
            const isSel     = selected === opt.key
            const isCorrect = submitted && opt.key === q.correct_option
            const isWrong   = submitted && isSel && !isCorrect
            return (
              <button key={opt.key}
                className={`answer-option${isCorrect?' correct':isWrong?' wrong':isSel?' selected':''}`}
                onClick={() => !submitted && setSelected(opt.key)}
                disabled={submitted}>
                <div className="option-key" style={{
                  background: isCorrect ? '#16A34A' : isWrong ? '#DC2626' : isSel ? 'var(--plum)' : 'var(--rose-bg)',
                  color: isCorrect||isWrong||isSel ? '#fff' : 'var(--muted)',
                }}>
                  {isCorrect ? '✓' : isWrong ? '✗' : opt.key.toUpperCase()}
                </div>
                <span style={{ fontSize:15, lineHeight: lang === 'te' ? 2 : 1.5, fontWeight: isSel?500:400,
                  color: isCorrect?'var(--success-text)':isWrong?'var(--danger-text)':'var(--body)',
                  fontFamily: lang === 'te' ? 'Noto Sans Telugu,sans-serif' : 'DM Sans,sans-serif' }}>
                  {lang === 'te' ? opt.te : opt.en}
                </span>
              </button>
            )
          })}

          {/* Explanation */}
          {submitted && (q.explanation_en || q.explanation_te) && (
            <div style={{ background:'var(--success-bg)', border:'1px solid #A7F3D0', borderRadius:10, padding:'14px 16px', marginTop:4 }}>
              <p style={{ fontSize:12, fontWeight:700, color:'var(--success-text)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:5 }}>
                {lang === 'te' ? 'వివరణ' : 'Explanation'}
              </p>
              <p style={{ fontSize:14, color:'var(--success-text)', lineHeight: lang === 'te' ? 2 : 1.6,
                fontFamily: lang === 'te' ? 'Noto Sans Telugu,sans-serif' : 'DM Sans,sans-serif' }}>
                {lang === 'te' ? q.explanation_te : q.explanation_en}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Fixed bottom */}
      <div style={{ position:'fixed', bottom:0, left:0, right:0, background:'var(--white)', borderTop:'1.5px solid var(--border)', padding:'14px 20px 28px' }}>
        {!submitted ? (
          <button className="btn-primary" onClick={submitAnswer} disabled={!selected}
            style={{ fontFamily: lang === 'te' ? 'Noto Sans Telugu,sans-serif' : 'DM Sans,sans-serif' }}>
            {lang === 'te' ? 'సమాధానం ఇవ్వు' : 'Submit answer'}
          </button>
        ) : (
          <button className="btn-gold" onClick={next} disabled={saving}
            style={{ fontFamily: lang === 'te' ? 'Noto Sans Telugu,sans-serif' : 'DM Sans,sans-serif' }}>
            {saving ? '...' : current + 1 >= questions.length
              ? (lang === 'te' ? 'ఫలితాలు చూడు →' : 'See results →')
              : (lang === 'te' ? 'తదుపరి ప్రశ్న →' : 'Next question →')}
          </button>
        )}
      </div>

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Telugu:wght@400;600;700&display=swap');`}</style>
    </div>
  )
}
