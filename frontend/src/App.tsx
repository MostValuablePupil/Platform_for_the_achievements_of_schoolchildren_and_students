// frontend/src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

// 👇 Работодатель: импортируем новые компоненты
import EmployerLayout from './pages/EmployerLayout';
import EmployerStudentsPage from './pages/EmployerStudentsPage';
import EmployerStudentProfilePage from './pages/EmployerStudentProfilePage';
import EmployerVacanciesPage from './pages/EmployerVacanciesPage';

function App() {
  const { isAuthenticated, currentUser } = useGameStore();
  
  // 👇 Определяем, является ли пользователь работодателем
  const isEmployer = currentUser?.role === 'EMPLOYER';

  return (
    <Router>
      <Routes>
        {/* === ПУБЛИЧНЫЕ МАРШРУТЫ === */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* === МАРШРУТЫ ДЛЯ РАБОТОДАТЕЛЕЙ === */}
        {isEmployer ? (
          <>
            <Route path="/employer" element={<EmployerLayout />}>
              <Route path="students" element={<EmployerStudentsPage />} />
              <Route path="students/:id" element={<EmployerStudentProfilePage />} />
              <Route path="vacancies" element={<EmployerVacanciesPage />} />
              <Route index element={<Navigate to="students" replace />} />
            </Route>
            
            {/* Редирект с корня для работодателя */}
            <Route 
              path="/" 
              element={<Navigate to="/employer/students" replace />} 
            />
          </>
        ) : (
          /* === МАРШРУТЫ ДЛЯ СТУДЕНТОВ === */
          <>
            <Route 
              path="/" 
              element={isAuthenticated ? <Layout><ProfilePage /></Layout> : <Navigate to="/login" />} 
            />
            
            <Route 
              path="/achievements" 
              element={isAuthenticated ? <Layout><AchievementsPage /></Layout> : <Navigate to="/login" />} 
            />
            
            <Route 
              path="/achievements/:id" 
              element={isAuthenticated ? <AchievementDetailPage /> : <Navigate to="/login" />} 
            />
            
            <Route 
              path="/achievements/new" 
              element={isAuthenticated ? <CreateAchievementPage /> : <Navigate to="/login" />} 
            />
            
            <Route 
              path="/skills" 
              element={isAuthenticated ? <Layout><SkillsPage /></Layout> : <Navigate to="/login" />} 
            />
          </>
        )}
        
        {/* === FALLBACK: редирект в зависимости от роли === */}
        <Route 
          path="*" 
          element={
            isAuthenticated 
              ? <Navigate to={isEmployer ? "/employer/students" : "/"} replace /> 
              : <Navigate to="/login" replace />
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;