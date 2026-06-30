'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

/* ───────── Read-only block renderers ───────── */
function WhyBlock({ block }: { block: any }) {
  return (
    <div style={{ background: '#FEF3DC', border: '1px solid #FDE68A', borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#7A4D00', marginBottom: 6 }}>{block.icon} {block.label}</div>
      <p style={{ fontSize: 14, lineHeight: 1.7, color: '#7A4D00', margin: 0 }}>{block.text}</p>
    </div>
  )
}
function RuleBlock({ block }: { block: any }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#5A5A5A', marginBottom: 8 }}>{block.icon} {block.label}</div>
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
      <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#5A5A5A', marginBottom: 8 }}>{block.icon} {block.label}</div>
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
        {block.items?.map((item: any, i: number) => (
          <div key={i} style={{ display: 'flex', gap: 12, background: '#fff', border: '1.5px solid #E2D8E8', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1E0A2E', color: '#C9933A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{item.step}</div>
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
      <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#5A5A5A', marginBottom: 8 }}>{block.icon} {block.label}</div>
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
function ContentRenderer({ blocks }: { blocks: any[] }) {
  if (!blocks || !Array.isArray(blocks)) return null
  return <>{blocks.map((block: any, i: number) => {
    if (block.type === 'why') return <WhyBlock key={i} block={block} />
    if (block.type === 'rule') return <RuleBlock key={i} block={block} />
    if (block.type === 'steps') return <StepsBlock key={i} block={block} />
    if (block.type === 'scenarios') return <ScenariosBlock key={i} block={block} />
    return null
  })}</>
}

/* ───────── Structured editor ───────── */
function EditableRuleItem({ item, onChange, onDelete }: { item: any; onChange: (v: any) => void; onDelete: () => void }) {
  return (
    <div style={{ border: `1.5px solid ${item.do ? '#A7F3D0' : '#FECACA'}`, borderRadius: 8, padding: 10, marginBottom: 6, background: item.do ? '#F0FDF8' : '#FFF5F5' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
        <button onClick={() => onChange({ ...item, do: !item.do })}
          style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 12, border: 'none', cursor: 'pointer', background: item.do ? '#16A34A' : '#DC2626', color: '#fff' }}>
          {item.do ? '✓ DO' : '✗ DONT'}
        </button>
        <button onClick={onDelete} style={{ marginLeft: 'auto', fontSize: 11, color: '#9B1C1C', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
      </div>
      <input value={item.text || ''} onChange={e => onChange({ ...item, text: e.target.value })}
        placeholder="Rule text"
        style={{ width: '100%', padding: '6px 8px', fontSize: 13, fontWeight: 600, border: '1px solid #D4CEC8', borderRadius: 6, marginBottom: 6, fontFamily: 'inherit', boxSizing: 'border-box' }} />
      <textarea value={item.detail || ''} onChange={e => onChange({ ...item, detail: e.target.value })}
        placeholder="Detailed explanation" rows={2}
        style={{ width: '100%', padding: '6px 8px', fontSize: 13, border: '1px solid #D4CEC8', borderRadius: 6, fontFamily: 'inherit', boxSizing: 'border-box', resize: 'vertical' as const }} />
    </div>
  )
}
function EditableStepItem({ item, onChange, onDelete }: { item: any; onChange: (v: any) => void; onDelete: () => void }) {
  return (
    <div style={{ border: '1.5px solid #E2D8E8', borderRadius: 8, padding: 10, marginBottom: 6 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#5A5A5A' }}>Step {item.step}</span>
        <button onClick={onDelete} style={{ marginLeft: 'auto', fontSize: 11, color: '#9B1C1C', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
      </div>
      <input value={item.text || ''} onChange={e => onChange({ ...item, text: e.target.value })} placeholder="Step text"
        style={{ width: '100%', padding: '6px 8px', fontSize: 13, fontWeight: 600, border: '1px solid #D4CEC8', borderRadius: 6, marginBottom: 6, fontFamily: 'inherit', boxSizing: 'border-box' }} />
      <textarea value={item.detail || ''} onChange={e => onChange({ ...item, detail: e.target.value })} placeholder="Detail" rows={2}
        style={{ width: '100%', padding: '6px 8px', fontSize: 13, border: '1px solid #D4CEC8', borderRadius: 6, fontFamily: 'inherit', boxSizing: 'border-box', resize: 'vertical' as const }} />
    </div>
  )
}
function EditableScenarioItem({ item, onChange, onDelete }: { item: any; onChange: (v: any) => void; onDelete: () => void }) {
  return (
    <div style={{ border: '1.5px solid #BFDBFE', borderRadius: 8, padding: 10, marginBottom: 6, background: '#F5F9FF' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 6 }}>
        <button onClick={onDelete} style={{ fontSize: 11, color: '#9B1C1C', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
      </div>
      <input value={item.title || ''} onChange={e => onChange({ ...item, title: e.target.value })} placeholder="Scenario question"
        style={{ width: '100%', padding: '6px 8px', fontSize: 13, fontWeight: 600, border: '1px solid #D4CEC8', borderRadius: 6, marginBottom: 6, fontFamily: 'inherit', boxSizing: 'border-box' }} />
      <textarea value={item.response || ''} onChange={e => onChange({ ...item, response: e.target.value })} placeholder="Correct response" rows={2}
        style={{ width: '100%', padding: '6px 8px', fontSize: 13, border: '1px solid #D4CEC8', borderRadius: 6, fontFamily: 'inherit', boxSizing: 'border-box', resize: 'vertical' as const }} />
    </div>
  )
}

function StructuredEditor({ blocks, onChange }: { blocks: any[]; onChange: (b: any[]) => void }) {
  function updateBlock(idx: number, newBlock: any) {
    const next = [...blocks]; next[idx] = newBlock; onChange(next)
  }
  function updateItem(blockIdx: number, itemIdx: number, newItem: any) {
    const block = blocks[blockIdx]
    const items = [...block.items]; items[itemIdx] = newItem
    updateBlock(blockIdx, { ...block, items })
  }
  function deleteItem(blockIdx: number, itemIdx: number) {
    const block = blocks[blockIdx]
    updateBlock(blockIdx, { ...block, items: block.items.filter((_: any, i: number) => i !== itemIdx) })
  }
  function addItem(blockIdx: number) {
    const block = blocks[blockIdx]
    let newItem: any = {}
    if (block.type === 'rule') newItem = { do: true, text: '', detail: '' }
    if (block.type === 'steps') newItem = { step: (block.items?.length || 0) + 1, text: '', detail: '' }
    if (block.type === 'scenarios') newItem = { title: '', response: '' }
    updateBlock(blockIdx, { ...block, items: [...(block.items || []), newItem] })
  }

  return (
    <div>
      {blocks.map((block, bi) => (
        <div key={bi} style={{ marginBottom: 20, padding: 14, background: '#FAF8F4', borderRadius: 10, border: '1px solid #E2D8E8' }}>
          {block.type === 'why' ? (
            <>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input value={block.icon || ''} onChange={e => updateBlock(bi, { ...block, icon: e.target.value })} style={{ width: 50, padding: 6, fontSize: 14, border: '1px solid #D4CEC8', borderRadius: 6, textAlign: 'center' }} />
                <input value={block.label || ''} onChange={e => updateBlock(bi, { ...block, label: e.target.value })} placeholder="Section label" style={{ flex: 1, padding: 6, fontSize: 13, fontWeight: 700, border: '1px solid #D4CEC8', borderRadius: 6 }} />
              </div>
              <textarea value={block.text || ''} onChange={e => updateBlock(bi, { ...block, text: e.target.value })} placeholder="Why this matters..." rows={4}
                style={{ width: '100%', padding: 8, fontSize: 13, border: '1px solid #D4CEC8', borderRadius: 6, fontFamily: 'inherit', boxSizing: 'border-box', resize: 'vertical' as const }} />
            </>
          ) : (
            <>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' }}>
                <input value={block.icon || ''} onChange={e => updateBlock(bi, { ...block, icon: e.target.value })} style={{ width: 50, padding: 6, fontSize: 14, border: '1px solid #D4CEC8', borderRadius: 6, textAlign: 'center' }} />
                <input value={block.label || ''} onChange={e => updateBlock(bi, { ...block, label: e.target.value })} placeholder="Section label" style={{ flex: 1, padding: 6, fontSize: 13, fontWeight: 700, border: '1px solid #D4CEC8', borderRadius: 6 }} />
                <span style={{ fontSize: 11, color: '#5A5A5A', background: '#E2D8E8', padding: '3px 8px', borderRadius: 6 }}>{block.type}</span>
              </div>
              {block.items?.map((item: any, ii: number) => {
                if (block.type === 'rule') return <EditableRuleItem key={ii} item={item} onChange={v => updateItem(bi, ii, v)} onDelete={() => deleteItem(bi, ii)} />
                if (block.type === 'steps') return <EditableStepItem key={ii} item={item} onChange={v => updateItem(bi, ii, v)} onDelete={() => deleteItem(bi, ii)} />
                if (block.type === 'scenarios') return <EditableScenarioItem key={ii} item={item} onChange={v => updateItem(bi, ii, v)} onDelete={() => deleteItem(bi, ii)} />
                return null
              })}
              <button onClick={() => addItem(bi)}
                style={{ fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 6, border: '1.5px dashed #C9933A', background: 'none', color: '#C9933A', cursor: 'pointer', marginTop: 4 }}>
                + Add item
              </button>
            </>
          )}
        </div>
      ))}
    </div>
  )
}

/* ───────── Main page ───────── */
export default function ContentReviewPage() {
  const router = useRouter()
  const { id } = useParams() as { id: string }
  const [content, setContent] = useState<any>(null)
  const [lang, setLang] = useState<'en' | 'te'>('en')
  const [loading, setLoading] = useState(true)
  const [approving, setApproving] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [editorMode, setEditorMode] = useState<'structured' | 'json'>('structured')
  const [editedBlocks, setEditedBlocks] = useState<any[]>([])
  const [jsonText, setJsonText] = useState('')
  const [jsonError, setJsonError] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('lms_content').select('*').eq('id', id).single()
    setContent(data)
    setLoading(false)
  }

  const hasDraft = content?.draft_status === 'pending_review' && content?.draft_body_json
  const draftBlocks = lang === 'te' ? content?.draft_body_json_te : content?.draft_body_json
  const liveBlocks  = lang === 'te' ? content?.body_json_te : content?.body_json

  function startEdit() {
    const blocks = hasDraft ? draftBlocks : liveBlocks
    setEditedBlocks(JSON.parse(JSON.stringify(blocks || [])))
    setJsonText(JSON.stringify(blocks || [], null, 2))
    setJsonError('')
    setEditMode(true)
  }

  function switchToJson() {
    setJsonText(JSON.stringify(editedBlocks, null, 2))
    setEditorMode('json')
  }
  function switchToStructured() {
    try {
      const parsed = JSON.parse(jsonText)
      setEditedBlocks(parsed)
      setJsonError('')
      setEditorMode('structured')
    } catch (e: any) {
      setJsonError('Invalid JSON: ' + e.message)
    }
  }

  async function saveEdits() {
    let blocksToSave = editedBlocks
    if (editorMode === 'json') {
      try { blocksToSave = JSON.parse(jsonText) }
      catch (e: any) { setJsonError('Invalid JSON: ' + e.message); return }
    }

    setSaving(true)
    const field = hasDraft
      ? (lang === 'te' ? 'draft_body_json_te' : 'draft_body_json')
      : (lang === 'te' ? 'body_json_te' : 'body_json')

    const { error } = await supabase.from('lms_content').update({ [field]: blocksToSave, updated_at: new Date().toISOString() }).eq('id', id)
    if (error) { setMessage('❌ Save failed: ' + error.message); setSaving(false); return }

    setMessage('✅ Changes saved')
    setEditMode(false)
    setSaving(false)
    await load()
  }

  async function handleApprove() {
    setApproving(true)
    setMessage('')
    const { error } = await supabase.from('lms_content').update({
      body_json: content.draft_body_json,
      body_json_te: content.draft_body_json_te,
      body_en: content.draft_body_en,
      body_te: content.draft_body_te,
      draft_status: 'approved',
      updated_at: new Date().toISOString(),
    }).eq('id', id)
    if (error) { setMessage('❌ Error approving: ' + error.message); setApproving(false); return }
    setMessage('✅ Draft approved and published to staff!')
    await load()
    setApproving(false)
  }

  async function handleReject() {
    setRejecting(true)
    setMessage('')
    const { error } = await supabase.from('lms_content').update({ draft_status: 'rejected', updated_at: new Date().toISOString() }).eq('id', id)
    if (error) { setMessage('❌ Error: ' + error.message); setRejecting(false); return }
    setMessage('Draft rejected. Staff still see old content.')
    await load()
    setRejecting(false)
  }

  if (loading) return <div style={{ padding: 32, color: '#5A5A5A' }}>Loading...</div>
  if (!content) return <div style={{ padding: 32, color: '#9B1C1C' }}>Content not found.</div>

  return (
    <div style={{ maxWidth: 1000 }}>
      {/* Header */}
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <button onClick={() => router.push('/admin/content')}
            style={{ fontSize: 13, color: '#5A5A5A', background: 'none', border: '1.5px solid #D4CEC8', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', marginBottom: 12 }}>
            ← Back to Content
          </button>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1E0A2E', margin: 0 }}>{content.title_en}</h1>
          <p style={{ color: '#5A5A5A', fontSize: 13, marginTop: 4 }}>{content.title_te}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setLang(l => l === 'en' ? 'te' : 'en')}
            style={{ padding: '8px 16px', borderRadius: 8, border: '1.5px solid #C9933A', background: 'rgba(201,147,58,0.1)', color: '#C9933A', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
            {lang === 'en' ? 'తెలుగులో చూడండి' : 'View in English'}
          </button>
          {!editMode && (
            <button onClick={startEdit}
              style={{ padding: '8px 16px', borderRadius: 8, border: '1.5px solid #1E0A2E', background: '#1E0A2E', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
              ✎ Edit
            </button>
          )}
        </div>
      </div>

      {/* Media preview — image/video/audio/document */}
      {(content.photo_url || content.video_url || content.audio_url || content.document_url) && (
        <div style={{ marginBottom: 20, background: '#fff', border: '1.5px solid #E2D8E8', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '10px 16px', borderBottom: '1px solid #E2D8E8', fontSize: 12, fontWeight: 700, color: '#5A5A5A', textTransform: 'uppercase' as const, letterSpacing: '0.07em' }}>
            Attached Media
          </div>
          <div style={{ padding: 16 }}>
            {content.photo_url && (
              <img src={content.photo_url} alt={content.title_en}
                style={{ maxWidth: '100%', maxHeight: 420, borderRadius: 10, display: 'block', margin: '0 auto', border: '1px solid #E2D8E8' }}
                onError={(e: any) => { e.target.onerror = null; e.target.src = ''; e.target.alt = 'Image failed to load — check URL'; e.target.style.cssText = 'padding:20px;background:#FDECEA;color:#9B1C1C;border-radius:10px;text-align:center;' }} />
            )}
            {content.video_url && (
              <video src={content.video_url} controls style={{ maxWidth: '100%', maxHeight: 420, borderRadius: 10, display: 'block', margin: '0 auto' }} />
            )}
            {content.audio_url && (
              <audio src={content.audio_url} controls style={{ width: '100%' }} />
            )}
            {content.document_url && (
              <a href={content.document_url} target="_blank" rel="noreferrer"
                style={{ display: 'inline-block', padding: '10px 18px', background: '#EAF1FB', color: '#1A4A8A', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                📄 View document
              </a>
            )}
          </div>
        </div>
      )}

      {/* Draft pending banner */}
      {hasDraft && !editMode && (
        <div style={{ background: '#FEF3DC', border: '1.5px solid #FDE68A', borderRadius: 12, padding: '16px 20px', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#7A4D00', margin: 0 }}>⚠️ Enriched draft awaiting your review</p>
              <p style={{ fontSize: 13, color: '#7A4D00', margin: '4px 0 0' }}>Edit if needed, then approve to replace what staff currently see.</p>
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
        </div>
      )}

      {message && (
        <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, background: message.startsWith('✅') ? '#E8F5EE' : '#FDECEA', color: message.startsWith('✅') ? '#1A6B3C' : '#9B1C1C', fontSize: 14, fontWeight: 500 }}>
          {message}
        </div>
      )}

      {content.draft_status === 'approved' && !editMode && (
        <div style={{ background: '#E8F5EE', border: '1px solid #A7F3D0', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#1A6B3C', margin: 0 }}>✅ Enriched content approved — staff are seeing the new version.</p>
        </div>
      )}
      {content.draft_status === 'rejected' && !editMode && (
        <div style={{ background: '#FDECEA', border: '1px solid #FECACA', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#9B1C1C', margin: 0 }}>✕ Draft rejected — staff are still seeing the original content.</p>
        </div>
      )}

      {/* EDIT MODE */}
      {editMode ? (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={switchToStructured}
                style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, border: '1.5px solid', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                  borderColor: editorMode === 'structured' ? '#1E0A2E' : '#D4CEC8', background: editorMode === 'structured' ? '#1E0A2E' : '#fff', color: editorMode === 'structured' ? '#fff' : '#5A5A5A' }}>
                Structured Editor
              </button>
              <button onClick={switchToJson}
                style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, border: '1.5px solid', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                  borderColor: editorMode === 'json' ? '#1E0A2E' : '#D4CEC8', background: editorMode === 'json' ? '#1E0A2E' : '#fff', color: editorMode === 'json' ? '#fff' : '#5A5A5A' }}>
                Raw JSON
              </button>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setEditMode(false); setMessage('') }}
                style={{ padding: '8px 16px', borderRadius: 8, border: '1.5px solid #D4CEC8', background: '#fff', color: '#5A5A5A', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                Cancel
              </button>
              <button onClick={saveEdits} disabled={saving}
                style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#C9933A', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                {saving ? 'Saving...' : '💾 Save Changes'}
              </button>
            </div>
          </div>

          {editorMode === 'structured' ? (
            <StructuredEditor blocks={editedBlocks} onChange={setEditedBlocks} />
          ) : (
            <div>
              {jsonError && <div style={{ color: '#9B1C1C', fontSize: 13, marginBottom: 8, fontWeight: 600 }}>{jsonError}</div>}
              <textarea value={jsonText} onChange={e => setJsonText(e.target.value)}
                rows={30}
                style={{ width: '100%', padding: 14, fontSize: 13, fontFamily: 'Monaco, monospace', border: '1.5px solid #D4CEC8', borderRadius: 10, boxSizing: 'border-box', lineHeight: 1.6, background: '#1E1E1E', color: '#D4D4D4' }} />
            </div>
          )}
        </div>
      ) : hasDraft ? (
        /* Side by side comparison */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#5A5A5A', marginBottom: 12, padding: '6px 12px', background: '#F0EBF8', borderRadius: 6 }}>
              📺 Currently live (what staff see)
            </div>
            {liveBlocks ? <ContentRenderer blocks={liveBlocks} /> : <div style={{ padding: 16, background: '#FAF8F4', borderRadius: 10, color: '#5A5A5A', fontSize: 14 }}>No structured content yet.</div>}
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#7A4D00', marginBottom: 12, padding: '6px 12px', background: '#FEF3DC', borderRadius: 6 }}>
              ✏️ New enriched draft (pending approval)
            </div>
            <ContentRenderer blocks={draftBlocks} />
          </div>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#5A5A5A', marginBottom: 12 }}>Current content</div>
          {liveBlocks ? <ContentRenderer blocks={liveBlocks} /> : <div style={{ padding: 16, background: '#FAF8F4', borderRadius: 10, color: '#5A5A5A', fontSize: 14 }}>No structured content.</div>}
        </div>
      )}
    </div>
  )
}
