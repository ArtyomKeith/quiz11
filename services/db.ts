import { supabase } from './supabase';
import { PlayerProfile } from '../types';
import { MOCK_LEADERBOARD } from '../constants';

const LOCAL_ID_KEY = 'glassmind_user_id_v4';

// Fallback UUID generation for browser testing (when not in Telegram)
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Main function to identify the user
const getUserId = () => {
  // 1. Try to get Telegram ID
  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
  if (tgUser && tgUser.id) {
    return String(tgUser.id);
  }

  // 2. Fallback to LocalStorage (Browser Dev Mode)
  let id = localStorage.getItem(LOCAL_ID_KEY);
  if (!id || id.length < 10) {
    id = generateUUID();
    localStorage.setItem(LOCAL_ID_KEY, id);
  }
  return id;
};

export const db = {
  checkConnection: async (): Promise<string | null> => {
    try {
      const { error } = await supabase.from('profiles').select('id').limit(1);
      if (error) return error.message;
      return null;
    } catch (e: any) {
      return e.message || "Unknown DB Error";
    }
  },

  getUser: async (): Promise<PlayerProfile> => {
    // Notify Telegram we are ready (expands window if needed)
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
    }

    const userId = getUserId();
    const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;

    // 1. Try to fetch existing user
    const { data: existingUser, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (existingUser) {
        // If we have Telegram data, let's update the profile name/avatar to match Telegram 
        // (in case user changed it)
        if (tgUser) {
            const newName = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ');
            const newAvatar = tgUser.photo_url || existingUser.avatar; // Use TG photo or keep existing
            
            // Only update if something changed
            if (newName !== existingUser.name || (tgUser.photo_url && tgUser.photo_url !== existingUser.avatar)) {
                await supabase.from('profiles').update({
                    name: newName,
                    avatar: newAvatar
                }).eq('id', userId);
                
                return { ...existingUser, name: newName, avatar: newAvatar, rank: existingUser.rank || 0 };
            }
        }
        return { ...existingUser, rank: existingUser.rank || 0 } as PlayerProfile;
    }

    // 2. User not found -> Create new one
    // Determine Name and Avatar
    let userName = 'Новичок ' + Math.floor(Math.random() * 100);
    let userAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`;

    if (tgUser) {
        userName = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ');
        if (tgUser.photo_url) userAvatar = tgUser.photo_url;
    }

    const newUser = {
      id: userId,
      name: userName,
      avatar: userAvatar,
      points: 100, // Welcome bonus
      streak: 0
    };

    const { error: insertError } = await supabase
      .from('profiles')
      .insert([newUser]);

    if (insertError) {
      console.error("Ошибка при создании профиля:", insertError);
    }

    return {
      ...newUser,
      rank: 0
    };
  },

  addPoints: async (amount: number): Promise<void> => {
    const userId = getUserId();
    
    // Optimistic update logic
    const { data: currentUser, error: fetchError } = await supabase
      .from('profiles')
      .select('points, streak')
      .eq('id', userId)
      .single();

    if (fetchError || !currentUser) {
        // This shouldn't happen if getUser was called first, but safe fallback
        console.warn("User missing during point add, skipping");
        return;
    }

    const newPoints = (currentUser.points || 0) + amount;
    const newStreak = (currentUser.streak || 0) + 1;

    await supabase
      .from('profiles')
      .update({ points: newPoints, streak: newStreak })
      .eq('id', userId);
  },

  resetStreak: async (): Promise<void> => {
    const userId = getUserId();
    await supabase
      .from('profiles')
      .update({ streak: 0 })
      .eq('id', userId);
  },

  getLeaderboard: async (): Promise<PlayerProfile[]> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('points', { ascending: false })
      .limit(50);

    if (error || !data || data.length === 0) {
      return MOCK_LEADERBOARD;
    }

    return data.map((user, index) => ({
      ...user,
      rank: index + 1
    })) as PlayerProfile[];
  }
};
