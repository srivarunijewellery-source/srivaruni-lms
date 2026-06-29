'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function WhyBlock({ block, lang }: { block: any; lang: 'en' | 'te' }) {
  return (
    <div style={{ background: '#FEF3DC', border: '1px solid #FDE68A', borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#7A4D00', marginBottom: 6 }}>
        {block.icon} {block.label}
      </div>
      <p style={{ fontSize: 14, lineHeight: 1.7, color: '#7A4D00', margin: 0 }}>{block.text}</p>
    </div>
  )
}

function RuleBlock({ block, lang }: { block: any; lang: 'en' | 'te' }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#5A5A5A', marginBottom: 8 }}>
        {block.icon} {block.label}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
        {block.items?.map((item: any, i: number) => (
          <div key={i} style={{ borderRadius: 8, padding: '10px 14px', background: item.do ? '#E8F5EE' : '#FDECEA', border: `1px solid ${item.do ? '#A7F3D0' : '#FECACA'}` }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{item.do ? '✓' : '✗'}</span>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: item.do ? '#1A6B3C' : '#9B1C1C', margin: '0 0 4px 0' }}>{item.text}</p>
                {item.detail && <p style={{ fontSize: 13, color: item.do ? '#1A6B3C' : '#9B1C1C', margin: 0, lineHeight: 1.6, opacity: 0.85 }}>{item.detail}</p>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function StepsBlock({ block }: { block: any }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#5A5A5A', marginBottom: 8 }}>
        {block.icon} {block.label}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
        {block.items?.map((item: any, i: number) => (
          <div key={i} style={{ display: 'flex', gap: 12, background: '#fff', border: '1.5px solid #E2D8E8', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1E0A2E', color: '#C9933A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
              {item.step}
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#1E0A2E', margin: '0 0 4px 0' }}>{item.text}</p>
              {item.detail && <p style={{ fontSize: 13, color: '#5A5A5A', margin: 0, lineHeight: 1.6 }}>{item.detail}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ScenariosBlock({ block }: { block: any }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#5A5A5A', marginBottom: 8 }}>
        {block.icon} {block.label}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
        {block.items?.map((item: any, i: number) => (
          <div key={i} style={{ background: '#EAF1FB', border: '1px solid #BFDBFE', borderRadius: 10, padding: '12px 14px' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#1A4A8A', margin: '0 0 6px 0' }}>💬 {item.title}</p>
            <p style={{ fontSize: 13, color: '#1A4A8A', margin: 0, lineHeight: 1.6 }}>→ {item.response}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function ContentRenderer({ blocks, lang }: { blocks: any[]; lang: 'en' | 'te' }) {
  if (!blocks || !Array.isArray(blocks)) return null
  return (
    <>
      {blocks.map((block: any, i: number) => {
        if (block.type === 'why') return <WhyBlock key={i} block={block} lang={lang} />
        if (block.type === 'rule') return <RuleBlock key={i} block={block} lang={lang} />
        if (block.type === 'steps') return <StepsBlock key={i} block={block} />
        if (block.type === 'scenarios') return <ScenariosBlock key={i} block={block} />
        return null
      })}
    </>
  )
}

export default function ContentReviewPage() {
  const router = useRouter()
  const { id } = useParams() as { id: string }
  const [content, setContent] = useState<any>(null)
  const [lang, setLang] = useState<'en' | 'te'>('en')
  const [loading, setLoading] = useState(true)
  const [approving, setApproving] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('lms_content').select('*').eq('id', id).single()
    setContent(data)
    setLoading(false)
  }

  async function handleApprove() {
    setApproving(true)
    setMessage('')

    // Copy draft content over live content
    const { error } = await supabase.from('lms_content').update({
      body_json:    content.draft_body_json,
      body_json_te: content.draft_body_json_te,
      body_en:      content.draft_body_en,
      body_te:      content.draft_body_te,
      draft_status: 'approved',
      updated_at:   new Date().toISOString(),
    }).eq('id', id)

    if (error) {
      setMessage('❌ Error approving: ' + error.message)
      setApproving(false)
      return
    }

    setMessage('✅ Draft approved and published to staff!')
    await load()
    setApproving(false)
  }

  async function handleReject() {
    setRejecting(true)
    setMessage('')
    const { error } = await supabase.from('lms_content').update({
      draft_status: 'rejected',
      updated_at: new Date().toISOString(),
    }).eq('id', id)
    if (error) { setMessage('❌ Error: ' + error.message); setRejecting(false); return }
    setMessage('Draft rejected. Staff still see old content.')
    await load()
    setRejecting(false)
  }

  if (loading) return (
    <div style={{ padding: 32, color: '#5A5A5A' }}>Loading...</div>
  )

  if (!content) return (
    <div style={{ padding: 32, color: '#9B1C1C' }}>Content not found.</div>
  )

  const hasDraft = content.draft_status === 'pending_review' && content.draft_body_json
  const draftBlocks = lang === 'te' ? content.draft_body_json_te : content.draft_body_json
  const liveBlocks  = lang === 'te' ? content.body_json_te : content.body_json

  return (
    <div style={{ maxWidth: 900 }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <button onClick={() => router.push('/admin/content')}
            style={{ fontSize: 13, color: '#5A5A5A', background: 'none', border: '1.5px solid #D4CEC8', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', marginBottom: 12 }}>
            ← Back to Content
          </button>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1E0A2E', margin: 0 }}>{content.title_en}</h1>
          <p style={{ color: '#5A5A5A', fontSize: 13, marginTop: 4 }}>{content.title_te}</p>
        </div>
        {/* Lang toggle */}
        <button onClick={() => setLang(l => l === 'en' ? 'te' : 'en')}
          style={{ padding: '8px 16px', borderRadius: 8, border: '1.5px solid #C9933A', background: 'rgba(201,147,58,0.1)', color: '#C9933A', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
          {lang === 'en' ? 'తెలుగులో చూడండి' : 'View in English'}
        </button>
      </div>

      {/* Draft pending banner */}
      {hasDraft && (
        <div style={{ background: '#FEF3DC', border: '1.5px solid #FDE68A', borderRadius: 12, padding: '16px 20px', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#7A4D00', margin: 0 }}>⚠️ Enriched draft awaiting your review</p>
              <p style={{ fontSize: 13, color: '#7A4D00', margin: '4px 0 0' }}>Review the new content below. Approve to replace what staff currently see, or reject to discard.</p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleReject} disabled={rejecting}
                style={{ padding: '9px 18px', borderRadius: 8, border: '1.5px solid #9B1C1C', background: '#FDECEA', color: '#9B1C1C', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                {rejecting ? '...' : '✕ Reject'}
              </button>
              <button onClick={handleApprove} disabled={approving}
                style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#1A6B3C', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                {approving ? 'Approving...' : '✓ Approve & Publish'}
              </button>
            </div>
          </div>
          {message && (
            <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 8, background: message.startsWith('✅') ? '#E8F5EE' : '#FDECEA', color: message.startsWith('✅') ? '#1A6B3C' : '#9B1C1C', fontSize: 14, fontWeight: 500 }}>
              {message}
            </div>
          )}
        </div>
      )}

      {content.draft_status === 'approved' && (
        <div style={{ background: '#E8F5EE', border: '1px solid #A7F3D0', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#1A6B3C', margin: 0 }}>✅ Enriched content approved — staff are seeing the new version.</p>
        </div>
      )}

      {content.draft_status === 'rejected' && (
        <div style={{ background: '#FDECEA', border: '1px solid #FECACA', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#9B1C1C', margin: 0 }}>✕ Draft rejected — staff are still seeing the original content.</p>
        </div>
      )}

      {/* Side by side comparison if draft pending */}
      {hasDraft ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Current live */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#5A5A5A', marginBottom: 12, padding: '6px 12px', background: '#F0EBF8', borderRadius: 6 }}>
              📺 Currently live (what staff see)
            </div>
            {liveBlocks ? (
              <ContentRenderer blocks={liveBlocks} lang={lang} />
            ) : (
              <div style={{ padding: 16, background: '#FAF8F4', borderRadius: 10, color: '#5A5A5A', fontSize: 14 }}>No structured content yet.</div>
            )}
          </div>

          {/* New draft */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#7A4D00', marginBottom: 12, padding: '6px 12px', background: '#FEF3DC', borderRadius: 6 }}>
              ✏️ New enriched draft (pending approval)
            </div>
            <ContentRenderer blocks={draftBlocks} lang={lang} />
          </div>
        </div>
      ) : (
        /* Single column — live content */
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#5A5A5A', marginBottom: 12 }}>
            Current content
          </div>
          {liveBlocks ? (
            <ContentRenderer blocks={liveBlocks} lang={lang} />
          ) : (
            <div style={{ padding: 16, background: '#FAF8F4', borderRadius: 10, color: '#5A5A5A', fontSize: 14 }}>No structured content.</div>
          )}
        </div>
      )}
    </div>
  )
}
