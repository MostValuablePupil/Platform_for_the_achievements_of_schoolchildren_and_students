// frontend/src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useGameStore } from './store/useGameStore';
// Студенческие компоненты
import Layout from './components/Layout';
import ProfilePage from './pages/ProfilePage';
import AchievementsPage from './pages/AchievementsPage';
import AchievementDetailPage from './pages/AchievementDetailPage';
import SkillsPage from './pages/SkillsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CreateAchievementPage from './pages/CreateAchievementPage';

// Работодатель
import EmployerLayout from './pages/EmployerLayout';
import EmployerStudentsPage from './pages/EmployerStudentsPage';
import EmployerStudentProfilePage from './pages/EmployerStudentProfilePage';
import EmployerVacanciesPage from './pages/EmployerVacanciesPage';

function App() {
  const { isAuthenticated, currentUser, isLoading, checkAuth } = useGameStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Пока идет ПЕРВИЧНАЯ загрузка данных пользователя, показываем заглушку,
  // чтобы роутер не сделал поспешный редирект.
  if (isLoading && !currentUser && localStorage.getItem('token')) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0f1419]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="text-gray-500 animate-pulse">Восстановление сессии...</p>
        </div>
      </div>
    );
  }

  const isEmployer = currentUser?.role === 'EMPLOYER';

  return (
    <Router>
      <Routes>
        {/* === ПУБЛИЧНЫЕ МАРШРУТЫ === */}
        <Route 
          path="/login" 
          element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" replace />} 
        />
        <Route 
          path="/register" 
          element={!isAuthenticated ? <RegisterPage /> : <Navigate to="/" replace />} 
        />
        
        {/* === МАРШРУТЫ ДЛЯ РАБОТОДАТЕЛЕЙ === */}
        {isAuthenticated && isEmployer ? (
          <>
            <Route path="/employer" element={<EmployerLayout />}>
              <Route path="students" element={<EmployerStudentsPage />} />
              <Route path="students/:id" element={<EmployerStudentProfilePage />} />
              <Route path="vacancies" element={<EmployerVacanciesPage />} />
              <Route index element={<Navigate to="students" replace />} />
            </Route>
            <Route path="/" element={<Navigate to="/employer/students" replace />} />
          </>
        ) : isAuthenticated && !isEmployer ? (
          /* === МАРШРУТЫ ДЛЯ СТУДЕНТОВ === */
          <>
            <Route path="/" element={<Layout><ProfilePage /></Layout>} />
            <Route path="/achievements" element={<Layout><AchievementsPage /></Layout>} />
            <Route path="/achievements/:id" element={<AchievementDetailPage />} />
            <Route path="/achievements/new" element={<CreateAchievementPage />} />
            <Route path="/skills" element={<Layout><SkillsPage /></Layout>} />
            
            {/* Если студент забрел в админку работодателя — кидаем домой */}
            <Route path="/employer/*" element={<Navigate to="/" replace />} />
          </>
        ) : (
          /* === ДЛЯ НЕАВТОРИЗОВАННЫХ === */
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}
      </Routes>
    </Router>
  );
}

export default App;