import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../components/GlassCard';
import { POPULAR_TOPICS } from '../constants';
import { db } from '../services/db';
import { multiplayerService } from '../services/multiplayerService';
import { supabase } from '../services/supabase';
import { Swords, User, Zap, Lock, Copy, ArrowRight, ArrowLeft, Users, Sparkles, AlertCircle, HelpCircle, Cpu, FlaskConical, Hourglass, Music, Globe, BookOpen, Loader2 } from 'lucide-react';
import { MultiplayerMatch } from '../types';

type MultiState = 'menu' | 'quick_search' | 'room_menu' | 'topic_selection' | 'room_create' | 'room_join' | 'found';

const iconMap: Record<string, React.ElementType> = {
  Cpu, FlaskConical, Hourglass, Music, Globe, BookOpen, HelpCircle
};

const Multiplayer: React.FC = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<MultiState>('menu');
  const [roomCode, setRoomCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string>('random');
  const [customTopic, setCustomTopic] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [currentMatch, setCurrentMatch] = useState<MultiplayerMatch | null>(null);
  const [userId, setUserId] = useState<string>('');

  // Setup User ID
  useEffect(() => {
    const initUser = async () => {
        const u = await db.getUser();
        setUserId(u.id);
    };
    initUser();
  }, []);

  // -- Realtime Subscription for Host --
  useEffect(() => {
    if (view === 'room_create' && currentMatch) {
        // Listen for Player 2 joining
        const channel = supabase
            .channel(`match-${currentMatch.id}`)
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'matches', filter: `id=eq.${currentMatch.id}` },
                (payload) => {
                    const updatedMatch = payload.new as MultiplayerMatch;
                    if (updatedMatch.player2_id && updatedMatch.status === 'playing') {
                        handleMatchFound(updatedMatch);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }
  }, [view, currentMatch]);

  // -- Actions --

  const handleMatchFound = (match: MultiplayerMatch) => {
      setCurrentMatch(match);
      setView('found');
      setTimeout(() => {
          // Pass match ID and user ID so Quiz page knows who is who
          navigate(`/quiz?topic=${encodeURIComponent(match.topic)}&mode=multi&matchId=${match.id}`);
      }, 1500);
  };

  const handleCancel = () => {
    setIsJoining(false);
    setError(null);
    setView('menu');
    setCurrentMatch(null);
  };

  const startQuickSearch = async () => {
    if (!userId) return;
    setView('quick_search');
    setIsJoining(true);
    setSelectedTopic('random'); 
    
    // 1. Try to join existing
    const existingMatch = await multiplayerService.findQuickMatch(userId);
    if (existingMatch) {
        handleMatchFound(existingMatch);
        return;
    }

    // 2. If no match found, create one and wait
    const newMatch = await multiplayerService.createMatch(userId, 'random');
    if (newMatch) {
        setCurrentMatch(newMatch);
        // We stay in 'quick_search' view but logically we are now waiting like a host
        // We need to listen to this match just like room_create
        const channel = supabase
            .channel(`match-${newMatch.id}`)
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'matches', filter: `id=eq.${newMatch.id}` },
                (payload) => {
                    const updatedMatch = payload.new as MultiplayerMatch;
                    if (updatedMatch.player2_id) {
                        handleMatchFound(updatedMatch);
                    }
                }
            )
            .subscribe();
    } else {
        setError("Не удалось создать матч");
        setView('menu');
    }
  };

  const startCreateRoomFlow = () => {
      setView('topic_selection');
  };

  const confirmRoomCreation = async (topicId: string) => {
    if (!topicId.trim() || !userId) return;
    
    setSelectedTopic(topicId);
    setIsJoining(true); // show generic loader while creating
    
    const match = await multiplayerService.createMatch(userId, topicId);
    if (match) {
        setRoomCode(match.code);
        setCurrentMatch(match);
        setView('room_create');
        setIsJoining(false);
    } else {
        setError("Ошибка создания комнаты");
    }
  };

  const joinRoom = async () => {
      if(joinCode.length < 3 || !userId) return;
      
      setError(null);
      setIsJoining(true);
      
      try {
        const match = await multiplayerService.joinMatch(joinCode, userId);
        if (match) {
            handleMatchFound(match);
        } else {
            setError("Комната не найдена или уже занята");
            setIsJoining(false);
        }
      } catch (e) {
          console.error(e);
          setError("Ошибка сети");
          setIsJoining(false);
      }
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
                    <p className="text-xs text-white/50">Поиск реального игрока</p>
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
              <p className="text-xs text-white/50 mt-1">Ты получишь код для друга</p>
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
                        disabled={joinCode.length < 3 || isJoining}
                        className="bg-white text-black font-bold px-6 rounded-xl m-1 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
                    >
                        {isJoining ? <Loader2 className="animate-spin"/> : "Войти"}
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
                    disabled={!customTopic.trim() || isJoining}
                    className="bg-pink-500/80 hover:bg-pink-400 disabled:opacity-50 disabled:cursor-not-allowed p-1.5 rounded-lg transition-all"
                >
                   {isJoining ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
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
    let displayTopic = 'Случайная';
    if (selectedTopic !== 'random') {
        const found = POPULAR_TOPICS.find(t => t.id === selectedTopic);
        displayTopic = found ? found.name : selectedTopic;
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
        <p className="text-white/50 text-sm">Реальные соперники</p>
      </div>

      {view === 'menu' && renderMenu()}
      {view === 'room_menu' && renderRoomMenu()}
      {view === 'topic_selection' && renderTopicSelection()}
      {view === 'room_create' && renderRoomCreate()}
      
      {view === 'quick_search' && (
          <GlassCard className="w-full max-w-sm text-center py-8">
             <p className="text-lg animate-pulse mb-4">
                 Поиск соперника...
             </p>
             <LoaderDots />
             <p className="text-xs text-white/30 mt-4">Мы ищем открытую комнату или создаем новую.</p>
             <button onClick={handleCancel} className="mt-4 text-sm text-white/30">Отмена</button>
          </GlassCard>
      )}

      {view === 'found' && (
           <GlassCard className="w-full max-w-sm space-y-4 animate-scale-in border-green-500/50 bg-green-900/20">
             <p className="text-green-400 font-bold tracking-widest uppercase text-center text-sm">
                 Матч найден!
             </p>
             <div className="flex items-center space-x-4 p-2">
                <div className="w-10 h-10 rounded-full bg-gray-500 flex items-center justify-center">
                    <User size={20} />
                </div>
                <div className="text-left">
                    <p className="font-bold">Соперник подключен</p>
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
