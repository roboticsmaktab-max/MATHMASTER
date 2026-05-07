import { GoogleGenAI, Type } from "@google/genai";
import { Grade, Subject, Question, TestType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getTopics(grade: Grade, subject: Subject, language: string): Promise<string[]> {
  const prompt = `List ALL main and sub-topics for ${grade}-grade ${subject} as per the national curriculum in ${language} language. 
  Include topics from the very basics to advanced problems for this grade.
  Output strictly as a JSON array of strings. 
  Limit to maximum 20 most important topics.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });

  return JSON.parse(response.text);
}

export async function generateTest(grade: Grade, subject: Subject, language: string, topic?: string, count: number = 5, testType: TestType = TestType.QUIZ, variant: string = 'A'): Promise<Question[]> {
  const prompt = `Generate a math ${testType === TestType.EXAM ? "comprehensive control work (nazorat ishi)" : "quiz"} for ${grade}-grade ${subject} in ${language} language. 
  This is for Variant ${variant}. 
  ${topic ? `Focus specifically on the topic: ${topic}.` : "Cover multiple topics from the curriculum if possible."}
  Number of questions: ${count}.
  ${testType === TestType.EXAM ? "Questions should range from easy to complex (A, B, C levels)." : ""}
  Ensure unique and challenging questions specifically for this variant (${variant}) that are different from other potential variants.
  Each question should have 4 options and one correct answer.
  Provide a detailed explanation for the correct answer.
  Output strictly as JSON following the schema.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
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
            correctAnswer: { type: Type.INTEGER },
            explanation: { type: Type.STRING }
          },
          required: ["id", "text", "options", "correctAnswer", "explanation"]
        }
      }
    }
  });

  return JSON.parse(response.text);
}

export async function analyzeErrors(wrongAnswers: any[], language: string): Promise<string> {
  const prompt = `Analyze these math errors and provide a detailed explanation and a personalized learning plan in ${language}:
  ${JSON.stringify(wrongAnswers)}`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      systemInstruction: "You are a professional math tutor. Help the student understand their mistakes and give them a plan to improve."
    }
  });

  return response.text;
}
