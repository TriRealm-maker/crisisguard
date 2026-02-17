const API_BASE = '/api';

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const api = {
  auth: {
    register: async (email: string, password: string, name: string) => {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      return res.json();
    },
    login: async (email: string, password: string) => {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      return res.json();
    },
    me: async () => {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: getAuthHeaders(),
      });
      return res.json();
    },
  },

  weather: {
    get: async (lat: number, lng: number) => {
      const res = await fetch(`${API_BASE}/weather?lat=${lat}&lng=${lng}`);
      return res.json();
    },
  },

  places: {
    getNearby: async (lat: number, lng: number, radius?: number) => {
      const params = new URLSearchParams({ lat: lat.toString(), lng: lng.toString() });
      if (radius) params.append('radius', radius.toString());
      const res = await fetch(`${API_BASE}/places?${params}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || errorData.error || 'Failed to fetch places');
      }
      return res.json();
    },
  },

  prediction: {
    get: async (lat: number, lng: number) => {
      const res = await fetch(`${API_BASE}/prediction?lat=${lat}&lng=${lng}`);
      return res.json();
    },
    getGuide: async (disaster: string) => {
      const res = await fetch(`${API_BASE}/guide?disaster=${disaster}`);
      return res.json();
    },
  },

  medical: {
    getProfile: async () => {
      const res = await fetch(`${API_BASE}/medical/profile`, {
        headers: getAuthHeaders(),
      });
      return res.json();
    },
    updateProfile: async (data: Record<string, unknown>) => {
      const res = await fetch(`${API_BASE}/medical/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    uploadFile: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const headers = getAuthHeaders();
      delete headers['Content-Type'];
      const res = await fetch(`${API_BASE}/medical/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });
      return res.json();
    },
    deleteFile: async (fileId: string) => {
      const res = await fetch(`${API_BASE}/medical/files/${fileId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      return res.json();
    },
    generateShareLink: async (hours: number = 24) => {
      const res = await fetch(`${API_BASE}/medical/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ hours }),
      });
      return res.json();
    },
    getSharedProfile: async (token: string) => {
      const res = await fetch(`${API_BASE}/medical/share/${token}`);
      return res.json();
    },
  },
};
