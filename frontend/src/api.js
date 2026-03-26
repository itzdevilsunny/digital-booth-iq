import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API,
  headers: { 'Content-Type': 'application/json' }
});

// Booths
export const getBooths = () => api.get('/booths').then(r => r.data);

// Users
export const getUsers = () => api.get('/users').then(r => r.data);
export const getUsersByRole = (role) => api.get(`/users/role/${role}`).then(r => r.data);

// Voters
export const getVoters = (boothId) => api.get(`/voters?booth_id=${boothId}`).then(r => r.data);
export const updateVoter = (data) => api.patch('/voters', data).then(r => r.data);

// Calls
export const getCalls = (boothId) => api.get(`/calls?booth_id=${boothId}`).then(r => r.data);
export const createCall = (data) => api.post('/calls', data).then(r => r.data);

// Grievances
export const getGrievances = (params) => {
  const query = new URLSearchParams(params).toString();
  return api.get(`/grievances?${query}`).then(r => r.data);
};
export const createGrievance = (data) => api.post('/grievances', data).then(r => r.data);
export const updateGrievance = (data) => api.patch('/grievances', data).then(r => r.data);

// Analytics
export const getAnalytics = (boothId) => api.get(`/analytics?booth_id=${boothId}`).then(r => r.data);

// Knowledge Graph
export const getGraphData = () => api.get('/graph-data').then(r => r.data);
export const filterVoters = (params) => {
  const query = new URLSearchParams(params).toString();
  return api.get(`/filter-voters?${query}`).then(r => r.data);
};

// Manager
export const getBoothsSummary = () => api.get('/manager/booths-summary').then(r => r.data);
export const analyzeBooth = (boothId) => api.post('/manager/analyze', { booth_id: boothId }).then(r => r.data);
export const sendTargetedUpdate = (data) => api.post('/manager/send-update', data).then(r => r.data);

// Schemes
export const getSchemes = () => api.get('/schemes').then(r => r.data);
export const applyForScheme = (data) => api.post('/schemes/apply', data).then(r => r.data);
export const getApplications = (voterId) => api.get(`/schemes/applications?voter_id=${voterId}`).then(r => r.data);
export const getVoterServices = () => api.get('/voter-services').then(r => r.data);

// Seed
export const seedData = () => api.post('/seed').then(r => r.data);

// Health
export const healthCheck = () => api.get('/health').then(r => r.data);

export default api;
