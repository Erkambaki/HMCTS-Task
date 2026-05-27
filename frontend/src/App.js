import React, { useState, useEffect, useCallback } from 'react';
import * as api from './api';
import './App.css';

const STATUSES = ['pending', 'in_progress', 'on_hold', 'completed', 'cancelled'];
const STATUS_LABELS = {
  pending: 'Pending',
  in_progress: 'In Progress',
  on_hold: 'On Hold',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function isOverdue(due_date, status) {
  if (status === 'completed' || status === 'cancelled') return false;
  return new Date(due_date) < new Date();
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

// ── Task Form ─────────────────────────────────────────────────────────────────
function TaskForm({ onSubmit, loading }) {
  const [form, setForm] = useState({ title: '', description: '', status: 'pending', due_date: '' });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    else if (form.title.length > 255) e.title = 'Title must be ≤255 characters';
    if (!form.due_date) e.due_date = 'Due date is required';
    if (form.description.length > 2000) e.description = 'Description must be ≤2000 characters';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    await onSubmit({
      title: form.title.trim(),
      description: form.description || null,
      status: form.status,
      due_date: new Date(form.due_date).toISOString(),
    });
    setForm({ title: '', description: '', status: 'pending', due_date: '' });
    setErrors({});
  };

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label htmlFor="title">Title <span className="required">*</span></label>
        <input id="title" type="text" value={form.title} onChange={set('title')} maxLength={255} placeholder="e.g. Review case documents" />
        {errors.title && <span className="field-error">{errors.title}</span>}
      </div>
      <div className="field">
        <label htmlFor="description">Description</label>
        <textarea id="description" value={form.description} onChange={set('description')} rows={3} maxLength={2000} placeholder="Optional details…" />
        {errors.description && <span className="field-error">{errors.description}</span>}
      </div>
      <div className="field-row">
        <div className="field">
          <label htmlFor="status">Status</label>
          <select id="status" value={form.status} onChange={set('status')}>
            {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="due_date">Due Date &amp; Time <span className="required">*</span></label>
          <input id="due_date" type="datetime-local" value={form.due_date} onChange={set('due_date')} />
          {errors.due_date && <span className="field-error">{errors.due_date}</span>}
        </div>
      </div>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Creating…' : 'Create Task'}
        </button>
      </div>
    </form>
  );
}

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{STATUS_LABELS[status]}</span>;
}

// ── Task Card ─────────────────────────────────────────────────────────────────
function TaskCard({ task, onStatusChange, onDelete, onSelect }) {
  const overdue = isOverdue(task.due_date, task.status);
  return (
    <article className={`task-card ${overdue ? 'task-card--overdue' : ''}`}>
      <div className="task-card__header">
        <button className="task-card__title-btn" onClick={() => onSelect(task)}>
          <h3 className="task-card__title">{task.title}</h3>
        </button>
        <StatusBadge status={task.status} />
      </div>
      {task.description && <p className="task-card__desc">{task.description}</p>}
      <div className="task-card__footer">
        <div className="task-card__meta">
          <span className={`task-card__due ${overdue ? 'overdue' : ''}`}>
            {overdue ? '⚠ Overdue · ' : '🗓 '}
            {formatDate(task.due_date)}
          </span>
        </div>
        <div className="task-card__actions">
          <select
            className="status-select"
            value={task.status}
            onChange={e => onStatusChange(task.id, e.target.value)}
            aria-label="Update status"
          >
            {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
          <button className="btn btn-danger btn-sm" onClick={() => onDelete(task.id)} aria-label="Delete task">
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}

// ── Filter Bar ────────────────────────────────────────────────────────────────
function FilterBar({ filter, setFilter, counts }) {
  const tabs = [{ key: 'all', label: 'All' }, ...STATUSES.map(s => ({ key: s, label: STATUS_LABELS[s] }))];
  return (
    <div className="filter-bar" role="tablist">
      {tabs.map(t => (
        <button
          key={t.key}
          role="tab"
          aria-selected={filter === t.key}
          className={`filter-tab ${filter === t.key ? 'filter-tab--active' : ''}`}
          onClick={() => setFilter(t.key)}
        >
          {t.label}
          {counts[t.key] !== undefined && <span className="filter-count">{counts[t.key]}</span>}
        </button>
      ))}
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getTasks();
      setTasks(res.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (data) => {
    setCreating(true);
    try {
      await api.createTask(data);
      await load();
      setShowForm(false);
      showToast('Task created successfully');
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.updateStatus(id, status);
      setTasks(ts => ts.map(t => t.id === id ? { ...t, status } : t));
      if (selectedTask?.id === id) setSelectedTask(t => ({ ...t, status }));
      showToast('Status updated');
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const handleDelete = (id) => setConfirmDelete(id);

  const confirmDeleteFn = async () => {
    try {
      await api.deleteTask(confirmDelete);
      setTasks(ts => ts.filter(t => t.id !== confirmDelete));
      setConfirmDelete(null);
      if (selectedTask?.id === confirmDelete) setSelectedTask(null);
      showToast('Task deleted');
    } catch (e) {
      showToast(e.message, 'error');
      setConfirmDelete(null);
    }
  };

  const counts = { all: tasks.length };
  STATUSES.forEach(s => { counts[s] = tasks.filter(t => t.status === s).length; });

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);
  const overdueCount = tasks.filter(t => isOverdue(t.due_date, t.status)).length;

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar__brand">
          <div className="brand-crest">⚖</div>
          <div>
            <div className="brand-name">HMCTS</div>
            <div className="brand-sub">Task Manager</div>
          </div>
        </div>
        <div className="sidebar__stats">
          <div className="stat-card">
            <div className="stat-num">{tasks.length}</div>
            <div className="stat-label">Total Tasks</div>
          </div>
          <div className="stat-card">
            <div className="stat-num stat-num--warn">{overdueCount}</div>
            <div className="stat-label">Overdue</div>
          </div>
          <div className="stat-card">
            <div className="stat-num stat-num--good">{counts.completed || 0}</div>
            <div className="stat-label">Completed</div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="main">
        <header className="page-header">
          <div>
            <h1 className="page-title">Caseworker Tasks</h1>
            <p className="page-subtitle">Manage and track your caseload</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            + New Task
          </button>
        </header>

        <FilterBar filter={filter} setFilter={setFilter} counts={counts} />

        {loading && <div className="state-msg">Loading tasks…</div>}
        {error && <div className="state-msg state-msg--error">Error: {error} <button className="btn btn-sm" onClick={load}>Retry</button></div>}

        {!loading && !error && filtered.length === 0 && (
          <div className="state-msg state-msg--empty">
            {filter === 'all' ? 'No tasks yet. Create your first task above.' : `No tasks with status "${STATUS_LABELS[filter]}".`}
          </div>
        )}

        <div className="task-grid">
          {filtered.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
              onSelect={setSelectedTask}
            />
          ))}
        </div>
      </main>

      {/* New Task Modal */}
      {showForm && (
        <Modal title="Create New Task" onClose={() => setShowForm(false)}>
          <TaskForm onSubmit={handleCreate} loading={creating} />
        </Modal>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <Modal title="Task Details" onClose={() => setSelectedTask(null)}>
          <div className="task-detail">
            <div className="task-detail__row">
              <span className="task-detail__label">Title</span>
              <span className="task-detail__value">{selectedTask.title}</span>
            </div>
            <div className="task-detail__row">
              <span className="task-detail__label">Status</span>
              <StatusBadge status={selectedTask.status} />
            </div>
            <div className="task-detail__row">
              <span className="task-detail__label">Due</span>
              <span className={`task-detail__value ${isOverdue(selectedTask.due_date, selectedTask.status) ? 'overdue' : ''}`}>
                {formatDate(selectedTask.due_date)}
              </span>
            </div>
            {selectedTask.description && (
              <div className="task-detail__row task-detail__row--col">
                <span className="task-detail__label">Description</span>
                <p className="task-detail__desc">{selectedTask.description}</p>
              </div>
            )}
            <div className="task-detail__row">
              <span className="task-detail__label">Created</span>
              <span className="task-detail__value">{formatDate(selectedTask.created_at)}</span>
            </div>
            <div className="task-detail__row">
              <span className="task-detail__label">Updated</span>
              <span className="task-detail__value">{formatDate(selectedTask.updated_at)}</span>
            </div>
            <div className="task-detail__row">
              <span className="task-detail__label">ID</span>
              <span className="task-detail__value task-detail__id">{selectedTask.id}</span>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <Modal title="Delete Task" onClose={() => setConfirmDelete(null)}>
          <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
            Are you sure you want to delete this task? This action cannot be undone.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={() => setConfirmDelete(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={confirmDeleteFn}>Delete Task</button>
          </div>
        </Modal>
      )}

      {/* Toast */}
      {toast && (
        <div className={`toast toast--${toast.type}`} role="alert">{toast.msg}</div>
      )}
    </div>
  );
}
