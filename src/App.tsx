import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings, 
  Brain, 
  BookOpen, 
  Trophy, 
  ChevronRight, 
  CheckCircle2, 
  XCircle,
  RefreshCcw,
  Moon,
  Sun,
  Globe,
  Loader2,
  Download,
  Award,
  Share2
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useStore } from './store/useStore';
import { Grade, Subject, Question, TestResult, TestType, Variant } from './types';
import { generateTest, analyzeErrors, getTopics } from './lib/gemini';
import { cn } from './lib/utils';
import './i18n';

type Screen = 'home' | 'topics' | 'test' | 'result' | 'analysis' | 'settings';

export default function App() {
  const { t, i18n } = useTranslation();
  const { settings, updateSettings, setCurrentTest, currentTest, addTestResult, testResults } = useStore();
  const [screen, setScreen] = useState<Screen>('home');
  const [selectedGrade, setSelectedGrade] = useState<Grade>(settings.grade);
  const [selectedSubject, setSelectedSubject] = useState<Subject>(Subject.MATH);
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [testType, setTestType] = useState<TestType>(TestType.QUIZ);
  const [selectedVariant, setSelectedVariant] = useState<Variant>('A');
  
  const [loading, setLoading] = useState(false);
  const [fetchingTopics, setFetchingTopics] = useState(false);
  const [topics, setTopics] = useState<string[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    document.documentElement.className = settings.theme;
    i18n.changeLanguage(settings.language);

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [settings.theme, settings.language, i18n]);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'MathMaster AI',
          text: 'Matematika barcha sinflar uchun qulay testlar generatori.',
          url: window.location.href,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    }
    
    // Also trigger install if possible
    if (deferredPrompt) {
      handleInstallApp();
    }
  };

  const toggleTheme = () => {
    updateSettings({ theme: settings.theme === 'light' ? 'dark' : 'light' });
  };

  const handleExploreTopics = async () => {
    setFetchingTopics(true);
    setScreen('topics');
    try {
      const fetchedTopics = await getTopics(selectedGrade, selectedSubject, settings.language);
      setTopics(fetchedTopics);
    } catch (error) {
      console.error(error);
      alert('Error fetching topics.');
    } finally {
      setFetchingTopics(false);
    }
  };

  const handleStartTest = async (topic?: string) => {
    setLoading(true);
    setSelectedTopic(topic || null);
    try {
      const test = await generateTest(selectedGrade, selectedSubject, settings.language, topic, questionCount, testType, selectedVariant);
      setCurrentTest(test);
      setUserAnswers([]);
      setCurrentQuestionIndex(0);
      setScreen('test');

      // Track activity for Telegram Bot
      fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade: selectedGrade,
          subject: selectedSubject,
          message: `${settings.name} ${selectedGrade}-sinf ${selectedSubject} fanidan ${testType === TestType.EXAM ? "Nazorat ishi" : "Test"} boshladi. Mavzu: ${topic ? `"${topic}"` : "Barcha"}. Savollar: ${questionCount}`
        })
      }).catch(console.error);

    } catch (error) {
      console.error(error);
      alert('Error generating test. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadTestAsPDF = () => {
    if (!currentTest) return;
    const doc = new jsPDF();
    const title = `${selectedGrade}-sinf ${selectedSubject} - ${selectedTopic || t('all_topics')}`;
    
    doc.setFontSize(20);
    doc.text("MathMaster AI - Test", 20, 20);
    doc.setFontSize(14);
    doc.text(title, 20, 30);
    doc.text(`Ism: ${settings.name}`, 20, 40);
    doc.line(20, 45, 190, 45);

    let y = 60;
    currentTest.forEach((q, i) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(12);
      const lines = doc.splitTextToSize(`${i + 1}. ${q.text}`, 170);
      doc.text(lines, 20, y);
      y += lines.length * 7;

      q.options.forEach((opt, j) => {
        doc.text(`${String.fromCharCode(65 + j)}) ${opt}`, 30, y);
        y += 7;
      });
      y += 10;
    });

    const fileName = `test_${selectedGrade}_${selectedSubject.toLowerCase()}.pdf`;
    doc.save(fileName);
  };

  const downloadCertificateAsPDF = () => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Background color
    doc.setFillColor(250, 250, 250);
    doc.rect(0, 0, 297, 210, 'F');

    // Border
    doc.setDrawColor(245, 158, 11); // Orange-500
    doc.setLineWidth(10);
    doc.rect(10, 10, 277, 190);
    
    doc.setLineWidth(1);
    doc.rect(15, 15, 267, 180);

    // Content
    doc.setTextColor(23, 23, 23);
    doc.setFontSize(40);
    doc.text(t('certificate_title'), 148.5, 60, { align: 'center' });

    doc.setDrawColor(163, 163, 163);
    doc.line(100, 70, 197, 70);

    doc.setFontSize(20);
    doc.setTextColor(115, 115, 115);
    const bodyText = t('certificate_body', { 
      name: settings.name, 
      grade: selectedGrade, 
      subject: t(selectedSubject.toLowerCase()) 
    });
    const splitBody = doc.splitTextToSize(bodyText, 200);
    doc.text(splitBody, 148.5, 90, { align: 'center' });

    doc.setFontSize(25);
    doc.setTextColor(245, 158, 11);
    doc.text(settings.name, 148.5, 120, { align: 'center' });

    doc.setFontSize(14);
    doc.setTextColor(163, 163, 163);
    doc.text(`Sana: ${new Date().toLocaleDateString()}`, 148.5, 150, { align: 'center' });

    // Seal icon placeholder
    doc.setDrawColor(245, 158, 11);
    doc.setLineWidth(2);
    doc.circle(148.5, 175, 15);
    doc.setFontSize(10);
    doc.text("MathMaster AI", 148.5, 176, { align: 'center' });

    doc.save(`certificate_${settings.name.replace(/\s+/g, '_')}.pdf`);
  };

  const handleAnswer = (optionIndex: number) => {
    const newAnswers = [...userAnswers, optionIndex];
    setUserAnswers(newAnswers);
    
    if (currentQuestionIndex < (currentTest?.length || 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleFinish(newAnswers);
    }
  };

  const handleFinish = (finalAnswers: number[]) => {
    if (!currentTest) return;
    
    let score = 0;
    const wrongAnswers: any[] = [];
    
    currentTest.forEach((q, idx) => {
      if (q.correctAnswer === finalAnswers[idx]) {
        score++;
      } else {
        wrongAnswers.push({
          question: q.text,
          givenAnswer: q.options[finalAnswers[idx]],
          correctAnswer: q.options[q.correctAnswer],
          explanation: q.explanation
        });
      }
    });

    const result: TestResult = {
      id: Math.random().toString(36).substr(2, 9),
      testId: 'test-' + Date.now(),
      userId: 'guest',
      score,
      totalQuestions: currentTest.length,
      completedAt: new Date(),
      wrongAnswers: [] // simplified for now
    };
    
    addTestResult(result);
    setScreen('result');

    // Track activity for Telegram Bot
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grade: selectedGrade,
        subject: selectedSubject,
        message: `${settings.name} ${selectedGrade}-sinf testini tugatdi. Natija: ${score}/${currentTest.length}`
      })
    }).catch(console.error);
  };

  const handleGetAnalysis = async () => {
    if (!currentTest) return;
    setLoading(true);
    try {
      const wrongs = currentTest.map((q, i) => ({
        question: q.text,
        userAnswer: q.options[userAnswers[i]],
        correctAnswer: q.options[q.correctAnswer],
        isCorrect: userAnswers[i] === q.correctAnswer
      })).filter(a => !a.isCorrect);

      const analysis = await analyzeErrors(wrongs, settings.language);
      setAnalysisResult(analysis);
      setScreen('analysis');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn(
      "min-h-screen font-sans antialiased transition-colors duration-500",
      settings.theme === 'dark' ? "bg-[#0c0c0c] text-neutral-100" : "bg-[#fafafa] text-neutral-900"
    )}>
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-neutral-200/10 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setScreen('home')}>
            <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
              <Brain size={24} />
            </div>
            <span className="text-xl font-display font-bold uppercase tracking-tight">MathMaster AI</span>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                const langs: ('uz' | 'ru' | 'en')[] = ['uz', 'ru', 'en'];
                const next = langs[(langs.indexOf(settings.language) + 1) % 3];
                updateSettings({ language: next });
              }}
              className="p-2.5 rounded-full hover:bg-neutral-500/10 transition-colors uppercase text-xs font-bold flex items-center gap-2"
            >
              <Globe size={18} />
              {settings.language}
            </button>
            <button 
              onClick={toggleTheme}
              className="p-2.5 rounded-full hover:bg-neutral-500/10 transition-colors"
            >
              {settings.theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <button 
              onClick={() => setScreen('settings')}
              className="p-2.5 rounded-full hover:bg-neutral-500/10 transition-colors"
            >
              <Settings size={20} />
            </button>
            {deferredPrompt && (
              <button 
                onClick={handleInstallApp}
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all"
              >
                <Download size={16} />
                {t('install_app')}
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {screen === 'home' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              <div className="text-center space-y-4">
                <motion.h1 
                  className="text-6xl md:text-8xl font-display font-bold leading-[0.9] tracking-tighter"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  {t('generate_test')}
                </motion.h1>
                <p className="text-neutral-500 text-lg max-w-xl mx-auto">{t('slogan')}</p>
              </div>

              {deferredPrompt && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="max-w-md mx-auto"
                >
                  <button
                    onClick={handleInstallApp}
                    className="w-full p-4 rounded-3xl bg-blue-500 text-white flex items-center justify-between group hover:bg-blue-600 transition-all shadow-xl shadow-blue-500/20"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                        <Download size={20} />
                      </div>
                      <div className="text-left">
                        <p className="font-bold leading-none">{t('install_app')}</p>
                        <p className="text-[10px] opacity-80 mt-1">Smartfon yoki kompyuterga o'rnatish</p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </motion.div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
                <div className="bg-white dark:bg-neutral-900 overflow-hidden rounded-[2.5rem] border border-neutral-200 dark:border-neutral-800 p-8 space-y-8 flex flex-col shadow-2xl shadow-black/5">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-orange-500">{t('grade_select')}</label>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {Array.from({ length: 11 }, (_, i) => i + 1).map((g) => (
                        <button
                          key={g}
                          onClick={() => setSelectedGrade(g as Grade)}
                          className={cn(
                            "h-12 rounded-2xl flex items-center justify-center font-bold transition-all",
                            selectedGrade === g 
                              ? "bg-orange-500 text-white shadow-xl shadow-orange-500/30" 
                              : "bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                          )}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-blue-500">{t('subject_select')}</label>
                    <div className="flex flex-wrap gap-2">
                      {[Subject.MATH, Subject.ALGEBRA, Subject.GEOMETRY].map((s) => (
                        <button
                          key={s}
                          onClick={() => setSelectedSubject(s)}
                          className={cn(
                            "px-6 h-12 rounded-2xl font-bold transition-all",
                            selectedSubject === s 
                              ? "bg-blue-500 text-white shadow-xl shadow-blue-500/30" 
                              : "bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                          )}
                        >
                          {t(s.toLowerCase())}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold tracking-widest text-neutral-500">{t('question_count')}</label>
                        <select 
                          value={questionCount}
                          onChange={(e) => setQuestionCount(Number(e.target.value))}
                          className="w-full h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 px-4 font-bold outline-none ring-2 ring-transparent focus:ring-orange-500 transition-all appearance-none"
                        >
                          {[5, 10, 15, 20, 30, 50, 100].map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold tracking-widest text-neutral-500">{t('test_type')}</label>
                        <div className="flex bg-neutral-100 dark:bg-neutral-800 rounded-2xl h-12 p-1">
                          {[TestType.QUIZ, TestType.EXAM].map(type => (
                            <button
                              key={type}
                              onClick={() => setTestType(type)}
                              className={cn(
                                "flex-1 rounded-xl text-[10px] font-black uppercase transition-all",
                                testType === type ? "bg-white dark:bg-neutral-700 shadow-sm text-orange-500" : "text-neutral-500"
                              )}
                            >
                              {t(type.toLowerCase())}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Variant Selection */}
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold tracking-widest text-neutral-500">{t('variant')}</label>
                      <div className="grid grid-cols-4 gap-2">
                        {(['A', 'B', 'C', 'D'] as Variant[]).map(v => (
                          <button
                            key={v}
                            onClick={() => setSelectedVariant(v)}
                            className={cn(
                              "h-12 rounded-2xl font-bold transition-all",
                              selectedVariant === v 
                                ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" 
                                : "bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200"
                            )}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    disabled={loading}
                    onClick={handleExploreTopics}
                    className="w-full h-16 bg-neutral-900 dark:bg-white text-white dark:text-black rounded-[1.5rem] font-bold text-xl flex items-center justify-center gap-3 transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : <BookOpen />}
                    {t('generate_test')}
                  </button>
                </div>

                <div className="bg-white dark:bg-neutral-900 overflow-hidden rounded-[2.5rem] border border-neutral-200 dark:border-neutral-800 p-8 space-y-6 flex flex-col shadow-2xl shadow-black/5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold tracking-tight">{t('result')}</h3>
                    <Trophy className="text-orange-500" size={20} />
                  </div>
                  
                  <div className="space-y-3 overflow-y-auto max-h-[300px] pr-2 scrollbar-hide">
                    {testResults.length === 0 ? (
                      <div className="h-32 rounded-3xl border-2 border-dashed border-neutral-200 dark:border-neutral-800 flex flex-col items-center justify-center text-neutral-400 gap-2">
                        <BookOpen size={24} />
                        <span className="text-xs font-bold uppercase tracking-widest">Hozircha natijalar yo'q</span>
                      </div>
                    ) : (
                      testResults.map((res, idx) => (
                        <div key={res.id} className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 flex items-center justify-between group hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white",
                              res.score / res.totalQuestions >= 0.8 ? "bg-green-500" : res.score / res.totalQuestions >= 0.5 ? "bg-orange-500" : "bg-red-500"
                            )}>
                              {Math.round((res.score / res.totalQuestions) * 100)}%
                            </div>
                            <div>
                              <div className="text-sm font-bold">{new Date(res.completedAt).toLocaleDateString()}</div>
                              <div className="text-[10px] uppercase font-bold text-neutral-500">{res.score}/{res.totalQuestions} to'g'ri</div>
                            </div>
                          </div>
                          <ChevronRight size={16} className="text-neutral-300 group-hover:text-neutral-500 transition-colors" />
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {screen === 'topics' && (
            <motion.div 
              key="topics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-3xl mx-auto space-y-8"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-4xl font-bold tracking-tight">{t('select_topic')}</h2>
                  <p className="text-neutral-500">{selectedGrade}-sinf • {t(selectedSubject.toLowerCase())}</p>
                </div>
                <button 
                  onClick={() => setScreen('home')}
                  className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center hover:bg-neutral-200"
                >
                  <XCircle size={20} />
                </button>
              </div>

              {fetchingTopics ? (
                <div className="h-64 flex flex-col items-center justify-center text-neutral-400 gap-4">
                  <Loader2 className="animate-spin" size={32} />
                  <p className="font-bold uppercase tracking-widest text-xs">{t('loading_topics')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => handleStartTest()}
                    className="p-6 rounded-[2rem] border-2 border-dashed border-neutral-200 dark:border-neutral-800 hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/10 transition-all text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-lg">{t('all_topics')}</span>
                      <ChevronRight className="text-neutral-400 group-hover:text-orange-500" />
                    </div>
                  </button>
                  {topics.map((topic, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleStartTest(topic)}
                      className="p-6 rounded-[2rem] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/10 transition-all text-left group shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-lg leading-tight">{topic}</span>
                        <ChevronRight className="text-neutral-400 group-hover:text-blue-500 shrink-0" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {screen === 'test' && currentTest && (
            <motion.div 
              key="test"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-2xl mx-auto space-y-12"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-neutral-500">
                    Question {currentQuestionIndex + 1} of {currentTest.length}
                  </span>
                  <div className="w-32 h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-orange-500" 
                      initial={{ width: 0 }}
                      animate={{ width: `${((currentQuestionIndex + 1) / currentTest.length) * 100}%` }}
                    />
                  </div>
                </div>
                <h2 className="text-4xl font-bold leading-tight">{currentTest[currentQuestionIndex].text}</h2>
              </div>

              <div className="grid gap-3">
                {currentTest[currentQuestionIndex].options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(idx)}
                    className="group relative w-full p-6 text-left rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-orange-500 dark:hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 group-hover:bg-orange-500 group-hover:text-white flex items-center justify-center font-bold transition-colors">
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <span className="text-xl font-medium">{option}</span>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {screen === 'result' && (
            <motion.div 
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl mx-auto text-center space-y-12 py-12"
            >
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-orange-500/20 blur-[80px] rounded-full" />
                <div className="relative w-48 h-48 rounded-[3rem] border-8 border-white dark:border-neutral-900 bg-neutral-900 dark:bg-white flex flex-col items-center justify-center shadow-2xl">
                  <span className="text-[10px] uppercase font-black tracking-widest text-orange-500">{t('result')}</span>
                  <span className="text-7xl font-display font-black text-white dark:text-black">
                    {Math.round((userAnswers.filter((a, i) => a === currentTest![i].correctAnswer).length / currentTest!.length) * 100)}%
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-5xl font-bold tracking-tight">Ajoyib natija!</h2>
                <p className="text-neutral-500 max-w-sm mx-auto">
                  Siz {currentTest?.length} tadan {userAnswers.filter((a, i) => a === currentTest![i].correctAnswer).length} tasiga to'g'ri javob berdingiz.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                {Math.round((userAnswers.filter((a, i) => a === currentTest![i].correctAnswer).length / currentTest!.length) * 100) === 100 && (
                  <button
                    onClick={downloadCertificateAsPDF}
                    className="flex-1 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-3xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-lg shadow-orange-500/20"
                  >
                    <Award size={20} />
                    {t('download_certificate')}
                  </button>
                )}
                <button
                  onClick={handleGetAnalysis}
                  disabled={loading}
                  className="flex-1 h-16 bg-orange-500 text-white rounded-3xl font-bold flex items-center justify-center gap-2 hover:bg-orange-600 transition-colors disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <Brain size={20} />}
                  {t('analyze_errors')}
                </button>
                <button
                  onClick={downloadTestAsPDF}
                  className="flex-1 h-16 bg-neutral-900 dark:bg-white text-white dark:text-black rounded-3xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                >
                  <Download size={20} />
                  {t('download_pdf')}
                </button>
                <button
                  onClick={() => setScreen('home')}
                  className="px-8 h-16 border border-neutral-200 dark:border-neutral-800 rounded-3xl font-bold flex items-center justify-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
                >
                  <RefreshCcw size={20} />
                  {t('start')}
                </button>
              </div>
            </motion.div>
          )}

          {screen === 'analysis' && analysisResult && (
            <motion.div 
              key="analysis"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-3xl mx-auto space-y-8"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center text-white">
                  <Brain size={24} />
                </div>
                <h2 className="text-4xl font-bold">{t('error_analysis_report')}</h2>
              </div>

              <div className="prose prose-neutral dark:prose-invert max-w-none bg-white dark:bg-neutral-900 p-8 rounded-[2rem] border border-neutral-200 dark:border-neutral-800 shadow-xl leading-relaxed whitespace-pre-wrap">
                {analysisResult}
              </div>

              <button
                onClick={() => setScreen('home')}
                className="w-full h-16 bg-neutral-900 dark:bg-white text-white dark:text-black rounded-3xl font-bold"
              >
                Tushunarli, darsga qaytish
              </button>
            </motion.div>
          )}

          {screen === 'settings' && (
            <motion.div 
              key="settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="max-w-xl mx-auto space-y-12"
            >
              <h2 className="text-4xl font-bold">{t('settings')}</h2>
              
              <div className="space-y-8">
                <div className="p-6 rounded-3xl bg-neutral-100 dark:bg-neutral-900 space-y-4">
                  <label className="text-sm font-bold text-neutral-500">{t('name')}</label>
                  <input 
                    type="text" 
                    value={settings.name}
                    onChange={(e) => updateSettings({ name: e.target.value })}
                    className="w-full bg-white dark:bg-neutral-800 h-14 rounded-2xl px-6 outline-none ring-2 ring-transparent focus:ring-orange-500 transition-all font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div 
                    onClick={toggleTheme}
                    className="p-6 rounded-3xl bg-neutral-100 dark:bg-neutral-900 flex flex-col items-center gap-4 cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
                  >
                    {settings.theme === 'light' ? <Sun /> : <Moon />}
                    <span className="font-bold">{t('theme')}</span>
                  </div>
                  <div 
                    onClick={() => {
                      const langs: ('uz' | 'ru' | 'en')[] = ['uz', 'ru', 'en'];
                      const next = langs[(langs.indexOf(settings.language) + 1) % 3];
                      updateSettings({ language: next });
                    }}
                    className="p-6 rounded-3xl bg-neutral-100 dark:bg-neutral-900 flex flex-col items-center gap-4 cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <Globe />
                    <span className="font-bold uppercase">{settings.language}</span>
                  </div>
                  <div 
                    onClick={handleShare}
                    className="p-6 rounded-3xl bg-neutral-100 dark:bg-neutral-900 flex flex-col items-center gap-4 cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors col-span-2 md:col-span-1"
                  >
                    <Share2 className="text-orange-500" />
                    <span className="font-bold">{t('share')}</span>
                  </div>
                </div>

                {deferredPrompt && (
                  <button
                    onClick={handleInstallApp}
                    className="w-full p-6 rounded-3xl bg-blue-500 text-white flex items-center justify-center gap-4 hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20"
                  >
                    <Download />
                    <span className="font-bold">{t('install_app')}</span>
                  </button>
                )}
              </div>

              <button
                onClick={() => setScreen('home')}
                className="w-full h-16 bg-orange-500 text-white rounded-3xl font-bold"
              >
                Tayyor
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Branding */}
      <footer className="max-w-5xl mx-auto px-6 py-12 border-t border-neutral-200/10 text-center space-y-4">
        <div className="flex items-center justify-center gap-2 opacity-50">
          <Brain size={20} />
          <span className="text-xs font-black tracking-[0.3em] uppercase">MathMaster Platform</span>
        </div>
        <p className="text-[10px] text-neutral-500 font-mono">POWERED BY GEMINI 3.0 FOR ADVANCED MATHEMATICAL REASONING</p>
      </footer>
    </div>
  );
}

