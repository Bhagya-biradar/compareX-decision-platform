import api from './api';

export const getComparisons = async () => {
  const { data } = await api.get('/comparisons');
  return data;
};

export const getComparisonById = async (id) => {
  const { data } = await api.get(`/comparisons/${id}`);
  return data;
};

export const createComparison = async (payload) => {
  const { data } = await api.post('/comparisons', payload);
  return data;
};

export const updateComparison = async (id, payload) => {
  const { data } = await api.put(`/comparisons/${id}`, payload);
  return data;
};

export const deleteComparison = async (id) => {
  const { data } = await api.delete(`/comparisons/${id}`);
  return data;
};
