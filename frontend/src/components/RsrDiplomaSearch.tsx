import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Download, Plus, Loader2, AlertCircle, User, Calendar } from 'lucide-react';
import { rsrDiplomaAPI } from '../api/client';
import { useGameStore } from '../store/useGameStore';
import type { RsrDiploma } from '../types';

const YEARS = Array.from({ length: 2025 - 2014 + 1 }, (_, i) => 2025 - i);

function isoToDisplay(iso: string) {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

function isoToApi(iso: string) {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

export default function RsrDiplomaSearch() {
  const navigate = useNavigate();
  const { currentUser } = useGameStore();

  const [year, setYear] = useState(2025);
  const [diplomas, setDiplomas] = useState<RsrDiploma[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const hasBirthDate = !!currentUser?.birth_date;

  const handleSearch = async () => {
    if (!currentUser || !hasBirthDate) return;

    setLoading(true);
    setError('');
    setSearched(false);

    try {
      const res = await rsrDiplomaAPI.search({
        last_name: currentUser.last_name.trim(),
        first_name: currentUser.first_name.trim(),
        middle_name: currentUser.middle_name?.trim() || undefined,
        birth_date: isoToApi(currentUser.birth_date!),
        year,
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
        Данные берутся из вашего профиля автоматически.
      </div>

      {/* Search form */}
      <div className="bg-[#1a2332] rounded-xl sm:rounded-2xl p-4 sm:p-6 space-y-4">
        <h2 className="text-sm sm:text-base font-semibold text-white">Поиск диплома</h2>

        {/* Profile data preview */}
        <div className="bg-[#0f1419] border border-gray-700 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-3">
            <User className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">ФИО</p>
              <p className="text-sm text-white font-medium">
                {currentUser?.last_name} {currentUser?.first_name}{currentUser?.middle_name ? ` ${currentUser.middle_name}` : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Дата рождения</p>
              {hasBirthDate ? (
                <p className="text-sm text-white font-medium">
                  {isoToDisplay(currentUser!.birth_date!)}
                </p>
              ) : (
                <p className="text-sm text-yellow-400">
                  Не указана —{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="underline hover:text-yellow-300 transition-colors"
                  >
                    добавить в настройках профиля
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Year selector */}
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Учебный год</label>
          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="bg-[#0f1419] border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors w-full sm:w-48"
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
          disabled={loading || !hasBirthDate}
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
