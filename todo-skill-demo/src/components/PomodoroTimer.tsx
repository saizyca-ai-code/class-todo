import React, { useEffect } from 'react';
import { useTodo } from '../context/TodoContext';

export const PomodoroTimer: React.FC = () => {
  const { state, dispatch } = useTodo();
  const { pomodoro, tasks } = state;

  // Interval timer tick
  useEffect(() => {
    let interval: any = null;
    if (pomodoro.isRunning) {
      interval = setInterval(() => {
        dispatch({ type: 'TICK_POMODORO' });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [pomodoro.isRunning, dispatch]);

  const activeTask = tasks.find((t) => t.id === pomodoro.activeTaskId);

  const minutes = Math.floor(pomodoro.secondsRemaining / 60);
  const seconds = pomodoro.secondsRemaining % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const totalSeconds = pomodoro.durationMinutes * 60;
  const progressPercent = ((totalSeconds - pomodoro.secondsRemaining) / totalSeconds) * 100;

  return (
    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1.1rem', color: 'var(--accent-pink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🍅 Pomodoro Focus Timer
        </h3>
        {activeTask && (
          <span className="badge" style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#f472b6' }}>
            Bound to: {activeTask.title}
          </span>
        )}
      </div>

      {/* Countdown Ring */}
      <div
        style={{
          width: '180px',
          height: '180px',
          borderRadius: '50%',
          background: `conic-gradient(var(--accent-pink) ${progressPercent}%, rgba(255, 255, 255, 0.08) ${progressPercent}%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 25px rgba(236, 72, 153, 0.25)',
          margin: '12px 0',
        }}
      >
        <div
          style={{
            width: '160px',
            height: '160px',
            borderRadius: '50%',
            background: 'var(--bg-main)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ fontSize: '2.4rem', fontWeight: 800, fontFamily: 'var(--font-family)', color: 'var(--text-primary)' }}>
            {formattedTime}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {pomodoro.isRunning ? 'Focusing...' : 'Paused'}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '12px' }}>
        {pomodoro.isRunning ? (
          <button className="btn-secondary" style={{ padding: '8px 24px' }} onClick={() => dispatch({ type: 'PAUSE_POMODORO' })}>
            ⏸ Pause
          </button>
        ) : (
          <button className="btn-primary" style={{ padding: '8px 24px', background: 'linear-gradient(135deg, var(--accent-pink), var(--accent-violet))' }} onClick={() => dispatch({ type: 'START_POMODORO' })}>
            ▶ Start Focus
          </button>
        )}
        <button className="btn-secondary" onClick={() => dispatch({ type: 'RESET_POMODORO' })}>
          🔄 Reset
        </button>
      </div>
    </div>
  );
};
