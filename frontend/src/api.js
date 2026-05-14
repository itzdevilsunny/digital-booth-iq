import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API,
  headers: { 'Content-Type': 'application/json' }
});

// Auth
export const login = (data) => api.post('/auth/login', data).then(r => {
  if (r.data.token) {
    localStorage.setItem('token', r.data.token);
    api.defaults.headers.common['Authorization'] = `Bearer ${r.data.token}`;
  }
  return r.data;
});

export const logout = () => {
  localStorage.removeItem('token');
  delete api.defaults.headers.common['Authorization'];
};

// Interceptor to attach token from localStorage if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Booths
export const getBooths = () => api.get('/booths').then(r => r.data);

// Users
export const getUsers = () => api.get('/users').then(r => r.data);
export const getUsersByRole = (role) => api.get(`/users/role/${role}`).then(r => r.data);

// Voters
export const getVoters = (boothId, force = false) => 
  getCached(`voters_${boothId}`, () => api.get(`/voters?booth_id=${boothId}`).then(r => r.data), force);
export const getVoterProfile = (voterId) => api.get(`/voters-profile/${voterId}`).then(r => r.data);
export const updateVoter = (data) => api.patch('/voters', data).then(r => r.data);
export const initiateCampaignBlast = (data) => api.post('/campaigns/blast', data).then(r => r.data);

// Calls
export const getCalls = (boothId) => api.get(`/calls?booth_id=${boothId}`).then(r => r.data);
export const createCall = (data) => api.post('/calls', data).then(r => r.data);

// Grievances
export const getGrievances = (params) => api.get('/grievances', { params }).then(r => r.data);
export const createGrievance = (data) => api.post('/grievances', data).then(r => r.data);
export const updateGrievance = (data) => api.patch('/grievances', data).then(r => r.data);
export const uploadFile = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/upload', formData, { 
    headers: { 'Content-Type': 'multipart/form-data' } 
  }).then(r => r.data);
};

// Tactical Client-side Cache for high-frequency syncs
const cache = new Map();
const CACHE_TTL = 30000; // 30s

const getCached = (key, fetcher, force = false) => {
  const cached = cache.get(key);
  if (!force && cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
    return Promise.resolve(cached.data);
  }
  return fetcher().then(data => {
    cache.set(key, { data, timestamp: Date.now() });
    return data;
  });
};

// Analytics
export const getAnalytics = (boothId, force = false) => 
  getCached(`analytics_${boothId}`, () => api.get(`/analytics?booth_id=${boothId}`).then(r => r.data), force);

// Knowledge Graph
export const getGraphData = (boothId, perspective = 'social', force = false) => 
  getCached(`graph_${boothId}_${perspective}`, () => api.get(`/graph-data?booth_id=${boothId}&perspective=${perspective}`).then(r => r.data), force);
export const filterVoters = (params) => {
  const query = new URLSearchParams(params).toString();
  return api.get(`/filter-voters?${query}`).then(r => r.data);
};

// Manager
export const getBoothsSummary = () => api.get('/manager/booths-summary').then(r => r.data);
export const analyzeBooth = (boothId) => api.post('/manager/analyze', { booth_id: boothId }).then(r => r.data);
export const sendTargetedUpdate = (data) => api.post('/manager/send-update', data).then(r => r.data);
export const getManagerAlerts = () => api.get('/manager/automation-alerts').then(r => r.data);
export const managerAutoResolve = () => api.post('/manager/auto-resolve').then(r => r.data);
export const managerAutoAssign = (data) => api.post('/manager/auto-assign', data).then(r => r.data);
export const getActionHistory = () => api.get('/manager/action-history').then(r => r.data);
export const getBulletins = () => api.get('/bulletins').then(r => r.data);
export const getConstituencySummary = () => api.get('/constituency/summary').then(r => r.data);

// Schemes
export const getSchemes = () => api.get('/schemes').then(r => r.data);
export const applyForScheme = (data) => api.post('/schemes/apply', data).then(r => r.data);
export const getApplications = (voterId) => api.get(`/schemes/applications?voter_id=${voterId}`).then(r => r.data);
export const getVoterServices = () => api.get('/voter-services').then(r => r.data);

// AI Chat
export const aiChat = (data) => api.post('/chat', data).then(r => r.data);
export const speechToText = (formData) => api.post('/ai/stt', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
}).then(r => r.data);
export const textToSpeech = (formData) => api.post('/ai/tts', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
}).then(r => r.data);

// Seed
export const seedData = () => api.post('/seed').then(r => r.data);

// Health
export const healthCheck = () => api.get('/health').then(r => r.data);

export default api;
