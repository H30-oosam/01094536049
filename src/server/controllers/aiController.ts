import { Request, Response } from "express";
import { GoogleGenAI } from "@google/genai";

// Initialize GoogleGenAI client on the server side with correct options
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

export const getHRAdvice = async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction:
          "You are an expert HR Specialist for Hossam Elwardany HR Services (خدمات حسام الورداني للموارد البشرية). Provide professional, clear, and actionable business management, training, performance evaluation, and HR advice. If the user asks in Arabic, respond in Arabic. If in English, respond in English.",
      },
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini AI HR advice error:", error);
    res.status(500).json({ error: error.message || "Failed to generate AI advice" });
  }
};

export const analyzeJobDec = async (req: Request, res: Response) => {
  try {
    const { description } = req.body;
    if (!description) {
      return res.status(400).json({ error: "Job description is required" });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Please analyze this job description and suggest improvements for clarity, inclusivity, and impact: \n\n${description}`,
      config: {
        systemInstruction:
          "You are an expert recruitment specialist. Focus on making the job post more attractive to top talent.",
      },
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini AI Job analysis error:", error);
    res.status(500).json({ error: error.message || "Failed to analyze job description" });
  }
};
