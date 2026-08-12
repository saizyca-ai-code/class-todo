# 06 — Recurring Task Engine

**What to build:** Enable recurring schedule options (Daily, Weekly, Monthly) on task creation. When a recurring task is completed by the user, automatically create the next instance with an updated due date.

**Blocked by:**
- 03 — Basic Task CRUD & List UI

**Status:** ready-for-agent

- [ ] Add Recurrence selector (`None`, `Daily`, `Weekly`, `Monthly`) to task creation and edit options.
- [ ] Display recurrence indicator icon/badge on task cards.
- [ ] Implement completion hook logic: when a recurring task is marked complete, compute the next due date based on the recurrence interval.
- [ ] Create next recurring task instance automatically while keeping historical completed instances intact.
