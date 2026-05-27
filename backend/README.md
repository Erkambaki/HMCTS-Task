# HMCTS Task Management – Backend API

A RESTful API for managing caseworker tasks, built with **Node.js**, **Express**, and **SQLite** (via sql.js).

## Getting Started

### Prerequisites
- Node.js ≥ 18

### Installation

```bash
npm install
```

### Run (development)

```bash
npm run dev
# → http://localhost:3001
```

### Run (production)

```bash
npm start
```

### Run Tests

```bash
npm test
```

---

## API Endpoints

Base URL: `http://localhost:3001/api`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api` | API info and endpoint list |
| `GET` | `/health` | Health check |
| `GET` | `/api/tasks` | Retrieve all tasks |
| `GET` | `/api/tasks/:id` | Retrieve a task by ID |
| `POST` | `/api/tasks` | Create a new task |
| `PATCH` | `/api/tasks/:id/status` | Update a task's status |
| `DELETE` | `/api/tasks/:id` | Delete a task |

---

### `POST /api/tasks` — Create a Task

**Request Body**

```json
{
  "title": "Review case documents",
  "description": "Optional — review all files for case #12345",
  "status": "pending",
  "due_date": "2025-12-31T17:00:00.000Z"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `title` | string | ✅ | Max 255 characters |
| `description` | string | ❌ | Max 2000 characters |
| `status` | string | ❌ | Defaults to `pending`. See valid values below. |
| `due_date` | string (ISO 8601) | ✅ | e.g. `2025-12-31T17:00:00.000Z` |

**Valid status values:** `pending`, `in_progress`, `on_hold`, `completed`, `cancelled`

**Response (201)**

```json
{
  "data": {
    "id": "uuid-v4",
    "title": "Review case documents",
    "description": "...",
    "status": "pending",
    "due_date": "2025-12-31T17:00:00.000Z",
    "created_at": "2025-05-01T10:00:00.000Z",
    "updated_at": "2025-05-01T10:00:00.000Z"
  },
  "message": "Task created successfully"
}
```

---

### `GET /api/tasks` — Get All Tasks

Returns all tasks ordered by `due_date` ascending.

**Response (200)**

```json
{
  "data": [ { ...task }, ... ],
  "count": 5
}
```

---

### `GET /api/tasks/:id` — Get Task by ID

**Response (200)**

```json
{ "data": { ...task } }
```

**Response (404)** — Task not found  
**Response (400)** — Invalid UUID format

---

### `PATCH /api/tasks/:id/status` — Update Status

**Request Body**

```json
{ "status": "completed" }
```

**Response (200)** — Returns updated task  
**Response (400)** — Invalid status value  
**Response (404)** — Task not found

---

### `DELETE /api/tasks/:id` — Delete Task

**Response (200)**

```json
{ "message": "Task deleted successfully" }
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Short error message",
  "details": [ { "field": "title", "msg": "Title is required" } ]
}
```

HTTP status codes used: `200`, `201`, `400`, `404`, `500`

---

## Project Structure

```
backend/
├── src/
│   ├── app.js              # Express app entry point
│   ├── routes/
│   │   └── tasks.js        # Task route handlers & validation
│   ├── db/
│   │   └── database.js     # SQLite (sql.js) database layer
│   ├── middleware/
│   │   └── errorHandler.js # 404 + global error handler
│   └── tests/
│       └── tasks.test.js   # Jest + Supertest integration tests
└── data/
    └── tasks.db            # SQLite database file (auto-created)
```
