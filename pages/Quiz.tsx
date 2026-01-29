import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { generateQuestions, generateDailyQuestions } from '../services/geminiService';
import { db } from '../services/db';
import { Question } from '../types';
import GlassCard from '../components/GlassCard';
import { ArrowLeft, CheckCircle, XCircle, Loader2, Sparkles, Clock, AlertTriangle, RefreshCcw, LogOut } from 'lucide-react';

const TIMER_DURATION = 15; // Seconds

const Quiz: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const topic = searchParams.get('topic') || 'general';
  const mode = searchParams.get('mode') || 'single';

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [finished, setFinished] = useState(false);
  const [dataSaved, setDataSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  
  // Exit Modal State
  const [showExitModal, setShowExitModal] = useState(false);
  
  // Timer State
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Multiplayer Simulation State
  const [opponentScore, setOpponentScore] = useState(0);

  // Fetch Questions
  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      let data: Question[] = [];
      if (mode === 'daily') {
        data = await generateDailyQuestions();
      } else {
        data = await generateQuestions(topic);
      }
      setQuestions(data);
      setLoading(false);
      setIsTimerRunning(true);
    };
    fetchQuestions();
  }, [topic, mode]);

  // Timer Logic
  useEffect(() => {
    // Timer stops if modal is open (isTimerRunning set to false on back click)
    if (!isTimerRunning || finished || loading) return;

    if (timeLeft <= 0) {
      handleTimeOut();
      return;
    }

    const timerId = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [timeLeft, isTimerRunning, finished, loading]);

  // Opponent logic (simulation)
  useEffect(() => {
    if (mode !== 'multi' || finished) return;
    const interval = setInterval(() => {
        if (Math.random() > 0.6) {
            setOpponentScore(prev => prev + 100);
        }
    }, 3000);
    return () => clearInterval(interval);
  }, [mode, finished]);

  const saveData = async () => {
    if (mode === 'multi') return;
    setIsSaving(true);
    setSaveError(false);
    try {
        await db.addPoints(score);
        setDataSaved(true);
    } catch(e) {
        console.error("Error saving score", e);
        setSaveError(true);
    } finally {
        setIsSaving(false);
    }
  };

  // Save to DB when finished
  useEffect(() => {
      if (finished && !dataSaved && mode !== 'multi' && !isSaving && !saveError) {
          saveData();
      }
  }, [finished, dataSaved, score, mode]);

  const handleTimeOut = () => {
    setIsTimerRunning(false);
    setSelectedOption(-1); // -1 indicates timeout
    setShowExplanation(true);
    
    // Auto advance after showing explanation
    setTimeout(nextQuestion, 3500); // Slightly longer to read explanation
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setShowExplanation(false);
      setTimeLeft(TIMER_DURATION);
      setIsTimerRunning(true);
    } else {
      setFinished(true);
      setIsTimerRunning(false);
    }
  };

  const handleOptionClick = (index: number) => {
    if (selectedOption !== null) return;

    setIsTimerRunning(false); // Pause timer
    setSelectedOption(index);
    setShowExplanation(true);

    const isCorrect = index === questions[currentIndex].correctAnswerIndex;
    if (isCorrect) {
        // Score calculation includes time bonus
        const timeBonus = Math.floor(timeLeft * 2);
        setScore((prev) => prev + 100 + timeBonus + (mode === 'daily' ? 50 : 0));
    }

    setTimeout(nextQuestion, 3000); // 3s to read explanation
  };

  // --- Exit Logic ---
  const handleBackClick = () => {
    if (finished) {
        navigate('/');
    } else {
        // Pause timer and show modal
        setIsTimerRunning(false);
        setShowExitModal(true);
    }
  };

  const confirmExit = () => {
      navigate('/');
  };

  const cancelExit = () => {
      setShowExitModal(false);
      // Only resume timer if we haven't selected an option yet (meaning we are actively thinking)
      if (selectedOption === null) {
          setIsTimerRunning(true);
      }
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
          <Loader2 size={64} className="animate-spin text-white relative z-10" />
        </div>
        <h2 className="mt-6 text-2xl font-bold">Генерация...</h2>
      </div>
    );
  }

  if (finished) {
    const isWin = mode === 'multi' ? score > opponentScore : score > 200;

    return (
      <div className="h-full flex flex-col items-center justify-center p-6 animate-fade-in">
        <GlassCard className="w-full text-center space-y-6">
          <h1 className="text-3xl font-bold">{isWin ? 'Победа!' : 'Завершено!'}</h1>
          <div className="flex justify-center">
            {isWin ? <Sparkles size={80} className="text-yellow-400" /> : <CheckCircle size={80} className="text-blue-400" />}
          </div>
          <div className="space-y-2">
            <p className="text-xl">Счет за игру</p>
            <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-500">
              {score}
            </p>
            {mode !== 'multi' && (
                <div className="min-h-8 flex flex-col items-center justify-center gap-2">
                    {isSaving ? (
                         <p className="text-sm text-white/50 flex justify-center items-center gap-2"><Loader2 size={12} className="animate-spin"/> Сохранение...</p>
                    ) : saveError ? (
                         <div className="flex flex-col items-center gap-2">
                             <p className="text-sm text-red-400 animate-pulse flex items-center justify-center gap-1">
                                 <AlertTriangle size={14}/> Ошибка базы данных
                             </p>
                             <button onClick={saveData} className="flex items-center gap-1 text-xs bg-red-500/20 px-2 py-1 rounded hover:bg-red-500/40 transition-colors">
                                 <RefreshCcw size={10} /> Повторить
                             </button>
                         </div>
                    ) : (
                         <p className="text-sm text-green-300 animate-pulse">Сохранено в профиль</p>
                    )}
                </div>
            )}
          </div>
          {mode === 'multi' && (
             <div className="p-3 bg-white/10 rounded-xl">
                 <p className="text-sm text-white/70">Соперник: {opponentScore}</p>
                 <p className="font-bold mt-1 text-lg">{score > opponentScore ? "Ты выиграл!" : "Ты проиграл"}</p>
             </div>
          )}
          <button 
            onClick={() => navigate('/')}
            className="w-full bg-white text-black font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-transform"
          >
            В меню
          </button>
        </GlassCard>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className="h-full flex flex-col p-4 relative">
      
      {/* Exit Confirmation Modal */}
      {showExitModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
              <GlassCard className="w-full max-w-sm text-center border-red-500/30">
                  <div className="flex justify-center mb-4 text-red-400">
                      <AlertTriangle size={48} />
                  </div>
                  <h2 className="text-xl font-bold mb-2">Закончить викторину?</h2>
                  <p className="text-white/60 text-sm mb-6">
                      Текущий прогресс и заработанные очки ({score}) будут потеряны.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={cancelExit}
                        className="bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition-colors"
                      >
                          Остаться
                      </button>
                      <button 
                        onClick={confirmExit}
                        className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                      >
                          <LogOut size={16} /> Выйти
                      </button>
                  </div>
              </GlassCard>
          </div>
      )}

      {/* Header with Timer */}
      <div className="flex justify-between items-center mb-4 h-12 shrink-0">
        <button onClick={handleBackClick} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
          <ArrowLeft size={20} />
        </button>
        
        {/* Timer UI */}
        <div className="flex items-center space-x-2 bg-black/20 px-3 py-1 rounded-full border border-white/10">
            <Clock size={14} className={timeLeft < 5 ? 'text-red-400 animate-pulse' : 'text-white/70'} />
            <span className={`font-mono font-bold ${timeLeft < 5 ? 'text-red-400' : 'text-white'}`}>{timeLeft}s</span>
        </div>

        <div className="flex flex-col items-end">
             <div className="font-mono font-bold text-yellow-400 text-sm">{score}</div>
             <div className="text-[10px] text-white/50">{currentIndex + 1} / {questions.length}</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1 bg-white/10 rounded-full mb-4 shrink-0 overflow-hidden">
        <div 
          className="h-full bg-blue-500 transition-all duration-300"
          style={{ width: `${(timeLeft / TIMER_DURATION) * 100}%` }}
        ></div>
      </div>

      {/* Main Content Area - Question & Explanation */}
      <div className="flex-grow flex flex-col justify-center items-center w-full min-h-0 mb-4 space-y-4 overflow-y-auto">
          {/* Question Card: Smaller frame, auto height */}
          <GlassCard className="w-full p-4 text-center flex items-center justify-center min-h-[100px]">
            <h2 className="text-lg font-bold leading-relaxed">{currentQuestion.text}</h2>
          </GlassCard>

          {/* Explanation Toast - Inline */}
          {showExplanation && (
            <div className="w-full animate-fade-in-up bg-slate-900/90 backdrop-blur-xl p-4 rounded-xl border border-blue-500/50 shadow-2xl shrink-0">
               <p className="text-sm text-blue-100 leading-snug text-center">
                <span className={`font-bold block mb-1 ${currentQuestion.correctAnswerIndex === selectedOption ? 'text-green-400' : 'text-red-400'}`}>
                    {currentQuestion.correctAnswerIndex === selectedOption ? "Верно!" : "Ошибка!"}
                </span>
                {currentQuestion.correctAnswerIndex !== selectedOption && (
                     <span className="block mb-2 text-white/80">
                         Правильный ответ: {currentQuestion.options[currentQuestion.correctAnswerIndex]}
                     </span>
                )}
                {currentQuestion.explanation}
              </p>
            </div>
          )}
      </div>

      {/* Options - Fixed at bottom area */}
      <div className="space-y-2 shrink-0 pb-2">
        {currentQuestion.options.map((option, idx) => {
          let statusClass = 'bg-white/10 active:bg-white/20';
          let Icon = null;

          if (selectedOption !== null) {
            if (idx === currentQuestion.correctAnswerIndex) {
              statusClass = 'bg-green-500/80 border-green-400';
              Icon = CheckCircle;
            } else if (selectedOption === idx) {
              statusClass = 'bg-red-500/80 border-red-400';
              Icon = XCircle;
            } else {
              statusClass = 'bg-white/5 opacity-30';
            }
          }

          return (
            <button
              key={idx}
              disabled={selectedOption !== null}
              onClick={() => handleOptionClick(idx)}
              className={`w-full p-3.5 rounded-xl border border-white/10 text-left transition-all duration-200 flex justify-between items-center ${statusClass}`}
            >
              <span className="font-medium text-sm leading-tight pr-2">{option}</span>
              {Icon && <Icon size={18} className="shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Quiz;