import { useState, useEffect, useCallback } from 'react'
import { tasksService } from '../services/tasks'
import TaskModal from '../components/ui/TaskModal'
import TaskHistoryModal from '../components/ui/TaskHistoryModal'
import FeedbackModal from '../components/ui/FeedbackModal'
import { format, isToday, isTomorrow, isPast } from 'date-fns'

function PriorityBadge({ priority }) {
  const cls = { low: 'badge-low', medium: 'badge-medium', high: 'badge-high' }
  return <span className={cls[priority]}>{priority}</span>
}

function StatusBadge({ status }) {
  const cls = { pending: 'badge-pending', completed: 'badge-completed', archived: 'badge-archived' }
  return <span className={cls[status]}>{status}</span>
}

function TaskCard({ task, onEdit, onComplete, onArchive, onDelete, onHistory, onFeedback }) {
  const [menuOpen, setMenuOpen] = useState(false)

  const dueLabel = task.due_date
    ? isToday(new Date(task.due_date))    ? { text: 'Due today',     color: 'text-amber-400' }
      : isTomorrow(new Date(task.due_date)) ? { text: 'Due tomorrow',  color: 'text-amber-400' }
      : isPast(new Date(task.due_date)) && task.status !== 'completed'
                                            ? { text: 'Overdue',       color: 'text-rose-400' }
      : { text: `Due ${format(new Date(task.due_date), 'MMM d, yyyy')}`, color: 'text-text-muted' }
    : null

  return (
    <div className="card p-4 hover:border-bg-border/80 transition-all duration-200 group animate-fade-in">
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={() => task.status !== 'completed' && onComplete(task.id)}
          className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200
            ${task.status === 'completed' ? 'bg-accent-500 border-accent-500' : 'border-bg-border hover:border-primary-500'}`}
        >
          {task.status === 'completed' && (
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} className="w-3 h-3"><path d="M5 13l4 4L19 7"/></svg>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`font-medium text-sm leading-snug ${task.status === 'completed' ? 'line-through text-text-muted' : 'text-text-primary'}`}>
              {task.title}
            </p>

            {/* Actions menu */}
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setMenuOpen(v => !v)}
                className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-text-primary transition-all p-1 rounded-lg hover:bg-bg-elevated"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
                </svg>
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)}/>
                  <div className="absolute right-0 top-8 z-20 bg-bg-elevated border border-bg-border rounded-xl shadow-xl py-1.5 min-w-[160px]">

                    <button onClick={() => { onEdit(task); setMenuOpen(false) }}
                      className="w-full text-left px-3.5 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-border transition-colors flex items-center gap-2">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      Edit
                    </button>

                    {task.status !== 'completed' && (
                      <button onClick={() => { onComplete(task.id); setMenuOpen(false) }}
                        className="w-full text-left px-3.5 py-2 text-sm text-accent-400 hover:bg-bg-border transition-colors flex items-center gap-2">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>
                        Complete
                      </button>
                    )}

                    {task.status !== 'archived' && (
                      <button onClick={() => { onArchive(task.id); setMenuOpen(false) }}
                        className="w-full text-left px-3.5 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-border transition-colors flex items-center gap-2">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><polyline points="21,8 21,21 3,21 3,8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
                        Archive
                      </button>
                    )}

                    <div className="border-t border-bg-border my-1"/>

                    <button onClick={() => { onHistory(task); setMenuOpen(false) }}
                      className="w-full text-left px-3.5 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-border transition-colors flex items-center gap-2">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
                      View History
                    </button>

                    <button onClick={() => { onFeedback(task); setMenuOpen(false) }}
                      className="w-full text-left px-3.5 py-2 text-sm text-amber-400 hover:bg-bg-border transition-colors flex items-center gap-2">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>
                      Feedback
                    </button>

                    <div className="border-t border-bg-border my-1"/>

                    <button onClick={() => { onDelete(task.id); setMenuOpen(false) }}
                      className="w-full text-left px-3.5 py-2 text-sm text-rose-400 hover:bg-bg-border transition-colors flex items-center gap-2">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><polyline points="3,6 5,6 21,6"/><path d="M19,6l-1,14a2,2,0,0,1-2,2H8a2,2,0,0,1-2-2L5,6"/><path d="M10,11v6M14,11v6"/></svg>
                      Delete
                    </button>

                  </div>
                </>
              )}
            </div>
          </div>

          {task.description && <p className="text-xs text-text-muted mt-1 line-clamp-2">{task.description}</p>}

          <div className="flex items-center gap-2 mt-2.5 flex-wrap">
            <PriorityBadge priority={task.priority}/>
            <StatusBadge status={task.status}/>
            {dueLabel && <span className={`text-xs ${dueLabel.color}`}>{dueLabel.text}</span>}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Tasks() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pagination, setPagination] = useState({ count: 0, total_pages: 1, current_page: 1 })
  const [filters, setFilters] = useState({ status: '', priority: '', search: '' })
  const [page, setPage] = useState(1)

  // Modals
  const [taskModal, setTaskModal]       = useState(false)
  const [editingTask, setEditingTask]   = useState(null)
  const [historyTask, setHistoryTask]   = useState(null)
  const [feedbackTask, setFeedbackTask] = useState(null)

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, page_size: 12, ...Object.fromEntries(Object.entries(filters).filter(([,v]) => v)) }
      const data = await tasksService.getTasks(params)
      setTasks(data.results || [])
      setPagination({ count: data.count, total_pages: data.total_pages, current_page: data.current_page })
    } finally { setLoading(false) }
  }, [page, filters])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  const handleSave = async (payload) => {
    setSaving(true)
    try {
      if (editingTask) await tasksService.updateTask(editingTask.id, payload)
      else await tasksService.createTask(payload)
      setTaskModal(false)
      setEditingTask(null)
      fetchTasks()
    } finally { setSaving(false) }
  }

  const handleComplete = async (id) => { await tasksService.completeTask(id); fetchTasks() }
  const handleArchive  = async (id) => { await tasksService.archiveTask(id);  fetchTasks() }
  const handleDelete   = async (id) => { if (confirm('Delete this task?')) { await tasksService.deleteTask(id); fetchTasks() } }
  const handleEdit     = (task)      => { setEditingTask(task); setTaskModal(true) }

  const FilterBtn = ({ field, value, label }) => (
    <button
      onClick={() => { setFilters(f => ({ ...f, [field]: f[field] === value ? '' : value })); setPage(1) }}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
        filters[field] === value
          ? 'bg-primary-500/20 border-primary-500/40 text-primary-400'
          : 'bg-bg-elevated border-bg-border text-text-secondary hover:text-text-primary'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-text-primary">Tasks</h1>
          <p className="text-text-secondary text-sm mt-0.5">{pagination.count} tasks total</p>
        </div>
        <button onClick={() => { setEditingTask(null); setTaskModal(true) }} className="btn-primary flex items-center gap-2 text-sm">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="M12 5v14M5 12h14"/></svg>
          New Task
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <input type="text" placeholder="Search tasks..." value={filters.search}
            onChange={e => { setFilters(f => ({ ...f, search: e.target.value })); setPage(1) }}
            className="input flex-1 min-w-[200px] py-2 text-sm"/>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-text-muted">Status:</span>
            <FilterBtn field="status" value="pending"   label="Pending"/>
            <FilterBtn field="status" value="completed" label="Completed"/>
            <FilterBtn field="status" value="archived"  label="Archived"/>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-text-muted">Priority:</span>
            <FilterBtn field="priority" value="high"   label="High"/>
            <FilterBtn field="priority" value="medium" label="Medium"/>
            <FilterBtn field="priority" value="low"    label="Low"/>
          </div>
          {(filters.status || filters.priority || filters.search) && (
            <button onClick={() => { setFilters({ status: '', priority: '', search: '' }); setPage(1) }} className="text-xs text-rose-400 hover:text-rose-300 transition-colors">Clear</button>
          )}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"/>
        </div>
      ) : tasks.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-bg-elevated border border-bg-border flex items-center justify-center mx-auto mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8 text-text-muted">
              <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
            </svg>
          </div>
          <p className="font-medium text-text-secondary">No tasks found</p>
          <p className="text-sm text-text-muted mt-1">
            {filters.status || filters.priority || filters.search ? 'Try adjusting your filters' : 'Create your first task to get started'}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map(task => (
            <TaskCard key={task.id} task={task}
              onEdit={handleEdit}
              onComplete={handleComplete}
              onArchive={handleArchive}
              onDelete={handleDelete}
              onHistory={t => setHistoryTask(t)}
              onFeedback={t => setFeedbackTask(t)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="btn-secondary px-3 py-2 text-sm disabled:opacity-40">← Prev</button>
          <span className="text-sm text-text-secondary">Page {page} of {pagination.total_pages}</span>
          <button onClick={() => setPage(p => Math.min(pagination.total_pages, p+1))} disabled={page === pagination.total_pages} className="btn-secondary px-3 py-2 text-sm disabled:opacity-40">Next →</button>
        </div>
      )}

      {/* Modals */}
      {taskModal && (
        <TaskModal task={editingTask} onClose={() => { setTaskModal(false); setEditingTask(null) }} onSave={handleSave} loading={saving}/>
      )}
      {historyTask && (
        <TaskHistoryModal taskId={historyTask.id} taskTitle={historyTask.title} onClose={() => setHistoryTask(null)}/>
      )}
      {feedbackTask && (
        <FeedbackModal task={feedbackTask} onClose={() => setFeedbackTask(null)}/>
      )}
    </div>
  )
}
