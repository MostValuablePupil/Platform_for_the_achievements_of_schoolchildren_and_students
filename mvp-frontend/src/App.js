// src/App.js
import React from 'react';
// ⚠️ УБЕРИ Router из импорта! Оставь только Routes, Route, Navigate:
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Achievements from './pages/Achievements';
import SkillsTracking from './pages/SkillsTracking';
import './App.css';
import AddAchievement from './pages/AddAchievement';

function App() {
  return (
    <AuthProvider>
      {/* ⚠️ УБЕРИ <Router> отсюда! Оставь только Routes: */}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/achievements" element={<Achievements />} />
        <Route path="/skills" element={<SkillsTracking />} />
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/achievements/add" element={<AddAchievement />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;