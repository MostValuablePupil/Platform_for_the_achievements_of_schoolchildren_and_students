// src/components/Layout/Sidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const { user, logout } = useAuth();

  const menuItems = [
    { path: '/profile', label: 'Мой профиль', icon: '🏠' },
    { path: '/achievements', label: 'Достижения', icon: '🏆' },
    { path: '/skills', label: 'Трекинг навыков', icon: '📈' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <img src="/logo.svg" alt="MVP Logo" className="logo" />
        <h2>Most Valuable Pupil</h2>
        <p>Цифровое портфолио</p>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => 
              `nav-item ${isActive ? 'active' : ''}`
            }
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-mini-profile">
          <div className="avatar">
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>
          <div className="user-info">
            <div className="user-name">
              {user?.first_name} {user?.last_name}
            </div>
            <div className="user-level">Уровень {user?.level}</div>
          </div>
        </div>
        <button onClick={logout} className="logout-btn">
          <span>🚪</span> Выйти
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;