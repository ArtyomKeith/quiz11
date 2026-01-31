import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { generateQuestions, generateDailyQuestions } from '../services/geminiService';
import { db } from '../services/db';
import { multiplayerService } from '../services/multiplayerService';
import { supabase } from '../services/supabase';
import { Question, MultiplayerMatch } from '../types';
import GlassCard from '../components/GlassCard';
import { ArrowLeft, CheckCircle, XCircle, Loader2, Sparkles, Clock, AlertTriangle, User, Users } from 'lucide-react';

const TIMER_DURATION = 15;

const Quiz: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const topic = searchParams.get('topic') || 'general';
  const mode = searchParams.get('mode') || 'single';
  const matchId = searchParams.get('matchId');

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
  
  // User State
  const [userId, setUserId] = useState('');
  const [isPlayer1, setIsPlayer1] = useState(false);
  
  // Exit Modal State
  const [showExitModal, setShowExitModal] = useState(false);
  
  // Timer State
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Real Multiplayer State
  const [opponentScore, setOpponentScore] = useState(0);

  // Fetch Questions & Setup
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const user = await db.getUser();
      setUserId(user.id);

      let data: Question[] = [];

      if (mode === 'daily') {
        data = await generateDailyQuestions();
      } else if (mode === 'multi' && matchId) {
        // Load match data to ensure sync
        const match = await multiplayerService.getMatch(matchId);
        if (match && match.questions) {
            data = match.questions;
            const isP1 = match.player1_id === user.id;
            setIsPlayer1(isP1);
            
            // Initial opponent score load
            setOpponentScore(isP1 ? match.player2_score : match.player1_score);
        } else {
            console.error("Failed to load match or questions");
            navigate('/multiplayer'); // Abort
            return;
        }
      } else {
        data = await generateQuestions(topic);
      }
      
      setQuestions(data);
      setLoading(false);
      setIsTimerRunning(true);
    };
    init();
  }, [topic, mode, matchId]);

  // -- ROBUST SCORE SYNC (Realtime + Polling) --
  useEffect(() => {
    if (mode !== 'multi' || !matchId || !userId) return;

    // 1. Helper to update state based on match data
    const syncState = (m: MultiplayerMatch) => {
        // Determine if I am P1 or P2 based on ID check (more reliable than state closure)
        const amIPlayer1 = m.player1_id === userId;
        // If I am P1, opponent is P2. If I am P2, opponent is P1.
        const enemyScore = amIPlayer1 ? m.player2_score : m.player1_score;
        setOpponentScore(enemyScore);
    };

    // 2. Realtime Subscription (Fast updates)
    const channel = supabase
        .channel(`quiz-match-${matchId}`)
        .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'matches', filter: `id=eq.${matchId}` },
            (payload) => {
                const m = payload.new as MultiplayerMatch;
                syncState(m);
            }
        )
        .subscribe();

    // 3. Polling Interval (Backup for stability - every 3 seconds)
    // This ensures that even if a socket packet is dropped, the score updates.
    const intervalId = setInterval(async () => {
        const m = await multiplayerService.getMatch(matchId);
        if (m) {
            syncState(m);
        }
    }, 3000);

    return () => {
        supabase.removeChannel(channel);
        clearInterval(intervalId);
    };
  }, [mode, matchId, userId]);

  // Timer Logic
  useEffect(() => {
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

  const saveData = async () => {
    if (mode === 'multi') return; // Multi data is saved incrementally
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

  useEffect(() => {
      if (finished && !dataSaved && mode !== 'multi' && !isSaving && !saveError) {
          saveData();
      }
  }, [finished, dataSaved, score, mode]);

  const handleTimeOut = () => {
    setIsTimerRunning(false);
    setSelectedOption(-1); 
    setShowExplanation(true);
    setTimeout(nextQuestion, 3500);
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

  const handleOptionClick = async (index: number) => {
    if (selectedOption !== null) return;

    setIsTimerRunning(false);
    setSelectedOption(index);
    setShowExplanation(true);

    const isCorrect = index === questions[currentIndex].correctAnswerIndex;
    let newScore = score;
    if (isCorrect) {
        const timeBonus = Math.floor(timeLeft * 2);
        const points = 100 + timeBonus + (mode === 'daily' ? 50 : 0);
        newScore = score + points;
        setScore(newScore);
    }

    // Sync score if multiplayer
    if (mode === 'multi' && matchId) {
        // Optimistic UI update happened above, now send to DB
        await multiplayerService.updateScore(matchId, userId, newScore, isPlayer1);
    }

    setTimeout(nextQuestion, 3000);
  };

  const handleBackClick = () => {
    if (finished) {
        navigate('/');
    } else {
        setIsTimerRunning(false);
        setShowExitModal(true);
    }
  };

  const confirmExit = () => {
      navigate('/');
  };

  const cancelExit = () => {
      setShowExitModal(false);
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
        <h2 className="mt-6 text-2xl font-bold">
            {mode === 'multi' ? 'Синхронизация матча...' : 'Генерация...'}
        </h2>
      </div>
    );
  }

  if (finished) {
    const isWin = mode === 'multi' ? score > opponentScore : score > 200;
    const isDraw = mode === 'multi' && score === opponentScore;

    return (
      <div className="h-full flex flex-col items-center justify-center p-6 animate-fade-in">
        <GlassCard className="w-full text-center space-y-6">
          <h1 className="text-3xl font-bold">
             {mode === 'multi' ? (isDraw ? 'Ничья!' : isWin ? 'Победа!' : 'Поражение') : 'Завершено!'}
          </h1>
          <div className="flex justify-center">
            {isWin ? <Sparkles size={80} className="text-yellow-400" /> : <CheckCircle size={80} className="text-blue-400" />}
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="p-3 bg-white/10 rounded-xl border border-white/10">
                 <p className="text-sm text-white/70">Вы</p>
                 <p className="font-bold mt-1 text-2xl text-yellow-400">{score}</p>
             </div>
             {mode === 'multi' && (
                 <div className="p-3 bg-white/10 rounded-xl border border-white/10">
                     <p className="text-sm text-white/70">Соперник</p>
                     <p className="font-bold mt-1 text-2xl text-red-400">{opponentScore}</p>
                 </div>
             )}
          </div>
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
      
      {showExitModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
              <GlassCard className="w-full max-w-sm text-center border-red-500/30">
                  <div className="flex justify-center mb-4 text-red-400">
                      <AlertTriangle size={48} />
                  </div>
                  <h2 className="text-xl font-bold mb-2">Сдаться?</h2>
                  <p className="text-white/60 text-sm mb-6">
                      Прогресс будет потерян.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                      <button onClick={cancelExit} className="bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition-colors">Нет</button>
                      <button onClick={confirmExit} className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-colors">Выйти</button>
                  </div>
              </GlassCard>
          </div>
      )}

      {/* Header */}
      <div className="grid grid-cols-3 items-center mb-4 h-12 shrink-0">
        <button onClick={handleBackClick} className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-full hover:bg-white/20 transition-colors">
          <ArrowLeft size={20} />
        </button>
        
        <div className="flex justify-center">
             <div className="flex items-center space-x-2 bg-black/20 px-3 py-1 rounded-full border border-white/10">
                <Clock size={14} className={timeLeft < 5 ? 'text-red-400 animate-pulse' : 'text-white/70'} />
                <span className={`font-mono font-bold ${timeLeft < 5 ? 'text-red-400' : 'text-white'}`}>{timeLeft}s</span>
            </div>
        </div>

        {/* Improved Scoreboard */}
        <div className="flex flex-col items-end text-xs">
             <div className="flex items-center gap-1">
                 <span className="text-white/60">Вы:</span>
                 <span className="font-mono font-bold text-yellow-400 text-sm">{score}</span>
             </div>
             {mode === 'multi' && (
                 <div className="flex items-center gap-1">
                     <span className="text-white/60">Враг:</span>
                     <span className="font-mono font-bold text-red-400 text-sm">{opponentScore}</span>
                 </div>
             )}
        </div>
      </div>

      <div className="w-full h-1 bg-white/10 rounded-full mb-4 shrink-0 overflow-hidden">
        <div 
          className="h-full bg-blue-500 transition-all duration-300"
          style={{ width: `${(timeLeft / TIMER_DURATION) * 100}%` }}
        ></div>
      </div>

      <div className="flex-grow flex flex-col justify-center items-center w-full min-h-0 mb-4 space-y-4 overflow-y-auto">
          {/* Question Counter */}
          <GlassCard className="w-full p-4 text-center flex flex-col items-center justify-center min-h-[120px] relative">
            <div className="absolute top-3 left-0 w-full text-center">
                <span className="bg-white/10 px-2 py-1 rounded-md text-[10px] font-bold text-white/50 tracking-wider">
                    ВОПРОС {currentIndex + 1} / {questions.length}
                </span>
            </div>
            <h2 className="text-lg font-bold leading-relaxed mt-4">{currentQuestion.text}</h2>
          </GlassCard>

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
