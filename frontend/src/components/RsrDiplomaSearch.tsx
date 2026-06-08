import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Download, Plus, Loader2, AlertCircle } from 'lucide-react';
import { rsrDiplomaAPI } from '../api/client';
import type { RsrDiploma } from '../types';

const YEARS = Array.from({ length: 2025 - 2014 + 1 }, (_, i) => 2025 - i);

export default function RsrDiplomaSearch() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    last_name: '',
    first_name: '',
    middle_name: '',
    birth_day: '',
    birth_month: '',
    birth_year: '',
    year: 2025,
  });
  const [diplomas, setDiplomas] = useState<RsrDiploma[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSearch = async () => {
    const { last_name, first_name, birth_day, birth_month, birth_year } = form;
    if (!last_name || !first_name || !birth_day || !birth_month || !birth_year) {
      setError('Заполните фамилию, имя и дату рождения');
      return;
    }

    const dd = birth_day.padStart(2, '0');
    const mm = birth_month.padStart(2, '0');
    const birth_date = `${dd}.${mm}.${birth_year}`;

    setLoading(true);
    setError('');
    setSearched(false);

    try {
      const res = await rsrDiplomaAPI.search({
        last_name: last_name.trim(),
        first_name: first_name.trim(),
        middle_name: form.middle_name.trim() || undefined,
        birth_date,
        year: form.year,
      });
      setDiplomas(res.data.diplomas);
      setSearched(true);
    } catch {
      setError('Ошибка при обращении к серверу. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAchievement = (diploma: RsrDiploma) => {
    navigate('/achievements/new', {
      state: {
        prefill: {
          title: diploma.olympiad,
          link: diploma.pdf_url,
          event_type: 'OLYMPIAD',
          achievement_level: 'WINNER',
          organization: 'Российский совет олимпиад школьников',
        },
      },
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in-up">
      {/* Info banner */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 sm:p-4 text-xs sm:text-sm text-blue-300">
        Поиск по базе дипломов{' '}
        <span className="font-semibold">Российского совета олимпиад школьников (РСОШ)</span>.
        Введите ФИО и дату рождения — будут найдены все дипломы за выбранный учебный год.
      </div>

      {/* Search form */}
      <div className="bg-[#1a2332] rounded-xl sm:rounded-2xl p-4 sm:p-6 space-y-4">
        <h2 className="text-sm sm:text-base font-semibold text-white">Поиск диплома</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { name: 'last_name',   placeholder: 'Фамилия *' },
            { name: 'first_name',  placeholder: 'Имя *' },
            { name: 'middle_name', placeholder: 'Отчество' },
          ].map(f => (
            <input
              key={f.name}
              name={f.name}
              value={form[f.name as keyof typeof form]}
              onChange={handleChange}
              placeholder={f.placeholder}
              className="bg-[#0f1419] border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <input
            name="birth_day"
            value={form.birth_day}
            onChange={handleChange}
            placeholder="День *"
            maxLength={2}
            className="bg-[#0f1419] border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
          <input
            name="birth_month"
            value={form.birth_month}
            onChange={handleChange}
            placeholder="Месяц *"
            maxLength={2}
            className="bg-[#0f1419] border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
          <input
            name="birth_year"
            value={form.birth_year}
            onChange={handleChange}
            placeholder="Год рождения *"
            maxLength={4}
            className="bg-[#0f1419] border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
          <select
            name="year"
            value={form.year}
            onChange={handleChange}
            className="bg-[#0f1419] border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
          >
            {YEARS.map(y => (
              <option key={y} value={y}>
                {y - 1}/{String(y).slice(-2)} уч. год
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-400 text-xs sm:text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <button
          onClick={handleSearch}
          disabled={loading}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-blue-500/25"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
          Найти дипломы
        </button>
      </div>

      {/* Results */}
      {searched && (
        <div className="bg-[#1a2332] rounded-xl sm:rounded-2xl p-4 sm:p-6 animate-fade-in-up">
          {diplomas.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-400 text-sm">Дипломы не найдены</p>
              <p className="text-gray-600 text-xs mt-1">
                Проверьте правильность данных и выбранный учебный год
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-gray-400">
                Найдено дипломов: <span className="text-white font-semibold">{diplomas.length}</span>
              </p>
              {diplomas.map((diploma) => (
                <div
                  key={diploma.code}
                  className="bg-[#0f1419] rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white line-clamp-2 mb-1">
                      {diploma.olympiad || 'Олимпиада РСОШ'}
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs text-gray-400">
                      <span>Класс: {diploma.form}</span>
                      <span className="text-gray-600">·</span>
                      <span>Код: {String(diploma.code).replace(/(\d{3})(\d{4})(\d{4})/, '$1 $2-$3')}</span>
                      <span className="text-gray-600">·</span>
                      <span>{diploma.year - 1}/{String(diploma.year).slice(-2)} уч. год</span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <a
                      href={diploma.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg text-xs font-medium transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      PDF
                    </a>
                    <button
                      onClick={() => handleAddAchievement(diploma)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-medium transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      В портфолио
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
