import { GoogleGenAI } from '@google/genai';

export const extractTextFromMedia = async (
  file: File, 
  apiKey?: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  try {
    if (onProgress) onProgress(10);
    
    let uploadInterval: any;
    if (onProgress) {
      let fakeProgress = 10;
      uploadInterval = setInterval(() => {
        fakeProgress += Math.random() * 5;
        if (fakeProgress > 90) fakeProgress = 90;
        onProgress(Math.floor(fakeProgress));
      }, 1000);
    }

    let fileUri: string;
    let fileMimeType: string = file.type;
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (apiKey) formData.append('apiKey', apiKey);
      
      const uploadRes = await fetch('/api/upload', {
         method: 'POST',
         body: formData
      });
      
      if (!uploadRes.ok) {
         const errData = await uploadRes.json();
         throw new Error(errData.error || 'Server backend upload failed');
      }
      
      const data = await uploadRes.json();
      fileUri = data.uri;
      fileMimeType = data.mimeType;

      if (onProgress) onProgress(95);
    } catch (err: any) {
      throw new Error(`Upload failed: ${err.message}`);
    } finally {
      if (uploadInterval) clearInterval(uploadInterval);
    }

    let lastError = null;
    let attempt = 0;
    const maxRetries = 4;

    const prompt = `Please extract and transcribe all the text from this file exactly as it is. 
If it is audio, transcribe the speech accurately. If it is a document, extract the text.
CRITICAL INSTRUCTION FOR ARABIC: If the file contains Arabic text, including Classical Arabic (Fusha), Quranic verses, or Colloquial Arabic (Amiya), you MUST ensure the transcription is highly accurate. Preserve the original language, diacritics (tashkeel) if present, and formatting perfectly. Do not translate it to English unless requested.
Do not add any conversational filler, markdown formatting (unless present in the original), or summaries. Just output the raw text.`;

    while (attempt < maxRetries) {
      try {
        const genRes = await fetch("/api/generate", {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
              fileUri,
              mimeType: fileMimeType,
              prompt,
              apiKey
           })
        });
        
        if (!genRes.ok) {
          const errData = await genRes.json();
          throw new Error(errData.error || "Failed to generate via backend");
        }
        
        const resultText = await genRes.text();
        if (resultText.includes('[ERROR]')) {
           throw new Error(resultText.split('[ERROR]')[1].trim());
        }
        if (onProgress) onProgress(100);
        return resultText || '';
      } catch (error: any) {
        lastError = error;
        const errorMessage = error?.message || error?.toString() || '';
        if (errorMessage.includes('quota') || errorMessage.includes('429') || errorMessage.includes('503') || errorMessage.includes('UNAVAILABLE') || errorMessage.includes('high demand') || errorMessage.includes('Failed to fetch')) {
           console.warn("Rate limit or high demand hit, retrying...");
           attempt++;
           await new Promise(r => setTimeout(r, 2000 * Math.pow(2, attempt) + Math.random() * 1000));
           continue;
        }
        throw error;
      }
    }
    throw lastError || new Error("Failed to generate content.");
  } catch (error: any) {
    console.error("Extraction Error:", error);
    throw new Error(error.message || "An error occurred during text extraction.");
  }
};

export const generateEducationalContent = async (
  rawText: string,
  type: 'Summary' | 'LessonPlan' | 'Quiz' | 'CourseOutline',
  apiKey?: string,
  language: string = 'Arabic'
) => {
  let prompt = '';
  const langInstruction = `\n\nCRITICAL: You MUST generate the entire response in ${language}.`;
  
  switch (type) {
    case 'Summary':
      prompt = `Extract a short, medium, and detailed summary of the following text. Format as Markdown with clear headings.${langInstruction}\n\nText:\n${rawText}`;
      break;
    case 'LessonPlan':
      prompt = `Structure the following text into a logical lesson plan. Include Title, Objectives, Main Points, and a Step-by-step explanation. Explain technical terms simply. Format as Markdown.${langInstruction}\n\nText:\n${rawText}`;
      break;
    case 'Quiz':
      prompt = `Create a quiz based on the following text. Include Multiple Choice, True/False, and Essay questions with varying difficulties (Beginner, Intermediate, Advanced). Provide an answer key at the end. Format as Markdown.${langInstruction}\n\nText:\n${rawText}`;
      break;
    case 'CourseOutline':
      prompt = `Chunk the following information into a full Course Structure (Modules -> Lessons -> Objectives -> Assessments). Format as Markdown.${langInstruction}\n\nText:\n${rawText}`;
      break;
  }

  const maxRetries = 4;
  let attempt = 0;
  let lastError: any;

  while (attempt < maxRetries) {
    try {
      const genRes = await fetch("/api/generate", {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
            prompt,
            apiKey,
            systemInstruction: "You are an expert educational content synthesizer. Never invent facts, only use the provided text. Output in a highly structured, exportable Markdown format."
         })
      });
      
      if (!genRes.ok) {
        const errData = await genRes.json();
        throw new Error(errData.error || "Failed to generate educational content via backend");
      }
      
      let resultText = await genRes.text();
      if (resultText.includes('[ERROR]')) {
         throw new Error(resultText.split('[ERROR]')[1].trim());
      }
      return resultText || '';
    } catch (error: any) {
      lastError = error;
      console.error(`AI Generation Error (Attempt ${attempt + 1}/${maxRetries}):`, error);
      
      const errorMessage = error?.message || error?.toString() || '';
      if (errorMessage.includes('quota') || errorMessage.includes('429') || errorMessage.includes('503') || errorMessage.includes('UNAVAILABLE') || errorMessage.includes('high demand') || errorMessage.includes('Failed to fetch')) {
        attempt++;
        await new Promise(r => setTimeout(r, 2000 * Math.pow(2, attempt) + Math.random() * 1000));
      } else {
        throw new Error(error.message || "An error occurred during generation.");
      }
    }
  }
  
  throw new Error(lastError?.message || "An error occurred during generation.");
};
