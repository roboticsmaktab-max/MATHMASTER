import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      "app_name": "MathMaster AI",
      "slogan": "Quick Math Tests & AI Analysis",
      "generate_test": "Generate Test",
      "analyze_errors": "Analyze Mistakes",
      "grade_select": "Select Grade",
      "subject_select": "Select Subject",
      "language": "Language",
      "theme": "Theme",
      "start": "Start",
      "next": "Next",
      "finish": "Finish",
      "result": "Result",
      "explanation": "Explanation",
      "algebra": "Algebra",
      "geometry": "Geometry",
      "math": "Mathematics",
      "grade": "{{grade}}-grade",
      "error_analysis_report": "Error Analysis Report",
      "personal_plan": "Personalized Learning Plan",
      "settings": "Settings",
      "name": "Name",
      "save": "Save",
      "select_topic": "Select Topic",
      "download_pdf": "Download PDF",
      "download_certificate": "Download Certificate",
      "certificate_title": "CERTIFICATE OF ACHIEVEMENT",
      "certificate_body": "This certificate is awarded to {{name}} for achieving a 100% score in the {{grade}}-grade {{subject}} test.",
      "all_topics": "All Topics",
      "loading_topics": "Loading topics...",
      "question_count": "Questions",
      "test_type": "Test Type",
      "quiz": "Modern Quiz",
      "exam": "Control Work",
      "variant": "Variant",
      "install_app": "Install App",
      "share": "Share App"
    }
  },
  uz: {
    translation: {
      "app_name": "MathMaster AI",
      "slogan": "Tezkor Matematika Testlari va AI Tahlili",
      "generate_test": "Test Yaratish",
      "analyze_errors": "Xatolarni Tahlil Qilish",
      "grade_select": "Sinfni Tanlang",
      "subject_select": "Fanni Tanlang",
      "language": "Til",
      "theme": "Mavzu",
      "start": "Boshlash",
      "next": "Keyingisi",
      "finish": "Tugatish",
      "result": "Natija",
      "explanation": "Tushuntirish",
      "algebra": "Algebra",
      "geometry": "Geometriya",
      "math": "Matematika",
      "grade": "{{grade}}-sinf",
      "error_analysis_report": "Xatolar Tahlili Hisoboti",
      "personal_plan": "Shaxsiy O'quv Rejasi",
      "settings": "Sozlamalar",
      "name": "Ism",
      "save": "Saqlash",
      "select_topic": "Mavzuni Tanlang",
      "download_pdf": "PDF Yuklab Olish",
      "download_certificate": "Sertifikatni Yuklab Olish",
      "certificate_title": "MUVAFFARIYAT SERTIFIKATI",
      "certificate_body": "Ushbu sertifikat {{name}}ga {{grade}}-sinf {{subject}} fanidan o'tkazilgan testda 100% natija ko'rsatgani uchun topshiriladi.",
      "all_topics": "Barcha Mavzular",
      "loading_topics": "Mavzular yuklanmoqda...",
      "question_count": "Savollar soni",
      "test_type": "Dars turi",
      "quiz": "Oddiy test",
      "exam": "Nazorat ishi",
      "variant": "Variant",
      "install_app": "Dasturni o'rnatish",
      "share": "Ulashish"
    }
  },
  ru: {
    translation: {
      "app_name": "MathMaster AI",
      "slogan": "Быстрые Тесты по Математике и AI Анализ",
      "generate_test": "Создать Тест",
      "analyze_errors": "Анализ Ошибок",
      "grade_select": "Выберите Класс",
      "subject_select": "Выберите Предмет",
      "language": "Язык",
      "theme": "Тема",
      "start": "Начать",
      "next": "Далее",
      "finish": "Завершить",
      "result": "Результат",
      "explanation": "Объяснение",
      "algebra": "Алгебра",
      "geometry": "Геометрия",
      "math": "Математика",
      "grade": "{{grade}}-класс",
      "error_analysis_report": "Отчет по Анализу Ошибок",
      "personal_plan": "Персональный План Обучения",
      "settings": "Настройки",
      "name": "Имя",
      "save": "Сохранить",
      "select_topic": "Выберите Тему",
      "download_pdf": "Скачать PDF",
      "download_certificate": "Скачать Сертификат",
      "certificate_title": "СЕРТИФИКАТ УСПЕХА",
      "certificate_body": "Данный сертификат вручается {{name}} за достижение 100% результата в тесте по {{subject}} для {{grade}}-класса.",
      "all_topics": "Все Темы",
      "loading_topics": "Загрузка тем...",
      "question_count": "Количество вопросов",
      "test_type": "Тип теста",
      "quiz": "Обычный тест",
      "exam": "Контрольная работа",
      "variant": "Вариант",
      "install_app": "Установить приложение",
      "share": "Поделиться"
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'uz',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
