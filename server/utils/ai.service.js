import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

const generateResponse = async (content) => {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: content,
  });

  return response.text;
};

const generateVector = async (content) => {
  const response = await ai.models.embedContent({
    model: "gemini-embedding-001",
    contents: content,
    config: {
      outputDimensionality: 768,
    },
  });

  return response.embeddings[0].values;
};

export { generateResponse, generateVector };




