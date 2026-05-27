const BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export const getTasks    = ()          => request('/tasks');
export const getTask     = (id)        => request(`/tasks/${id}`);
export const createTask  = (body)      => request('/tasks', { method: 'POST', body: JSON.stringify(body) });
export const updateStatus = (id, status) => request(`/tasks/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
export const deleteTask  = (id)        => request(`/tasks/${id}`, { method: 'DELETE' });
