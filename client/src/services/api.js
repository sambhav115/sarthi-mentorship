import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

export const getStudents = () => API.get('/students');
export const getStudent = (id) => API.get(`/students/${id}`);
export const getMentors = () => API.get('/reviews/mentors');
export const submitLead = (data) => API.post('/leads', data);
export const submitReview = (data) => API.post('/reviews', data);
export const getReviews = (studentId) => API.get(`/reviews?studentId=${studentId}`);
export const getLatestReview = (studentId) => API.get(`/reviews/latest/${studentId}`);
export const summarizeReview = (reviewText) => API.post('/ai/summarize', { reviewText });
export const summarizeAll = (studentId) => API.post('/ai/summarize-all', { studentId });

export default API;
