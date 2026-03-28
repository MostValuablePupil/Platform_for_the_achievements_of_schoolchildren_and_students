// src/components/Layout/Header.jsx
import React from 'react';
import { useAuth } from '../../context/AuthContext';

// Функция для перевода роли на русский
const getRoleLabel = (role) => {
  const roles = {
    'STUDENT': 'Студент',
    'SCHOOLCHILD': 'Школьник',
    'EMPLOYER': 'Работодатель',
    'TEACHER': 'Преподаватель',
  };
  return roles[role] || role;
};

const Header = () => {
  const { user } = useAuth();

  // Формируем текст статуса: "Школьник; МАОУСОШ №29"
  const statusText = user?.institution 
    ? `${getRoleLabel(user?.role)}; ${user?.institution}`
    : getRoleLabel(user?.role);

  return (
    <header className="header">
      <div className="header-content">
        <div className="user-header">
          <div className="avatar-large">
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>
          <div className="user-details">
            <h1>{user?.first_name} {user?.last_name}</h1>
            <p>{statusText}</p>
          </div>
        </div>
        
        <div className="xp-progress">
          <div className="level-info">
            <span className="level">Уровень {user?.level || 1}</span>
            <span className="xp">
              {user?.total_xp % 100} / 100 XP
            </span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${(user?.total_xp % 100)}%` }}
            />
          </div>
          <span className="progress-label">(Продвинутый)</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
