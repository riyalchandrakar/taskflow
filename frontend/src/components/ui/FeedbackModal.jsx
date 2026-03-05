import { useState } from 'react'
import { tasksService } from '../../services/tasks'

export default function FeedbackModal({ task, onClose }) {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!rating) { setError('Please select a rating.'); return }
    if (!comment.trim()) { setError('Please add a comment.'); return }
    setLoading(true)
    setError('')
    try {
      await tasksService.createFeedback({
        task: task?.id || null,
        comment: comment.trim(),
        rating,
      })
      setSuccess(true)
      setTimeout(onClose, 1500)
    } catch (e) {
      setError('Failed to submit feedback. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const ratingLabels = { 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Great', 5: 'Excellent' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="card w-full max-w-md p-6 animate-slide-up shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-display font-semibold text-text-primary">Leave Feedback</h2>
            {task && <p className="text-xs text-text-muted mt-0.5 truncate max-w-[260px]">{task.title}</p>}
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {success ? (
          <div className="text-center py-8">
            <div className="w-14 h-14 rounded-2xl bg-accent-500/10 border border-accent-500/20 flex items-center justify-center mx-auto mb-3">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-7 h-7 text-accent-400">
                <circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/>
              </svg>
            </div>
            <p className="font-medium text-text-primary">Feedback submitted!</p>
            <p className="text-sm text-text-muted mt-1">Thank you for your feedback.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Star rating */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-3">Rating</label>
              <div className="flex items-center gap-2">
                {[1,2,3,4,5].map(star => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHovered(star)}
                    onMouseLeave={() => setHovered(0)}
                    className="transition-transform hover:scale-110 active:scale-95"
                  >
                    <svg viewBox="0 0 24 24" className="w-8 h-8 transition-colors duration-150"
                      fill={(hovered || rating) >= star ? '#fbbf24' : 'none'}
                      stroke={(hovered || rating) >= star ? '#fbbf24' : '#475569'}
                      strokeWidth={1.5}>
                      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                    </svg>
                  </button>
                ))}
                {(hovered || rating) > 0 && (
                  <span className="text-sm font-medium text-amber-400 ml-2">
                    {ratingLabels[hovered || rating]}
                  </span>
                )}
              </div>
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Comment</label>
              <textarea
                rows={4}
                className="input resize-none"
                placeholder="Share your thoughts about this task..."
                value={comment}
                onChange={e => setComment(e.target.value)}
              />
              <p className="text-xs text-text-muted mt-1 text-right">{comment.length}/500</p>
            </div>

            {error && <p className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-xl">{error}</p>}

            <div className="flex gap-3">
              <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : 'Submit'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
