// frontend/src/pages/AchievementDetailPage.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Calendar, Building2, Link2, Award, FileText, CheckCircle, Clock, XCircle, Download } from 'lucide-react';
import apiClient from '../api/client';
import Layout from '../components/Layout';

interface AchievementFile {
  id: number;
  file: string;
  uploaded_at: string;
}

interface Achievement {
  id: number;
  title: string;
  description: string;
  event_type: string;
  level_category: string;
  achievement_level: string;
  organization: string;
  link?: string;
  points: number;
  status: string;
  student: number;
  student_name: string;
  verifier?: number;
  proof_file?: string;
  files?: AchievementFile[]; // 🔥 Добавляем поле для множественных файлов
  skills?: any[];
  skill_names?: string[];
  is_rewarded: boolean;
  verified_at?: string;
  created: string;
  hours_count?: number;
  has_certificate?: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  OLYMPIAD: '🧠 Олимпиада',
  HACKATHON: '💻 Проект / Хакатон',
  COURSE: '📚 Курс / Обучение',
  VOLUNTEERING: '🤝 Волонтерство',
  SCIENCE: '🔬 Научная работа',
  SPORT_ART: '🏅 Спорт / Творчество',
};

const LEVEL_LABELS: Record<string, string> = {
  UNIVERSITY: 'Вузовская',
  REGIONAL: 'Региональная',
  ALL_RUSSIA: 'Всероссийская',
  INTERNAL: 'Внутривузовский',
  INTER_UNIVERSITY: 'Межвузовский',
  ONLINE_SHORT: 'Онлайн-курс (до 20 ч)',
  RETRAINING: 'Профессиональная переподготовка',
  SHORT: '1-10 часов',
  LONG: '10+ часов',
  ARTICLE: 'Статья в сборнике',
  VAK: 'Публикация в журнале ВАК',
  EVENT: 'Участие в мероприятии',
};

const RESULT_LABELS: Record<string, string> = {
  PARTICIPANT: 'Участие',
  PRIZE: 'Призёр',
  WINNER: 'Победитель',
};

export default function AchievementDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [achievement, setAchievement] = useState<Achievement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      apiClient.get(`achievements/${id}/`)
        .then(res => {
          setAchievement(res.data);
          setLoading(false);
        })
        .catch(err => {
          setError('Ошибка загрузки достижения');
          setLoading(false);
          console.error(err);
        });
    }
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  if (error || !achievement) {
    return (
      <Layout>
        <div className="text-center text-red-400">
          {error || 'Достижение не найдено'}
        </div>
      </Layout>
    );
  }

  // 🔥 Функция для получения имени файла из URL
  const getFileName = (url: string) => {
    return url.split('/').pop() || 'Файл';
  };

  // 🔥 Функция для определения типа файла
  const getFileType = (url: string) => {
    const ext = url.split('.').pop()?.toLowerCase();
    const types: Record<string, string> = {
      'pdf': 'PDF документ',
      'doc': 'Word документ',
      'docx': 'Word документ',
      'jpg': 'Изображение',
      'jpeg': 'Изображение',
      'png': 'Изображение',
      'gif': 'Изображение',
      'webp': 'Изображение',
      'txt': 'Текстовый файл',
    };
    return types[ext || ''] || 'Файл';
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Кнопка Назад */}
        <button 
          onClick={() => navigate('/achievements')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Назад к достижениям</span>
        </button>

        {/* Основная карточка */}
        <div className="bg-[#1a2332] border border-gray-800 rounded-2xl p-8">
          
          {/* Заголовок и статус */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-green-500/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Trophy className="w-7 h-7 text-green-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white mb-2">
                  {achievement.title}
                </h1>
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <span>{TYPE_LABELS[achievement.event_type]}</span>
                  <span className="w-1 h-1 bg-gray-600 rounded-full" />
                  <span>{LEVEL_LABELS[achievement.level_category] || achievement.level_category}</span>
                  {achievement.achievement_level && achievement.achievement_level !== 'PARTICIPANT' && (
                    <>
                      <span className="w-1 h-1 bg-gray-600 rounded-full" />
                      <span>{RESULT_LABELS[achievement.achievement_level]}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <span className={`px-4 py-2 rounded-full text-sm font-medium ${
              achievement.status === 'VERIFIED'
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : achievement.status === 'PENDING'
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              {achievement.status === 'VERIFIED' ? (
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Подтверждено
                </span>
              ) : achievement.status === 'PENDING' ? (
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  На проверке
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  Отклонено
                </span>
              )}
            </span>
          </div>

          {/* Описание */}
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Описание
            </h2>
            <p className="text-gray-300 text-base leading-relaxed">
              {achievement.description}
            </p>
          </div>

          {/* Информация */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="bg-[#0f1419] rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <Building2 className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider">Организация</span>
              </div>
              <p className="text-white font-medium">{achievement.organization}</p>
            </div>

            <div className="bg-[#0f1419] rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <Award className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider">Начислено XP</span>
              </div>
              <p className="text-cyan-400 font-bold text-xl">+{achievement.points} XP</p>
            </div>

            <div className="bg-[#0f1419] rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <Calendar className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider">Дата создания</span>
              </div>
              <p className="text-white">
                {new Date(achievement.created).toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>

            {achievement.verified_at && (
              <div className="bg-[#0f1419] rounded-xl p-4">
                <div className="flex items-center gap-2 text-gray-500 mb-2">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-xs uppercase tracking-wider">Дата проверки</span>
                </div>
                <p className="text-white">
                  {new Date(achievement.verified_at).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            )}

            {achievement.hours_count && (
              <div className="bg-[#0f1419] rounded-xl p-4">
                <div className="flex items-center gap-2 text-gray-500 mb-2">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs uppercase tracking-wider">Количество часов</span>
                </div>
                <p className="text-white">{achievement.hours_count} ч.</p>
              </div>
            )}

            {achievement.has_certificate && (
              <div className="bg-[#0f1419] rounded-xl p-4">
                <div className="flex items-center gap-2 text-gray-500 mb-2">
                  <FileText className="w-4 h-4" />
                  <span className="text-xs uppercase tracking-wider">Сертификат</span>
                </div>
                <p className="text-green-400">Есть сертификат/диплом</p>
              </div>
            )}
          </div>

          {/* Ссылка */}
          {achievement.link && (
            <div className="mb-8">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Ссылка
              </h2>
              <a 
                href={achievement.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
              >
                <Link2 className="w-4 h-4" />
                {achievement.link}
              </a>
            </div>
          )}

          {/* 🔥 ФАЙЛЫ ПОДТВЕРЖДЕНИЯ (ОБНОВЛЕНО) */}
          {(achievement.files && achievement.files.length > 0) || achievement.proof_file ? (
            <div className="mb-8">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                Прикрепленные файлы
              </h2>
              <div className="space-y-3">
                {/* 🔥 Одиночный proof_file (для обратной совместимости) */}
                {achievement.proof_file && (
                  <a
                    href={achievement.proof_file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 bg-[#0f1419] border border-gray-800 rounded-xl hover:border-blue-500/30 transition-all group"
                  >
                    <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">
                        {getFileName(achievement.proof_file)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {getFileType(achievement.proof_file)}
                      </p>
                    </div>
                    <Download className="w-5 h-5 text-gray-500 group-hover:text-blue-400 transition-colors" />
                  </a>
                )}

                {/* 🔥 Множественные файлы из files[] */}
                {achievement.files && achievement.files.map((file, index) => (
                  <a
                    key={file.id}
                    href={file.file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 bg-[#0f1419] border border-gray-800 rounded-xl hover:border-blue-500/30 transition-all group animate-fade-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">
                        {getFileName(file.file)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {getFileType(file.file)}
                      </p>
                      <p className="text-xs text-gray-600">
                        {new Date(file.uploaded_at).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                    <Download className="w-5 h-5 text-gray-500 group-hover:text-blue-400 transition-colors" />
                  </a>
                ))}
              </div>
            </div>
          ) : null}

          {/* Навыки */}
          {achievement.skill_names && achievement.skill_names.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Навыки
              </h2>
              <div className="flex flex-wrap gap-2">
                {achievement.skill_names.map((skill: any, i: number) => (
                  <span 
                    key={i}
                    className="px-3 py-1.5 bg-gray-800 rounded-lg text-sm text-gray-300"
                  >
                    {typeof skill === 'object' ? skill.name : skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
