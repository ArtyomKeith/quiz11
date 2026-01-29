import React from 'react';
import { Home, Users, Trophy, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const Navigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Home, label: 'Главная', path: '/' },
    { icon: Users, label: 'Дуэль', path: '/multiplayer' },
    { icon: Trophy, label: 'Топ', path: '/leaderboard' },
    { icon: User, label: 'Профиль', path: '/profile' }, 
  ];

  return (
    <div className="fixed bottom-0 left-0 w-full p-4 z-50">
      <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl flex justify-around items-center h-16 shadow-2xl">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center w-full h-full transition-colors duration-200 ${
                isActive ? 'text-white' : 'text-white/50 hover:text-white/80'
              }`}
            >
              <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : ''} />
              <span className="text-[10px] mt-1 font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Navigation;