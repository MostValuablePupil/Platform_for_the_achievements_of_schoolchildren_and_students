// src/pages/Achievements.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import Header from '../components/Layout/Header';
import Sidebar from '../components/Layout/Sidebar';

const Achievements = () => {
  const [achievements, setAchievements] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    pending: 0,
    by_type: {}
  });
  const [activeTab, setActiveTab] = useState('achievements');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAchievements();
    loadStats();
  }, []);

  useEffect(() => {
    loadAchievements();
    loadStats();
  }, [filter]);

  const loadAchievements = async () => {
    try {
      let url = '/achievements/';
      const params = {};
      
      if (filter === 'verified') {
        params.status = 'VERIFIED';
      } else if (filter === 'pending') {
        params.status = 'PENDING';
      }
      
      const response = await api.get(url, { params });
      setAchievements(response.data.results || response.data || []);
    } catch (error) {
      console.error('Error loading achievements:', error);
      setAchievements([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get('/achievements/stats/');
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
      setStats({ total: 0, verified: 0, pending: 0, by_type: {} });
    }
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
  };

  // ✅ Типы достижений: первый счетчик = общая сумма (stats.total)
  const achievementTypes = [
    { key: 'PROJECT', label: 'Проектов', count: stats.total || 0, icon: '💼' },  // ✅ ИСПРАВЛЕНО
    { key: 'OLYMPIAD', label: 'Олимпиад', count: stats.by_type?.OLYMPIAD || 0, icon: '🏆' },
    { key: 'COURSE', label: 'Курсов', count: stats.by_type?.COURSE || 0, icon: '📚' },
    { key: 'HACKATHON', label: 'Хакатонов', count: stats.by_type?.HACKATHON || 0, icon: '💻' },
    { key: 'VOLUNTEER', label: 'Волонтерств', count: stats.by_type?.VOLUNTEER || 0, icon: '🤝' },
    { key: 'PUBLICATION', label: 'Публикаций', count: stats.by_type?.PUBLICATION || 0, icon: '📰' },
  ];

  const getStatusBadge = (status) => {
    if (status === 'VERIFIED') {
      return <span className="status-badge verified">✓ Верифицировано</span>;
    }
    return <span className="status-badge pending">⏳ На проверке</span>;
  };

  const getTypeLabel = (type) => {
    const types = {
      'HACKATHON': '💻 Хакатоны',
      'OLYMPIAD': '🏆 Олимпиады',
      'COURSE': '📚 Курсы',
      'VOLUNTEER': '🤝 Волонтерство',
      'PUBLICATION': '📰 Публикации',
      'PROJECT': '💼 Проекты',
    };
    return types[type] || type;
  };

  if (loading) {
    return <div className="loading-page">Загрузка...</div>;
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="achievements-page-v2">
          {/* Заголовок страницы */}
          <div className="page-main-header">
            <h1>Достижения</h1>
            <p className="page-subtitle">Все ваши успехи, награды и сертификаты в одном месте</p>
          </div>

          {/* Счетчики по типам */}
          <div className="stats-grid-v2">
            {achievementTypes.map((type) => (
              <div key={type.key} className="stat-card-v2">
                <div className="stat-number-v2">{type.count}</div>
                <div className="stat-label-v2">{type.label}</div>
              </div>
            ))}
          </div>

          {/* Табы */}
          <div className="tabs-container">
            <button 
              className={`tab ${activeTab === 'achievements' ? 'active' : ''}`}
              onClick={() => setActiveTab('achievements')}
            >
              Достижения
            </button>
            <button 
              className={`tab ${activeTab === 'badges' ? 'active' : ''}`}
              onClick={() => setActiveTab('badges')}
            >
              Награды и бейджи
            </button>
          </div>

          {/* ✅ Фильтры — ВНУТРИ return */}
          <div className="filters-container">
            <div className="filter-group">
              <span className="filter-label">🔽 Фильтр:</span>
              <button 
                className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                onClick={() => handleFilterChange('all')}
              >
                Все
              </button>
              <button 
                className={`filter-btn ${filter === 'verified' ? 'active' : ''}`}
                onClick={() => handleFilterChange('verified')}
              >
                Верифицированные
              </button>
              <button 
                className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
                onClick={() => handleFilterChange('pending')}
              >
                На проверке
              </button>
            </div>
            
            <Link to="/achievements/add" className="btn-add-achievement-v2">
              + Добавить достижение
            </Link>
          </div>

          {/* Список достижений */}
          {activeTab === 'achievements' && (
            <div className="achievements-list-v2">
              {achievements.length > 0 ? (
                achievements.map((achievement) => (
                  <div key={achievement.id} className="achievement-item-v2">
                    <div className="achievement-status-icon">
                      {achievement.status === 'VERIFIED' ? '✓' : '⏳'}
                    </div>
                    <div className="achievement-body">
                      <div className="achievement-header-v2">
                        <h3 className="achievement-title">{achievement.title}</h3>
                        {getStatusBadge(achievement.status)}
                      </div>
                      <p className="achievement-description">{achievement.description}</p>
                      <div className="achievement-footer">
                        <div className="achievement-tags">
                          <span className="tag">{getTypeLabel(achievement.type)}</span>
                          <span className="tag">{achievement.organization}</span>
                        </div>
                        <span className="achievement-date">
                          {new Date(achievement.date).toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-achievements">
                  <p>Пока нет достижений</p>
                  <Link to="/achievements/add" className="btn-primary">
                    Добавить первое достижение
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Вкладка наград и бейджей */}
          {activeTab === 'badges' && (
            <div className="badges-section">
              <div className="badges-grid-v2">
                <div className="badge-card">🏆</div>
                <div className="badge-card">💡</div>
                <div className="badge-card">👥</div>
                <div className="badge-card">🎯</div>
                <div className="badge-card">⭐</div>
                <div className="badge-card">🚀</div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Achievements;