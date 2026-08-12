import React from 'react';
import { useTodo } from '../context/TodoContext';
import { TaskItem } from './TaskItem';
import { Task } from '../types/todo';

export const TaskList: React.FC = () => {
  const { state } = useTodo();

  // Filter tasks based on status, category, priority, and search query
  const filteredTasks = state.tasks.filter((task) => {
    // Status filter
    if (state.filterStatus === 'active' && task.completed) return false;
    if (state.filterStatus === 'completed' && !task.completed) return false;

    // Category filter
    if (state.selectedCategory !== 'all' && task.category !== state.selectedCategory) return false;

    // Priority filter
    if (state.selectedPriority !== 'all' && task.priority !== state.selectedPriority) return false;

    // Search query
    if (state.searchQuery.trim()) {
      const q = state.searchQuery.toLowerCase();
      const titleMatch = task.title.toLowerCase().includes(q);
      const descMatch = task.description?.toLowerCase().includes(q);
      const catMatch = task.category.toLowerCase().includes(q);
      if (!titleMatch && !descMatch && !catMatch) return false;
    }

    return true;
  });

  // Sort tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (state.sortBy === 'dueDate') {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    }
    if (state.sortBy === 'priority') {
      const priorityOrder: Record<string, number> = { high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    // Default: createdAt desc
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  if (sortedTasks.length === 0) {
    return (
      <div className="glass-panel empty-state">
        <div className="empty-icon">✨</div>
        <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>No tasks found</h3>
        <p>Try creating a new task or adjusting your filter controls.</p>
      </div>
    );
  }

  return (
    <div className="task-list">
      {sortedTasks.map((task: Task) => (
        <TaskItem key={task.id} task={task} />
      ))}
    </div>
  );
};
