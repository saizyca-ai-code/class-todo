import React, { useState } from 'react';
import { useTodo } from '../context/TodoContext';
import { Priority, RecurrencePattern } from '../types/todo';

export const TaskForm: React.FC = () => {
  const { dispatch } = useTodo();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [category, setCategory] = useState('Work');
  const [dueDate, setDueDate] = useState('');
  const [recurring, setRecurring] = useState<RecurrencePattern>('none');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    dispatch({
      type: 'ADD_TASK',
      payload: {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        category: category.trim() || 'General',
        dueDate: dueDate || undefined,
        recurring,
      },
    });

    setTitle('');
    setDescription('');
    setDueDate('');
    setIsExpanded(false);
  };

  return (
    <form className="glass-panel task-form-card" onSubmit={handleSubmit}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="+ Add a new task..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => setIsExpanded(true)}
          style={{ flex: 1, fontSize: '1rem', fontWeight: 500 }}
        />
        <button type="submit" className="btn-primary" disabled={!title.trim()}>
          Add Task
        </button>
      </div>

      {isExpanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '4px' }}>
          <input
            type="text"
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="form-row">
            <div className="form-group">
              <label>Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
                <option value="high">🔥 High</option>
                <option value="medium">⚡ Medium</option>
                <option value="low">💧 Low</option>
              </select>
            </div>

            <div className="form-group">
              <label>Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Work, Personal"
              />
            </div>

            <div className="form-group">
              <label>Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Recurrence</label>
              <select value={recurring} onChange={(e) => setRecurring(e.target.value as RecurrencePattern)}>
                <option value="none">One-time</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};
