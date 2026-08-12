import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { TodoState, TodoAction, Task } from '../types/todo';

const STORAGE_KEY = 'class_todo_app_data_v1';

const initialPomodoro = {
  activeTaskId: null,
  mode: 'work' as const,
  durationMinutes: 25,
  secondsRemaining: 25 * 60,
  isRunning: false,
};

const defaultInitialState: TodoState = {
  tasks: [
    {
      id: 'demo-1',
      title: 'Welcome to your Dark Modern Todo App!',
      description: 'Explore subtasks, priority tags, recurring events, and integrated Pomodoro timer.',
      completed: false,
      priority: 'high',
      category: 'Work',
      dueDate: new Date().toISOString().split('T')[0],
      subtasks: [
        { id: 'sub-1', title: 'Try creating a new task', completed: false },
        { id: 'sub-2', title: 'Start a Pomodoro focus timer', completed: false },
      ],
      recurring: 'none',
      completedPomodoros: 0,
      totalFocusMinutes: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  filterStatus: 'all',
  selectedCategory: 'all',
  selectedPriority: 'all',
  searchQuery: '',
  sortBy: 'createdAt',
  pomodoro: initialPomodoro,
};

function getStoredState(): TodoState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...defaultInitialState,
        ...parsed,
        pomodoro: {
          ...initialPomodoro,
          ...(parsed.pomodoro || {}),
          isRunning: false, // reset running status on load
        },
      };
    }
  } catch (e) {
    console.error('Failed to load tasks from localStorage', e);
  }
  return defaultInitialState;
}

function calculateNextDueDate(currentDueDate?: string, recurrence: 'daily' | 'weekly' | 'monthly' = 'daily'): string {
  const baseDate = currentDueDate ? new Date(currentDueDate) : new Date();
  if (isNaN(baseDate.getTime())) {
    const fallback = new Date();
    fallback.setDate(fallback.getDate() + 1);
    return fallback.toISOString().split('T')[0];
  }
  
  if (recurrence === 'daily') {
    baseDate.setDate(baseDate.getDate() + 1);
  } else if (recurrence === 'weekly') {
    baseDate.setDate(baseDate.getDate() + 7);
  } else if (recurrence === 'monthly') {
    baseDate.setMonth(baseDate.getMonth() + 1);
  }
  return baseDate.toISOString().split('T')[0];
}

function todoReducer(state: TodoState, action: TodoAction): TodoState {
  switch (action.type) {
    case 'ADD_TASK': {
      const newTask: Task = {
        id: 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        title: action.payload.title,
        description: action.payload.description || '',
        completed: false,
        priority: action.payload.priority || 'medium',
        category: action.payload.category || 'General',
        dueDate: action.payload.dueDate,
        subtasks: [],
        recurring: action.payload.recurring || 'none',
        completedPomodoros: 0,
        totalFocusMinutes: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return { ...state, tasks: [newTask, ...state.tasks] };
    }

    case 'UPDATE_TASK': {
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.payload.id
            ? { ...task, ...action.payload.updates, updatedAt: new Date().toISOString() }
            : task
        ),
      };
    }

    case 'DELETE_TASK': {
      return {
        ...state,
        tasks: state.tasks.filter((task) => task.id !== action.payload),
        pomodoro: state.pomodoro.activeTaskId === action.payload
          ? { ...state.pomodoro, activeTaskId: null, isRunning: false }
          : state.pomodoro,
      };
    }

    case 'TOGGLE_TASK': {
      const now = new Date().toISOString();
      const updatedTasks: Task[] = [];

      for (const task of state.tasks) {
        if (task.id === action.payload) {
          const willBeCompleted = !task.completed;
          const updated = { ...task, completed: willBeCompleted, updatedAt: now };
          updatedTasks.push(updated);

          // Recurring Task Engine trigger
          if (willBeCompleted && task.recurring !== 'none') {
            const nextDueDate = calculateNextDueDate(task.dueDate, task.recurring);
            const nextInstance: Task = {
              ...task,
              id: 'task_' + Date.now() + '_recur',
              completed: false,
              dueDate: nextDueDate,
              subtasks: task.subtasks.map((st) => ({ ...st, completed: false })),
              createdAt: now,
              updatedAt: now,
            };
            updatedTasks.push(nextInstance);
          }
        } else {
          updatedTasks.push(task);
        }
      }
      return { ...state, tasks: updatedTasks };
    }

    case 'ADD_SUBTASK': {
      return {
        ...state,
        tasks: state.tasks.map((task) => {
          if (task.id !== action.payload.taskId) return task;
          const newSubtask = {
            id: 'sub_' + Date.now(),
            title: action.payload.title,
            completed: false,
          };
          return {
            ...task,
            subtasks: [...task.subtasks, newSubtask],
            updatedAt: new Date().toISOString(),
          };
        }),
      };
    }

    case 'TOGGLE_SUBTASK': {
      return {
        ...state,
        tasks: state.tasks.map((task) => {
          if (task.id !== action.payload.taskId) return task;
          return {
            ...task,
            subtasks: task.subtasks.map((st) =>
              st.id === action.payload.subtaskId ? { ...st, completed: !st.completed } : st
            ),
            updatedAt: new Date().toISOString(),
          };
        }),
      };
    }

    case 'DELETE_SUBTASK': {
      return {
        ...state,
        tasks: state.tasks.map((task) => {
          if (task.id !== action.payload.taskId) return task;
          return {
            ...task,
            subtasks: task.subtasks.filter((st) => st.id !== action.payload.subtaskId),
            updatedAt: new Date().toISOString(),
          };
        }),
      };
    }

    case 'SET_FILTER_STATUS':
      return { ...state, filterStatus: action.payload };

    case 'SET_CATEGORY_FILTER':
      return { ...state, selectedCategory: action.payload };

    case 'SET_PRIORITY_FILTER':
      return { ...state, selectedPriority: action.payload };

    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };

    case 'SET_SORT_BY':
      return { ...state, sortBy: action.payload };

    case 'SET_ACTIVE_POMODORO_TASK':
      return {
        ...state,
        pomodoro: {
          ...state.pomodoro,
          activeTaskId: action.payload,
          secondsRemaining: state.pomodoro.durationMinutes * 60,
          isRunning: false,
        },
      };

    case 'START_POMODORO':
      return { ...state, pomodoro: { ...state.pomodoro, isRunning: true } };

    case 'PAUSE_POMODORO':
      return { ...state, pomodoro: { ...state.pomodoro, isRunning: false } };

    case 'RESET_POMODORO':
      return {
        ...state,
        pomodoro: {
          ...state.pomodoro,
          isRunning: false,
          secondsRemaining: state.pomodoro.durationMinutes * 60,
        },
      };

    case 'TICK_POMODORO': {
      if (state.pomodoro.secondsRemaining <= 1) {
        // Complete session
        const activeId = state.pomodoro.activeTaskId;
        const updatedTasks = state.tasks.map((t) => {
          if (t.id === activeId) {
            return {
              ...t,
              completedPomodoros: t.completedPomodoros + 1,
              totalFocusMinutes: t.totalFocusMinutes + state.pomodoro.durationMinutes,
            };
          }
          return t;
        });

        return {
          ...state,
          tasks: updatedTasks,
          pomodoro: {
            ...state.pomodoro,
            isRunning: false,
            secondsRemaining: state.pomodoro.durationMinutes * 60,
          },
        };
      }
      return {
        ...state,
        pomodoro: {
          ...state.pomodoro,
          secondsRemaining: state.pomodoro.secondsRemaining - 1,
        },
      };
    }

    default:
      return state;
  }
}

interface TodoContextType {
  state: TodoState;
  dispatch: React.Dispatch<TodoAction>;
}

const TodoContext = createContext<TodoContextType | undefined>(undefined);

export const TodoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(todoReducer, undefined, getStoredState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save tasks to localStorage', e);
    }
  }, [state]);

  return <TodoContext.Provider value={{ state, dispatch }}>{children}</TodoContext.Provider>;
};

export const useTodo = (): TodoContextType => {
  const context = useContext(TodoContext);
  if (!context) {
    throw new Error('useTodo must be used within a TodoProvider');
  }
  return context;
};
