// src/pages/AddAchievement.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

const AddAchievement = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formData, setFormData] = useState({
    title: '',
    type: '',
    date: '',
    description: '',
    organization: '',
    link: '',
  });
  const [files, setFiles] = useState([]);

  const achievementTypes = [
    { value: 'HACKATHON', label: '💻 Хакатоны' },
    { value: 'OLYMPIAD', label: '🏆 Олимпиады' },
    { value: 'COURSE', label: '📚 Курсы' },
    { value: 'VOLUNTEER', label: '🤝 Волонтерство' },
    { value: 'PUBLICATION', label: '📰 Публикации' },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const maxSize = 10 * 1024 * 1024;

    const invalidFiles = selectedFiles.filter(file => 
      !validTypes.includes(file.type) || file.size > maxSize
    );

    if (invalidFiles.length > 0) {
      alert('Некоторые файлы не подходят. Разрешены: JPG, PNG, PDF, DOC (макс. 10MB)');
      return;
    }

    setFiles([...files, ...selectedFiles]);
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.type || !formData.date || !formData.description) {
      alert('Заполните все обязательные поля');
      return;
    }

    setLoading(true);

    try {
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('type', formData.type);
      submitData.append('date', formData.date);
      submitData.append('description', formData.description);
      submitData.append('organization', formData.organization);
      submitData.append('link', formData.link);

      files.forEach((file) => {
        submitData.append('documents', file);
      });

      const response = await api.post('/achievements/', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        },
      });

      console.log('✅ Достижение добавлено:', response.data);
      
      // ✅ Просто переходим на страницу достижений (там статика обновится автоматически)
      navigate('/achievements');
      
    } catch (error) {
      console.error('❌ Ошибка при добавлении достижения:', error);
      alert('Ошибка при сохранении достижения. Проверьте консоль.');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="add-achievement-page">
      <div className="page-header">
        <Link to="/achievements" className="back-link">
          ← Назад к достижениям
        </Link>
        <h1>Добавить достижение</h1>
        <p className="page-subtitle">Заполните информацию о вашем новом достижении</p>
      </div>

      <form onSubmit={handleSubmit} className="achievement-form-card">
        {/* Название */}
        <div className="form-group">
          <label className="form-label">
            Название достижения <span className="required">*</span>
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Например: Победа в олимпиаде по программированию"
            className="form-input"
            required
          />
        </div>

        {/* Тип и дата */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">
              Тип достижения <span className="required">*</span>
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="form-select"
              required
            >
              <option value="">Выберите тип</option>
              {achievementTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              Дата получения <span className="required">*</span>
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>
        </div>

        {/* Описание */}
        <div className="form-group">
          <label className="form-label">
            Описание <span className="required">*</span>
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Опишите ваше достижение подробнее..."
            className="form-textarea"
            rows="4"
            required
          />
        </div>

        {/* Организация и ссылка */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">
              Организация/Учреждение <span className="required">*</span>
            </label>
            <input
              type="text"
              name="organization"
              value={formData.organization}
              onChange={handleChange}
              placeholder="Название организации"
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Ссылка <span className="optional">(опционально)</span>
            </label>
            <input
              type="url"
              name="link"
              value={formData.link}
              onChange={handleChange}
              placeholder="https://..."
              className="form-input"
            />
          </div>
        </div>

        {/* Загрузка файлов */}
        <div className="form-group">
          <label className="form-label">Сертификаты и документы</label>
          <div className="file-upload-area">
            <input
              type="file"
              id="file-upload"
              multiple
              accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
              onChange={handleFileChange}
              className="file-upload-input"
            />
            <label htmlFor="file-upload" className="file-upload-label">
              <div className="upload-icon">📁</div>
              <p className="upload-text">Нажмите для загрузки или перетащите файлы сюда</p>
              <span className="file-types">PDF, JPG, PNG, DOC (максимум 10 МБ)</span>
            </label>
          </div>

          {/* Список загруженных файлов */}
          {files.length > 0 && (
            <div className="uploaded-files">
              {files.map((file, index) => (
                <div key={index} className="file-item">
                  <span className="file-name">📄 {file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="remove-file-btn"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Индикатор прогресса загрузки */}
        {uploadProgress > 0 && (
          <div className="upload-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <span className="progress-text">{uploadProgress}%</span>
          </div>
        )}

        {/* Информация о верификации */}
        <div className="verification-info">
          <strong>Верификация:</strong> После добавления достижения, оно будет 
          отправлено на проверку. Вы получите уведомление, когда администратор 
          подтвердит информацию.
        </div>

        {/* Кнопки */}
        <div className="form-actions">
          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Добавление...' : 'Добавить достижение'}
          </button>
          <button 
            type="button" 
            onClick={() => navigate('/achievements')}
            className="btn-cancel"
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddAchievement;