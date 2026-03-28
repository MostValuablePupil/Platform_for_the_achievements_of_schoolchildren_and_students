// src/pages/SkillsTracking.jsx
import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Layout/Sidebar';
import api from '../api/axios';

const SkillsTracking = () => {
  const [skills, setSkills] = useState([]);
  const [stats, setStats] = useState({
    totalSkills: 0,
    verified: 0,
    projects: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSkills();
  }, []);

  const loadSkills = async () => {
    try {
      const response = await api.get('/skills/my-skills/');
      setSkills(response.data);
      
      setStats({
        totalSkills: response.data.length,
        verified: response.data.filter(s => s.level >= 3).length,
        projects: response.data.reduce((acc, skill) => acc + (skill.projects_count || 0), 0),
      });
    } catch (error) {
      console.error('Error loading skills:', error);
    } finally {
      setLoading(false);
    }
  };

  // Данные для радарной диаграммы
  const radarData = skills.slice(0, 6).map(skill => ({
    skill: skill.skill.name,
    level: skill.level * 20, // Масштабируем до 100
  }));

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1>Трекинг навыков</h1>
          <p>Отслеживайте развитие компетенций и получайте аналитику</p>
        </div>

        {/* Статистика */}
        <div className="stats-grid-3">
          <div className="stat-card-large">
            <div className="stat-icon">💻</div>
            <div className="stat-value">{stats.totalSkills}</div>
            <div className="stat-label">Навыков</div>
          </div>
          <div className="stat-card-large">
            <div className="stat-icon">✓</div>
            <div className="stat-value">{stats.verified}</div>
            <div className="stat-label">Верифицировано</div>
          </div>
          <div className="stat-card-large">
            <div className="stat-icon">📁</div>
            <div className="stat-value">{stats.projects}</div>
            <div className="stat-label">Проектов</div>
          </div>
        </div>

        <div className="skills-analytics">
          {/* Уровень владения навыками */}
          <section className="analytics-section">
            <h2>Уровень владения навыками</h2>
            <div className="skills-progress-list">
              {skills.map((userSkill) => (
                <div key={userSkill.id} className="skill-progress-item">
                  <div className="skill-name">
                    {userSkill.skill.name}
                    {userSkill.level >= 3 && <span className="verified-icon">✓</span>}
                  </div>
                  <div className="skill-progress-bar">
                    <div 
                      className="skill-progress-fill"
                      style={{ width: `${Math.min(userSkill.level * 20, 100)}%` }}
                    />
                  </div>
                  <div className="skill-projects">
                    {userSkill.projects_count || 0} проектов
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Карта компетенций (радар) */}
          <section className="analytics-section">
            <h2>Карта компетенций</h2>
            <div className="radar-chart">
              <svg viewBox="0 0 200 200" className="radar-svg">
                {/* Сетка */}
                {[20, 40, 60, 80, 100].map((level, i) => (
                  <polygon
                    key={i}
                    points={radarData.map((_, idx) => {
                      const angle = (idx * 60 - 90) * Math.PI / 180;
                      const r = level;
                      return `${100 + r * Math.cos(angle)},${100 + r * Math.sin(angle)}`;
                    }).join(' ')}
                    fill="none"
                    stroke="#e0e0e0"
                    strokeWidth="1"
                  />
                ))}
                
                {/* Данные */}
                <polygon
                  points={radarData.map((data, idx) => {
                    const angle = (idx * 60 - 90) * Math.PI / 180;
                    const r = data.level;
                    return `${100 + r * Math.cos(angle)},${100 + r * Math.sin(angle)}`;
                  }).join(' ')}
                  fill="rgba(99, 102, 241, 0.3)"
                  stroke="#6366f1"
                  strokeWidth="2"
                />
                
                {/* Подписи */}
                {radarData.map((data, idx) => {
                  const angle = (idx * 60 - 90) * Math.PI / 180;
                  const r = 115;
                  return (
                    <text
                      key={idx}
                      x={100 + r * Math.cos(angle)}
                      y={100 + r * Math.sin(angle)}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="8"
                      fill="#666"
                    >
                      {data.skill}
                    </text>
                  );
                })}
              </svg>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default SkillsTracking;