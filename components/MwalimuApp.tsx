'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  generateStudyPoints, 
  generateFlashcards, 
  generateQuestions, 
  generateQuizAnalysis,
  chatWithMwalimu,
  Language,
  StudyPoint,
  Flashcard,
  Question
} from '@/lib/gemini';
import { 
  BookOpen, 
  MessageSquare, 
  Layers, 
  HelpCircle, 
  Send, 
  ChevronRight, 
  ChevronLeft,
  Languages,
  Loader2,
  Flag,
  RefreshCw,
  BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';

export default function MwalimuApp() {
  const [activeTab, setActiveTab] = useState<'study' | 'flashcards' | 'quiz' | 'chat' | 'saved'>('study');
  const [language, setLanguage] = useState<Language>('english');
  const [loading, setLoading] = useState(false);

  const translations = {
    english: {
      title: "Mwalimu AI",
      subtitle: "Your Kenyan STEM Companion",
      study: "Study",
      cards: "Cards",
      quiz: "Quiz",
      chat: "Chat",
      saved: "Saved",
      generate: "Generate",
      getCards: "Get Cards",
      startQuiz: "Start Quiz",
      loadMore: "Load More",
      saveOffline: "Save for Offline",
      discuss: "Discuss with Mwalimu",
      placeholderConcept: "Enter a concept (e.g. Algebra)",
      placeholderSubject: "Subject (e.g. Physics)",
      placeholderChat: "Ask Mwalimu a question...",
      emptyStudy: "Enter a topic to get personalized study tips!",
      emptyCards: "Select a subject to generate flashcards!",
      emptyQuiz: "Generate a quiz to test your knowledge!",
      emptyChat: "Sasa! I'm Mwalimu AI. Ask me anything about STEM.",
      explanation: "Explanation",
      nextQuestion: "Next Question",
      finishQuiz: "Finish Quiz",
      analysis: "AI Analysis",
      analyzing: "Analyzing results...",
      discussing: "Discussing",
      offlineTitle: "Offline Materials",
      noSaved: "No materials saved yet."
    },
    kiswahili: {
      title: "Mwalimu AI",
      subtitle: "Mwenzi wako wa STEM wa Kenya",
      study: "Somo",
      cards: "Kadi",
      quiz: "Chemsha Bongo",
      chat: "Mazungumzo",
      saved: "Zilizohifadhiwa",
      generate: "Tengeneza",
      getCards: "Pata Kadi",
      startQuiz: "Anza Chemsha Bongo",
      loadMore: "Ongeza Zaidi",
      saveOffline: "Hifadhi Nje ya Mtandao",
      discuss: "Zungumza na Mwalimu",
      placeholderConcept: "Ingiza mada (mfano Aljebra)",
      placeholderSubject: "Somo (mfano Fizikia)",
      placeholderChat: "Uliza Mwalimu swali...",
      emptyStudy: "Ingiza mada ili upate vidokezo vya masomo!",
      emptyCards: "Chagua somo ili utengeneze kadi!",
      emptyQuiz: "Tengeneza chemsha bongo ili upime maarifa yako!",
      emptyChat: "Sasa! Mimi ni Mwalimu AI. Niulize chochote kuhusu STEM.",
      explanation: "Maelezo",
      nextQuestion: "Swali Linalofuata",
      finishQuiz: "Maliza Chemsha Bongo",
      analysis: "Uchambuzi wa AI",
      analyzing: "Tunachambua matokeo...",
      discussing: "Tunajadili",
      offlineTitle: "Vifaa vya Nje ya Mtandao",
      noSaved: "Hakuna vifaa vilivyohifadhiwa bado."
    },
    sheng: {
      title: "Mwalimu AI",
      subtitle: "Beshte yako wa STEM mtaani",
      study: "Somo",
      cards: "Kadi",
      quiz: "Quiz",
      chat: "Story",
      saved: "Saved",
      generate: "Tengeneza",
      getCards: "Leta Kadi",
      startQuiz: "Anza Quiz",
      loadMore: "Ongeza Zingine",
      saveOffline: "Save Offline",
      discuss: "Bonga na Mwalimu",
      placeholderConcept: "Weka mada (e.g. Algebra)",
      placeholderSubject: "Somo (e.g. Physics)",
      placeholderChat: "Uliza Mwalimu swali...",
      emptyStudy: "Weka mada upate tips za kusoma!",
      emptyCards: "Chagua somo utengeneze kadi!",
      emptyQuiz: "Tengeneza quiz upime akili!",
      emptyChat: "Sasa! Mimi ni Mwalimu AI. Niulize swali yoyote ya STEM.",
      explanation: "Maelezo",
      nextQuestion: "Swali Next",
      finishQuiz: "Maliza Quiz",
      analysis: "AI Analysis",
      analyzing: "Tuna-analyze results...",
      discussing: "Tunajadili",
      offlineTitle: "Vitu ume-save",
      noSaved: "Huja-save kitu bado."
    }
  };

  const t = translations[language];

  // Study Points State
  const [concept, setConcept] = useState('Quadratic Equations');
  const [studyPoints, setStudyPoints] = useState<StudyPoint[]>([]);

  // Flashcards State
  const [subject, setSubject] = useState('Biology');
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Quiz State
  const [quizSubject, setQuizSubject] = useState('Computer Science');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizResults, setQuizResults] = useState<{ question: string, isCorrect: boolean, selected: string, correct: string }[]>([]);
  const [quizAnalysis, setQuizAnalysis] = useState<string | null>(null);

  // Chat State
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'model', text: string }[]>([]);
  const [studyPath, setStudyPath] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<{ type: 'quiz' | 'flashcards', subject: string } | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Offline / Saved State
  const [savedContent, setSavedContent] = useState<{
    studyPoints: { concept: string, points: StudyPoint[] }[],
    flashcards: { subject: string, cards: Flashcard[] }[],
    quizzes: { subject: string, questions: Question[] }[]
  }>({ studyPoints: [], flashcards: [], quizzes: [] });

  useEffect(() => {
    // Load saved content from localStorage
    const saved = localStorage.getItem('mwalimu_saved_content');
    if (saved) {
      setSavedContent(JSON.parse(saved));
    }
  }, []);

  const saveToOffline = (type: 'study' | 'flashcards' | 'quiz', data: any, label: string) => {
    const newSaved = { ...savedContent };
    if (type === 'study') {
      newSaved.studyPoints.push({ concept: label, points: data });
    } else if (type === 'flashcards') {
      newSaved.flashcards.push({ subject: label, cards: data });
    } else if (type === 'quiz') {
      newSaved.quizzes.push({ subject: label, questions: data });
    }
    setSavedContent(newSaved);
    localStorage.setItem('mwalimu_saved_content', JSON.stringify(newSaved));
    alert(`${label} saved for offline use!`);
  };

  const deleteSaved = (type: 'study' | 'flashcards' | 'quiz', index: number) => {
    const newSaved = { ...savedContent };
    if (type === 'study') newSaved.studyPoints.splice(index, 1);
    if (type === 'flashcards') newSaved.flashcards.splice(index, 1);
    if (type === 'quiz') newSaved.quizzes.splice(index, 1);
    setSavedContent(newSaved);
    localStorage.setItem('mwalimu_saved_content', JSON.stringify(newSaved));
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleGenerateStudyPoints = async () => {
    setLoading(true);
    try {
      const points = await generateStudyPoints(concept, language);
      setStudyPoints(points);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDiscussStudyPoint = (point: StudyPoint) => {
    setStudyPath(point.concept);
    const msgs = {
      english: `Mwalimu, I have a question about "${point.concept}". Your suggestion was: "${point.suggestion}". Can you explain more?`,
      kiswahili: `Mwalimu, niko na swali kuhusu "${point.concept}". Pendekezo lako lilikuwa: "${point.suggestion}". Unaweza kuelezea zaidi?`,
      sheng: `Mwalimu, niko na swali kuhusu "${point.concept}". Suggestion yako ilikuwa: "${point.suggestion}". Hebu nielezee zaidi?`
    };
    setChatMessage(msgs[language]);
    setActiveTab('chat');
  };

  const handleGenerateFlashcards = async (append = false) => {
    setLoading(true);
    try {
      const cards = await generateFlashcards(subject);
      if (append) {
        setFlashcards(prev => [...prev, ...cards]);
      } else {
        setFlashcards(cards);
        setCurrentCardIndex(0);
        setIsFlipped(false);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQuiz = async (append = false) => {
    setLoading(true);
    try {
      const q = await generateQuestions(quizSubject, 'Intermediate');
      if (append) {
        setQuestions(prev => [...prev, ...q]);
      } else {
        setQuestions(q);
        setCurrentQuestionIndex(0);
        setSelectedAnswer(null);
        setShowExplanation(false);
        setQuizResults([]);
        setQuizAnalysis(null);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFinishQuiz = async () => {
    setLoading(true);
    try {
      const analysis = await generateQuizAnalysis(quizSubject, quizResults, language);
      setQuizAnalysis(analysis);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim()) return;
    const userMsg = chatMessage;
    setChatMessage('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setSuggestion(null);
    
    setLoading(true);
    try {
      const response = await chatWithMwalimu(userMsg, chatHistory, language, studyPath || undefined);
      if (response) {
        // Parse for suggestions
        let cleanResponse = response;
        const quizMatch = response.match(/\[SUGGEST_QUIZ:(.*?)\]/);
        const flashMatch = response.match(/\[SUGGEST_FLASHCARDS:(.*?)\]/);

        if (quizMatch) {
          setSuggestion({ type: 'quiz', subject: quizMatch[1] });
          cleanResponse = response.replace(/\[SUGGEST_QUIZ:.*?\]/, '');
        } else if (flashMatch) {
          setSuggestion({ type: 'flashcards', subject: flashMatch[1] });
          cleanResponse = response.replace(/\[SUGGEST_FLASHCARDS:.*?\]/, '');
        }

        setChatHistory(prev => [...prev, { role: 'model', text: cleanResponse }]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-kenya-red rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg border-2 border-kenya-black">
            M
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold text-kenya-black tracking-tight">{t.title}</h1>
            <p className="text-sm text-kenya-green font-medium">{t.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg border border-gray-200">
          <Languages className="w-4 h-4 text-gray-500 ml-2" />
          {(['english', 'kiswahili', 'sheng'] as Language[]).map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`px-3 py-1 rounded-md text-xs font-bold uppercase transition-all ${
                language === lang 
                ? 'bg-kenya-red text-white shadow-sm' 
                : 'text-gray-500 hover:bg-gray-200'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="flex justify-around mb-8 border-b-2 border-gray-100">
        {[
          { id: 'study', icon: BookOpen, label: t.study },
          { id: 'flashcards', icon: Layers, label: t.cards },
          { id: 'quiz', icon: HelpCircle, label: t.quiz },
          { id: 'chat', icon: MessageSquare, label: t.chat },
          { id: 'saved', icon: Flag, label: t.saved },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex flex-col items-center gap-1 pb-2 px-4 transition-all relative ${
              activeTab === tab.id ? 'text-kenya-red' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <tab.icon className="w-6 h-6" />
            <span className="text-xs font-bold uppercase tracking-wider">{tab.label}</span>
            {activeTab === tab.id && (
              <motion.div 
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-1 bg-kenya-red rounded-t-full"
              />
            )}
          </button>
        ))}
      </nav>

      {/* Main Content Area */}
      <main className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 min-h-[500px] overflow-hidden flex flex-col">
        
        {/* Study Tab */}
        {activeTab === 'study' && (
          <div className="p-6 flex flex-col h-full">
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-2">{t.study}</h2>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={concept}
                  onChange={(e) => setConcept(e.target.value)}
                  placeholder={t.placeholderConcept}
                  className="flex-1 border-2 border-gray-200 rounded-lg px-4 py-2 focus:border-kenya-red outline-none transition-colors"
                />
                <button 
                  onClick={() => handleGenerateStudyPoints()}
                  disabled={loading}
                  className="btn-kenya flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t.generate}
                </button>
              </div>
            </div>

            <div className="space-y-4 flex-1">
              {studyPoints.length > 0 ? (
                <>
                  <button 
                    onClick={() => saveToOffline('study', studyPoints, concept)}
                    className="text-xs font-bold text-kenya-green flex items-center gap-1 mb-2 hover:underline"
                  >
                    <Flag className="w-3 h-3" /> {t.saveOffline}
                  </button>
                  {studyPoints.map((point, idx) => (
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      key={idx} 
                      className="p-4 rounded-xl border-l-4 border-kenya-green bg-green-50 shadow-sm group"
                    >
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-kenya-green mb-1">{point.concept}</h3>
                        <button 
                          onClick={() => handleDiscussStudyPoint(point)}
                          className="text-[10px] font-bold uppercase text-kenya-red opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          {t.discuss}
                        </button>
                      </div>
                      <p className="text-gray-700 leading-relaxed italic">&quot;{point.suggestion}&quot;</p>
                    </motion.div>
                  ))}
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 py-12">
                  <BookOpen className="w-16 h-16 mb-4 opacity-20" />
                  <p>{t.emptyStudy}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Flashcards Tab */}
        {activeTab === 'flashcards' && (
          <div className="p-6 flex flex-col h-full items-center">
            <div className="w-full mb-6">
              <h2 className="text-xl font-bold mb-2">{t.cards}</h2>
              <div className="flex gap-2">
                <select 
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="flex-1 border-2 border-gray-200 rounded-lg px-4 py-2 outline-none"
                >
                  <option>Biology</option>
                  <option>Computer Science</option>
                  <option>Physics</option>
                  <option>Chemistry</option>
                  <option>Medicine</option>
                </select>
                <button 
                  onClick={() => handleGenerateFlashcards()}
                  disabled={loading}
                  className="btn-kenya disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t.getCards}
                </button>
              </div>
            </div>

            {flashcards.length > 0 ? (
              <div className="flex flex-col items-center gap-8 w-full max-w-md">
                <div className="flex gap-4">
                  <button 
                    onClick={() => saveToOffline('flashcards', flashcards, subject)}
                    className="text-xs font-bold text-kenya-green flex items-center gap-1 hover:underline"
                  >
                    <Flag className="w-3 h-3" /> {t.saveOffline}
                  </button>
                  <button 
                    onClick={() => handleGenerateFlashcards(true)}
                    disabled={loading}
                    className="text-xs font-bold text-kenya-red flex items-center gap-1 hover:underline disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> {t.loadMore}
                  </button>
                </div>
                <div 
                  className="relative w-full h-64 perspective-1000 cursor-pointer"
                  onClick={() => setIsFlipped(!isFlipped)}
                >
                  <motion.div 
                    className="w-full h-full relative transition-all duration-500 preserve-3d"
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                  >
                    {/* Front */}
                    <div className="absolute inset-0 backface-hidden bg-kenya-black text-white rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-2xl border-4 border-kenya-red">
                      <span className="text-xs font-bold uppercase tracking-widest text-kenya-red mb-4">TERM</span>
                      <h3 className="text-3xl font-bold">{flashcards[currentCardIndex].term}</h3>
                      <p className="mt-4 text-sm opacity-60">Click to flip</p>
                    </div>
                    {/* Back */}
                    <div className="absolute inset-0 backface-hidden bg-white text-kenya-black rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-2xl border-4 border-kenya-green rotate-y-180">
                      <span className="text-xs font-bold uppercase tracking-widest text-kenya-green mb-2">DEFINITION</span>
                      <p className="text-lg mb-4">{flashcards[currentCardIndex].definition}</p>
                      <div className="w-full h-px bg-gray-100 my-2" />
                      <div className="grid grid-cols-2 gap-4 w-full text-xs">
                        <div className="text-left">
                          <p className="font-bold text-kenya-red">Kiswahili</p>
                          <p>{flashcards[currentCardIndex].translation_sw}</p>
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-kenya-green">Sheng</p>
                          <p>{flashcards[currentCardIndex].translation_sheng}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>

                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => {
                      setCurrentCardIndex(prev => Math.max(0, prev - 1));
                      setIsFlipped(false);
                    }}
                    disabled={currentCardIndex === 0}
                    className="p-2 rounded-full bg-gray-100 disabled:opacity-30"
                  >
                    <ChevronLeft />
                  </button>
                  <span className="font-bold">{currentCardIndex + 1} / {flashcards.length}</span>
                  <button 
                    onClick={() => {
                      setCurrentCardIndex(prev => Math.min(flashcards.length - 1, prev + 1));
                      setIsFlipped(false);
                    }}
                    disabled={currentCardIndex === flashcards.length - 1}
                    className="p-2 rounded-full bg-gray-100 disabled:opacity-30"
                  >
                    <ChevronRight />
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 py-12">
                <Layers className="w-16 h-16 mb-4 opacity-20" />
                <p>{t.emptyCards}</p>
              </div>
            )}
          </div>
        )}

        {/* Quiz Tab */}
        {activeTab === 'quiz' && (
          <div className="p-6 flex flex-col h-full">
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-2">{t.quiz}</h2>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={quizSubject}
                  onChange={(e) => setQuizSubject(e.target.value)}
                  placeholder={t.placeholderSubject}
                  className="flex-1 border-2 border-gray-200 rounded-lg px-4 py-2 outline-none"
                />
                <button 
                  onClick={() => handleGenerateQuiz()}
                  disabled={loading}
                  className="btn-kenya disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t.startQuiz}
                </button>
              </div>
            </div>

            {questions.length > 0 ? (
              <div className="flex-1">
                <div className="flex gap-4 mb-4">
                  <button 
                    onClick={() => saveToOffline('quiz', questions, quizSubject)}
                    className="text-xs font-bold text-kenya-green flex items-center gap-1 hover:underline"
                  >
                    <Flag className="w-3 h-3" /> {t.saveOffline}
                  </button>
                  <button 
                    onClick={() => handleGenerateQuiz(true)}
                    disabled={loading}
                    className="text-xs font-bold text-kenya-red flex items-center gap-1 hover:underline disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> {t.loadMore}
                  </button>
                </div>
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-bold text-gray-500 uppercase">{t.quiz} {currentQuestionIndex + 1} of {questions.length}</span>
                    <div className="h-2 w-32 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-kenya-red transition-all" 
                        style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                      />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold leading-tight">{questions[currentQuestionIndex].question}</h3>
                </div>

                <div className="grid grid-cols-1 gap-3 mb-6">
                  {questions[currentQuestionIndex].options.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        if (selectedAnswer) return;
                        setSelectedAnswer(option);
                        setShowExplanation(true);
                        setQuizResults(prev => [...prev, {
                          question: questions[currentQuestionIndex].question,
                          isCorrect: option === questions[currentQuestionIndex].answer,
                          selected: option,
                          correct: questions[currentQuestionIndex].answer
                        }]);
                      }}
                      className={`p-4 rounded-xl border-2 text-left transition-all font-medium ${
                        selectedAnswer === option
                          ? option === questions[currentQuestionIndex].answer
                            ? 'bg-green-50 border-kenya-green text-kenya-green'
                            : 'bg-red-50 border-kenya-red text-kenya-red'
                          : selectedAnswer && option === questions[currentQuestionIndex].answer
                            ? 'bg-green-50 border-kenya-green text-kenya-green'
                            : 'bg-white border-gray-100 hover:border-gray-300'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>

                <AnimatePresence>
                  {showExplanation && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-gray-50 rounded-xl border border-gray-200 mb-6"
                    >
                      <p className="text-sm font-bold mb-1 text-gray-500 uppercase">{t.explanation}</p>
                      <p className="text-gray-700">{questions[currentQuestionIndex].explanation}</p>
                      
                      <button 
                        onClick={() => {
                          if (currentQuestionIndex < questions.length - 1) {
                            setCurrentQuestionIndex(prev => prev + 1);
                            setSelectedAnswer(null);
                            setShowExplanation(false);
                          } else {
                            handleFinishQuiz();
                          }
                        }}
                        className="mt-4 text-kenya-red font-bold flex items-center gap-1 hover:underline"
                      >
                        {currentQuestionIndex < questions.length - 1 ? t.nextQuestion : t.finishQuiz} <ChevronRight className="w-4 h-4" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {quizAnalysis && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-6 bg-kenya-green/5 border-2 border-kenya-green rounded-2xl"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <BarChart3 className="w-5 h-5 text-kenya-green" />
                      <h3 className="font-bold text-kenya-green uppercase tracking-wider">{t.analysis}</h3>
                    </div>
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown>{quizAnalysis}</ReactMarkdown>
                    </div>
                  </motion.div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 py-12">
                <HelpCircle className="w-16 h-16 mb-4 opacity-20" />
                <p>{t.emptyQuiz}</p>
              </div>
            )}
          </div>
        )}

        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <div className="flex flex-col h-[500px]">
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {chatHistory.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center px-8">
                  <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
                  <p className="font-bold text-gray-500 mb-2">{t.emptyChat}</p>
                </div>
              )}
              {chatHistory.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-kenya-red text-white rounded-tr-none' 
                      : 'bg-gray-100 text-kenya-black rounded-tl-none border border-gray-200'
                  }`}>
                    <div className="prose prose-sm max-w-none prose-p:leading-relaxed">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
              {suggestion && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-kenya-green/10 border-2 border-kenya-green p-4 rounded-2xl rounded-tl-none flex flex-col gap-3">
                    <p className="text-sm font-bold text-kenya-green">Mwalimu suggests a challenge!</p>
                    <button 
                      onClick={() => {
                        if (suggestion.type === 'quiz') {
                          setQuizSubject(suggestion.subject);
                          setActiveTab('quiz');
                          handleGenerateQuiz();
                        } else {
                          setSubject(suggestion.subject);
                          setActiveTab('flashcards');
                          handleGenerateFlashcards();
                        }
                      }}
                      className="bg-kenya-green text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors"
                    >
                      Take {suggestion.type === 'quiz' ? t.quiz : t.cards} on {suggestion.subject}
                    </button>
                  </div>
                </motion.div>
              )}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 p-4 rounded-2xl rounded-tl-none border border-gray-200 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-kenya-red" />
                    <span className="text-xs font-bold text-gray-500 uppercase">{t.analyzing}</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50">
              {studyPath && (
                <div className="mb-2 flex items-center justify-between bg-kenya-red/5 px-3 py-1 rounded-full border border-kenya-red/20">
                  <span className="text-[10px] font-bold text-kenya-red uppercase tracking-wider">{t.discussing}: {studyPath}</span>
                  <button onClick={() => setStudyPath(null)} className="text-kenya-red text-xs">×</button>
                </div>
              )}
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={t.placeholderChat}
                  className="flex-1 border-2 border-gray-200 rounded-full px-6 py-3 outline-none focus:border-kenya-red transition-all"
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={loading || !chatMessage.trim()}
                  className="w-12 h-12 bg-kenya-red text-white rounded-full flex items-center justify-center shadow-lg hover:bg-kenya-black transition-colors disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Saved Tab */}
        {activeTab === 'saved' && (
          <div className="p-6 flex flex-col h-full">
            <h2 className="text-xl font-bold mb-6">{t.offlineTitle}</h2>
            
            <div className="space-y-8">
              {/* Saved Study Points */}
              <section>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">{t.study}</h3>
                {savedContent.studyPoints.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {savedContent.studyPoints.map((item, idx) => (
                      <div key={idx} className="p-4 rounded-xl border-2 border-gray-100 bg-gray-50 group relative">
                        <h4 className="font-bold text-kenya-green">{item.concept}</h4>
                        <p className="text-xs text-gray-500">{item.points.length} points saved</p>
                        <div className="mt-2 flex gap-2">
                          <button 
                            onClick={() => {
                              setStudyPoints(item.points);
                              setConcept(item.concept);
                              setActiveTab('study');
                            }}
                            className="text-[10px] font-bold text-kenya-red uppercase hover:underline"
                          >
                            View
                          </button>
                          <button 
                            onClick={() => deleteSaved('study', idx)}
                            className="text-[10px] font-bold text-gray-400 uppercase hover:text-red-500"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-gray-300 italic">{t.noSaved}</p>}
              </section>

              {/* Saved Flashcards */}
              <section>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">{t.cards}</h3>
                {savedContent.flashcards.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {savedContent.flashcards.map((item, idx) => (
                      <div key={idx} className="p-4 rounded-xl border-2 border-gray-100 bg-gray-50 group relative">
                        <h4 className="font-bold text-kenya-red">{item.subject}</h4>
                        <p className="text-xs text-gray-500">{item.cards.length} cards saved</p>
                        <div className="mt-2 flex gap-2">
                          <button 
                            onClick={() => {
                              setFlashcards(item.cards);
                              setSubject(item.subject);
                              setActiveTab('flashcards');
                            }}
                            className="text-[10px] font-bold text-kenya-red uppercase hover:underline"
                          >
                            View
                          </button>
                          <button 
                            onClick={() => deleteSaved('flashcards', idx)}
                            className="text-[10px] font-bold text-gray-400 uppercase hover:text-red-500"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-gray-300 italic">{t.noSaved}</p>}
              </section>

              {/* Saved Quizzes */}
              <section>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">{t.quiz}</h3>
                {savedContent.quizzes.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {savedContent.quizzes.map((item, idx) => (
                      <div key={idx} className="p-4 rounded-xl border-2 border-gray-100 bg-gray-50 group relative">
                        <h4 className="font-bold text-kenya-black">{item.subject}</h4>
                        <p className="text-xs text-gray-500">{item.questions.length} questions saved</p>
                        <div className="mt-2 flex gap-2">
                          <button 
                            onClick={() => {
                              setQuestions(item.questions);
                              setQuizSubject(item.subject);
                              setActiveTab('quiz');
                            }}
                            className="text-[10px] font-bold text-kenya-red uppercase hover:underline"
                          >
                            View
                          </button>
                          <button 
                            onClick={() => deleteSaved('quiz', idx)}
                            className="text-[10px] font-bold text-gray-400 uppercase hover:text-red-500"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-gray-300 italic">{t.noSaved}</p>}
              </section>
            </div>
          </div>
        )}

      </main>

      {/* Footer Branding */}
      <footer className="mt-12 text-center">
        <div className="flex justify-center items-center gap-4 mb-4">
          <div className="h-1 w-12 bg-kenya-black rounded-full" />
          <div className="h-1 w-12 bg-kenya-red rounded-full" />
          <div className="h-1 w-12 bg-kenya-green rounded-full" />
        </div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">
          Made with ❤️ in Kenya for the Future of STEM
        </p>
      </footer>

      <style jsx global>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
}
