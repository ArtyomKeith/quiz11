import { supabase } from './supabase';
import { PlayerProfile } from '../types';
import { MOCK_LEADERBOARD } from '../constants';

// Меняем версию ключа на v4, чтобы сгенерировать новый корректный UUID
const LOCAL_ID_KEY = 'glassmind_user_id_v4';

// Функция генерации настоящего UUID, который нравится базам данных
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

const getDeviceId = () => {
  let id = localStorage.getItem(LOCAL_ID_KEY);
  // Проверяем, что ID похож на UUID (длина 36), если нет — пересоздаем
  if (!id || id.length !== 36) {
    id = generateUUID();
    localStorage.setItem(LOCAL_ID_KEY, id);
  }
  return id;
};

export const db = {
  // Проверка соединения для отладки
  checkConnection: async (): Promise<string | null> => {
    try {
      // Пытаемся просто прочитать любую запись
      const { error } = await supabase.from('profiles').select('id').limit(1);
      if (error) return error.message;
      return null;
    } catch (e: any) {
      return e.message || "Unknown DB Error";
    }
  },

  getUser: async (): Promise<PlayerProfile> => {
    const userId = getDeviceId();

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (data) {
      // Возвращаем данные. Rank вычисляется динамически, поэтому если его нет в БД — ставим 0
      return { ...data, rank: data.rank || 0 } as PlayerProfile;
    }

    // Если пользователя нет, создаем объект для БД (БЕЗ поля rank, так как его нет в таблице)
    const dbUser = {
      id: userId,
      name: 'Новичок ' + Math.floor(Math.random() * 100),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
      points: 100, // Стартовый бонус
      streak: 0
    };

    // Пытаемся сохранить в базу только существующие поля
    const { error: insertError } = await supabase
      .from('profiles')
      .insert([dbUser]);

    if (insertError) {
      console.error("Ошибка при создании профиля:", insertError);
      // Если ошибка базы, мы все равно вернем объект локально, чтобы приложение работало
    }

    // Возвращаем полноценный объект для UI с полем rank
    return {
      ...dbUser,
      rank: 0
    };
  },

  addPoints: async (amount: number): Promise<void> => {
    const userId = getDeviceId();
    
    // 1. Пробуем получить текущие данные
    const { data: currentUser, error: fetchError } = await supabase
      .from('profiles')
      .select('points, streak')
      .eq('id', userId)
      .single();

    if (fetchError || !currentUser) {
        console.log("Пользователь не найден при начислении. Создаем...");
        
        const { error: createError } = await supabase.from('profiles').insert([{
            id: userId,
            name: 'Игрок ' + Math.floor(Math.random() * 1000),
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
            points: 100 + amount,
            streak: 1
            // rank не передаем, чтобы избежать ошибки
        }]);

        if (createError) {
            console.error("CRITICAL DB ERROR:", createError);
            throw createError; // Это покажет ошибку в UI
        }
        return;
    }

    // Обновление
    const newPoints = (currentUser.points || 0) + amount;
    const newStreak = (currentUser.streak || 0) + 1;

    const { error } = await supabase
      .from('profiles')
      .update({ points: newPoints, streak: newStreak })
      .eq('id', userId);

    if (error) {
        console.error("Ошибка обновления:", error);
        throw error;
    }
  },

  resetStreak: async (): Promise<void> => {
    const userId = getDeviceId();
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

    // Rank вычисляем на лету по индексу в сортированном массиве
    return data.map((user, index) => ({
      ...user,
      rank: index + 1
    })) as PlayerProfile[];
  }
};