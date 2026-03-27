// src/pages/Profile.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import Header from '../components/Layout/Header';
import Sidebar from '../components/Layout/Sidebar';
import Badge from '../components/UI/Badge';

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

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const [userRes, achievementsRes, skillsRes] = await Promise.all([
        api.get('/auth/me/'),
        // ✅ БЫЛО (только верифицированные):
        // api.get('/achievements/?status=VERIFIED&limit=3').catch(() => ({ data: [] })),
        
        // ✅ СТАЛО (все достижения, последние 3):
        api.get('/achievements/?limit=3&ordering=-created_at').catch(() => ({ data: { results: [] } })),
        
        api.get('/api/skills/my-skills/?limit=3').catch(() => ({ data: { results: [] } })),
      ]);

      setProfile(userRes.data);
      setAchievements(achievementsRes.data.results || achievementsRes.data || []);
      setSkills(skillsRes.data.results || skillsRes.data || []);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading-page">Загрузка профиля...</div>;

  // Формируем текст статуса
  const statusText = profile?.institution 
    ? `${getRoleLabel(profile?.role)}; ${profile?.institution}`
    : getRoleLabel(profile?.role);

  // Инициалы для аватара
  const initials = (profile?.first_name?.[0] || 'П') + (profile?.last_name?.[0] || 'П');

  // Типы достижений
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
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Header />

        <div className="profile-content">
          <div className="profile-columns">
            {/* ЛЕВАЯ КОЛОНКА: Навыки + Бейджи */}
            <div className="profile-left-column">
              {/* Навыки */}
              <section className="profile-section">
                <h2>
                  <span className="icon-success">✓</span>
                  Подтвержденные навыки
                </h2>
                <div className="skills-list">
                  {skills.length > 0 ? (
                    skills.map((skill) => (
                      <div key={skill.id} className="skill-item">
                        <span>{skill.skill?.name || skill.name}</span>
                        <Badge variant={skill.skill?.category || 'default'}>
                          {skill.skill?.category === 'Programming' ? 'Вуз' : 'Курсы'}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <p className="no-data">Пока нет подтвержденных навыков</p>
                  )}
                </div>
                <Link to="/skills" className="link-show-all">
                  Показать все →
                </Link>
              </section>

              {/* Бейджи */}
              <section className="profile-section">
                <h2>Награды и бейджи</h2>
                <div className="badges-grid">
                  <div className="badge-item">🏆</div>
                  <div className="badge-item">💡</div>
                  <div className="badge-item">👥</div>
                  <div className="badge-item">🎯</div>
                </div>
              </section>
            </div>

            {/* ПРАВАЯ КОЛОНКА: Достижения */}
            <section className="profile-section achievements-column">
              <div className="section-header">
                <h2>Недавние достижения</h2>
                <Link to="/achievements/add" className="btn-add">
                  <span>±</span> Добавить
                </Link>
              </div>

              <div className="achievements-list">
                {achievements.length > 0 ? (
                  achievements.map((achievement) => (
                    <div key={achievement.id} className="achievement-card">
                      <div className="achievement-header">
                        <h3>{achievement.title}</h3>
                        <span className={`status-badge status-${achievement.status?.toLowerCase() || 'pending'}`}>
                          {achievement.status === 'VERIFIED' ? '✓ Верифицировано' : '⏳ На проверке'}
                        </span>
                      </div>
                      <p className="achievement-description">{achievement.description}</p>
                      <div className="achievement-skills">
                        <span className="tag">{getTypeLabel(achievement.type)}</span>
                        <span className="tag">{achievement.organization}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="no-data">Пока нет достижений</p>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;