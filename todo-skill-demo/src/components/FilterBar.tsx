import React from 'react';
import { useTodo } from '../context/TodoContext';
import { FilterStatus, Priority, SortOption } from '../types/todo';

export const FilterBar: React.FC = () => {
  const { state, dispatch } = useTodo();

  // Extract unique categories from tasks
  const categories = Array.from(
    new Set(state.tasks.map((t) => t.category).filter(Boolean))
  );

  return (
    <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
      {/* Search Input */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <input
          type="text"
          placeholder="🔍 Search tasks by title, description, or category..."
          value={state.searchQuery}
          onChange={(e) => dispatch({ type: 'SET_SEARCH_QUERY', payload: e.target.value })}
          style={{ flex: 1 }}
        />
        <select
          value={state.sortBy}
          onChange={(e) => dispatch({ type: 'SET_SORT_BY', payload: e.target.value as SortOption })}
          style={{ width: '160px' }}
        >
          <option value="createdAt">Sort: Created Date</option>
          <option value="dueDate">Sort: Due Date</option>
          <option value="priority">Sort: Priority</option>
        </select>
      </div>

      {/* Filter Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        {/* Status Filter Buttons */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {(['all', 'active', 'completed'] as FilterStatus[]).map((status) => (
            <button
              key={status}
              className={`btn-secondary ${state.filterStatus === status ? 'active' : ''}`}
              style={{
                padding: '6px 14px',
                fontSize: '0.85rem',
                textTransform: 'capitalize',
                background: state.filterStatus === status ? 'var(--accent-cyan-glow)' : undefined,
                borderColor: state.filterStatus === status ? 'var(--accent-cyan)' : undefined,
                color: state.filterStatus === status ? 'var(--accent-cyan)' : undefined,
              }}
              onClick={() => dispatch({ type: 'SET_FILTER_STATUS', payload: status })}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Priority & Category Dropdowns */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <select
            value={state.selectedPriority}
            onChange={(e) => dispatch({ type: 'SET_PRIORITY_FILTER', payload: e.target.value as Priority | 'all' })}
            style={{ padding: '6px 12px', fontSize: '0.85rem' }}
          >
            <option value="all">All Priorities</option>
            <option value="high">🔥 High</option>
            <option value="medium">⚡ Medium</option>
            <option value="low">💧 Low</option>
          </select>

          <select
            value={state.selectedCategory}
            onChange={(e) => dispatch({ type: 'SET_CATEGORY_FILTER', payload: e.target.value })}
            style={{ padding: '6px 12px', fontSize: '0.85rem' }}
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                🏷️ {cat}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
