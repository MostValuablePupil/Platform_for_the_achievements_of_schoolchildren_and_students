// frontend/src/pages/VerifierAchievementsPage.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient, { achievementAPI } from '../api/client';
import { useGameStore } from '../store/useGameStore';
import { CheckCircle, XCircle, FileText, ExternalLink, ChevronDown, ChevronUp, Search, Image, Download, Loader2, Brain, Clock, Eye } from 'lucide-react';

interface AchievementFile {
  id: number;
  file: string;
  uploaded_at: string;
}

interface AchievementItem {
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
  proof_file?: string;
  skill_names?: string[];
  files?: AchievementFile[];
  ai_analysis_result?: string;
  created: string;
}

const TYPE_LABELS: Record<string, string> = {
  OLYMPIAD: '🧠 Олимпиада',
  HACKATHON: '💻 Проект / Хакатон',
  COURSE: '📚 Курс / Обучение',
  VOLUNTEERING: '🤝 Волонтерство',
  SCIENCE: '🔬 Научная работа',
  SPORT_ART: '🏅 Спорт / Творчество',
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  PENDING: { label: 'На проверке', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
  VERIFIED: { label: 'Подтверждено', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' },
  REJECTED: { label: 'Отклонено', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
};

export default function VerifierAchievementsPage() {
  const navigate = useNavigate();
  const { verifyAchievement, rejectAchievement } = useGameStore();
  const [achievements, setAchievements] = useState<AchievementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'VERIFIED' | 'REJECTED'>('PENDING');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadAchievements = async () => {
    try {
      setLoading(true);
      const res = await achievementAPI.getAll();
      setAchievements(res.data as any);
    } catch (err) {
      console.error('Ошибка загрузки достижений:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAchievements();
  }, []);

  const handleVerify = async (id: number) => {
    setActionLoading(id);
    try {
      await verifyAchievement(id);
      setAchievements(prev => prev.map(a => a.id === id ? { ...a, status: 'VERIFIED' } : a));
    } catch (err) {
      console.error('Ошибка верификации:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: number) => {
    setActionLoading(id);
    try {
      await rejectAchievement(id);
      setAchievements(prev => prev.map(a => a.id === id ? { ...a, status: 'REJECTED' } : a));
    } catch (err) {
      console.error('Ошибка отклонения:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSetPending = async (id: number) => {
    setActionLoading(id);
    try {
      await apiClient.patch(`achievements/${id}/set-pending/`);
      setAchievements(prev => prev.map(a => a.id === id ? { ...a, status: 'PENDING' } : a));
    } catch (err) {
      console.error('Ошибка:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = achievements.filter(a => {
    const matchesFilter = filter === 'ALL' || a.status === filter;
    const matchesSearch = !searchQuery || 
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.student_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const counts = {
    ALL: achievements.length,
    PENDING: achievements.filter(a => a.status === 'PENDING').length,
    VERIFIED: achievements.filter(a => a.status === 'VERIFIED').length,
    REJECTED: achievements.filter(a => a.status === 'REJECTED').length,
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-gray-500">Загрузка достижений...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Верификация достижений</h1>
        <p className="text-gray-400 text-sm">Проверяйте и подтверждайте достижения студентов</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
        <div className="flex gap-2">
          {(['ALL', 'PENDING', 'VERIFIED', 'REJECTED'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === status
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'bg-[#1a2332] text-gray-400 border border-gray-800 hover:text-white hover:border-gray-600'
              }`}
            >
              {status === 'ALL' ? 'Все' : STATUS_CONFIG[status].label}
              <span className="ml-2 text-xs opacity-60">{counts[status]}</span>
            </button>
          ))}
        </div>
        
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Поиск по названию или студенту..."
            className="w-full pl-10 pr-4 py-2 bg-[#1a2332] border border-gray-800 rounded-xl text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* Achievements List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-4">📭</div>
          <p className="text-gray-400">
            {filter === 'PENDING' ? 'Нет достижений на проверке' : 'Нет достижений по выбранному фильтру'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(achievement => {
            const statusConf = STATUS_CONFIG[achievement.status] || STATUS_CONFIG.PENDING;
            const isExpanded = expandedId === achievement.id;
            const isActioning = actionLoading === achievement.id;

            return (
              <div
                key={achievement.id}
                className="bg-[#1a2332] border border-gray-800 rounded-2xl overflow-hidden transition-all hover:border-gray-700"
              >
                {/* Compact Row */}
                <div
                  className="flex items-center gap-4 p-5 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : achievement.id)}
                >
                  {/* Status dot */}
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                    achievement.status === 'PENDING' ? 'bg-yellow-400' :
                    achievement.status === 'VERIFIED' ? 'bg-green-400' : 'bg-red-400'
                  }`} />
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className="text-white font-medium truncate">{achievement.title}</h3>
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {TYPE_LABELS[achievement.event_type] || achievement.event_type}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span>{achievement.student_name}</span>
                      <span>•</span>
                      <span>{new Date(achievement.created).toLocaleDateString('ru-RU')}</span>
                      <span>•</span>
                      <span className="text-cyan-400/70">+{achievement.points} XP</span>
                    </div>
                  </div>

                  {/* Status badge */}
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusConf.bg} ${statusConf.color} border ${statusConf.border} flex-shrink-0`}>
                    {statusConf.label}
                  </span>

                  {/* Expand icon */}
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  )}
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-gray-800/50 pt-4 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-2">Описание</h4>
                        <p className="text-gray-300 text-sm leading-relaxed">{achievement.description}</p>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-1">Организация</h4>
                          <p className="text-gray-300 text-sm">{achievement.organization}</p>
                        </div>
                        {achievement.link && (
                          <div>
                            <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-1">Ссылка</h4>
                            <a
                              href={achievement.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              Открыть
                            </a>
                          </div>
                        )}
                        {achievement.proof_file && (
                          <div>
                            <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-1">Документ</h4>
                            <a
                              href={achievement.proof_file}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 transition-colors"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              Скачать подтверждение
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Прикреплённые файлы (фото / документы) */}
                    {achievement.files && achievement.files.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Image className="w-3.5 h-3.5" />
                          Прикреплённые файлы ({achievement.files.length})
                        </h4>
                        <div className="flex flex-wrap gap-3">
                          {achievement.files.map((f) => {
                            const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(f.file);
                            const fileUrl = f.file.startsWith('http') ? f.file : `http://127.0.0.1:8000${f.file}`;
                            return (
                              <div key={f.id} className="group relative">
                                {isImage ? (
                                  <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                                    <img
                                      src={fileUrl}
                                      alt="Подтверждение"
                                      className="w-32 h-32 object-cover rounded-xl border border-gray-700 hover:border-blue-500 transition-all cursor-pointer"
                                    />
                                  </a>
                                ) : (
                                  <a
                                    href={fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-4 py-3 bg-[#0f1419] border border-gray-700 hover:border-blue-500 rounded-xl text-sm text-gray-300 hover:text-blue-400 transition-all"
                                  >
                                    <Download className="w-4 h-4" />
                                    Скачать файл
                                  </a>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* AI-анализ (компактный статус) */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Brain className="w-3.5 h-3.5 text-gray-500" />
                        {achievement.ai_analysis_result ? (
                          <span className="text-green-400/80">✅ AI-анализ завершён</span>
                        ) : achievement.files && achievement.files.length > 0 ? (
                          <span className="text-yellow-400/80 flex items-center gap-1.5">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Анализируется…
                          </span>
                        ) : (
                          <span className="text-gray-600">Файлы не прикреплены</span>
                        )}
                      </div>
                    </div>

                    {/* Skills */}
                    {achievement.skill_names && achievement.skill_names.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-2">Навыки</h4>
                        <div className="flex flex-wrap gap-2">
                          {achievement.skill_names.map((skill, i) => (
                            <span key={i} className="px-2.5 py-1 bg-[#0f1419] rounded-lg text-xs text-gray-400">
                              {typeof skill === 'object' ? (skill as any).name : skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center gap-3 pt-3 border-t border-gray-800/50">
                      {/* Кнопка Подробнее */}
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/verifier/achievements/${achievement.id}`); }}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 rounded-xl text-sm font-medium transition-all"
                      >
                        <Eye className="w-4 h-4" />
                        Подробнее
                      </button>
                      {achievement.status !== 'VERIFIED' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleVerify(achievement.id); }}
                          disabled={isActioning}
                          className="flex items-center gap-2 px-5 py-2.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                        >
                          <CheckCircle className="w-4 h-4" />
                          {isActioning ? 'Обработка...' : 'Подтвердить'}
                        </button>
                      )}
                      {achievement.status !== 'REJECTED' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleReject(achievement.id); }}
                          disabled={isActioning}
                          className="flex items-center gap-2 px-5 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4" />
                          {isActioning ? 'Обработка...' : 'Отклонить'}
                        </button>
                      )}
                      {achievement.status !== 'PENDING' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleSetPending(achievement.id); }}
                          disabled={isActioning}
                          className="flex items-center gap-2 px-5 py-2.5 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/30 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                        >
                          <Clock className="w-4 h-4" />
                          {isActioning ? 'Обработка...' : 'На проверку'}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
