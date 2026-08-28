const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, '');
  }
  const host = window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname;
  return `http://${host}:5001/api`;
};

const API_URL = getApiUrl();

/**
 * Perform an API request.
 * Automatically injects the JWT token from localStorage.
 */
const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const config = {
    method: options.method || 'GET',
    headers,
    ...options,
  };

  if (options.body) {
    config.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error.message);
    throw error;
  }
};

export const authService = {
  login: (email, password) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: { email, password },
    }),
  register: (name, email, password, role, extraFields = {}) =>
    apiRequest('/auth/register', {
      method: 'POST',
      body: { name, email, password, role, ...extraFields },
    }),
  getMe: () => apiRequest('/auth/me'),
  updatePass: (planName, amount, route) =>
    apiRequest('/auth/me/pass', {
      method: 'PUT',
      body: { planName, amount, route },
    }),
};

export const busService = {
  getBuses: () => apiRequest('/buses'),
  getBus: (id) => apiRequest(`/buses/${id}`),
  getMyBus: () => apiRequest('/buses/employee/mybus'),
  createBus: (busData) =>
    apiRequest('/buses', {
      method: 'POST',
      body: busData,
    }),
  updateBus: (id, busData) =>
    apiRequest(`/buses/${id}`, {
      method: 'PUT',
      body: busData,
    }),
  deleteBus: (id) =>
    apiRequest(`/buses/${id}`, {
      method: 'DELETE',
    }),
};

export const routeService = {
  getRoutes: () => apiRequest('/routes'),
  getRoute: (id) => apiRequest(`/routes/${id}`),
  createRoute: (routeData) =>
    apiRequest('/routes', {
      method: 'POST',
      body: routeData,
    }),
  updateRoute: (id, routeData) =>
    apiRequest(`/routes/${id}`, {
      method: 'PUT',
      body: routeData,
    }),
  deleteRoute: (id) =>
    apiRequest(`/routes/${id}`, {
      method: 'DELETE',
    }),
};

export const employeeService = {
  getEmployees: () => apiRequest('/employees'),
  getAvailableEmployees: () => apiRequest('/employees/available'),
  createEmployee: (empData) =>
    apiRequest('/employees', {
      method: 'POST',
      body: empData,
    }),
};

export const aiService = {
  chat: (message, history = []) =>
    apiRequest('/ai/chat', {
      method: 'POST',
      body: { message, history },
    }),
};
