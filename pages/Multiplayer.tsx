import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../components/GlassCard';
import { POPULAR_TOPICS } from '../constants';
import { Swords, User, Zap, Lock, Copy, ArrowRight, ArrowLeft, Users, Sparkles, AlertCircle, HelpCircle, Cpu, FlaskConical, Hourglass, Music, Globe, BookOpen } from 'lucide-react';

type MultiState = 'menu' | 'quick_search' | 'room_menu' | 'topic_selection' | 'room_create' | 'room_join' | 'found';

// Explicit mapping prevents loading the entire icon library
const iconMap: Record<string, React.ElementType> = {
  Cpu, FlaskConical, Hourglass, Music, Globe, BookOpen, HelpCircle
};

const Multiplayer: React.FC = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<MultiState>('menu');
  const [opponent, setOpponent] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string>('random');
  const [customTopic, setCustomTopic] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  // Ref to hold the timer ID so we can cancel it
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // -- Actions --

  const handleCancel = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsJoining(false);
    setError(null);
    setView('menu');
  };

  const startQuickSearch = () => {
    setView('quick_search');
    setIsJoining(false);
    setSelectedTopic('random'); 
    
    // Simulate finding logic
    timerRef.current = setTimeout(() => {
      setOpponent("RandomPlayer_77");
      setView('found');
      // Delay before redirecting to game
      timerRef.current = setTimeout(() => {
          navigate('/quiz?topic=random&mode=multi');
      }, 2000);
    }, 2500);
  };

  const startCreateRoomFlow = () => {
      setView('topic_selection');
  };

  const confirmRoomCreation = (topicId: string) => {
    if (!topicId.trim()) return;
    
    setSelectedTopic(topicId);
    // Generate random code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setRoomCode(code);
    setView('room_create');
    
    // Simulate someone joining after 4 seconds
    timerRef.current = setTimeout(() => {
        setOpponent("Friend_Pro");
        setView('found');
        timerRef.current = setTimeout(() => {
            navigate(`/quiz?topic=${encodeURIComponent(topicId)}&mode=multi`);
        }, 2000);
    }, 4000);
  };

  const joinRoom = () => {
      if(joinCode.length < 4) return;
      
      setError(null);
      setIsJoining(true);
      setView('quick_search'); // Show loader
      
      timerRef.current = setTimeout(() => {
        // MOCK VALIDATION LOGIC
        // Only allow entry if code is '777777' OR matches the locally generated roomCode
        const isValid = joinCode === '777777' || (roomCode && joinCode === roomCode);

        if (isValid) {
            const mockRoomTopic = 'random'; 
            setOpponent("Host_Master");
            setView('found');
            timerRef.current = setTimeout(() => {
                navigate(`/quiz?topic=${mockRoomTopic}&mode=multi`);
            }, 1500);
        } else {
            // Failed to find room
            setIsJoining(false);
            setError("Комната не найдена");
            setView('room_menu');
        }
      }, 2000);
  }

  // -- Renders --

  const renderMenu = () => (
    <div className="w-full max-w-sm space-y-4 animate-fade-in">
        <GlassCard onClick={startQuickSearch} className="group relative overflow-hidden">
            <div className="flex items-center space-x-4 relative z-10">
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-300 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                    <Zap size={24} />
                </div>
                <div className="text-left flex-1">
                    <h3 className="font-bold text-lg">Быстрая игра</h3>
                    <p className="text-xs text-white/50">Случайная тема • Случайный враг</p>
                </div>
                <ArrowRight size={20} className="text-white/30 group-hover:translate-x-1 transition-transform"/>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 to-blue-600/10 group-hover:from-blue-600/0 group-hover:to-blue-600/20 transition-all"></div>
        </GlassCard>

        <GlassCard onClick={() => setView('room_menu')} className="group relative overflow-hidden">
             <div className="flex items-center space-x-4 relative z-10">
                <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-300 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                    <Users size={24} />
                </div>
                <div className="text-left flex-1">
                    <h3 className="font-bold text-lg">Игра с другом</h3>
                    <p className="text-xs text-white/50">Создать комнату или войти</p>
                </div>
                <ArrowRight size={20} className="text-white/30 group-hover:translate-x-1 transition-transform"/>
            </div>
        </GlassCard>
    </div>
  );

  const renderRoomMenu = () => (
      <div className="w-full max-w-sm space-y-4 animate-fade-in">
          <button onClick={() => { setView('menu'); setError(null); }} className="flex items-center text-white/50 hover:text-white text-sm mb-2">
              <ArrowLeft size={16} className="mr-1"/> Назад
          </button>
          
          <GlassCard onClick={startCreateRoomFlow} className="text-center py-8">
              <div className="w-16 h-16 mx-auto bg-white/10 rounded-2xl flex items-center justify-center mb-4 text-yellow-400">
                  <Lock size={32} />
              </div>
              <h3 className="font-bold text-xl">Создать комнату</h3>
              <p className="text-xs text-white/50 mt-1">Ты выберешь тему и получишь код</p>
          </GlassCard>

          <div className="relative">
              <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-transparent px-2 text-white/30 font-bold">Или</span>
              </div>
          </div>

          <GlassCard noPadding className={`p-2 transition-colors duration-300 ${error ? 'border-red-500/50 bg-red-900/10' : ''}`}>
              <div className="flex flex-col">
                  <div className="flex">
                    <input 
                        type="number" 
                        placeholder="Введи код друга"
                        value={joinCode}
                        onFocus={() => setError(null)}
                        onChange={(e) => setJoinCode(e.target.value)}
                        className="flex-1 bg-transparent border-none p-4 text-white placeholder-white/30 outline-none font-mono text-lg"
                    />
                    <button 
                        onClick={joinRoom}
                        disabled={joinCode.length < 3}
                        className="bg-white text-black font-bold px-6 rounded-xl m-1 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
                    >
                        Войти
                    </button>
                  </div>
                  {error && (
                      <div className="px-4 pb-3 pt-0 flex items-center text-red-400 text-xs animate-shake">
                          <AlertCircle size={12} className="mr-1.5" />
                          {error}
                      </div>
                  )}
              </div>
          </GlassCard>
          
          <div className="text-center">
             <p className="text-[10px] text-white/20">Для теста используйте код: 777777</p>
          </div>
      </div>
  );

  const renderTopicSelection = () => (
      <div className="w-full max-w-sm space-y-4 animate-fade-in h-[70vh] overflow-y-auto pb-4">
           <div className="flex items-center justify-between mb-2">
                <button onClick={() => setView('room_menu')} className="flex items-center text-white/50 hover:text-white text-sm">
                    <ArrowLeft size={16} className="mr-1"/> Назад
                </button>
                <span className="font-bold text-sm">Выберите тему</span>
           </div>

           {/* Custom Topic Input */}
           <GlassCard className="border-pink-500/30 bg-pink-900/10 py-3 px-4 mb-2">
                <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-pink-400 shrink-0"/>
                <input 
                    type="text" 
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && confirmRoomCreation(customTopic)}
                    placeholder="Своя тема (напр. Аниме)"
                    className="flex-1 bg-transparent border-none text-white placeholder-white/40 focus:outline-none text-sm"
                />
                <button 
                    onClick={() => confirmRoomCreation(customTopic)}
                    disabled={!customTopic.trim()}
                    className="bg-pink-500/80 hover:bg-pink-400 disabled:opacity-50 disabled:cursor-not-allowed p-1.5 rounded-lg transition-all"
                >
                    <ArrowRight size={16} />
                </button>
                </div>
            </GlassCard>

           <div className="grid grid-cols-2 gap-3">
              <GlassCard 
                  onClick={() => confirmRoomCreation('random')}
                  className="flex flex-col items-center justify-center p-4 gap-2 active:scale-95 transition-transform border-yellow-400/30 bg-yellow-400/10"
                >
                  <div className="w-10 h-10 rounded-full bg-yellow-400 text-black flex items-center justify-center">
                    <Zap size={20} />
                  </div>
                  <span className="font-bold text-sm">Случайная</span>
              </GlassCard>

              {POPULAR_TOPICS.map((topic) => {
                 const IconComponent = iconMap[topic.icon] || HelpCircle;
                 return (
                  <GlassCard 
                    key={topic.id} 
                    onClick={() => confirmRoomCreation(topic.id)}
                    className="flex flex-col items-center justify-center p-4 gap-2 active:scale-95 transition-transform"
                  >
                    <div className={`w-10 h-10 rounded-lg ${topic.color} bg-opacity-80 flex items-center justify-center shadow-md`}>
                      <IconComponent size={20} className="text-white" />
                    </div>
                    <span className="font-semibold text-xs text-center">{topic.name}</span>
                  </GlassCard>
                );
              })}
            </div>
      </div>
  );

  const renderRoomCreate = () => {
    // Determine display name for topic
    let displayTopic = 'Случайная';
    if (selectedTopic !== 'random') {
        const found = POPULAR_TOPICS.find(t => t.id === selectedTopic);
        displayTopic = found ? found.name : selectedTopic; // Use custom string if not found in constants
    }

    return (
      <GlassCard className="w-full max-w-sm text-center animate-scale-in">
          <p className="text-white/50 text-sm mb-2">Тема: <span className="text-white font-bold">{displayTopic}</span></p>
          <div className="bg-white/10 rounded-xl p-6 mb-6 flex items-center justify-center space-x-4 cursor-pointer active:scale-95 transition-transform" onClick={() => navigator.clipboard.writeText(roomCode)}>
              <span className="font-mono text-4xl font-bold tracking-widest text-yellow-400">{roomCode}</span>
              <Copy size={20} className="text-white/30"/>
          </div>
          
          <div className="flex flex-col items-center space-y-3">
              <LoaderDots />
              <p className="text-sm text-white/60 animate-pulse">Ожидание подключения друга...</p>
          </div>

          <button onClick={handleCancel} className="mt-8 text-sm text-red-300 hover:text-red-200">
              Отмена
          </button>
      </GlassCard>
    );
  };

  const LoaderDots = () => (
      <div className="flex justify-center space-x-2">
        <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-0"></div>
        <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-150"></div>
        <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-300"></div>
     </div>
  );

  return (
    <div className="h-[calc(100vh-80px)] px-4 flex flex-col items-center justify-center space-y-8">
      
      {/* Avatar / Status Visual */}
      <div className="relative shrink-0">
        {(view === 'quick_search' || view === 'room_create' || view === 'room_join') && (
          <>
            <div className="absolute inset-0 rounded-full bg-red-500 blur-2xl opacity-20 animate-ping"></div>
          </>
        )}
        <div className="w-28 h-28 rounded-full bg-gradient-to-br from-red-500 to-pink-600 p-1 shadow-2xl z-10 relative">
          <div className="w-full h-full bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center">
            <Swords size={40} className="text-white" />
          </div>
        </div>
      </div>

      <div className="text-center space-y-1 shrink-0">
        <h1 className="text-2xl font-bold">PvP Арена</h1>
        <p className="text-white/50 text-sm">Сражайся и побеждай</p>
      </div>

      {/* View Switcher */}
      {view === 'menu' && renderMenu()}
      {view === 'room_menu' && renderRoomMenu()}
      {view === 'topic_selection' && renderTopicSelection()}
      {view === 'room_create' && renderRoomCreate()}
      
      {view === 'quick_search' && (
          <GlassCard className="w-full max-w-sm text-center py-8">
             <p className="text-lg animate-pulse mb-4">
                 {isJoining ? 'Подключение к комнате...' : 'Поиск соперника...'}
             </p>
             <LoaderDots />
             {!isJoining && <p className="text-xs text-white/30 mt-4">Тема: Случайная</p>}
             <button onClick={handleCancel} className="mt-4 text-sm text-white/30">Отмена</button>
          </GlassCard>
      )}

      {view === 'found' && (
           <GlassCard className="w-full max-w-sm space-y-4 animate-scale-in border-green-500/50 bg-green-900/20">
             <p className="text-green-400 font-bold tracking-widest uppercase text-center text-sm">
                 {isJoining ? 'Вход выполнен!' : 'Игра найдена!'}
             </p>
             <div className="flex items-center space-x-4 p-2">
                <div className="w-10 h-10 rounded-full bg-gray-500 flex items-center justify-center">
                    <User size={20} />
                </div>
                <div className="text-left">
                    <p className="font-bold">{opponent}</p>
                    <p className="text-xs text-white/50">
                        {selectedTopic === 'random' ? 'Случайная тема' : 
                         POPULAR_TOPICS.find(t => t.id === selectedTopic)?.name || selectedTopic}
                    </p>
                </div>
             </div>
           </GlassCard>
      )}

    </div>
  );
};

export default Multiplayer;
