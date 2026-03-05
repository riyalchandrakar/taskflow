import { useState, useEffect } from 'react'
import { tasksService } from '../../services/tasks'
import { format } from 'date-fns'

const ACTION_CONFIG = {
  created:   { color: 'text-accent-400',  bg: 'bg-accent-500/10  border-accent-500/20',  label: 'Created'   },
  updated:   { color: 'text-primary-400', bg: 'bg-primary-500/10 border-primary-500/20', label: 'Updated'   },
  completed: { color: 'text-accent-400',  bg: 'bg-accent-500/10  border-accent-500/20',  label: 'Completed' },
  archived:  { color: 'text-text-muted',  bg: 'bg-text-muted/10  border-text-muted/20',  label: 'Archived'  },
  deleted:   { color: 'text-rose-400',    bg: 'bg-rose-500/10    border-rose-500/20',    label: 'Deleted'   },
}

function DiffRow({ label, prev, curr }) {
  if (prev === curr || (prev === null && curr === null)) return null
  return (
    <div className="flex items-start gap-2 text-xs">
      <span className="text-text-muted w-20 flex-shrink-0 pt-0.5">{label}</span>
      <div className="flex items-center gap-1.5 flex-wrap">
        {prev !== undefined && prev !== null && (
          <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 line-through">{String(prev)}</span>
        )}
        {prev !== undefined && <span className="text-text-muted">→</span>}
        {curr !== undefined && curr !== null && (
          <span className="px-2 py-0.5 rounded bg-accent-500/10 text-accent-400">{String(curr)}</span>
        )}
      </div>
    </div>
  )
}

export default function TaskHistoryModal({ taskId, taskTitle, onClose }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    tasksService.getTask(taskId)
      .then(data => setHistory(data.task?.history || []))
      .finally(() => setLoading(false))
  }, [taskId])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="card w-full max-w-lg p-6 animate-slide-up shadow-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-5 flex-shrink-0">
          <div>
            <h2 className="font-display font-semibold text-text-primary">Task History</h2>
            <p className="text-xs text-text-muted mt-0.5 truncate max-w-[280px]">{taskTitle}</p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Timeline */}
        <div className="overflow-y-auto flex-1 space-y-1 pr-1">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"/>
            </div>
          ) : history.length === 0 ? (
            <p className="text-center text-text-muted text-sm py-10">No history available.</p>
          ) : history.map((h, i) => {
            const cfg = ACTION_CONFIG[h.action_type] || ACTION_CONFIG.updated
            const isOpen = expanded === h.id
            const prev = h.previous_state

            return (
              <div key={h.id} className="relative pl-6">
                {/* Vertical line */}
                {i < history.length - 1 && (
                  <div className="absolute left-2 top-6 bottom-0 w-px bg-bg-border"/>
                )}
                {/* Dot */}
                <div className={`absolute left-0 top-2 w-4 h-4 rounded-full border flex items-center justify-center ${cfg.bg}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${cfg.color.replace('text-', 'bg-')}`}/>
                </div>

                <div className={`card-elevated p-3 mb-2 cursor-pointer transition-all ${isOpen ? 'border-bg-border/80' : ''}`}
                  onClick={() => setExpanded(isOpen ? null : h.id)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`badge text-xs border ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                      <span className="text-xs text-text-muted">
                        {format(new Date(h.timestamp), 'MMM d, yyyy · h:mm a')}
                      </span>
                    </div>
                    {prev && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                        className={`w-4 h-4 text-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                        <path d="M6 9l6 6 6-6"/>
                      </svg>
                    )}
                  </div>

                  {/* Diff view */}
                  {isOpen && prev && (
                    <div className="mt-3 pt-3 border-t border-bg-border space-y-2">
                      <p className="text-xs font-medium text-text-muted mb-2">Previous state:</p>
                      <DiffRow label="Title"    prev={prev.title}       />
                      <DiffRow label="Status"   prev={prev.status}      />
                      <DiffRow label="Priority" prev={prev.priority}    />
                      <DiffRow label="Due date" prev={prev.due_date ? prev.due_date.slice(0,10) : null} />
                      {prev.description && (
                        <div className="text-xs">
                          <span className="text-text-muted">Description: </span>
                          <span className="text-text-secondary">{prev.description.slice(0, 80)}{prev.description.length > 80 ? '...' : ''}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
