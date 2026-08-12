export type Priority = 'high' | 'medium' | 'low';

export type RecurrencePattern = 'none' | 'daily' | 'weekly' | 'monthly';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: Priority;
  category: string;
  dueDate?: string; // ISO date string (YYYY-MM-DD)
  subtasks: Subtask[];
  recurring: RecurrencePattern;
  completedPomodoros: number;
  totalFocusMinutes: number;
  createdAt: string;
  updatedAt: string;
}

export type FilterStatus = 'all' | 'active' | 'completed';
export type SortOption = 'dueDate' | 'priority' | 'createdAt';

export interface PomodoroState {
  activeTaskId: string | null;
  mode: 'work' | 'shortBreak' | 'longBreak';
  durationMinutes: number;
  secondsRemaining: number;
  isRunning: boolean;
}

export interface TodoState {
  tasks: Task[];
  filterStatus: FilterStatus;
  selectedCategory: string;
  selectedPriority: Priority | 'all';
  searchQuery: string;
  sortBy: SortOption;
  pomodoro: PomodoroState;
}

export type TodoAction =
  | { type: 'ADD_TASK'; payload: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'completed' | 'subtasks' | 'completedPomodoros' | 'totalFocusMinutes'> }
  | { type: 'UPDATE_TASK'; payload: { id: string; updates: Partial<Task> } }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'TOGGLE_TASK'; payload: string }
  | { type: 'ADD_SUBTASK'; payload: { taskId: string; title: string } }
  | { type: 'TOGGLE_SUBTASK'; payload: { taskId: string; subtaskId: string } }
  | { type: 'DELETE_SUBTASK'; payload: { taskId: string; subtaskId: string } }
  | { type: 'SET_FILTER_STATUS'; payload: FilterStatus }
  | { type: 'SET_CATEGORY_FILTER'; payload: string }
  | { type: 'SET_PRIORITY_FILTER'; payload: Priority | 'all' }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_SORT_BY'; payload: SortOption }
  | { type: 'SET_ACTIVE_POMODORO_TASK'; payload: string | null }
  | { type: 'START_POMODORO' }
  | { type: 'PAUSE_POMODORO' }
  | { type: 'RESET_POMODORO' }
  | { type: 'TICK_POMODORO' }
  | { type: 'COMPLETE_POMODORO_SESSION' };
