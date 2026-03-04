import { useState, useEffect } from 'react'
import { analyticsService } from '../services/analytics'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const PRIORITY_COLORS = { high: '#fb7185', medium: '#fbbf24', low: '#34d399' }
const CHART_COLORS = ['#6366f1', '#22d3ee', '#10b981', '#fbbf24', '#fb7185']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-bg-elevated border border-bg-border rounded-xl px-3 py-2 shadow-xl">
      {label && <p className="text-xs text-text-muted mb-1">{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-medium" style={{ color: entry.color || entry.fill }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  )
}

function MetricCard({ label, value, sub, icon, color = '#6366f1' }) {
  return (
    <div className="card p-5 animate-slide-up">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}20`, border: `1px solid ${color}30` }}>
          <span style={{ color }}>{icon}</span>
        </div>
        <span className="text-sm font-medium text-text-secondary">{label}</span>
      </div>
      <p className="font-display font-bold text-2xl text-text-primary">{value}</p>
      {sub && <p className="text-xs text-text-muted mt-0.5">{sub}</p>}
    </div>
  )
}

export default function Analytics() {
  const [data, setData] = useState(null)
  const [period, setPeriod] = useState('day')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    analyticsService.getDashboard()
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  const chartData = data ? (
    period === 'day' ? data.tasks_over_time
    : period === 'week' ? data.tasks_per_week
    : data.tasks_per_month
  ) : []

  const formattedChartData = chartData.map(d => ({
    ...d,
    date: d.date ? d.date.slice(0, period === 'day' ? 10 : 7) : d.date,
  }))

  const pieData = data?.priority_distribution?.map(d => ({
    name: d.priority,
    value: d.count,
    color: PRIORITY_COLORS[d.priority] || '#6366f1',
  })) || []

  const score = data?.productivity_score?.score ?? 0
  const breakdown = data?.productivity_score?.breakdown ?? {}

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="font-display font-bold text-2xl text-text-primary">Analytics</h1>
        <p className="text-text-secondary text-sm mt-0.5">Insights into your productivity patterns</p>
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Tasks"
          value={data?.total_tasks ?? 0}
          color="#6366f1"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>}
        />
        <MetricCard
          label="Completed"
          value={data?.completed_tasks ?? 0}
          sub={`${data?.completion_percentage ?? 0}%`}
          color="#10b981"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>}
        />
        <MetricCard
          label="Most Productive"
          value={data?.most_productive_day?.day ?? 'N/A'}
          sub={`${data?.most_productive_day?.count ?? 0} tasks done`}
          color="#22d3ee"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>}
        />
        <MetricCard
          label="Avg. Completion"
          value={data?.avg_completion_time?.formatted ?? 'N/A'}
          sub="per task"
          color="#fbbf24"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>}
        />
      </div>

      {/* Tasks Over Time */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display font-semibold text-text-primary">Tasks Completed Over Time</h2>
            <p className="text-xs text-text-muted mt-0.5">Number of tasks completed per period</p>
          </div>
          <div className="flex gap-1 bg-bg-elevated rounded-xl p-1 border border-bg-border">
            {['day', 'week', 'month'].map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
                  period === p ? 'bg-primary-500 text-white' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        {formattedChartData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-text-muted text-sm">
            No completed tasks yet. Complete some tasks to see trends.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={formattedChartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e32" vertical={false}/>
              <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 11 }} tickLine={false} axisLine={false}/>
              <YAxis tick={{ fill: '#475569', fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false}/>
              <Tooltip content={<CustomTooltip />}/>
              <Area type="monotone" dataKey="count" name="Tasks" stroke="#6366f1" strokeWidth={2} fill="url(#areaGrad)"/>
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Priority Distribution */}
        <div className="card p-6">
          <h2 className="font-display font-semibold text-text-primary mb-1">Priority Distribution</h2>
          <p className="text-xs text-text-muted mb-6">All tasks by priority level</p>
          {pieData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-text-muted text-sm">No tasks yet</div>
          ) : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="50%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} stroke="transparent"/>
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />}/>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3 flex-1">
                {pieData.map(d => (
                  <div key={d.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}/>
                      <span className="text-sm capitalize text-text-secondary">{d.name}</span>
                    </div>
                    <span className="text-sm font-medium text-text-primary">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Productivity Score Breakdown */}
        <div className="card p-6">
          <h2 className="font-display font-semibold text-text-primary mb-1">Productivity Score</h2>
          <p className="text-xs text-text-muted mb-6">
            Score = (Completion × 50) + (On-time × 30) + (High-priority × 20)
          </p>
          <div className="flex items-center gap-6">
            {/* Score ring */}
            <div className="relative w-32 h-32 flex-shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="#1e1e32" strokeWidth="10"/>
                <circle
                  cx="60" cy="60" r="52"
                  fill="none"
                  stroke={score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#f43f5e'}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 52}
                  strokeDashoffset={2 * Math.PI * 52 * (1 - score / 100)}
                  style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display font-bold text-3xl text-text-primary">{score}</span>
                <span className="text-xs text-text-muted">/ 100</span>
              </div>
            </div>
            {/* Breakdown bars */}
            <div className="flex-1 space-y-3">
              {Object.entries(breakdown).map(([key, val]) => (
                <div key={key}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-text-muted capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="text-text-secondary font-medium">{val}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-bg-elevated overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${val}%`,
                        backgroundColor: val >= 70 ? '#10b981' : val >= 40 ? '#f59e0b' : '#f43f5e'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Status Distribution Bar */}
      <div className="card p-6">
        <h2 className="font-display font-semibold text-text-primary mb-1">Task Status Overview</h2>
        <p className="text-xs text-text-muted mb-6">Distribution of tasks across statuses</p>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart
            data={[{
              name: 'Tasks',
              Pending: data?.pending_tasks ?? 0,
              Completed: data?.completed_tasks ?? 0,
              Archived: data?.archived_tasks ?? 0,
            }]}
            layout="vertical"
            margin={{ top: 5, right: 20, bottom: 5, left: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1e1e32" horizontal={false}/>
            <XAxis type="number" tick={{ fill: '#475569', fontSize: 11 }} tickLine={false} axisLine={false}/>
            <YAxis type="category" dataKey="name" tick={{ fill: '#475569', fontSize: 11 }} tickLine={false} axisLine={false}/>
            <Tooltip content={<CustomTooltip />}/>
            <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }}/>
            <Bar dataKey="Pending" fill="#6366f1" radius={[0, 4, 4, 0]}/>
            <Bar dataKey="Completed" fill="#10b981" radius={[0, 4, 4, 0]}/>
            <Bar dataKey="Archived" fill="#475569" radius={[0, 4, 4, 0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
