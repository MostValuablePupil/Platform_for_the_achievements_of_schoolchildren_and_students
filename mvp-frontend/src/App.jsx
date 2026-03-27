// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Achievements from './pages/Achievements';
import SkillsTracking from './pages/SkillsTracking';
import './App.css';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Загрузка...</div>;
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route 
            path="/profile" 
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/achievements" 
            element={
              <PrivateRoute>
                <Achievements />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/skills" 
            element={
              <PrivateRoute>
                <SkillsTracking />
              </PrivateRoute>
            } 
          />
          <Route path="/" element={<Navigate to="/profile" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;