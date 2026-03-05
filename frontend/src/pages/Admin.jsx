import { useState, useEffect, useCallback } from 'react'
import { adminService } from '../services/admin'
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const PRIORITY_COLORS = { high: '#fb7185', medium: '#fbbf24', low: '#34d399' }

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-bg-elevated border border-bg-border rounded-xl px-3 py-2 shadow-xl text-sm">
      {label && <p className="text-text-muted mb-1 text-xs">{label}</p>}
      {payload.map((e, i) => <p key={i} style={{ color: e.color || e.fill }}>{e.name}: {e.value}</p>)}
    </div>
  )
}

function StatCard({ label, value, sub, color = '#6366f1', icon }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}18`, border: `1px solid ${color}30`, color }}>
          {icon}
        </div>
        <span className="text-sm text-text-secondary">{label}</span>
      </div>
      <p className="font-display font-bold text-2xl text-text-primary">{value}</p>
      {sub && <p className="text-xs text-text-muted mt-0.5">{sub}</p>}
    </div>
  )
}

// ─── Users Tab ────────────────────────────────────────────────────────────────
function UsersTab() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ count: 0, total_pages: 1 })
  const [page, setPage] = useState(1)
  const [toggling, setToggling] = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const data = await adminService.getUsers({ page, page_size: 15 })
      setUsers(data.results || [])
      setPagination({ count: data.count, total_pages: data.total_pages })
    } finally { setLoading(false) }
  }, [page])

  useEffect(() => { fetch() }, [fetch])

  const toggle = async (userId, field, currentVal) => {
    setToggling(userId + field)
    try {
      await adminService.updateUser(userId, { [field]: !currentVal })
      setUsers(u => u.map(x => x.id === userId ? { ...x, [field]: !currentVal } : x))
    } finally { setToggling(null) }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">{pagination.count} total users</p>
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-bg-border">
                <th className="text-left px-4 py-3 text-text-muted font-medium">User</th>
                <th className="text-left px-4 py-3 text-text-muted font-medium">Joined</th>
                <th className="text-center px-4 py-3 text-text-muted font-medium">Tasks</th>
                <th className="text-center px-4 py-3 text-text-muted font-medium">Done</th>
                <th className="text-center px-4 py-3 text-text-muted font-medium">Active</th>
                <th className="text-center px-4 py-3 text-text-muted font-medium">Admin</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12 text-text-muted">
                  <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
                </td></tr>
              ) : users.map(u => (
                <tr key={u.id} className="border-b border-bg-border/50 hover:bg-bg-elevated transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-xs font-bold text-primary-400">
                        {u.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2)}
                      </div>
                      <div>
                        <p className="font-medium text-text-primary">{u.name}</p>
                        <p className="text-xs text-text-muted">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-center text-text-primary font-medium">{u.total_tasks}</td>
                  <td className="px-4 py-3 text-center text-accent-400 font-medium">{u.completed_tasks}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggle(u.id, 'is_active', u.is_active)}
                      disabled={toggling === u.id + 'is_active'}
                      className={`w-10 h-5 rounded-full transition-all duration-300 relative ${u.is_active ? 'bg-accent-500' : 'bg-bg-border'}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${u.is_active ? 'left-5' : 'left-0.5'}`} />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggle(u.id, 'is_staff', u.is_staff)}
                      disabled={toggling === u.id + 'is_staff'}
                      className={`w-10 h-5 rounded-full transition-all duration-300 relative ${u.is_staff ? 'bg-primary-500' : 'bg-bg-border'}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${u.is_staff ? 'left-5' : 'left-0.5'}`} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {pagination.total_pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-40">← Prev</button>
          <span className="text-sm text-text-secondary">Page {page} of {pagination.total_pages}</span>
          <button onClick={() => setPage(p => Math.min(pagination.total_pages, p+1))} disabled={page === pagination.total_pages} className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-40">Next →</button>
        </div>
      )}
    </div>
  )
}

// ─── Tasks Tab ────────────────────────────────────────────────────────────────
function TasksTab() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ count: 0, total_pages: 1 })
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({ status: '', priority: '', search: '' })

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, page_size: 15, ...Object.fromEntries(Object.entries(filters).filter(([,v]) => v)) }
      const data = await adminService.getTasks(params)
      setTasks(data.results || [])
      setPagination({ count: data.count, total_pages: data.total_pages })
    } finally { setLoading(false) }
  }, [page, filters])

  useEffect(() => { fetch() }, [fetch])

  const priorityColors = { high: 'text-rose-400', medium: 'text-amber-400', low: 'text-accent-400' }
  const statusColors = { pending: 'text-primary-400', completed: 'text-accent-400', archived: 'text-text-muted' }

  return (
    <div className="space-y-4">
      <div className="card p-3 flex flex-wrap gap-2">
        <input type="text" placeholder="Search tasks..." value={filters.search}
          onChange={e => { setFilters(f => ({...f, search: e.target.value})); setPage(1) }}
          className="input flex-1 min-w-[180px] py-2 text-sm" />
        {['', 'pending', 'completed', 'archived'].map(s => (
          <button key={s} onClick={() => { setFilters(f => ({...f, status: s})); setPage(1) }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all capitalize
              ${filters.status === s ? 'bg-primary-500/20 border-primary-500/40 text-primary-400' : 'bg-bg-elevated border-bg-border text-text-secondary hover:text-text-primary'}`}>
            {s || 'All Status'}
          </button>
        ))}
        {['', 'high', 'medium', 'low'].map(p => (
          <button key={p} onClick={() => { setFilters(f => ({...f, priority: p})); setPage(1) }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all capitalize
              ${filters.priority === p ? 'bg-primary-500/20 border-primary-500/40 text-primary-400' : 'bg-bg-elevated border-bg-border text-text-secondary hover:text-text-primary'}`}>
            {p || 'All Priority'}
          </button>
        ))}
      </div>
      <p className="text-sm text-text-secondary">{pagination.count} total tasks</p>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-bg-border">
                <th className="text-left px-4 py-3 text-text-muted font-medium">Task</th>
                <th className="text-left px-4 py-3 text-text-muted font-medium">User</th>
                <th className="text-center px-4 py-3 text-text-muted font-medium">Priority</th>
                <th className="text-center px-4 py-3 text-text-muted font-medium">Status</th>
                <th className="text-left px-4 py-3 text-text-muted font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-12 text-text-muted">
                  <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
                </td></tr>
              ) : tasks.map(t => (
                <tr key={t.id} className="border-b border-bg-border/50 hover:bg-bg-elevated transition-colors">
                  <td className="px-4 py-3">
                    <p className={`font-medium ${t.status === 'completed' ? 'line-through text-text-muted' : 'text-text-primary'}`}>{t.title}</p>
                    {t.description && <p className="text-xs text-text-muted truncate max-w-[200px]">{t.description}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-text-primary">{t.user.name}</p>
                    <p className="text-xs text-text-muted">{t.user.email}</p>
                  </td>
                  <td className={`px-4 py-3 text-center font-medium capitalize ${priorityColors[t.priority]}`}>{t.priority}</td>
                  <td className={`px-4 py-3 text-center font-medium capitalize ${statusColors[t.status]}`}>{t.status}</td>
                  <td className="px-4 py-3 text-text-secondary">{new Date(t.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {pagination.total_pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-40">← Prev</button>
          <span className="text-sm text-text-secondary">Page {page} of {pagination.total_pages}</span>
          <button onClick={() => setPage(p => Math.min(pagination.total_pages, p+1))} disabled={page === pagination.total_pages} className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-40">Next →</button>
        </div>
      )}
    </div>
  )
}

// ─── Analytics Tab ────────────────────────────────────────────────────────────
function AnalyticsTab() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminService.getAnalytics().then(setData).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>

  const pieData = data?.priority_distribution?.map(d => ({ name: d.priority, value: d.count, color: PRIORITY_COLORS[d.priority] })) || []

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={data?.total_users ?? 0} color="#6366f1"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>} />
        <StatCard label="Total Tasks" value={data?.total_tasks ?? 0} color="#22d3ee"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>} />
        <StatCard label="Completed" value={data?.completed_tasks ?? 0} sub={`${data?.completion_percentage ?? 0}%`} color="#10b981"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>} />
        <StatCard label="Avg Completion" value={data?.avg_completion_time?.formatted ?? 'N/A'} color="#fbbf24"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Tasks over time */}
        <div className="card p-6">
          <h3 className="font-display font-semibold text-text-primary mb-4">Completions (Last 30 Days)</h3>
          {data?.tasks_over_time?.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-text-muted text-sm">No completed tasks yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={data?.tasks_over_time || []} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <defs>
                  <linearGradient id="adminGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e32" vertical={false}/>
                <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} axisLine={false}/>
                <YAxis tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false}/>
                <Tooltip content={<CustomTooltip />}/>
                <Area type="monotone" dataKey="count" name="Tasks" stroke="#6366f1" strokeWidth={2} fill="url(#adminGrad)"/>
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Priority distribution */}
        <div className="card p-6">
          <h3 className="font-display font-semibold text-text-primary mb-4">Priority Distribution</h3>
          {pieData.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-text-muted text-sm">No tasks yet</div>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="55%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={4} dataKey="value">
                    {pieData.map((e, i) => <Cell key={i} fill={e.color} stroke="transparent"/>)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />}/>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3 flex-1">
                {pieData.map(d => (
                  <div key={d.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }}/>
                      <span className="text-sm capitalize text-text-secondary">{d.name}</span>
                    </div>
                    <span className="text-sm font-medium text-text-primary">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top users */}
      <div className="card p-6">
        <h3 className="font-display font-semibold text-text-primary mb-4">Top 5 Most Productive Users</h3>
        <div className="space-y-3">
          {data?.top_users?.map((u, i) => (
            <div key={u.id} className="flex items-center gap-4">
              <span className="w-6 text-center text-sm font-bold text-text-muted">#{i+1}</span>
              <div className="w-8 h-8 rounded-lg bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-xs font-bold text-primary-400">
                {u.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{u.name}</p>
                <p className="text-xs text-text-muted truncate">{u.email}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 rounded-full bg-accent-500" style={{ width: `${Math.min(100, (u.done / (data?.top_users[0]?.done || 1)) * 80 + 20)}px` }}/>
                <span className="text-sm font-medium text-accent-400">{u.done}</span>
              </div>
            </div>
          ))}
          {(!data?.top_users?.length) && <p className="text-text-muted text-sm text-center py-4">No data yet</p>}
        </div>
      </div>
    </div>
  )
}

// ─── Main Admin Page ──────────────────────────────────────────────────────────
export default function Admin() {
  const [tab, setTab] = useState('analytics')

  const tabs = [
    { id: 'analytics', label: 'Global Analytics', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><path d="M18 20V10M12 20V4M6 20v-6"/></svg> },
    { id: 'users',     label: 'All Users',         icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg> },
    { id: 'tasks',     label: 'All Tasks',         icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg> },
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl text-text-primary">Admin Panel</h1>
            <p className="text-text-secondary text-sm">System-wide management and analytics</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-bg-elevated rounded-xl p-1 border border-bg-border w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
              ${tab === t.id ? 'bg-bg-surface text-text-primary shadow-sm border border-bg-border' : 'text-text-secondary hover:text-text-primary'}`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {tab === 'analytics' && <AnalyticsTab />}
      {tab === 'users'     && <UsersTab />}
      {tab === 'tasks'     && <TasksTab />}
    </div>
  )
}
