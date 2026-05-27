const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { body, param, validationResult } = require('express-validator');
const { getDb, run, getOne, getAll } = require('../db/database');

const router = express.Router();

const VALID_STATUSES = ['pending', 'in_progress', 'on_hold', 'completed', 'cancelled'];

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  next();
};

const taskCreateRules = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 255 }).withMessage('Title must be ≤255 characters'),
  body('description').optional({ nullable: true }).isString().isLength({ max: 2000 }).withMessage('Description must be ≤2000 characters'),
  body('status').optional().isIn(VALID_STATUSES).withMessage(`Status must be one of: ${VALID_STATUSES.join(', ')}`),
  body('due_date').notEmpty().withMessage('Due date is required').isISO8601().withMessage('Due date must be a valid ISO 8601 datetime'),
];

const updateStatusRules = [
  param('id').isUUID().withMessage('Task ID must be a valid UUID'),
  body('status').notEmpty().withMessage('Status is required').isIn(VALID_STATUSES).withMessage(`Status must be one of: ${VALID_STATUSES.join(', ')}`),
];

// GET /api/tasks
router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const tasks = getAll(db, 'SELECT * FROM tasks ORDER BY due_date ASC');
    res.json({ data: tasks, count: tasks.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve tasks', message: err.message });
  }
});

// GET /api/tasks/:id
router.get('/:id',
  param('id').isUUID().withMessage('Task ID must be a valid UUID'),
  handleValidation,
  async (req, res) => {
    try {
      const db = await getDb();
      const task = getOne(db, 'SELECT * FROM tasks WHERE id = ?', [req.params.id]);
      if (!task) return res.status(404).json({ error: 'Task not found' });
      res.json({ data: task });
    } catch (err) {
      res.status(500).json({ error: 'Failed to retrieve task', message: err.message });
    }
  }
);

// POST /api/tasks
router.post('/', taskCreateRules, handleValidation, async (req, res) => {
  try {
    const { title, description = null, status = 'pending', due_date } = req.body;
    const id = uuidv4();
    const now = new Date().toISOString();
    const db = await getDb();

    run(db,
      'INSERT INTO tasks (id, title, description, status, due_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, title.trim(), description, status, due_date, now, now]
    );

    const created = getOne(db, 'SELECT * FROM tasks WHERE id = ?', [id]);
    res.status(201).json({ data: created, message: 'Task created successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create task', message: err.message });
  }
});

// PATCH /api/tasks/:id/status
router.patch('/:id/status', updateStatusRules, handleValidation, async (req, res) => {
  try {
    const { status } = req.body;
    const now = new Date().toISOString();
    const db = await getDb();

    const existing = getOne(db, 'SELECT id FROM tasks WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Task not found' });

    run(db, 'UPDATE tasks SET status = ?, updated_at = ? WHERE id = ?', [status, now, req.params.id]);
    const updated = getOne(db, 'SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    res.json({ data: updated, message: 'Task status updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update task', message: err.message });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id',
  param('id').isUUID().withMessage('Task ID must be a valid UUID'),
  handleValidation,
  async (req, res) => {
    try {
      const db = await getDb();
      const existing = getOne(db, 'SELECT id FROM tasks WHERE id = ?', [req.params.id]);
      if (!existing) return res.status(404).json({ error: 'Task not found' });

      run(db, 'DELETE FROM tasks WHERE id = ?', [req.params.id]);
      res.json({ message: 'Task deleted successfully' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete task', message: err.message });
    }
  }
);

module.exports = router;
