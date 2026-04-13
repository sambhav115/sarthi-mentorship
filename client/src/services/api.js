import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
});

// Attach JWT token to every request if available
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('mentor_token') || localStorage.getItem('student_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Mentor Auth
export const login = (email, password) => API.post('/auth/login', { email, password });
export const getMe = () => API.get('/auth/me');

// Student Auth
export const studentLogin = (email, password) => API.post('/auth/student/login', { email, password });
export const getStudentMe = () => API.get('/auth/student/me');

// Students
export const getStudents = (search) => API.get('/students', { params: search ? { search } : {} });

// Mentors
export const getMentors = () => API.get('/reviews/mentors');

// Leads
export const submitLead = (data) => API.post('/leads', data);

// Reviews
export const submitReview = (data) => API.post('/reviews', data);
export const getReviews = (studentId) => API.get(`/reviews?studentId=${studentId}`);

// AI
export const summarizeAll = (studentId) => API.post('/ai/summarize-all', { studentId });
export const getLeaderboard = (params) => API.get('/ai/leaderboard', { params });

export default API;
