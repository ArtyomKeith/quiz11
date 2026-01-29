import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  noPadding?: boolean;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', onClick, noPadding = false }) => {
  return (
    <div 
      onClick={onClick}
      className={`
        relative overflow-hidden
        bg-white/10 
        backdrop-blur-xl 
        border border-white/20 
        shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] 
        rounded-2xl 
        text-white
        transition-all duration-300
        ${onClick ? 'cursor-pointer hover:bg-white/20 hover:scale-[1.02] active:scale-95' : ''}
        ${noPadding ? '' : 'p-5'}
        ${className}
      `}
    >
      {/* Reflection effect */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
      {children}
    </div>
  );
};

export default GlassCard;