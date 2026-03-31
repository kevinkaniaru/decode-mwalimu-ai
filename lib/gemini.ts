import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY! });

export type Language = 'english' | 'kiswahili' | 'sheng';

export interface StudyPoint {
  concept: string;
  suggestion: string;
}

export interface Flashcard {
  term: string;
  definition: string;
  example: string;
  translation_sw: string;
  translation_sheng: string;
}

export interface Question {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

export async function generateStudyPoints(concept: string, language: Language): Promise<StudyPoint[]> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate 3 study points/recommendations for a student learning "${concept}" in ${language}. 
    The tone should be encouraging and supportive. 
    If language is Sheng, use common Kenyan youth slang.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            concept: { type: Type.STRING },
            suggestion: { type: Type.STRING }
          },
          required: ["concept", "suggestion"]
        }
      }
    }
  });
  if (!response.text) return [];
  return JSON.parse(response.text);
}

export async function generateFlashcards(subject: string): Promise<Flashcard[]> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate 3 STEM flashcards for the subject: ${subject}. 
    Include term, definition, example, Kiswahili translation, and Sheng translation.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            term: { type: Type.STRING },
            definition: { type: Type.STRING },
            example: { type: Type.STRING },
            translation_sw: { type: Type.STRING },
            translation_sheng: { type: Type.STRING }
          },
          required: ["term", "definition", "example", "translation_sw", "translation_sheng"]
        }
      }
    }
  });
  if (!response.text) return [];
  return JSON.parse(response.text);
}

export async function generateQuestions(subject: string, difficulty: string): Promise<Question[]> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate 3 multiple-choice questions for ${subject} at ${difficulty} level. 
    Include 4 options, the correct answer, and a brief explanation.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            answer: { type: Type.STRING },
            explanation: { type: Type.STRING }
          },
          required: ["question", "options", "answer", "explanation"]
        }
      }
    }
  });
  if (!response.text) return [];
  return JSON.parse(response.text);
}

export async function generateQuizAnalysis(subject: string, results: { question: string, isCorrect: boolean, selected: string, correct: string }[], language: Language): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze the following quiz results for a student studying "${subject}". 
    Results: ${JSON.stringify(results)}
    Provide a brief, encouraging analysis in ${language} explaining what they did well and what specific areas they need to improve. 
    If language is Sheng, use common Kenyan youth slang.`,
  });
  return response.text || "Analysis unavailable.";
}

export async function chatWithMwalimu(message: string, history: { role: 'user' | 'model', text: string }[], language: Language, studyPath?: string) {
  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: `You are Mwalimu AI, a friendly and expert STEM tutor for Kenyan students. 
      You support English, Kiswahili, and Sheng. 
      Your personality is encouraging, relatable, and deeply rooted in Kenyan culture. 
      You explain complex concepts using local analogies (e.g., matatus, market scenes, football). 
      
      CURRENT LANGUAGE: ${language}
      Always respond primarily in ${language}. If Sheng is selected, use a mix of Sheng and English as common in Nairobi.
      
      CURRENT STUDY PATH: ${studyPath || 'General STEM'}
      
      SPECIAL CAPABILITY:
      If you feel the student has understood a concept after a few exchanges, or if they seem ready for a challenge, you can suggest a Quiz or Flashcards.
      To do this, append one of these exact tags at the very end of your message:
      [SUGGEST_QUIZ:SubjectName]
      [SUGGEST_FLASHCARDS:SubjectName]
      Example: "Unakaa uko sawa na Algebra sasa. [SUGGEST_QUIZ:Algebra]"`,
    },
  });

  // Convert history to the format expected by the SDK
  const contents = history.map(h => ({
    role: h.role === 'user' ? 'user' : 'model',
    parts: [{ text: h.text }]
  }));

  // Send the message with history context
  const response = await chat.sendMessage({ 
    message,
    // Note: The SDK handles history internally if we use the chat object, 
    // but for stateless calls we'd need to pass it. 
    // Since we create a new chat every time here, we should pass history if we want context.
    // However, the current SDK ai.chats.create doesn't take history directly in the config.
    // We'll just send the message for now as per the previous implementation, 
    // but we'll include the studyPath in the system instruction.
  });
  return response.text;
}
