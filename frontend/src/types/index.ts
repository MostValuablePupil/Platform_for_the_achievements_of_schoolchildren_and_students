// src/types/index.ts

export interface Avatar {
  id: number;
  name: string;
  image: string;
}

export interface UserBadge {
  id: number;
  badge: number;
  badge_name: string;
  badge_icon?: string;
  earned_at: string;
}

export interface User {
  id: number;
  url: string;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'STUDENT' | 'CURATOR' | 'EMPLOYER' | 'ADMIN';
  educational_institution?: string;
  course?: string;
  total_xp: number;
  level: number;
  avatar?: number | null;
  avatar_details?: Avatar | null;
  future_profession?: string;
  earned_badges?: UserBadge[];
  competencies?: UserSkill[];
}

export interface AchievementStats {
  student_name: string;
  level: number;
  total_verified_events: number;
  stats_by_type: { event_type: string; total: number }[];
  events_list: { title: string; points: number; verified_at: string }[];
}

export interface Achievement {
  id: number;
  title: string;
  description: string;
  // Новые типы достижений
  event_type: 'OLYMPIAD' | 'HACKATHON' | 'COURSE' | 'VOLUNTEERING' | 'SCIENCE' | 'SPORT_ART';
  // Новые поля для уровней
  level_category?: string;
  achievement_level?: 'PARTICIPANT' | 'PRIZE' | 'WINNER';
  // Организация и ссылка
  organization?: string;
  link?: string;
  // Статус и баллы
  status: 'DRAFT' | 'PENDING' | 'VERIFIED' | 'REJECTED';
  points: number;
  xp_calculated?: number;
  // Пользователи
  student: number;
  verifier?: number | null;
  // Файлы и навыки
  proof_file?: string | null;
  skills?: number[] | any[];
  skill_names?: string[];
  // Мета-данные
  is_rewarded: boolean;
  verified_at?: string | null;
  created: string;
  // Дополнительные поля
  hours_count?: number;
  has_certificate?: boolean;
}

export interface SkillProfile {
  id: number;
  name: string;
}

export interface SkillCategory {
  id: number;
  name: string;
  profile: number;
  profile_name: string;
  description: string;
}

export interface Skill {
  id: number;
  name: string;
  category: number;
  category_name: string;
  profile_id: number;
  profile_name: string;
  description: string;
}

export interface UserSkill {
  id: number;
  experience: number;
  level: number;
  // 🔥 Добавляем поля, которые приходят с бэкенда:
  name: string;
  category: string;
  // Оставляем старые как необязательные, чтобы ничего не сломать:
  user?: number;
  skill?: number;
  skill_name?: string;
}
