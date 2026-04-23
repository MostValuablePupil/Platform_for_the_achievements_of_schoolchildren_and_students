// frontend/src/pages/CreateAchievementPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Award, Building2, Link2, X, ArrowLeft, Calendar } from 'lucide-react';
import apiClient from '../api/client';
import { useGameStore } from '../store/useGameStore';
import Layout from '../components/Layout';

type EventType = 'OLYMPIAD' | 'HACKATHON' | 'COURSE' | 'VOLUNTEERING' | 'SCIENCE' | 'SPORT_ART';
type AchievementLevel = 'PARTICIPANT' | 'PRIZE' | 'WINNER';

const TYPE_OPTIONS = [
  { value: 'OLYMPIAD', label: '🧠 Олимпиада' },
  { value: 'HACKATHON', label: '💻 Проект / Хакатон' },
  { value: 'COURSE', label: '📚 Курс / Обучение' },
  { value: 'VOLUNTEERING', label: '🤝 Волонтерство' },
  { value: 'SCIENCE', label: '🔬 Научная работа' },
  { value: 'SPORT_ART', label: '🏅 Спорт / Творчество' },
];

// Уровни для каждого типа достижения (из таблицы)
const LEVEL_OPTIONS: Record<EventType, { value: string; label: string }[]> = {
  OLYMPIAD: [
    { value: 'UNIVERSITY', label: 'Вузовская' },
    { value: 'REGIONAL', label: 'Региональная' },
    { value: 'ALL_RUSSIA', label: 'Всероссийская' },
  ],
  HACKATHON: [
    { value: 'INTERNAL', label: 'Внутривузовский' },
    { value: 'INTER_UNIVERSITY', label: 'Межвузовский' },
  ],
  COURSE: [
    { value: 'ONLINE_SHORT', label: 'Онлайн-курс (до 20 ч)' },
    { value: 'RETRAINING', label: 'Профессиональная переподготовка' },
  ],
  VOLUNTEERING: [
    { value: 'SHORT', label: '1-10 часов' },
    { value: 'LONG', label: '10+ часов' },
  ],
  SCIENCE: [
    { value: 'ARTICLE', label: 'Статья в сборнике' },
    { value: 'VAK', label: 'Публикация в журнале ВАК' },
  ],
  SPORT_ART: [
    { value: 'UNIVERSITY', label: 'Вузовский' },
    { value: 'REGIONAL', label: 'Региональный' },
    { value: 'ALL_RUSSIA', label: 'Всероссийский' },
  ],
};

export default function CreateAchievementPage() {
  const navigate = useNavigate();
  const { fetchCurrentUser, fetchAchievements, currentUser } = useGameStore();
  
  const [eventType, setEventType] = useState<EventType | ''>('');
  const [levelCategory, setLevelCategory] = useState('');
  const [achievementLevel, setAchievementLevel] = useState<AchievementLevel>('PARTICIPANT');
  const [hoursCount, setHoursCount] = useState('');
  const [hasCertificate, setHasCertificate] = useState(false);
  const [date, setDate] = useState(''); // Поле для даты
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    organization: '',
    link: '',
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [calculatedXP, setCalculatedXP] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');


// Сброс уровня при смене типа
  useEffect(() => {
    setLevelCategory('');
  }, [eventType]);

  // Расчёт XP
  useEffect(() => {
    const xpTable: Record<string, any> = {
      OLYMPIAD: {
        UNIVERSITY: { PARTICIPANT: 50, PRIZE: 150, WINNER: 300 },
        REGIONAL: { PARTICIPANT: 100, PRIZE: 250, WINNER: 500 },
        ALL_RUSSIA: { PARTICIPANT: 200, PRIZE: 500, WINNER: 1000 },
      },
      HACKATHON: {
        INTERNAL: { PARTICIPANT: 80, PRIZE: 200, WINNER: 400 },
        INTER_UNIVERSITY: { PARTICIPANT: 150, PRIZE: 350, WINNER: 700 },
      },
      COURSE: {
        ONLINE_SHORT: { BASE: 100, BONUS: 50 },
        RETRAINING: { BASE: 300, BONUS: 100 },
      },
      VOLUNTEERING: {
        SHORT: { perHour: 30, bonus: 50 },
        LONG: { perHour: 40, bonus: 0 },
      },
      SCIENCE: {
        ARTICLE: { PARTICIPANT: 150, WINNER: 300 },
        VAK: { PARTICIPANT: 400, WINNER: 800 },
      },
      SPORT_ART: {
        UNIVERSITY: { PARTICIPANT: 40, PRIZE: 100, WINNER: 250 },
        REGIONAL: { PARTICIPANT: 60, PRIZE: 150, WINNER: 350 },
        ALL_RUSSIA: { PARTICIPANT: 100, PRIZE: 250, WINNER: 500 },
      },
    };

    let xp = 0;
    if (eventType && levelCategory) {
      const table = xpTable[eventType];
      const levelData = table[levelCategory];
      
      if (eventType === 'COURSE') {
        xp = levelData?.BASE || 0;
        if (hasCertificate) xp += levelData?.BONUS || 0;
      } else if (eventType === 'VOLUNTEERING') {
        const hours = parseInt(hoursCount) || 0;
        xp = (levelData?.perHour || 0) * hours + (levelData?.bonus || 0);
      } else {
        xp = levelData?.[achievementLevel] || 0;
      }
    }
    
    setCalculatedXP(xp);
  }, [eventType, levelCategory, achievementLevel, hoursCount, hasCertificate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      // Превращаем FileList в массив и добавляем к уже выбранным
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...filesArray]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!eventType || !levelCategory || !formData.title) {
      setError('Заполните все обязательные поля');
      return;
    }

    setIsLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('event_type', eventType);
      formDataToSend.append('level_category', levelCategory);
      formDataToSend.append('achievement_level', achievementLevel);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('organization', formData.organization);
      formDataToSend.append('link', formData.link);
      
      // Отправляем остальные данные

      if (date) {
        formDataToSend.append('event_date', date);
      }
      
      if (hoursCount && eventType === 'VOLUNTEERING') {
        formDataToSend.append('hours_count', hoursCount);
      }
      if (eventType === 'COURSE') {
        formDataToSend.append('has_certificate', String(hasCertificate));
      }
      selectedFiles.forEach((file) => {
        formDataToSend.append('uploaded_files', file);
      });

      await apiClient.post('achievements/', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (currentUser) {
        await fetchCurrentUser(currentUser.id);
        await fetchAchievements({ student: currentUser.id });
      }

      navigate('/achievements');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Ошибка при создании достижения');
    } finally {
      setIsLoading(false);
    }
  };

  const isVolunteering = eventType === 'VOLUNTEERING';
  const isCourse = eventType === 'COURSE';
  const needsLevel = !isCourse && !isVolunteering && levelCategory;

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Заголовок и кнопка Назад */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-white">Добавить достижение</h1>
            <p className="text-gray-500 text-sm mt-1">Заполните информацию о вашем новом достижении</p>
          </div>
          <button 
            onClick={() => navigate('/achievements')}
            className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-[#1a2332] border border-gray-800 rounded-2xl p-6 space-y-5">
            
            {/* Название */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Название достижения <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full bg-[#0f1419] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Например: Победа в олимпиаде по программированию"
                required
              />
            </div>

            {/* Тип, Уровень и Дата */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Тип достижения <span className="text-red-500">*</span>
                </label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value as EventType)}
                  className="w-full bg-[#0f1419] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none cursor-pointer"
                  required
                >
                  <option value="">Выберите тип</option>
                  {TYPE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Уровень <span className="text-red-500">*</span>
                </label>
                <select
                  value={levelCategory}
                  onChange={(e) => setLevelCategory(e.target.value)}
                  className="w-full bg-[#0f1419] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                  disabled={!eventType}
                >
                  <option value="">
                    {eventType ? 'Выберите уровень' : 'Сначала выберите тип'}
                  </option>
                  {eventType && LEVEL_OPTIONS[eventType as EventType]?.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Дата <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-600" />
                  </div>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-[#0f1419] border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Результат (для олимпиад, хакатонов, науки, спорта) */}
            {needsLevel && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Результат <span className="text-red-500">*</span>
                </label>
                <select
                  value={achievementLevel}
                  onChange={(e) => setAchievementLevel(e.target.value as AchievementLevel)}
                  className="w-full bg-[#0f1419] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none cursor-pointer"
                >
                  <option value="PARTICIPANT">Участие</option>
                  <option value="PRIZE">Призёр</option>
                  <option value="WINNER">Победитель</option>
                </select>
              </div>
            )}

            {/* Часы для волонтёрства */}
            {isVolunteering && levelCategory && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Количество часов <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={hoursCount}
                  onChange={(e) => setHoursCount(e.target.value)}
                  className="w-full bg-[#0f1419] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Введите количество часов"
                  min="1"
                  required
                />
              </div>
            )}

            {/* Сертификат для курсов */}
            {isCourse && levelCategory && (
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={hasCertificate}
                  onChange={(e) => setHasCertificate(e.target.checked)}
                  className="w-5 h-5 rounded-lg border-gray-700 bg-[#0f1419] text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                />
                <span className="text-gray-300 group-hover:text-white transition-colors">
                  Есть сертификат/диплом <span className="text-gray-500 text-sm">(+бонус XP)</span>
                </span>
              </label>
            )}

            {/* Описание */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Описание <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full bg-[#0f1419] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                placeholder="Опишите ваше достижение подробнее..."
                rows={4}
                required
              />
            </div>

            {/* Организация и ссылка */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Организация <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 className="h-5 w-5 text-gray-600" />
                  </div>
                  <input
                    type="text"
                    value={formData.organization}
                    onChange={(e) => setFormData({...formData, organization: e.target.value})}
                    className="w-full bg-[#0f1419] border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="Название организации"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Ссылка <span className="text-gray-500 text-xs font-normal">(опционально)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Link2 className="h-5 w-5 text-gray-600" />
                  </div>
                  <input
                    type="url"
                    value={formData.link}
                    onChange={(e) => setFormData({...formData, link: e.target.value})}
                    className="w-full bg-[#0f1419] border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>

            {/* Загрузка файла */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Сертификаты и документы <span className="text-gray-500 text-xs font-normal">(можно несколько)</span>
              </label>
              <div className="border-2 border-dashed border-gray-700 rounded-xl p-6 text-center hover:border-blue-500/50 transition-colors bg-[#0f1419]/30">
                <Upload className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                
                <input
                  type="file"
                  multiple // ГЛАВНОЕ: разрешает выбирать несколько файлов
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                
                <label 
                  htmlFor="file-upload" 
                  className="inline-block px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm cursor-pointer transition-colors mb-2"
                >
                  Выбрать файлы
                </label>
                
                <p className="text-xs text-gray-600">PDF, JPG, PNG, DOC (максимум 10 МБ на файл)</p>
              </div>

              {/* Список выбранных файлов */}
              {selectedFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-800/40 border border-gray-700 rounded-xl animate-fade-in">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <Award className="w-4 h-4 text-blue-400 shrink-0" />
                        <span className="text-sm text-gray-300 truncate">{file.name}</span>
                        <span className="text-[10px] text-gray-500 shrink-0">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="p-1 hover:bg-red-500/10 rounded-lg text-gray-500 hover:text-red-400 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* XP Preview */}
            {calculatedXP > 0 && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Award className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Начисление XP</p>
                  <p className="text-2xl font-bold text-cyan-400">+{calculatedXP} XP</p>
                </div>
              </div>
            )}

            {/* Info */}
            <div className="bg-gray-800/50 rounded-xl p-4 text-sm text-gray-400 space-y-2">
              <p>
                <span className="text-blue-400 font-medium">Верификация:</span> После добавления 
                достижение будет отправлено на проверку. Вы получите уведомление, когда администратор 
                подтвердит информацию.
              </p>
              <p>
                <span className="text-cyan-400 font-medium">AI Анализ:</span> Привязанные к этому достижению навыки будут автоматически определены нейросетью на основе загруженных документов.
              </p>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-4 pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25"
              >
                {isLoading ? 'Добавление...' : 'Добавить достижение'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/achievements')}
                className="px-6 py-3 border border-gray-700 rounded-xl text-gray-400 hover:text-white hover:border-gray-600 transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
}