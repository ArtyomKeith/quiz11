import React from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import Quiz from './pages/Quiz';
import Multiplayer from './pages/Multiplayer';
import Leaderboard from './pages/Leaderboard';

// Wrapper to conditionally render Nav
const Layout: React.FC = () => {
  const location = useLocation();
  // Hide main nav on Quiz page to focus on the game and its specific UI
  const isQuiz = location.pathname === '/quiz';

  return (
    <div className="h-full flex flex-col relative z-10 selection:bg-pink-500/30">
        <div className="flex-1 overflow-y-auto overflow-x-hidden pb-20">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/quiz" element={<Quiz />} />
              <Route path="/multiplayer" element={<Multiplayer />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/profile" element={<div className="p-8 text-center text-white/50">Профиль (Скоро)</div>} />
            </Routes>
        </div>
        {!isQuiz && <Navigation />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <Layout />
    </HashRouter>
  );
};

export default App;