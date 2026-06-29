'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AdminContent() {
  const router = useRouter()
  const [content, setContent] = useState<any[]>([])
  const [filter, setFilter] = useState<'all' | 'draft' | 'published' | 'pending_review'>('all')
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('lms_content')
      .select('id, title_en, title_te, type, category, status, has_quiz, draft_status, created_at')
      .order('created_at', { ascending: false })
    setContent(data || [])
    setLoading(false)
  }

  async function toggleStatus(item: any) {
    setToggling(item.id)
    const newStatus = item.status === 'published' ? 'draft' : 'published'
    await supabase.from('lms_content').update({ status: newStatus }).eq('id', item.id)
    await load()
    setToggling(null)
  }

  const pendingCount = content.filter(c => c.draft_status === 'pending_review').length

  const filtered = filter === 'pending_review'
    ? content.filter(c => c.draft_status === 'pending_review')
    : filter === 'all' ? content : content.filter(c => c.status === filter)

  const typeIcon = (t: string) => ({ jewellery_piece: '💎', video: '🎥', document: '📋', text: '📝' }[t] || '📄')
  const catColors: Record<string, string> = {
    sales: '#EAF1FB|#1A4A8A', etiquette: '#F3E8FF|#6B21A8',
    jewellery: '#FEF3DC|#7A4D00', systems: '#E8F5EE|#1A6B3C',
    compliance: '#FDECEA|#9B1C1C'
  }
  const catColor = (c: string) => catColors[c] || '#F0EBF8|#5A5A5A'

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1E0A2E', margin: 0 }}>Content Library</h1>
          <p style={{ color: '#5A5A5A', fontSize: 14, marginTop: 4 }}>Review and publish training content</p>
        </div>
        {pendingCount > 0 && (
          <div style={{ background: '#FEF3DC', border: '1.5px solid #FDE68A', borderRadius: 10, padding: '10px 16px' }}>
            <p style={{ fontSize: 14, color: '#7A4D00', fontWeight: 600, margin: 0 }}>
              ⚠️ {pendingCount} item{pendingCount > 1 ? 's' : ''} awaiting your review
            </p>
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { key: 'all', label: 'All' },
          { key: 'pending_review', label: `⚠️ Pending Review (${pendingCount})` },
          { key: 'published', label: 'Published' },
          { key: 'draft', label: 'Draft' },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key as any)}
            style={{ padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', border: '1.5px solid', transition: 'all 0.15s',
              borderColor: filter === f.key ? '#1E0A2E' : '#D4CEC8',
              background: filter === f.key ? '#1E0A2E' : '#fff',
              color: filter === f.key ? '#fff' : '#5A5A5A' }}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? <p style={{ color: '#5A5A5A' }}>Loading...</p> : (
        <div style={{ background: '#fff', border: '1.5px solid #E2D8E8', borderRadius: 14, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#FAF8F4' }}>
                {['Content', 'Category', 'Type', 'Status', 'Draft', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#5A5A5A', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, i) => {
                const [catBg, catCol] = catColor(item.category).split('|')
                const hasPendingDraft = item.draft_status === 'pending_review'
                return (
                  <tr key={i} style={{ borderTop: '1px solid #E2D8E8', background: hasPendingDraft ? '#FFFBF0' : item.status === 'draft' ? '#FAFAF8' : '#fff' }}>
                    <td style={{ padding: '12px 20px' }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#1E0A2E' }}>{item.title_en}</div>
                      <div style={{ fontSize: 12, color: '#5A5A5A', marginTop: 2 }}>{item.title_te}</div>
                    </td>
                    <td style={{ padding: '12px 20px' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: catBg, color: catCol, textTransform: 'capitalize' }}>{item.category}</span>
                    </td>
                    <td style={{ padding: '12px 20px', fontSize: 20 }}>{typeIcon(item.type)}</td>
                    <td style={{ padding: '12px 20px' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                        background: item.status === 'published' ? '#E8F5EE' : '#FEF3DC',
                        color: item.status === 'published' ? '#1A6B3C' : '#7A4D00' }}>
                        {item.status === 'published' ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 20px' }}>
                      {hasPendingDraft && (
                        <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: '#FEF3DC', color: '#7A4D00' }}>
                          ⚠️ Pending
                        </span>
                      )}
                      {item.draft_status === 'approved' && (
                        <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: '#E8F5EE', color: '#1A6B3C' }}>
                          ✓ Approved
                        </span>
                      )}
                      {item.draft_status === 'rejected' && (
                        <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: '#FDECEA', color: '#9B1C1C' }}>
                          ✕ Rejected
                        </span>
                      )}
                      {(!item.draft_status || item.draft_status === 'none') && (
                        <span style={{ fontSize: 12, color: '#5A5A5A' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 20px' }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {hasPendingDraft && (
                          <button onClick={() => router.push(`/admin/content/${item.id}`)}
                            style={{ fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 6, border: '1.5px solid #7A4D00', background: '#FEF3DC', color: '#7A4D00', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                            Review →
                          </button>
                        )}
                        {!hasPendingDraft && (
                          <button onClick={() => router.push(`/admin/content/${item.id}`)}
                            style={{ fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 6, border: '1.5px solid #D4CEC8', background: '#fff', color: '#5A5A5A', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                            View
                          </button>
                        )}
                        <button onClick={() => toggleStatus(item)} disabled={toggling === item.id}
                          style={{ fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 6, border: '1.5px solid', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s',
                            borderColor: item.status === 'published' ? '#9B1C1C' : '#1A6B3C',
                            background: item.status === 'published' ? '#FDECEA' : '#E8F5EE',
                            color: item.status === 'published' ? '#9B1C1C' : '#1A6B3C' }}>
                          {toggling === item.id ? '...' : item.status === 'published' ? 'Unpublish' : 'Publish'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
