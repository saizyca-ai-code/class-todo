import React, { useState } from 'react';
import type { Task } from '../types/todo';
import { useTodo } from '../context/TodoContext';

interface TaskItemProps {
  task: Task;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task }) => {
  const { state, dispatch } = useTodo();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description || '');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [showSubtasks, setShowSubtasks] = useState(true);

  const isPomodoroActive = state.pomodoro.activeTaskId === task.id;

  const handleToggleCompleted = () => {
    dispatch({ type: 'TOGGLE_TASK', payload: task.id });
  };

  const handleDelete = () => {
    if (window.confirm(`Delete task "${task.title}"?`)) {
      dispatch({ type: 'DELETE_TASK', payload: task.id });
    }
  };

  const handleSaveEdit = () => {
    if (!editTitle.trim()) return;
    dispatch({
      type: 'UPDATE_TASK',
      payload: {
        id: task.id,
        updates: {
          title: editTitle.trim(),
          description: editDescription.trim() || undefined,
        },
      },
    });
    setIsEditing(false);
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    dispatch({
      type: 'ADD_SUBTASK',
      payload: { taskId: task.id, title: newSubtaskTitle.trim() },
    });
    setNewSubtaskTitle('');
  };

  const completedSubtasksCount = task.subtasks.filter((st) => st.completed).length;
  const totalSubtasksCount = task.subtasks.length;
  const subtaskProgress = totalSubtasksCount > 0 ? (completedSubtasksCount / totalSubtasksCount) * 100 : 0;

  return (
    <div className={`glass-panel task-item-card ${task.completed ? 'completed' : ''}`}>
      <div className="task-header-row">
        <div className="task-left-section">
          <div
            className={`custom-checkbox ${task.completed ? 'checked' : ''}`}
            onClick={handleToggleCompleted}
          />
          <div className="task-info">
            {isEditing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  style={{ width: '100%' }}
                />
                <input
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Description..."
                  style={{ width: '100%' }}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={handleSaveEdit}>
                    Save
                  </button>
                  <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => setIsEditing(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <span className="task-title">{task.title}</span>
                {task.description && <span className="task-description">{task.description}</span>}

                <div className="task-badges">
                  {/* Priority Badge */}
                  <span className={`badge badge-${task.priority}`}>
                    {task.priority === 'high' ? '🔥 High' : task.priority === 'medium' ? '⚡ Medium' : '💧 Low'}
                  </span>

                  {/* Category Tag */}
                  {task.category && <span className="badge badge-tag">🏷️ {task.category}</span>}

                  {/* Due Date */}
                  {task.dueDate && (
                    <span className="badge" style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--text-secondary)' }}>
                      📅 {task.dueDate}
                    </span>
                  )}

                  {/* Recurrence */}
                  {task.recurring !== 'none' && (
                    <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#6ee7b7' }}>
                      🔄 {task.recurring}
                    </span>
                  )}

                  {/* Pomodoro count */}
                  {task.completedPomodoros > 0 && (
                    <span className="badge" style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#f472b6' }}>
                      🍅 {task.completedPomodoros} session ({task.totalFocusMinutes}m)
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="task-actions">
          {/* Pomodoro Bind Button */}
          <button
            className={`btn-icon ${isPomodoroActive ? 'active' : ''}`}
            title="Focus with Pomodoro"
            style={{ color: isPomodoroActive ? 'var(--accent-pink)' : undefined }}
            onClick={() =>
              dispatch({
                type: 'SET_ACTIVE_POMODORO_TASK',
                payload: isPomodoroActive ? null : task.id,
              })
            }
          >
            🍅
          </button>
          <button className="btn-icon" title="Edit" onClick={() => setIsEditing(!isEditing)}>
            ✏️
          </button>
          <button className="btn-icon" title="Delete" onClick={handleDelete}>
            🗑️
          </button>
        </div>
      </div>

      {/* Subtasks Section */}
      <div style={{ marginTop: '8px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <button
            className="btn-icon"
            style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', gap: '4px' }}
            onClick={() => setShowSubtasks(!showSubtasks)}
          >
            {showSubtasks ? '▼' : '►'} Subtasks ({completedSubtasksCount}/{totalSubtasksCount})
          </button>
        </div>

        {totalSubtasksCount > 0 && (
          <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden', marginBottom: '10px' }}>
            <div style={{ width: `${subtaskProgress}%`, height: '100%', background: 'linear-gradient(to right, var(--accent-cyan), var(--accent-violet))', transition: 'width 0.3s ease' }} />
          </div>
        )}

        {showSubtasks && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '8px' }}>
            {task.subtasks.map((subtask) => (
              <div key={subtask.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    className={`custom-checkbox ${subtask.completed ? 'checked' : ''}`}
                    style={{ width: '16px', height: '16px' }}
                    onClick={() => dispatch({ type: 'TOGGLE_SUBTASK', payload: { taskId: task.id, subtaskId: subtask.id } })}
                  />
                  <span style={{ fontSize: '0.9rem', textDecoration: subtask.completed ? 'line-through' : 'none', color: subtask.completed ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                    {subtask.title}
                  </span>
                </div>
                <button
                  className="btn-icon"
                  style={{ fontSize: '0.75rem', padding: '2px' }}
                  onClick={() => dispatch({ type: 'DELETE_SUBTASK', payload: { taskId: task.id, subtaskId: subtask.id } })}
                >
                  ✕
                </button>
              </div>
            ))}

            <form onSubmit={handleAddSubtask} style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              <input
                type="text"
                placeholder="+ Add subtask"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                style={{ flex: 1, padding: '4px 10px', fontSize: '0.85rem' }}
              />
              <button type="submit" className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.8rem' }} disabled={!newSubtaskTitle.trim()}>
                Add
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
