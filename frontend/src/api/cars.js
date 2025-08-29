// src/api/cars.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

export const fetchCars = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const response = await apiClient.get(`/cars?${params}`);
  return response.data;
};

export const fetchCarById = async (carId) => {
  const response = await apiClient.get(`/cars/${carId}`);
  return response.data;
};
