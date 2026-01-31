import { supabase } from './supabase';
import { generateQuestions } from './geminiService';
import { Question, MultiplayerMatch } from '../types';

export const multiplayerService = {
  // Create a room and generate questions for fairness
  createMatch: async (playerId: string, topic: string, customCode?: string): Promise<MultiplayerMatch | null> => {
    // 1. CLEANUP: Delete any existing 'waiting' matches by this player to prevent zombie rooms
    await supabase
        .from('matches')
        .delete()
        .eq('player1_id', playerId)
        .eq('status', 'waiting');

    // Generate questions once so both players see the same quiz
    const questions = await generateQuestions(topic === 'random' ? 'General Knowledge' : topic);
    const code = customCode || Math.floor(100000 + Math.random() * 900000).toString();

    const { data, error } = await supabase
      .from('matches')
      .insert([
        {
          code,
          topic,
          player1_id: playerId,
          status: 'waiting',
          questions: questions, // Save generated questions to DB
          player1_score: 0,
          player2_score: 0
        }
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating match:", error);
      return null;
    }
    return data as MultiplayerMatch;
  },

  // Find an open quick match
  findQuickMatch: async (playerId: string): Promise<MultiplayerMatch | null> => {
    // 1. Look for ANY waiting match where I am not player 1
    const { data, error } = await supabase
      .from('matches')
      .select('id, questions') // Just get ID first for speed
      .eq('status', 'waiting')
      .neq('player1_id', playerId)
      .limit(1);

    if (error || !data || data.length === 0) return null;

    const matchId = data[0].id;

    // 2. Direct Update by ID (Much faster and reliable than searching by code)
    const { data: updatedMatch, error: updateError } = await supabase
      .from('matches')
      .update({
        player2_id: playerId,
        status: 'playing'
      })
      .eq('id', matchId)
      .eq('status', 'waiting') // Safety check: ensure it is STILL waiting
      .select()
      .single();

    if (updateError || !updatedMatch) {
        // Someone else probably took it, or it was cancelled
        return null;
    }

    return updatedMatch as MultiplayerMatch;
  },

  // Join an existing match by code
  joinMatch: async (code: string, playerId: string): Promise<MultiplayerMatch | null> => {
    // 1. Check if match exists and is waiting
    const { data: match, error: fetchError } = await supabase
      .from('matches')
      .select('*')
      .eq('code', code)
      .eq('status', 'waiting')
      .single();

    if (fetchError || !match) return null;

    if (match.player1_id === playerId) {
        // Cannot join own room
        return null;
    }

    // 2. Update match to set player 2 and status to playing
    const { data: updatedMatch, error: updateError } = await supabase
      .from('matches')
      .update({
        player2_id: playerId,
        status: 'playing'
      })
      .eq('id', match.id)
      .select()
      .single();

    if (updateError) return null;
    return updatedMatch as MultiplayerMatch;
  },

  // Get match details
  getMatch: async (matchId: string): Promise<MultiplayerMatch | null> => {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single();
    if (error) return null;
    return data as MultiplayerMatch;
  },

  // Update score
  updateScore: async (matchId: string, playerId: string, newScore: number, isPlayer1: boolean) => {
    const field = isPlayer1 ? 'player1_score' : 'player2_score';
    await supabase
      .from('matches')
      .update({ [field]: newScore })
      .eq('id', matchId);
  }
};
