import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000', // Убрали /api отсюда, добавим в методах
  headers: {
    'Content-Type': 'application/json',
  },
});

// Обратите внимание на слэши в конце каждого пути!
export const getSettings = () => api.get('/api/settings/');
export const updateSettings = (data) => api.put('/api/settings/', data);

export const getCampaigns = () => api.get('/api/campaigns/');
export const createCampaign = (data) => api.post('/api/campaigns/', data);
export const getCampaign = (id) => api.get(`/api/campaigns/${id}/`);
export const updateCampaign = (id, data) => api.put(`/api/campaigns/${id}/`, data);