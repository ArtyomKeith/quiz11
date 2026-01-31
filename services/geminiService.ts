import { GoogleGenAI, Type } from "@google/genai";
import { Question } from "../types";

// Initialize Gemini AI client directly with API key from environment
// as per strict coding guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateQuestions = async (topic: string, count: number = 10): Promise<Question[]> => {
  const model = "gemini-3-flash-preview";
  
  // Adding a random seed and specific instructions for variety
  const randomSeed = Math.floor(Math.random() * 1000000);

  const prompt = `Generate ${count} unique, diverse, and engaging multiple-choice quiz questions about "${topic}" in Russian language.
  
  CRITICAL INSTRUCTIONS:
  1. Variation Seed: ${randomSeed} (Use this to randomize the specific focus of questions).
  2. Difficulty: Mix easy, medium, and hard questions.
  3. Variety: Avoid repeating common facts. Focus on different sub-topics.
  4. Format: Provide 4 options for each question.
  5. Explanation: EXTREMELY SHORT and CONCISE Russian text. MAXIMUM 12 WORDS. Just the key fact.
  6. Output: STRICT JSON format.
  
  Ensure the JSON keys remain in English (id, text, options, correctAnswerIndex, explanation).`;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              text: { type: Type.STRING },
              options: { 
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              correctAnswerIndex: { type: Type.INTEGER },
              explanation: { type: Type.STRING },
            },
            propertyOrdering: ["id", "text", "options", "correctAnswerIndex", "explanation"],
          },
        },
      },
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No data received from Gemini");

    // Clean any potential markdown wrapping
    const cleanJson = jsonText.replace(/```json|```/g, '').trim();

    const questions = JSON.parse(cleanJson) as Question[];
    // Ensure IDs are unique-ish if model generates dupes
    return questions.map((q, idx) => ({ ...q, id: `${topic}-${Date.now()}-${idx}` }));

  } catch (error) {
    console.error("Gemini API Error:", error);
    return mockQuestions(topic);
  }
};

export const generateDailyQuestions = async (): Promise<Question[]> => {
  const topic = "Общие знания, Наука и Актуальные события мира";
  return generateQuestions(topic, 10);
};

// Fallback for demo purposes or error states
const mockQuestions = (topic: string): Question[] => [
  {
    id: 'm1',
    text: `Что является основным предметом изучения в теме "${topic}"? (Демо-режим)`,
    options: ['Инновации', 'История', 'Биология', 'Физика'],
    correctAnswerIndex: 0,
    explanation: 'Это тестовый вопрос, так как API ключ не найден или произошла ошибка.',
  },
  {
    id: 'm2',
    text: 'В каком году был изобретен World Wide Web?',
    options: ['1989', '1995', '2001', '1980'],
    correctAnswerIndex: 0,
    explanation: 'Тим Бернерс-Ли изобрел WWW в 1989 году.',
  },
  {
    id: 'm3',
    text: 'Какая планета самая большая в Солнечной системе?',
    options: ['Земля', 'Марс', 'Юпитер', 'Сатурн'],
    correctAnswerIndex: 2,
    explanation: 'Юпитер — крупнейшая планета.',
  },
   {
    id: 'm4',
    text: 'Сколько хромосом у здорового человека?',
    options: ['42', '44', '46', '48'],
    correctAnswerIndex: 2,
    explanation: 'У человека 46 хромосом (23 пары).',
  },
   {
    id: 'm5',
    text: 'Кто написал "Войну и мир"?',
    options: ['Достоевский', 'Толстой', 'Чехов', 'Пушкин'],
    correctAnswerIndex: 1,
    explanation: 'Автор — Лев Николаевич Толстой.',
  }
];
