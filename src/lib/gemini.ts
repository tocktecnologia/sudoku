import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function getSudokuHistory(level: number): Promise<string> {
  const prompt = `Conte uma história curta, interessante e educativa sobre a origem e história do Sudoku. Estamos no nível ${level} de uma jornada de carreira. A história deve ser envolvente para um jogador de Sudoku. Responda em Português do Brasil.`;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || "O Sudoku tem raízes profundas na lógica e nos quadrados latinos...";
  } catch (error) {
    console.error("Error generating history:", error);
    return "O Sudoku é um jogo de lógica que se popularizou no Japão nos anos 80, mas tem origens que remontam a Euler e seus quadrados latinos.";
  }
}
