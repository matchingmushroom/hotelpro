const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

async function request(endpoint, options = {}) {
  const url = `${BACKEND_URL}${endpoint}`;
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  };
  const res = await fetch(url, config);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Backend request failed');
  }
  return res.json();
}

export async function sendEmail({ to, subject, html, type }) {
  return request('/api/email', {
    method: 'POST',
    body: JSON.stringify({ to, subject, html, type }),
  });
}

export async function uploadFile(formData) {
  const res = await fetch(`${BACKEND_URL}/api/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Upload failed');
  return res.json();
}

export async function backupToJson(table, rows) {
  return request('/api/backup', {
    method: 'POST',
    body: JSON.stringify({ table, rows }),
  });
}

export async function getBackupData(table) {
  return request(`/api/backup/${table}`);
}

export async function inviteStaff({ email, password, name, phone, role }) {
  return request('/api/staff/invite', {
    method: 'POST',
    body: JSON.stringify({ email, password, name, phone, role }),
  });
}

export async function updateStaff(id, updates) {
  return request(`/api/staff/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function deleteStaff(id) {
  return request(`/api/staff/${id}`, {
    method: 'DELETE',
  });
}

export async function resetStaffPassword(id, password) {
  return request(`/api/staff/${id}/reset-password`, {
    method: 'PUT',
    body: JSON.stringify({ password }),
  });
}


