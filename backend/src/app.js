const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const tasksRouter = require('./routes/tasks');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === 'test' ? 'silent' : 'dev'));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// API docs summary
app.get('/api', (req, res) => res.json({
  name: 'HMCTS Task Management API',
  version: '1.0.0',
  endpoints: [
    { method: 'GET',    path: '/api/tasks',           description: 'Retrieve all tasks' },
    { method: 'GET',    path: '/api/tasks/:id',        description: 'Retrieve a task by ID' },
    { method: 'POST',   path: '/api/tasks',            description: 'Create a new task' },
    { method: 'PATCH',  path: '/api/tasks/:id/status', description: 'Update task status' },
    { method: 'DELETE', path: '/api/tasks/:id',        description: 'Delete a task' },
  ],
}));

app.use('/api/tasks', tasksRouter);
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3001;

if (require.main === module) {
  app.listen(PORT, () => console.log(`HMCTS Tasks API running on http://localhost:${PORT}`));
}

module.exports = app;
