import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Briefcase, MapPin, DollarSign, Clock, FileText, 
  ListChecks, Save, Send, CheckCircle, Loader2 
} from 'lucide-react';

export default function EmployerVacanciesPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    company: 'ООО «Технологии Будущего»',
    location: 'Москва / Удалённо',
    salaryMin: '',
    salaryMax: '',
    employmentType: '',
    description: '',
    requirements: '',
    skills: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent, draft: boolean) => {
    e.preventDefault();
    setIsLoading(true);

    // 🔥 MOCK: Имитация отправки на бэкенд
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
      console.log(draft ? '💾 Черновик сохранён' : '🚀 Вакансия опубликована', formData);
      
      // Через 2 секунды редирект или сброс
      setTimeout(() => {
        setIsSuccess(false);
        setFormData({
          title: '',
          company: 'ООО «Технологии Будущего»',
          location: 'Москва / Удалённо',
          salaryMin: '',
          salaryMax: '',
          employmentType: '',
          description: '',
          requirements: '',
          skills: '',
        });
      }, 2000);
    }, 1200);
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] animate-fade-in text-center">
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6 animate-scale-in">
          <CheckCircle className="w-10 h-10 text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Готово!</h2>
        <p className="text-gray-400 mb-6">Вакансия успешно создана и отправлена на модерацию.</p>
        <div className="flex gap-4">
          <button 
            onClick={() => navigate('/employer/vacancies')} 
            className="px-6 py-2.5 bg-[#1a2332] border border-gray-700 rounded-xl text-white hover:bg-gray-800 transition-colors"
          >
            К списку вакансий
          </button>
          <button 
            onClick={() => setIsSuccess(false)} 
            className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl text-white hover:opacity-90 transition-opacity"
          >
            Создать ещё
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-3xl font-bold text-white mb-2">Предложить вакансию</h1>
        <p className="text-gray-500">Заполните данные о вакансии. Все поля обязательны для заполнения.</p>
      </div>

      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
        {/* Основная информация */}
        <div className="bg-[#1a2332] border border-gray-800 rounded-2xl p-6 space-y-5 animate-fade-in-up delay-100">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
              <Briefcase className="w-4 h-4 text-blue-400" />
              Название вакансии *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full bg-[#0f1419] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Например: Junior Frontend Developer"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Компания *</label>
            <input
              type="text"
              name="company"
              value={formData.company}
              onChange={handleChange}
              className="w-full bg-[#0f1419] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Название компании"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                <MapPin className="w-4 h-4 text-blue-400" />
                Местоположение *
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full bg-[#0f1419] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Москва / Удалённо"
                required
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                <Clock className="w-4 h-4 text-blue-400" />
                Тип занятости *
              </label>
              <select
                name="employmentType"
                value={formData.employmentType}
                onChange={handleChange}
                className="w-full bg-[#0f1419] border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-pointer"
                required
              >
                <option value="">Выберите тип</option>
                <option value="FULL_TIME">Полная занятость</option>
                <option value="PART_TIME">Частичная занятость</option>
                <option value="INTERNSHIP">Стажировка</option>
                <option value="REMOTE">Удалённая работа</option>
                <option value="PROJECT">Проектная работа</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                <DollarSign className="w-4 h-4 text-blue-400" />
                Зарплата от
              </label>
              <input
                type="number"
                name="salaryMin"
                value={formData.salaryMin}
                onChange={handleChange}
                className="w-full bg-[#0f1419] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="120 000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Зарплата до</label>
              <input
                type="number"
                name="salaryMax"
                value={formData.salaryMax}
                onChange={handleChange}
                className="w-full bg-[#0f1419] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="150 000"
              />
            </div>
          </div>
        </div>

        {/* Описание и требования */}
        <div className="bg-[#1a2332] border border-gray-800 rounded-2xl p-6 space-y-5 animate-fade-in-up delay-200">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
              <FileText className="w-4 h-4 text-blue-400" />
              Описание вакансии *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full bg-[#0f1419] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              placeholder="Опишите обязанности, задачи и условия работы..."
              required
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
              <ListChecks className="w-4 h-4 text-blue-400" />
              Требования к кандидату *
            </label>
            <textarea
              name="requirements"
              value={formData.requirements}
              onChange={handleChange}
              rows={4}
              className="w-full bg-[#0f1419] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              placeholder="Перечислите необходимые навыки и опыт (каждый с новой строки)..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Ключевые навыки
            </label>
            <input
              type="text"
              name="skills"
              value={formData.skills}
              onChange={handleChange}
              className="w-full bg-[#0f1419] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Python, React, SQL (через запятую)"
            />
            <p className="text-xs text-gray-500 mt-2">Система автоматически сопоставит требования с навыками студентов</p>
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4 animate-fade-in-up delay-300">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
            {isLoading ? 'Публикация...' : 'Опубликовать вакансию'}
          </button>
          
          <button
            type="button"
            onClick={(e) => handleSubmit(e, true)}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 bg-[#1a2332] border border-gray-700 text-gray-300 py-3 rounded-xl font-medium hover:bg-gray-800 hover:text-white transition-all disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            Сохранить черновик
          </button>

          <button
            type="button"
            onClick={() => navigate('/employer/students')}
            className="px-6 py-3 border border-gray-700 rounded-xl text-gray-400 hover:text-white hover:border-gray-600 transition-colors"
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
}
