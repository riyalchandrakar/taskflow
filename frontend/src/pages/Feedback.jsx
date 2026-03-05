import { useState, useEffect, useCallback } from 'react'
import { tasksService } from '../services/tasks'
import { format } from 'date-fns'

function StarDisplay({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(s => (
        <svg key={s} viewBox="0 0 24 24" className="w-4 h-4"
          fill={s <= rating ? '#fbbf24' : 'none'}
          stroke={s <= rating ? '#fbbf24' : '#475569'}
          strokeWidth={1.5}>
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
        </svg>
      ))}
      <span className="text-xs text-text-muted ml-1">{rating}/5</span>
    </div>
  )
}

export default function Feedback() {
  const [feedbacks, setFeedbacks] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ count: 0, total_pages: 1 })
  const [page, setPage] = useState(1)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const data = await tasksService.getFeedbacks({ page, page_size: 10 })
      setFeedbacks(data.results || [])
      setPagination({ count: data.count, total_pages: data.total_pages })
    } finally { setLoading(false) }
  }, [page])

  useEffect(() => { fetch() }, [fetch])

  // average rating
  const avg = feedbacks.length
    ? (feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length).toFixed(1)
    : null

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-text-primary">My Feedback</h1>
          <p className="text-text-secondary text-sm mt-0.5">{pagination.count} feedback{pagination.count !== 1 ? 's' : ''} submitted</p>
        </div>
        {avg && (
          <div className="card px-4 py-3 flex items-center gap-3">
            <div className="text-center">
              <p className="font-display font-bold text-2xl text-amber-400">{avg}</p>
              <p className="text-xs text-text-muted">avg rating</p>
            </div>
            <div className="flex flex-col gap-0.5">
              {[5,4,3,2,1].map(s => {
                const count = feedbacks.filter(f => f.rating === s).length
                const pct = feedbacks.length ? (count / feedbacks.length) * 100 : 0
                return (
                  <div key={s} className="flex items-center gap-1.5">
                    <span className="text-xs text-text-muted w-2">{s}</span>
                    <div className="w-16 h-1.5 rounded-full bg-bg-border overflow-hidden">
                      <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${pct}%` }}/>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center h-40 items-center">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"/>
        </div>
      ) : feedbacks.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-bg-elevated border border-bg-border flex items-center justify-center mx-auto mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8 text-text-muted">
              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
            </svg>
          </div>
          <p className="font-medium text-text-secondary">No feedback yet</p>
          <p className="text-sm text-text-muted mt-1">Go to Tasks → task menu → Feedback to submit one.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {feedbacks.map(f => (
            <div key={f.id} className="card p-5 animate-fade-in">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {f.task && (
                    <div className="flex items-center gap-2 mb-2">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5 text-primary-400 flex-shrink-0">
                        <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
                      </svg>
                      <span className="text-xs font-medium text-primary-400 truncate">{f.task.title}</span>
                    </div>
                  )}
                  <p className="text-sm text-text-primary leading-relaxed">{f.comment}</p>
                  <p className="text-xs text-text-muted mt-2">
                    {format(new Date(f.created_at), 'MMM d, yyyy · h:mm a')}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <StarDisplay rating={f.rating}/>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1} className="btn-secondary px-3 py-2 text-sm disabled:opacity-40">← Prev</button>
          <span className="text-sm text-text-secondary">Page {page} of {pagination.total_pages}</span>
          <button onClick={() => setPage(p => Math.min(pagination.total_pages,p+1))} disabled={page===pagination.total_pages} className="btn-secondary px-3 py-2 text-sm disabled:opacity-40">Next →</button>
        </div>
      )}
    </div>
  )
}
