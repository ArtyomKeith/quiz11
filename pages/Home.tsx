import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../components/GlassCard';
import { POPULAR_TOPICS } from '../constants';
import { db } from '../services/db';
import { PlayerProfile } from '../types';
import { Flame, Play, Zap, Sparkles, ArrowRight, Loader2, RefreshCw, AlertTriangle, Trash2 } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [customTopic, setCustomTopic] = useState('');
  const [user, setUser] = useState<PlayerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  const loadUser = async () => {
    // 1. Проверяем связь с БД
    const errorMsg = await db.checkConnection();
    if (errorMsg) {
        setDbError(errorMsg);
    } else {
        setDbError(null);
    }

    // 2. Загружаем пользователя
    try {
      const userData = await db.getUser();
      setUser(userData);
    } catch (e) {
      console.error("Failed to load user", e);
    } finally {
      setIsLoading(false);
    }
  };

  // Load user from Supabase on mount
  useEffect(() => {
    loadUser();
  }, []);

  const startQuiz = (topicId: string, mode: 'single' | 'daily') => {
    navigate(`/quiz?topic=${topicId}&mode=${mode}`);
  };

  const handleCustomTopicStart = () => {
    if (customTopic.trim()) {
      startQuiz(customTopic, 'single');
    }
  };

  if (isLoading) {
    return (
        <div className="h-full flex items-center justify-center">
            <Loader2 className="animate-spin text-white" size={32} />
        </div>
    );
  }

  return (
    <div className="pt-4 px-4 space-y-4 animate-fade-in">
      
      {/* DEBUG BANNER: Показывает ошибку, если БД не работает */}
      {dbError && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 text-xs text-red-200">
              <div className="flex items-center gap-2 mb-1 font-bold text-red-400">
                  <AlertTriangle size={14} />
                  Ошибка базы данных
              </div>
              <p className="font-mono bg-black/30 p-2 rounded mb-2 overflow-x-auto whitespace-pre-wrap">
                  {dbError}
              </p>
              <div className="text-white/60 mb-2">
                 {dbError.includes('relation "public.profiles" does not exist') && "Таблица 'profiles' не создана. См. SQL ниже."}
                 {dbError.includes('row-level security') && "Запустите SQL скрипт для прав доступа."}
                 {dbError.includes('syntax for type uuid') && "ID формат исправлен, попробуйте сбросить ID."}
              </div>
              
              <button 
                onClick={() => {
                    // Очистка локального ID, чтобы сгенерировать новый (решает проблемы с битыми UUID)
                    localStorage.removeItem('glassmind_user_id_v4');
                    window.location.reload();
                }}
                className="bg-red-500/40 hover:bg-red-500/60 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors w-full justify-center font-bold"
              >
                <Trash2 size={12} />
                Сбросить мой ID и перезайти
              </button>
          </div>
      )}

      {/* Compact Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Привет, {user ? user.name.split(' ')[0] : 'Игрок'}</h1>
          <p className="text-white/60 text-xs flex items-center gap-1">
             Твой счет: <span className="text-yellow-400 font-mono font-bold">{user?.points.toLocaleString() || 0}</span>
          </p>
        </div>
        <div 
            onClick={() => {
                const img = document.getElementById('avatar-img');
                if(img) {
                    img.style.opacity = '0.5';
                    setTimeout(() => img.style.opacity = '1', 300);
                }
                loadUser();
            }}
            className="w-10 h-10 rounded-full border border-white/20 shadow-lg overflow-hidden bg-white/10 active:scale-90 transition-transform cursor-pointer relative"
        >
          {user && <img id="avatar-img" src={user.avatar} alt="Avatar" className="w-full h-full object-cover transition-opacity" />}
        </div>
      </div>

      {/* Daily Challenge - Compact */}
      <GlassCard 
        className="bg-gradient-to-r from-violet-600/40 to-indigo-600/40 border-white/30 p-4"
        onClick={() => startQuiz('daily', 'daily')}
      >
        <div className="flex justify-between items-center relative overflow-hidden">
          <div className="z-10">
            <div className="flex items-center space-x-2 mb-1">
              <span className="px-1.5 py-0.5 rounded-md bg-yellow-500/20 text-yellow-300 text-[10px] font-bold border border-yellow-500/30">
                DAILY
              </span>
            </div>
            <h2 className="text-lg font-bold">Дейли Челлендж</h2>
            <p className="text-xs text-white/70 mb-2">Удвой очки сегодня.</p>
            <button className="bg-white/90 text-indigo-900 px-3 py-1.5 rounded-lg font-bold text-xs shadow-lg flex items-center space-x-1">
              <Play size={12} fill="currentColor" />
              <span>Начать</span>
            </button>
          </div>
          <Flame size={60} className="text-yellow-500/80 absolute -right-4 -bottom-4 rotate-12 drop-shadow-lg z-0" />
        </div>
      </GlassCard>

      {/* Custom Topic Generator */}
      <GlassCard className="border-pink-500/30 bg-pink-900/10 py-3 px-4">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-pink-400 shrink-0"/>
          <input 
            type="text" 
            value={customTopic}
            onChange={(e) => setCustomTopic(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCustomTopicStart()}
            placeholder="Своя тема (напр. Космос)"
            className="flex-1 bg-transparent border-none text-white placeholder-white/40 focus:outline-none text-sm"
          />
          <button 
            onClick={handleCustomTopicStart}
            className="bg-pink-500/80 hover:bg-pink-400 p-1.5 rounded-lg transition-all"
          >
            <ArrowRight size={16} />
          </button>
        </div>
      </GlassCard>

      {/* Popular Topics - Grid */}
      <div className="pb-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center text-white/80">
          <Zap size={14} className="mr-1.5 text-yellow-400" />
          Популярные
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {POPULAR_TOPICS.map((topic) => {
             const IconComponent = (LucideIcons as any)[topic.icon] || LucideIcons.HelpCircle;
             return (
              <GlassCard 
                key={topic.id} 
                onClick={() => startQuiz(topic.id, 'single')}
                className="flex flex-row items-center justify-start p-3 gap-3 active:scale-95 transition-transform"
                noPadding
              >
                <div className={`w-8 h-8 rounded-lg ${topic.color} bg-opacity-80 flex items-center justify-center shadow-md ml-3`}>
                  <IconComponent size={16} className="text-white" />
                </div>
                <span className="font-semibold text-xs">{topic.name}</span>
              </GlassCard>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Home;