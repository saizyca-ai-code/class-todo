# Todo App Specification (SPEC)

## Problem Statement

Users need a powerful, privacy-focused, and visually captivating task management tool to organize daily activities, track subtasks, stay focused using a Pomodoro timer, and view personal productivity analytics without friction, mandatory accounts, or external dependencies.

## Solution

A single-page React + TypeScript web application (`todo-skill-demo`) operating completely client-side. The app leverages `localStorage` for instant local data persistence, featuring a Modern Dark & Vibrant design system. It seamlessly integrates task management (with priorities, categories, and subtasks), recurring task logic, an integrated Pomodoro timer, and visual analytics dashboards.

---

## User Stories

### Task & Subtask Management
1. As a user, I want to create a new task with a title, description, category, priority, and due date, so that I can capture my work items accurately.
2. As a user, I want to edit existing tasks, so that I can update details as my plans change.
3. As a user, I want to delete a task, so that I can remove items I no longer need to complete.
4. As a user, I want to toggle a task as completed or incomplete, so that I can track my progress.
5. As a user, I want to add subtasks to any main task, so that I can break complex goals into actionable micro-steps.
6. As a user, I want to check off individual subtasks, so that I can see incremental progress on larger tasks.
7. As a user, I want to set priority levels (High, Medium, Low) for tasks, so that I can focus on urgent matters first.
8. As a user, I want to assign custom categories/tags (e.g., Work, Personal, Study) to tasks, so that I can group related items together.

### Recurring Tasks
9. As a user, I want to configure a task to repeat on a recurring schedule (Daily, Weekly, Monthly), so that repetitive routines automatically recreate themselves upon completion.

### Integrated Pomodoro Timer
10. As a user, I want to start a 25-minute Pomodoro focus timer associated with a specific task, so that I can execute deep focus work.
11. As a user, I want to pause, resume, or reset the Pomodoro timer, so that I can adjust to unexpected interruptions.
12. As a user, I want completed Pomodoro sessions to accumulate focus time logged against the selected task, so that I can track time spent on activities.
13. As a user, I want audio/visual in-app visual indicators when a Pomodoro timer completes, so that I know when to take a break without requiring OS push notifications.

### Search, Filter & Organization
14. As a user, I want to filter tasks by category, priority, and completion status (All, Active, Completed), so that I can view specific subsets of my work.
15. As a user, I want to search tasks by keyword, so that I can quickly locate specific items.
16. As a user, I want to sort tasks by due date or priority, so that I can organize my workflow logically.

### Statistics & Productivity Analytics
17. As a user, I want to view a visual dashboard displaying completed vs. pending tasks, completion rate, and total focus time, so that I can evaluate my productivity over time.

### Visual Experience & Data Persistence
18. As a user, I want a modern dark-mode aesthetic with vibrant accent colors and smooth micro-animations, so that using the application feels engaging and premium.
19. As a user, I want my data to automatically save in my browser (`localStorage`), so that my tasks remain intact across browser sessions without creating an account.

---

## Implementation Decisions

### Tech Stack & Architecture
- **Framework**: React 18+ with TypeScript via Vite.
- **Styling System**: CSS Modules / Vanilla CSS design system using CSS Custom Properties (`:root` variables) for dark theme palette, glassmorphism shadows, glowing borders, and animations.
- **State Management**: React `useReducer` + Context API for central task state management, coupled with a custom hook (`useLocalStorage`) for automatic synchronous persistence.

### Data Model Schema (Pure In-Memory / LocalStorage)
- **Task Entity**:
  - `id`: string (UUID)
  - `title`: string
  - `description`: string (optional)
  - `completed`: boolean
  - `priority`: `'high' | 'medium' | 'low'`
  - `category`: string
  - `dueDate`: string (ISO date string)
  - `subtasks`: Array of `{ id: string, title: string, completed: boolean }`
  - `recurring`: `'none' | 'daily' | 'weekly' | 'monthly'`
  - `completedPomodoros`: number
  - `createdAt`: string
  - `updatedAt`: string

- **Pomodoro Entity**:
  - `activeTaskId`: string | null
  - `durationMinutes`: number (default 25)
  - `secondsRemaining`: number
  - `isRunning`: boolean
  - `mode`: `'work' | 'shortBreak' | 'longBreak'`

### High-Level Seams
1. **`TaskRepositorySeam`**: Encapsulates persistence read/write logic to `localStorage`. Components interact via context hooks, allowing unit testing without actual storage dependency.
2. **`PomodoroTimerSeam`**: Encapsulates interval timer clock and state transitions, isolated from the UI render layer.

---

## Testing Decisions

### Test Strategy
- **Behavior-Focused Testing**: Tests will verify end-to-end user behaviors (creating tasks, checking subtasks, timer tick calculations) rather than internal component lifecycle hooks.
- **Unit & Integration Boundaries**:
  - Task state reducer logic (pure functions for CRUD, subtasks, recurring triggers, filters).
  - Storage serialization and fallback handling.
  - Timer reducer tick and session completion logic.

---

## Out of Scope

The following features are **explicitly excluded** as requested:
- ❌ **User Authentication & Login**: No user sign-up, sign-in, OAuth, or session tokens.
- ❌ **Database Integration**: No backend databases (PostgreSQL, MongoDB, Firebase, Supabase, etc.).
- ❌ **Data Synchronization**: No cloud sync across devices or browser tabs sync.
- ❌ **Sharing & Collaboration**: No task sharing, multi-user assignment, or exported public links.
- ❌ **System/Push Notifications**: No web browser push notifications or native OS notifications. All timer alerts are strictly in-app visual and sound cues.

---

## Further Notes

- All state and user data remain 100% private to the local user's browser storage.
- Design tokens prioritize dark backgrounds (`#0f172a`, `#1e293b`), vibrant cyan/violet accents (`#06b6d4`, `#8b5cf6`), and smooth hover/active micro-interactions.
