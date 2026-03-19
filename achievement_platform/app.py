import streamlit as st
import json
import os
import time

# --- 1. РАБОТА С ДАННЫМИ ---
DATA_FILE = 'data.json'

def load_data():
    if not os.path.exists(DATA_FILE):
        return {"students": [], "teachers": [], "pending_achievements": []}
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_data(data):
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def calculate_level(xp):
    """
    Формула уровня: 
    Уровень 1: 0-99 XP
    Уровень 2: 100-199 XP
    Уровень 3: 200-299 XP и т.д.
    """
    return (xp // 100) + 1

def get_xp_for_next_level(level):
    """Сколько XP нужно для следующего уровня"""
    return level * 100

def get_current_level_progress(xp):
    """Возвращает текущий прогресс внутри уровня (от 0 до 100)"""
    level = calculate_level(xp)
    xp_in_current_level = xp % 100
    return xp_in_current_level, level

# --- 2. ИНТЕРФЕЙС ---
st.set_page_config(page_title="Платформа Достижений", layout="wide", page_icon="🎓")

# Кастомные стили для красоты
st.markdown("""
    <style>
    .metric-card {background-color: #f0f2f6; padding: 20px; border-radius: 10px; text-align: center;}
    .level-badge {font-size: 24px; font-weight: bold; color: #1f77b4;}
    </style>
""", unsafe_allow_html=True)

st.title("🎓 Платформа Достижений Студентов")
st.markdown("---")

# Выбор роли в сайдбаре
role = st.sidebar.selectbox("👤 Выберите роль", ["Студент", "Преподаватель"])

data = load_data()

# === СТРАНИЦА СТУДЕНТА ===
if role == "Студент":
    st.header("👨‍🎓 Личный кабинет студента")
    
    # Если студентов нет в базе, создадим тестовых
    if not data['students']:
        data['students'] = [
            {"id": 1, "name": "Иван Петров", "xp": 120, "coins": 50, "badges": ["Новичок"]},
            {"id": 2, "name": "Анна Смирнова", "xp": 450, "coins": 200, "badges": ["Новичок", "Активист"]},
            {"id": 3, "name": "Максим Волков", "xp": 50, "coins": 10, "badges": []}
        ]
        save_data(data)
        st.rerun()
    
    student_names = [s['name'] for s in data['students']]
    selected_name = st.selectbox("Выберите профиль для просмотра:", student_names)
    
    student = next((s for s in data['students'] if s['name'] == selected_name), None)
    
    if student:
        # === АВТОМАТИЧЕСКИЙ ПЕРЕСЧЕТ УРОВНЯ ===
        current_level = calculate_level(student['xp'])
        xp_current, level_display = get_current_level_progress(student['xp'])
        xp_needed = get_xp_for_next_level(current_level)
        progress_percent = xp_current / 100
        
        # Проверка на новый уровень (для демонстрации)
        if 'last_level' not in student:
            student['last_level'] = current_level
        elif current_level > student['last_level']:
            st.balloons()  # Салют при повышении!
            st.success(f"🎉 ПОЗДРАВЛЯЕМ! Новый уровень: {current_level}!")
            student['last_level'] = current_level
            save_data(data)
        
        # Верхняя панель с метриками
        col1, col2, col3 = st.columns(3)
        
        with col1:
            st.metric(label="🏆 Уровень", value=f"Lv.{current_level}")
        with col2:
            st.metric(label="⭐ Опыт (XP)", value=student['xp'], delta=f"+{xp_current} до след. уровня")
        with col3:
            st.metric(label="🪙 Монеты", value=student['coins'])
        
        # Прогресс бар до следующего уровня
        st.markdown(f"**Прогресс до {current_level + 1} уровня:** {xp_current}/100 XP")
        st.progress(progress_percent)
        
        # Бейджи
        st.subheader("🏅 Мои Бейджи")
        if student['badges']:
            cols = st.columns(len(student['badges']))
            for i, badge in enumerate(student['badges']):
                with cols[i]:
                    st.info(f"**{badge}**")
        else:
            st.warning("Пока нет бейджей. Выполняйте задания!")
        
        # Форма добавления достижения
        st.markdown("---")
        st.subheader("📂 Добавить достижение")
        
        with st.form("add_achievement"):
            ach_name = st.text_input("Название достижения (например, Победа в олимпиаде)")
            ach_type = st.selectbox("Тип", ["Олимпиада", "Курс", "Волонтерство", "Проект"])
            ach_desc = st.text_area("Описание (необязательно)")
            submitted = st.form_submit_button("🚀 Отправить на проверку")
            
            if submitted and ach_name:
                new_ach = {
                    "student_name": selected_name,
                    "title": ach_name,
                    "type": ach_type,
                    "description": ach_desc,
                    "status": "pending",
                    "xp_reward": 100  # Стандартная награда
                }
                data['pending_achievements'].append(new_ach)
                save_data(data)
                st.success("✅ Достижение отправлено на верификацию преподавателю!")
                st.rerun()

        # История
        st.markdown("---")
        st.subheader("📜 История активности")
        st.write("_Здесь будет отображаться список всех подтвержденных достижений_")

# === СТРАНИЦА ПРЕПОДАВАТЕЛЯ ===
elif role == "Преподаватель":
    st.header("👨‍🏫 Кабинет преподавателя (Валидатор)")
    
    st.subheader("📋 Заявки на проверку")
    
    if not data['pending_achievements']:
        st.info("🎉 Нет новых заявок. Все студенты молодцы!")
    else:
        for i, ach in enumerate(data['pending_achievements']):
            with st.expander(f"📩 Заявка от: {ach['student_name']} - {ach['title']}"):
                st.write(f"**Тип:** {ach['type']}")
                st.write(f"**Описание:** {ach.get('description', 'Нет')}")
                st.write(f"**Награда:** {ach.get('xp_reward', 100)} XP + 50 🪙")
                
                col1, col2 = st.columns(2)
                
                if col1.button("✅ Подтвердить", key=f"approve_{i}", type="primary"):
                    student = next((s for s in data['students'] if s['name'] == ach['student_name']), None)
                    if student:
                        # Начисление наград
                        xp_gain = ach.get('xp_reward', 100)
                        student['xp'] += xp_gain
                        student['coins'] += 50
                        
                        # Автоматический пересчет уровня
                        old_level = calculate_level(student['xp'] - xp_gain)
                        new_level = calculate_level(student['xp'])
                        
                        if new_level > old_level:
                            st.toast(f"🎉 {ach['student_name']} получил {new_level} уровень!")
                        
                        # Выдача бейджа по типу достижения
                        badge_map = {
                            "Олимпиада": "Олимпиец",
                            "Волонтерство": "Добро",
                            "Проект": "Проектировщик",
                            "Курс": "Ученик"
                        }
                        new_badge = badge_map.get(ach['type'])
                        if new_badge and new_badge not in student['badges']:
                            student['badges'].append(new_badge)
                        
                        data['pending_achievements'].pop(i)
                        save_data(data)
                        st.success(f"Подтверждено! Студент получил +{xp_gain} XP")
                        st.rerun()
                    
                if col2.button("❌ Отклонить", key=f"reject_{i}"):
                    data['pending_achievements'].pop(i)
                    save_data(data)
                    st.error("Заявка отклонена.")
                    st.rerun()

    st.markdown("---")
    st.subheader("📊 Аналитика группы")
    
    if data['students']:
        # Таблица со студентами
        import pandas as pd
        df_data = []
        for s in data['students']:
            lvl = calculate_level(s['xp'])
            df_data.append({
                "Студент": s['name'],
                "Уровень": lvl,
                "XP": s['xp'],
                "Монеты": s['coins'],
                "Бейджи": len(s['badges'])
            })
        
        df = pd.DataFrame(df_data)
        st.dataframe(df, use_container_width=True)
        
        # Кнопка отчета
        if st.button("📥 Сформировать отчет (Excel)"):
            st.success("✅ Отчет сформирован за 0.05 сек! (Экономия 3 часов)")
            st.download_button(
                label="Скачать CSV",
                data=df.to_csv(index=False).encode('utf-8-sig'),
                file_name="report.csv",
                mime="text/csv"
            )
    else:
        st.warning("Нет данных студентов")

# Футер
st.markdown("---")
st.caption("Проект по теме «Платформа достижений студентов/школьников» | Уровень сложности: B")
