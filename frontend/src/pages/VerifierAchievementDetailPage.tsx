// frontend/src/pages/VerifierAchievementDetailPage.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient, { achievementAPI } from '../api/client';
import { useGameStore } from '../store/useGameStore';
import {
  ArrowLeft, Trophy, Calendar, Building2, Link2, Award, FileText,
  CheckCircle, Clock, XCircle, Image, Download, Brain, Loader2,
  Pencil, Save, X
} from 'lucide-react';

interface AchievementFile {
  id: number;
  file: string;
  uploaded_at: string;
}

interface AchievementDetail {
  id: number;
  title: string;
  description: string;
  event_type: string;
  event_type_display: string;
  level_category: string;
  level_category_display: string;
  achievement_level: string;
  achievement_level_display: string;
  organization: string;
  link?: string;
  points: number;
  xp_calculated: number;
  status: string;
  student: number;
  student_name: string;
  verifier?: number;
  skills?: any[];
  skill_names?: string[];
  files?: AchievementFile[];
  ai_analysis_result?: string;
  is_rewarded: boolean;
  verified_at?: string;
  event_date?: string;
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

export default function VerifierAchievementDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { verifyAchievement, rejectAchievement } = useGameStore();

  const [achievement, setAchievement] = useState<AchievementDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: '',
    description: '',
    organization: '',
    link: '',
  });
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    if (id) {
      setLoading(true);
      apiClient.get(`achievements/${id}/`)
        .then(res => {
          setAchievement(res.data);
          setEditData({
            title: res.data.title || '',
            description: res.data.description || '',
            organization: res.data.organization || '',
            link: res.data.link || '',
          });
        })
        .catch(() => setError('Ошибка загрузки достижения'))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleVerify = async () => {
    if (!achievement) return;
    setActionLoading(true);
    try {
      await verifyAchievement(achievement.id);
      setAchievement(prev => prev ? { ...prev, status: 'VERIFIED' } : prev);
    } catch {}
    setActionLoading(false);
  };

  const handleReject = async () => {
    if (!achievement) return;
    setActionLoading(true);
    try {
      await rejectAchievement(achievement.id);
      setAchievement(prev => prev ? { ...prev, status: 'REJECTED' } : prev);
    } catch {}
    setActionLoading(false);
  };

  const handleSetPending = async () => {
    if (!achievement) return;
    setActionLoading(true);
    try {
      await apiClient.patch(`achievements/${achievement.id}/set-pending/`);
      setAchievement(prev => prev ? { ...prev, status: 'PENDING' } : prev);
    } catch {}
    setActionLoading(false);
  };

  const handleSave = async () => {
    if (!achievement) return;
    setSaveLoading(true);
    try {
      const res = await achievementAPI.update(achievement.id, editData as any);
      setAchievement(res.data as any);
      setIsEditing(false);
    } catch (err) {
      console.error('Ошибка сохранения:', err);
    }
    setSaveLoading(false);
  };

  const statusConfig: Record<string, { label: string; color: string; bg: string; border: string; icon: any }> = {
    PENDING: { label: 'На проверке', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', icon: Clock },
    VERIFIED: { label: 'Подтверждено', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', icon: CheckCircle },
    REJECTED: { label: 'Отклонено', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', icon: XCircle },
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-gray-500">Загрузка достижения...</p>
        </div>
      </div>
    );
  }

  if (error || !achievement) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <div className="text-red-400">{error || 'Достижение не найдено'}</div>
      </div>
    );
  }

  const sc = statusConfig[achievement.status] || statusConfig.PENDING;
  const StatusIcon = sc.icon;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Кнопка назад */}
      <button
        onClick={() => navigate('/verifier/achievements')}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Назад к списку</span>
      </button>

      {/* Заголовок + статус */}
      <div className="bg-[#1a2332] border border-gray-800 rounded-2xl p-8 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-4 flex-1">
            <div className="w-14 h-14 bg-green-500/20 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Trophy className="w-7 h-7 text-green-500" />
            </div>
            <div className="flex-1">
              {isEditing ? (
                <input
                  value={editData.title}
                  onChange={e => setEditData({ ...editData, title: e.target.value })}
                  className="w-full text-2xl font-bold bg-[#0f1419] border border-gray-700 rounded-xl px-4 py-2 text-white focus:border-blue-500 outline-none"
                />
              ) : (
                <h1 className="text-2xl font-bold text-white mb-2">{achievement.title}</h1>
              )}
              <div className="flex items-center gap-3 text-sm text-gray-400 mt-2">
                <span>{TYPE_LABELS[achievement.event_type] || achievement.event_type}</span>
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

          {/* Статус бейдж */}
          <span className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 ${sc.bg} ${sc.color} border ${sc.border}`}>
            <StatusIcon className="w-4 h-4" />
            {sc.label}
          </span>
        </div>

        {/* Студент */}
        <div className="text-sm text-gray-500 mb-4">
          Студент: <span className="text-gray-300">{achievement.student_name}</span>
        </div>

        {/* Кнопки статусов + редактирование */}
        <div className="flex items-center gap-3 flex-wrap">
          {achievement.status !== 'VERIFIED' && (
            <button onClick={handleVerify} disabled={actionLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 rounded-xl text-sm font-medium transition-all disabled:opacity-50">
              <CheckCircle className="w-4 h-4" />
              Подтвердить
            </button>
          )}
          {achievement.status !== 'REJECTED' && (
            <button onClick={handleReject} disabled={actionLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-xl text-sm font-medium transition-all disabled:opacity-50">
              <XCircle className="w-4 h-4" />
              Отклонить
            </button>
          )}
          {achievement.status !== 'PENDING' && (
            <button onClick={handleSetPending} disabled={actionLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/30 rounded-xl text-sm font-medium transition-all disabled:opacity-50">
              <Clock className="w-4 h-4" />
              На проверку
            </button>
          )}

          <div className="ml-auto">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <button onClick={handleSave} disabled={saveLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 rounded-xl text-sm font-medium transition-all disabled:opacity-50">
                  <Save className="w-4 h-4" />
                  {saveLoading ? 'Сохранение...' : 'Сохранить'}
                </button>
                <button onClick={() => setIsEditing(false)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gray-700/30 hover:bg-gray-700/50 text-gray-400 border border-gray-700 rounded-xl text-sm font-medium transition-all">
                  <X className="w-4 h-4" />
                  Отмена
                </button>
              </div>
            ) : (
              <button onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 rounded-xl text-sm font-medium transition-all">
                <Pencil className="w-4 h-4" />
                Редактировать
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Описание + информация */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Описание — 2/3 */}
        <div className="lg:col-span-2 bg-[#1a2332] border border-gray-800 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Описание</h2>
          {isEditing ? (
            <textarea
              value={editData.description}
              onChange={e => setEditData({ ...editData, description: e.target.value })}
              rows={5}
              className="w-full bg-[#0f1419] border border-gray-700 rounded-xl px-4 py-3 text-gray-300 text-sm focus:border-blue-500 outline-none resize-none"
            />
          ) : (
            <p className="text-gray-300 text-sm leading-relaxed">{achievement.description || 'Нет описания'}</p>
          )}
        </div>

        {/* Мета-информация — 1/3 */}
        <div className="bg-[#1a2332] border border-gray-800 rounded-2xl p-6 space-y-4">
          <div>
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Building2 className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider">Организация</span>
            </div>
            {isEditing ? (
              <input
                value={editData.organization}
                onChange={e => setEditData({ ...editData, organization: e.target.value })}
                className="w-full bg-[#0f1419] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 outline-none"
              />
            ) : (
              <p className="text-white text-sm">{achievement.organization || '—'}</p>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Award className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider">XP</span>
            </div>
            <p className="text-cyan-400 font-bold text-lg">+{achievement.points} XP</p>
          </div>

          <div>
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Calendar className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider">Дата создания</span>
            </div>
            <p className="text-white text-sm">
              {new Date(achievement.created).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          {achievement.verified_at && (
            <div>
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <CheckCircle className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider">Дата проверки</span>
              </div>
              <p className="text-white text-sm">
                {new Date(achievement.verified_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          )}

          {achievement.event_date && (
            <div>
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider">Дата мероприятия</span>
              </div>
              <p className="text-white text-sm">
                {new Date(achievement.event_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          )}

          {achievement.hours_count && (
            <div>
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider">Часы</span>
              </div>
              <p className="text-white text-sm">{achievement.hours_count} ч.</p>
            </div>
          )}

          {achievement.link && !isEditing && (
            <div>
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Link2 className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider">Ссылка</span>
              </div>
              <a href={achievement.link} target="_blank" rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 text-sm transition-colors break-all">
                {achievement.link}
              </a>
            </div>
          )}

          {isEditing && (
            <div>
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Link2 className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider">Ссылка</span>
              </div>
              <input
                value={editData.link}
                onChange={e => setEditData({ ...editData, link: e.target.value })}
                className="w-full bg-[#0f1419] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 outline-none"
                placeholder="https://..."
              />
            </div>
          )}

          {achievement.has_certificate && (
            <div>
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <FileText className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider">Сертификат</span>
              </div>
              <p className="text-green-400 text-sm">Есть сертификат/диплом</p>
            </div>
          )}
        </div>
      </div>

      {/* Прикреплённые файлы */}
      {achievement.files && achievement.files.length > 0 && (
        <div className="bg-[#1a2332] border border-gray-800 rounded-2xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Image className="w-4 h-4" />
            Прикреплённые файлы ({achievement.files.length})
          </h2>
          <div className="flex flex-wrap gap-4">
            {achievement.files.map(f => {
              const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(f.file);
              const fileUrl = f.file.startsWith('http') ? f.file : `http://127.0.0.1:8000${f.file}`;
              return (
                <div key={f.id}>
                  {isImage ? (
                    <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                      <img
                        src={fileUrl}
                        alt="Подтверждение"
                        className="w-48 h-48 object-cover rounded-xl border border-gray-700 hover:border-blue-500 transition-all cursor-pointer"
                      />
                    </a>
                  ) : (
                    <a href={fileUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-5 py-4 bg-[#0f1419] border border-gray-700 hover:border-blue-500 rounded-xl text-gray-300 hover:text-blue-400 transition-all">
                      <Download className="w-5 h-5" />
                      Скачать файл
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AI-анализ */}
      <div className="bg-[#1a2332] border border-gray-800 rounded-2xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Brain className="w-4 h-4" />
          AI-анализ документа
        </h2>
        {achievement.ai_analysis_result ? (
          <div className="bg-[#0f1419] border border-gray-700 rounded-xl p-4">
            <p className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">
              {achievement.ai_analysis_result}
            </p>
          </div>
        ) : achievement.files && achievement.files.length > 0 ? (
          <div className="flex items-center gap-2 text-yellow-400/80 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Фото анализируется нейросетью…</span>
          </div>
        ) : (
          <p className="text-gray-600 text-sm">Файлы не прикреплены — анализ не требуется</p>
        )}
      </div>

      {/* Навыки */}
      {achievement.skill_names && achievement.skill_names.length > 0 && (
        <div className="bg-[#1a2332] border border-gray-800 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Навыки ({achievement.skill_names.length})
          </h2>
          <div className="flex flex-wrap gap-2">
            {achievement.skill_names.map((skill, i) => (
              <span key={i} className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm text-blue-300">
                {typeof skill === 'object' ? (skill as any).name : skill}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
