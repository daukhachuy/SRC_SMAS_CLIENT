const API_BASE_URL = window.__API_BASE_URL__ || 'https://smas-api-hrapc0b0f3gsb2e7.eastasia-01.azurewebsites.net/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  const text = await response.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    const error = new Error(data?.message || `Request failed: ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export async function testLogin(email, password) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
}

export async function testReservationCreate(payload) {
  return request('/reservation/create', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

const apiTest = {
  testLogin,
  testReservationCreate
};

window.apiTest = apiTest;

export default apiTest;
