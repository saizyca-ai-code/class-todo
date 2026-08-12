# 02 — Task State Reducer & LocalStorage Repository

**What to build:** Create TypeScript type definitions for tasks, subtasks, priorities, categories, and pomodoro state, paired with a central `useReducer` state management hook and automatic synchronous `localStorage` persistence layer.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] Define TypeScript models for `Task`, `Subtask`, `Priority`, `Category`, and `PomodoroState`.
- [ ] Create `useLocalStorage` custom hook to read/write state safely to browser `localStorage`.
- [ ] Implement Task Reducer supporting `ADD_TASK`, `UPDATE_TASK`, `DELETE_TASK`, `TOGGLE_TASK`, `ADD_SUBTASK`, `TOGGLE_SUBTASK`, and `DELETE_SUBTASK` actions.
- [ ] Provide React Context provider so components across the app can access state and dispatch actions.
