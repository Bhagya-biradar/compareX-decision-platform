import api from './api';

export const getProductSuggestions = async (query) => {
  const { data } = await api.get('/products/suggestions', { params: { query } });
  return data;
};

export const compareProducts = async (payload) => {
  const { data } = await api.post('/products/compare', payload);
  return data;
};

export const getProductPrices = async (params) => {
  const { data } = await api.get('/products/prices', { params });
  return data;
};