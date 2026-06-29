'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AdminContent() {
  const [content, setContent] = useState<any[]>([])
  const [filter, setFilter] = useState<'all' | 'draft' | 'published'>('all')
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('lms_content')
      .select('id, title_en, title_te, type, category, status, has_quiz, created_at')
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

  const filtered = filter === 'all' ? content : content.filter(c => c.status === filter)
  const draftCount = content.filter(c => c.status === 'draft').length

  const typeIcon = (t: string) => ({ jewellery_piece: '💎', video: '🎥', document: '📋', text: '📝' }[t] || '📄')
  const catColor = (c: string) => ({ sales: '#EAF1FB|#1A4A8A', etiquette: '#F3E8FF|#6B21A8', jewellery: '#FEF3DC|#7A4D00', systems: '#E8F5EE|#1A6B3C', compliance: '#FDECEA|#9B1C1C' }[c] || '#F0EBF8|#5A5A5A')

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1E0A2E', margin: 0 }}>Content Library</h1>
          <p style={{ color: '#5A5A5A', fontSize: 14, marginTop: 4 }}>Review and publish training content</p>
        </div>
        {draftCount > 0 && (
          <div style={{ background: '#FEF3DC', border: '1px solid #FDE68A', borderRadius: 10, padding: '10px 16px', fontSize: 14, color: '#7A4D00', fontWeight: 500 }}>
            ⚠️ {draftCount} item{draftCount > 1 ? 's' : ''} awaiting review
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['all', 'draft', 'published'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', border: '1.5px solid', transition: 'all 0.15s', textTransform: 'capitalize',
              borderColor: filter === f ? '#1E0A2E' : '#D4CEC8', background: filter === f ? '#1E0A2E' : '#fff', color: filter === f ? '#fff' : '#5A5A5A' }}>
            {f} {f !== 'all' && `(${content.filter(c => c.status === f).length})`}
          </button>
        ))}
      </div>

      {loading ? <p style={{ color: '#5A5A5A' }}>Loading...</p> : (
        <div style={{ background: '#fff', border: '1.5px solid #E2D8E8', borderRadius: 14, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#FAF8F4' }}>
                {['Content', 'Category', 'Type', 'Quiz', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#5A5A5A', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, i) => {
                const [catBg, catColor2] = catColor(item.category).split('|')
                return (
                  <tr key={i} style={{ borderTop: '1px solid #E2D8E8', background: item.status === 'draft' ? '#FFFBF5' : '#fff' }}>
                    <td style={{ padding: '12px 20px' }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#1E0A2E' }}>{item.title_en}</div>
                      <div style={{ fontSize: 12, color: '#5A5A5A', marginTop: 2 }}>{item.title_te}</div>
                    </td>
                    <td style={{ padding: '12px 20px' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: catBg, color: catColor2, textTransform: 'capitalize' }}>{item.category}</span>
                    </td>
                    <td style={{ padding: '12px 20px', fontSize: 20 }}>{typeIcon(item.type)}</td>
                    <td style={{ padding: '12px 20px', fontSize: 13, color: item.has_quiz ? '#1A6B3C' : '#5A5A5A', fontWeight: item.has_quiz ? 600 : 400 }}>
                      {item.has_quiz ? '✓ Yes' : '—'}
                    </td>
                    <td style={{ padding: '12px 20px' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: item.status === 'published' ? '#E8F5EE' : '#FEF3DC', color: item.status === 'published' ? '#1A6B3C' : '#7A4D00' }}>
                        {item.status === 'published' ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 20px' }}>
                      <button onClick={() => toggleStatus(item)} disabled={toggling === item.id}
                        style={{ fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 6, border: '1.5px solid', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s',
                          borderColor: item.status === 'published' ? '#9B1C1C' : '#1A6B3C',
                          background: item.status === 'published' ? '#FDECEA' : '#E8F5EE',
                          color: item.status === 'published' ? '#9B1C1C' : '#1A6B3C' }}>
                        {toggling === item.id ? '...' : item.status === 'published' ? 'Unpublish' : 'Publish'}
                      </button>
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
