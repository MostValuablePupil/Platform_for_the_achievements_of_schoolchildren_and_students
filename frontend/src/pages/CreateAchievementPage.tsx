// frontend/src/pages/CreateAchievementPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Award, Building2, Link2, X, ArrowLeft, Calendar, Brain, Laptop, BookOpen, Heart, Microscope, Medal } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { ru } from 'date-fns/locale';
import apiClient from '../api/client';
import { useGameStore } from '../store/useGameStore';
import Layout from '../components/Layout';
import CustomSelect from '../components/CustomSelect';
import 'react-datepicker/dist/react-datepicker.css';

type EventType = 'OLYMPIAD' | 'HACKATHON' | 'COURSE' | 'VOLUNTEERING' | 'SCIENCE' | 'SPORT_ART';
type AchievementLevel = 'PARTICIPANT' | 'PRIZE' | 'WINNER';

// Опции для типа достижения с иконками
const TYPE_OPTIONS = [
  { value: 'OLYMPIAD', label: 'Олимпиада', icon: <Brain className="w-4 h-4 text-pink-400" /> },
  { value: 'HACKATHON', label: 'Проект / Хакатон', icon: <Laptop className="w-4 h-4 text-cyan-400" /> },
  { value: 'COURSE', label: 'Курс / Обучение', icon: <BookOpen className="w-4 h-4 text-green-400" /> },
  { value: 'VOLUNTEERING', label: 'Волонтерство', icon: <Heart className="w-4 h-4 text-yellow-400" /> },
  { value: 'SCIENCE', label: 'Научная работа', icon: <Microscope className="w-4 h-4 text-purple-400" /> },
  { value: 'SPORT_ART', label: 'Спорт / Творчество', icon: <Medal className="w-4 h-4 text-orange-400" /> },
];

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
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
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

  useEffect(() => { setLevelCategory(''); }, [eventType]);

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
      if (eventType === 'COURSE') { xp = levelData?.BASE || 0; if (hasCertificate) xp += levelData?.BONUS || 0; }
      else if (eventType === 'VOLUNTEERING') { const hours = parseInt(hoursCount) || 0; xp = (levelData?.perHour || 0) * hours + (levelData?.bonus || 0); }
      else { xp = levelData?.[achievementLevel] || 0; }
    }
    setCalculatedXP(xp);
  }, [eventType, levelCategory, achievementLevel, hoursCount, hasCertificate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
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
    if (!eventType || !levelCategory || !formData.title || !selectedDate) {
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
      
      if (selectedDate) {
        formDataToSend.append('event_date', selectedDate.toISOString().split('T')[0]);
      }
      
      if (hoursCount && eventType === 'VOLUNTEERING') formDataToSend.append('hours_count', hoursCount);
      if (eventType === 'COURSE') formDataToSend.append('has_certificate', String(hasCertificate));
      selectedFiles.forEach(file => formDataToSend.append('uploaded_files', file));

      await apiClient.post('achievements/', formDataToSend, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (currentUser) { await fetchCurrentUser(currentUser.id); await fetchAchievements({ student: currentUser.id }); }
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

  // Получаем опции уровня для текущего типа
  const levelOptions = eventType ? LEVEL_OPTIONS[eventType as EventType]?.map(opt => ({
    value: opt.value,
    label: opt.label
  })) || [] : [];

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6 px-4 md:px-0">
        
        {/* Заголовок */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-white">Добавить достижение</h1>
            <p className="text-gray-500 text-sm mt-1">Заполните информацию о вашем новом достижении</p>
          </div>
          <button onClick={() => navigate('/achievements')} className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors bg-[#1a2332] px-3 py-2 rounded-lg border border-gray-800">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Назад</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-[#1a2332] border border-gray-800 rounded-xl md:rounded-2xl p-4 md:p-6 space-y-4 md:space-y-5">
            
            {/* Название */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Название достижения <span className="text-red-500">*</span></label>
              <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full bg-[#0f1419] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors" placeholder="Например: Победа в олимпиаде по программированию" required />
            </div>

            {/* ✅ ТИП ДОСТИЖЕНИЯ - CustomSelect */}
            <CustomSelect
              label="Тип достижения"
              options={TYPE_OPTIONS}
              value={eventType}
              onChange={(val) => setEventType(val as EventType)}
              placeholder="Выберите тип"
              required
            />

            {/* Сетка для уровня и даты */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* ✅ УРОВЕНЬ - CustomSelect */}
              <CustomSelect
                label="Уровень"
                options={levelOptions}
                value={levelCategory}
                onChange={setLevelCategory}
                placeholder={!eventType ? 'Сначала выберите тип' : 'Выберите уровень'}
                disabled={!eventType}
                required
              />

              {/* 📅 ДАТА - DatePicker */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Дата <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    <Calendar className="h-5 w-5 text-gray-600" />
                  </div>
                  <DatePicker
                    selected={selectedDate}
                    onChange={(date: Date | null) => setSelectedDate(date)}
                    dateFormat="dd.MM.yyyy"
                    locale={ru}
                    placeholderText="ДД.ММ.ГГГГ"
                    className="w-full bg-[#0f1419] border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors [color-scheme:dark]"
                    wrapperClassName="w-full"
                    popperPlacement="bottom-start"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Результат */}
            {needsLevel && (
              <CustomSelect
                label="Результат"
                options={[
                  { value: 'PARTICIPANT', label: 'Участие' },
                  { value: 'PRIZE', label: 'Призёр' },
                  { value: 'WINNER', label: 'Победитель' }
                ]}
                value={achievementLevel}
                onChange={(val) => setAchievementLevel(val as AchievementLevel)}
                required
              />
            )}

            {/* Часы для волонтёрства */}
            {isVolunteering && levelCategory && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Количество часов <span className="text-red-500">*</span></label>
                <input type="number" value={hoursCount} onChange={(e) => setHoursCount(e.target.value)} className="w-full bg-[#0f1419] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors" placeholder="Введите количество часов" min="1" required />
              </div>
            )}

            {/* Сертификат для курсов */}
            {isCourse && levelCategory && (
              <label className="flex items-center gap-3 cursor-pointer group py-2">
                <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-colors ${hasCertificate ? 'bg-blue-500 border-blue-500' : 'border-gray-600 bg-[#0f1419]'}`}>
                  {hasCertificate && <Check className="w-4 h-4 text-white" />}
                </div>
                <input type="checkbox" checked={hasCertificate} onChange={(e) => setHasCertificate(e.target.checked)} className="hidden" />
                <span className="text-gray-300 group-hover:text-white transition-colors select-none">Есть сертификат/диплом <span className="text-blue-400 text-sm font-medium">(+бонус XP)</span></span>
              </label>
            )}

            {/* Описание */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Описание <span className="text-red-500">*</span></label>
              <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full bg-[#0f1419] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors resize-none min-h-[80px]" placeholder="Опишите ваше достижение подробнее..." rows={3} required />
            </div>

            {/* Организация и ссылка */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Организация <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Building2 className="h-5 w-5 text-gray-600" /></div>
                  <input type="text" value={formData.organization} onChange={(e) => setFormData({...formData, organization: e.target.value})} className="w-full bg-[#0f1419] border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors" placeholder="Название организации" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Ссылка <span className="text-gray-500 text-xs font-normal">(опционально)</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Link2 className="h-5 w-5 text-gray-600" /></div>
                  <input type="url" value={formData.link} onChange={(e) => setFormData({...formData, link: e.target.value})} className="w-full bg-[#0f1419] border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors" placeholder="https://..." />
                </div>
              </div>
            </div>

            {/* Загрузка файла */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Документы <span className="text-gray-500 text-xs font-normal">(PDF, JPG, DOC)</span></label>
              <div className="border-2 border-dashed border-gray-700 rounded-xl p-4 text-center hover:border-blue-500/50 transition-colors bg-[#0f1419]/30">
                <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={handleFileChange} className="hidden" id="file-upload" />
                <label htmlFor="file-upload" className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm cursor-pointer transition-colors">
                  <Upload className="w-4 h-4" /> Выбрать файлы
                </label>
              </div>
              {selectedFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-800/40 border border-gray-700 rounded-xl">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <Award className="w-4 h-4 text-blue-400 shrink-0" />
                        <span className="text-sm text-gray-300 truncate">{file.name}</span>
                      </div>
                      <button type="button" onClick={() => removeFile(index)} className="p-1 hover:bg-red-500/10 rounded-lg text-gray-500 hover:text-red-400 transition-colors"><X className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* XP Preview */}
            {calculatedXP > 0 && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-center gap-4 animate-fade-in-up">
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0"><Award className="w-6 h-6 text-blue-400" /></div>
                <div><p className="text-sm text-gray-400">Начисление XP</p><p className="text-2xl font-bold text-cyan-400">+{calculatedXP} XP</p></div>
              </div>
            )}

            {error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>}

            {/* Кнопки */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button type="submit" disabled={isLoading} className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25">
                {isLoading ? 'Добавление...' : 'Добавить достижение'}
              </button>
              <button type="button" onClick={() => navigate('/achievements')} className="px-6 py-3 border border-gray-700 rounded-xl text-gray-400 hover:text-white hover:border-gray-600 transition-colors">Отмена</button>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
}