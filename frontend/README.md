# HMCTS Task Management – Frontend

A React-based frontend for the HMCTS Task Management system.

## Prerequisites

- Node.js ≥ 18
- The [backend API](../backend) running on `http://localhost:3001`

## Getting Started

```bash
npm install
npm start
# → http://localhost:3000
```

## Environment Variables

Create a `.env` file to override the default API URL:

```
REACT_APP_API_URL=http://localhost:3001/api
```

## Features

- **View all tasks** with status filter tabs (All, Pending, In Progress, On Hold, Completed, Cancelled)
- **Create tasks** via a modal form with client-side validation
- **Update status** directly from each task card
- **Delete tasks** with a confirmation prompt
- **Task detail view** — click any task title to see full details
- **Overdue indicators** — tasks past their due date are highlighted
- **Summary stats** in the sidebar (total, overdue, completed)
- **Toast notifications** for all actions
- **Responsive** — works on mobile

## Project Structure

```
frontend/
├── public/
│   └── index.html
└── src/
    ├── App.js        # Main application component
    ├── App.css       # All styles
    ├── api.js        # API client (fetch wrapper)
    └── index.js      # React entry point
```
