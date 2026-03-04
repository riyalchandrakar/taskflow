import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { analyticsService } from '../services/analytics'
import { tasksService } from '../services/tasks'
import { useAuth } from '../context/AuthContext'
import { format, isToday, isTomorrow, isPast } from 'date-fns'

function StatCard({ label, value, sub, color = 'primary', icon }) {
  const colors = {
    primary: 'text-primary-400 bg-primary-500/10 border-primary-500/20',
    green: 'text-accent-400 bg-accent-500/10 border-accent-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    rose: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  }
  return (
    <div className="card p-5 hover:border-bg-border/80 transition-all duration-200 animate-slide-up">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${colors[color]}`}>
          {icon}
        </div>
      </div>
      <div className="text-2xl font-display font-bold text-text-primary">{value}</div>
      <div className="text-sm font-medium text-text-secondary mt-0.5">{label}</div>
      {sub && <div className="text-xs text-text-muted mt-1">{sub}</div>}
    </div>
  )
}

function TaskRow({ task }) {
  const priorityClass = { low: 'badge-low', medium: 'badge-medium', high: 'badge-high' }
  const statusClass = { pending: 'badge-pending', completed: 'badge-completed', archived: 'badge-archived' }

  const dueLabel = task.due_date
    ? isToday(new Date(task.due_date)) ? 'Due today'
      : isTomorrow(new Date(task.due_date)) ? 'Due tomorrow'
      : isPast(new Date(task.due_date)) && task.status !== 'completed' ? 'Overdue'
      : `Due ${format(new Date(task.due_date), 'MMM d')}`
    : null

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-bg-elevated transition-colors">
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${task.status === 'completed' ? 'bg-accent-400' : task.priority === 'high' ? 'bg-rose-400' : 'bg-primary-400'}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${task.status === 'completed' ? 'text-text-muted line-through' : 'text-text-primary'}`}>
          {task.title}
        </p>
        {dueLabel && (
          <p className={`text-xs mt-0.5 ${dueLabel === 'Overdue' ? 'text-rose-400' : 'text-text-muted'}`}>
            {dueLabel}
          </p>
        )}
      </div>
      <span className={priorityClass[task.priority]}>{task.priority}</span>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [analytics, setAnalytics] = useState(null)
  const [recentTasks, setRecentTasks] = useState([])
  const [loading, setLoading] = useState(true)

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  }

  useEffect(() => {
    Promise.all([
      analyticsService.getDashboard(),
      tasksService.getTasks({ page_size: 5, ordering: '-created_at', status: 'pending' })
    ]).then(([a, t]) => {
      setAnalytics(a)
      setRecentTasks(t.results || [])
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const score = analytics?.productivity_score?.score ?? 0
  const circumference = 2 * Math.PI * 52
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-text-primary">
            {greeting()}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-text-secondary mt-1 text-sm">
            Here's an overview of your productivity
          </p>
        </div>
        <Link to="/tasks" className="btn-primary flex items-center gap-2 text-sm">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          New Task
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Tasks"
          value={analytics?.total_tasks ?? 0}
          color="primary"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>}
        />
        <StatCard
          label="Completed"
          value={analytics?.completed_tasks ?? 0}
          sub={`${analytics?.completion_percentage ?? 0}% completion`}
          color="green"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>}
        />
        <StatCard
          label="Pending"
          value={analytics?.pending_tasks ?? 0}
          color="amber"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>}
        />
        <StatCard
          label="Avg. Completion"
          value={analytics?.avg_completion_time?.formatted ?? 'N/A'}
          sub="per task"
          color="cyan"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Productivity Score */}
        <div className="card p-6 flex flex-col items-center text-center">
          <h3 className="font-display font-semibold text-text-primary mb-4">Productivity Score</h3>
          <div className="relative w-36 h-36">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="#1e1e32" strokeWidth="10"/>
              <circle
                cx="60" cy="60" r="52"
                fill="none"
                stroke={score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#f43f5e'}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display font-bold text-3xl text-text-primary">{score}</span>
              <span className="text-xs text-text-muted">/ 100</span>
            </div>
          </div>
          <div className="mt-4 w-full space-y-2">
            {analytics?.productivity_score?.breakdown && Object.entries(analytics.productivity_score.breakdown).map(([key, val]) => (
              <div key={key} className="flex items-center justify-between text-xs">
                <span className="text-text-muted capitalize">{key.replace(/_/g, ' ')}</span>
                <span className="text-text-secondary font-medium">{val}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Pending Tasks */}
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-text-primary">Pending Tasks</h3>
            <Link to="/tasks" className="text-xs text-primary-400 hover:text-primary-300 transition-colors">
              View all →
            </Link>
          </div>
          {recentTasks.length === 0 ? (
            <div className="text-center py-8 text-text-muted text-sm">
              No pending tasks. Create one to get started!
            </div>
          ) : (
            <div className="space-y-1">
              {recentTasks.map(task => <TaskRow key={task.id} task={task} />)}
            </div>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-4">
        <Link to="/tasks" className="card p-5 hover:border-primary-500/30 transition-all duration-200 group">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-400">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
            </div>
            <div>
              <p className="font-medium text-text-primary text-sm">Manage Tasks</p>
              <p className="text-xs text-text-muted">Create, edit and organize</p>
            </div>
          </div>
        </Link>
        <Link to="/analytics" className="card p-5 hover:border-cyan-500/30 transition-all duration-200 group">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
            </div>
            <div>
              <p className="font-medium text-text-primary text-sm">View Analytics</p>
              <p className="text-xs text-text-muted">Charts and insights</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}
