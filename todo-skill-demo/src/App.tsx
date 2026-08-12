import React, { useState } from 'react';
import './App.css';
import { TodoProvider } from './context/TodoContext';
import { TaskForm } from './components/TaskForm';
import { FilterBar } from './components/FilterBar';
import { TaskList } from './components/TaskList';
import { PomodoroTimer } from './components/PomodoroTimer';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';

const MainAppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'tasks' | 'pomodoro' | 'analytics'>('tasks');

  return (
    <>
      <header className="app-header">
        <div className="brand">
          <div className="brand-icon">✓</div>
          <span className="brand-title">Dark Modern Todo</span>
        </div>

        <nav className="nav-tabs">
          <button
            className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
            onClick={() => setActiveTab('tasks')}
          >
            📋 Tasks
          </button>
          <button
            className={`tab-btn ${activeTab === 'pomodoro' ? 'active' : ''}`}
            onClick={() => setActiveTab('pomodoro')}
          >
            🍅 Focus Timer
          </button>
          <button
            className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            📊 Analytics
          </button>
        </nav>
      </header>

      <main className="app-container">
        {activeTab === 'tasks' && (
          <>
            <PomodoroTimer />
            <TaskForm />
            <FilterBar />
            <TaskList />
          </>
        )}

        {activeTab === 'pomodoro' && (
          <div style={{ maxWidth: '600px', margin: '0 auto', width: '100%' }}>
            <PomodoroTimer />
            <div style={{ marginTop: '24px' }}>
              <h3 style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>Current Tasks for Focus Session</h3>
              <TaskList />
            </div>
          </div>
        )}

        {activeTab === 'analytics' && <AnalyticsDashboard />}
      </main>

      <footer className="app-footer">
        Dark Modern Todo App — Built with React + TypeScript & LocalStorage Persistence
      </footer>
    </>
  );
};

function App() {
  return (
    <TodoProvider>
      <MainAppContent />
    </TodoProvider>
  );
}

export default App;
