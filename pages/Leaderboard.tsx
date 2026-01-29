import React, { useEffect, useState } from 'react';
import GlassCard from '../components/GlassCard';
import { db } from '../services/db';
import { PlayerProfile } from '../types';
import { Trophy, Loader2 } from 'lucide-react';

const Leaderboard: React.FC = () => {
  const [players, setPlayers] = useState<PlayerProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [lbData, userData] = await Promise.all([
           db.getLeaderboard(),
           db.getUser()
        ]);
        setPlayers(lbData);
        setCurrentUser(userData);
      } catch (e) {
        console.error("Error fetching leaderboard", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
        <div className="h-full flex items-center justify-center">
            <Loader2 className="animate-spin text-white" size={32} />
        </div>
    );
  }

  return (
    <div className="pb-24 pt-6 px-4 space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Trophy className="text-yellow-400" fill="currentColor" />
          Таблица лидеров
        </h1>
        <p className="text-white/60">Лучшие умы мира</p>
      </div>

      {/* List */}
      <div className="space-y-3">
        {players.map((player) => {
          const isMe = currentUser && player.id === currentUser.id;
          
          return (
            <GlassCard 
                key={player.id} 
                className={`flex items-center space-x-4 transition-all ${isMe ? 'border-yellow-400/50 bg-yellow-900/20' : ''}`} 
                noPadding
            >
                <div className="p-4 w-full flex items-center">
                    <div className={`w-8 h-8 flex items-center justify-center font-bold text-lg 
                        ${player.rank === 1 ? 'text-yellow-400' : 
                        player.rank === 2 ? 'text-gray-300' : 
                        player.rank === 3 ? 'text-amber-600' : 'text-white/50'}`}>
                        #{player.rank}
                    </div>
                    
                    <img src={player.avatar} alt={player.name} className="w-10 h-10 rounded-full border border-white/20 bg-black/20" />
                    
                    <div className="flex-grow ml-4">
                        <h3 className={`font-bold ${isMe ? 'text-yellow-200' : 'text-white'}`}>
                            {player.name} {isMe && '(Вы)'}
                        </h3>
                        <div className="flex items-center text-xs text-white/50 space-x-2">
                            <span>🔥 {player.streak} стрик</span>
                        </div>
                    </div>

                    <div className="font-mono font-bold text-lg text-white/90">
                        {player.points.toLocaleString()}
                    </div>
                </div>
            </GlassCard>
          );
        })}
        {players.length === 0 && (
             <div className="text-center text-white/50 py-10">Пока нет данных. Стань первым!</div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;