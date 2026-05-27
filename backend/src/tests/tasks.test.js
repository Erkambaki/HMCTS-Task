const request = require('supertest');
const app = require('../app');
const { closeDb } = require('../db/database');

process.env.NODE_ENV = 'test';

afterAll(() => closeDb());

describe('Health Check', () => {
  it('GET /health returns 200 with ok status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('Tasks API', () => {
  let createdId;

  const validTask = {
    title: 'Review case file',
    description: 'Review all documents in case #12345',
    due_date: '2025-12-31T17:00:00.000Z',
  };

  describe('POST /api/tasks', () => {
    it('creates a task with valid data', async () => {
      const res = await request(app).post('/api/tasks').send(validTask);
      expect(res.status).toBe(201);
      expect(res.body.data).toMatchObject({ title: validTask.title, status: 'pending' });
      expect(res.body.data.id).toBeDefined();
      createdId = res.body.data.id;
    });

    it('returns 400 when title is missing', async () => {
      const res = await request(app).post('/api/tasks').send({ due_date: '2025-12-31T00:00:00Z' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });

    it('returns 400 when due_date is missing', async () => {
      const res = await request(app).post('/api/tasks').send({ title: 'No date' });
      expect(res.status).toBe(400);
    });

    it('returns 400 for invalid due_date format', async () => {
      const res = await request(app).post('/api/tasks').send({ title: 'Bad date', due_date: 'not-a-date' });
      expect(res.status).toBe(400);
    });

    it('returns 400 for invalid status', async () => {
      const res = await request(app).post('/api/tasks').send({ ...validTask, status: 'invalid_status' });
      expect(res.status).toBe(400);
    });

    it('creates a task without optional description', async () => {
      const res = await request(app).post('/api/tasks').send({ title: 'No desc', due_date: '2025-12-31T00:00:00Z' });
      expect(res.status).toBe(201);
      expect(res.body.data.description).toBeNull();
    });
  });

  describe('GET /api/tasks', () => {
    it('returns all tasks', async () => {
      const res = await request(app).get('/api/tasks');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.count).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /api/tasks/:id', () => {
    it('returns a task by ID', async () => {
      const res = await request(app).get(`/api/tasks/${createdId}`);
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(createdId);
    });

    it('returns 404 for a non-existent ID', async () => {
      const res = await request(app).get('/api/tasks/00000000-0000-0000-0000-000000000000');
      expect(res.status).toBe(404);
    });

    it('returns 400 for an invalid UUID', async () => {
      const res = await request(app).get('/api/tasks/not-a-uuid');
      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /api/tasks/:id/status', () => {
    it('updates task status', async () => {
      const res = await request(app).patch(`/api/tasks/${createdId}/status`).send({ status: 'in_progress' });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('in_progress');
    });

    it('returns 400 for an invalid status value', async () => {
      const res = await request(app).patch(`/api/tasks/${createdId}/status`).send({ status: 'done' });
      expect(res.status).toBe(400);
    });

    it('returns 404 for a non-existent task', async () => {
      const res = await request(app).patch('/api/tasks/00000000-0000-0000-0000-000000000000/status').send({ status: 'completed' });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('deletes a task', async () => {
      const res = await request(app).delete(`/api/tasks/${createdId}`);
      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/deleted/i);
    });

    it('returns 404 when deleting an already-deleted task', async () => {
      const res = await request(app).delete(`/api/tasks/${createdId}`);
      expect(res.status).toBe(404);
    });
  });
});
