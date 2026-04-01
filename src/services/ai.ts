import { GoogleGenAI } from '@google/genai';

export const extractTextFromMedia = async (file: File, apiKey: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const prompt = "Please extract and transcribe all the text from this file exactly as it is. If it is audio, transcribe the speech accurately. If it is a document, extract the text. Do not add any conversational filler, markdown formatting (unless present in the original), or summaries. Just output the raw text.";

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: file.type,
              data: base64Data
            }
          },
          { text: prompt }
        ]
      }
    });

    return response.text || '';
  } catch (error: any) {
    console.error("Extraction Error:", error);
    throw new Error(error.message || "An error occurred during text extraction.");
  }
};

export const generateEducationalContent = async (
  rawText: string,
  type: 'Summary' | 'LessonPlan' | 'Quiz' | 'CourseOutline',
  apiKey: string
) => {
  try {
    const ai = new GoogleGenAI({ apiKey });
    
    let prompt = '';
    switch (type) {
      case 'Summary':
        prompt = `Extract a short, medium, and detailed summary of the following text. Format as Markdown with clear headings.\n\nText:\n${rawText}`;
        break;
      case 'LessonPlan':
        prompt = `Structure the following text into a logical lesson plan. Include Title, Objectives, Main Points, and a Step-by-step explanation. Explain technical terms simply. Format as Markdown.\n\nText:\n${rawText}`;
        break;
      case 'Quiz':
        prompt = `Create a quiz based on the following text. Include Multiple Choice, True/False, and Essay questions with varying difficulties (Beginner, Intermediate, Advanced). Provide an answer key at the end. Format as Markdown.\n\nText:\n${rawText}`;
        break;
      case 'CourseOutline':
        prompt = `Chunk the following information into a full Course Structure (Modules -> Lessons -> Objectives -> Assessments). Format as Markdown.\n\nText:\n${rawText}`;
        break;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: "You are an expert educational content synthesizer. Never invent facts, only use the provided text. Output in a highly structured, exportable Markdown format.",
      }
    });

    return response.text || '';
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    throw new Error(error.message || "An error occurred during generation.");
  }
};
