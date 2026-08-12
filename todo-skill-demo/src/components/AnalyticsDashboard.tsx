import React from 'react';
import { useTodo } from '../context/TodoContext';

export const AnalyticsDashboard: React.FC = () => {
  const { state } = useTodo();
  const { tasks } = state;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const totalFocusMinutes = tasks.reduce((sum, t) => sum + (t.totalFocusMinutes || 0), 0);
  const totalFocusHours = (totalFocusMinutes / 60).toFixed(1);

  // Group by category
  const categoryStats: Record<string, { total: number; completed: number }> = {};
  tasks.forEach((t) => {
    const cat = t.category || 'General';
    if (!categoryStats[cat]) categoryStats[cat] = { total: 0, completed: 0 };
    categoryStats[cat].total += 1;
    if (t.completed) categoryStats[cat].completed += 1;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total Tasks</span>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '4px' }}>{totalTasks}</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Completion Rate</span>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: '4px' }}>{completionRate}%</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Focus Time</span>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--accent-pink)', marginTop: '4px' }}>{totalFocusHours} hrs</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Pomodoros Done</span>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--accent-violet)', marginTop: '4px' }}>
            {tasks.reduce((sum, t) => sum + (t.completedPomodoros || 0), 0)}
          </div>
        </div>
      </div>

      {/* Category Distribution */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', color: 'var(--text-primary)' }}>🏷️ Completion Progress by Category</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {Object.entries(categoryStats).map(([cat, stat]) => {
            const pct = Math.round((stat.completed / stat.total) * 100);
            return (
              <div key={cat} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ fontWeight: 600 }}>{cat}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {stat.completed} / {stat.total} ({pct}%)
                  </span>
                </div>
                <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(to right, var(--accent-cyan), var(--accent-violet))', transition: 'width 0.5s ease' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
