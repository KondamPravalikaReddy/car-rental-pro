// src/router.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginForm from './auth/LoginForm';
import CarsPage from './pages/CarsPage';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

export default function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route path="/cars" element={
          <PrivateRoute>
            <CarsPage />
          </PrivateRoute>
        } />
        <Route path="*" element={<Navigate to="/cars" />} />
      </Routes>
    </Router>
  );
}
