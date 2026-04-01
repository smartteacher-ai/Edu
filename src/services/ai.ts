import { GoogleGenAI } from '@google/genai';

export const extractTextFromMedia = async (file: File, apiKey: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `Please extract and transcribe all the text from this file exactly as it is. 
If it is audio, transcribe the speech accurately. If it is a document, extract the text.
CRITICAL INSTRUCTION FOR ARABIC: If the file contains Arabic text, including Classical Arabic (Fusha), Quranic verses, or Colloquial Arabic (Amiya), you MUST ensure the transcription is highly accurate. Preserve the original language, diacritics (tashkeel) if present, and formatting perfectly. Do not translate it to English unless requested.
Do not add any conversational filler, markdown formatting (unless present in the original), or summaries. Just output the raw text.`;

    // For files > 15MB, we MUST use the File API to avoid browser memory crashes and API inline limits
    if (file.size > 15 * 1024 * 1024) {
      // 1. Initiate upload via REST API
      const uploadUrl = `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`;
      const initRes = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'X-Goog-Upload-Protocol': 'resumable',
          'X-Goog-Upload-Command': 'start',
          'X-Goog-Upload-Header-Content-Length': file.size.toString(),
          'X-Goog-Upload-Header-Content-Type': file.type,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ file: { displayName: file.name } })
      });
      
      if (!initRes.ok) throw new Error('Failed to initiate file upload');
      const uploadUrlResumable = initRes.headers.get('X-Goog-Upload-URL');
      if (!uploadUrlResumable) throw new Error('Failed to get upload URL');
      
      // 2. Upload the file chunks
      const uploadRes = await fetch(uploadUrlResumable, {
        method: 'POST',
        headers: {
          'Content-Length': file.size.toString(),
          'X-Goog-Upload-Offset': '0',
          'X-Goog-Upload-Command': 'upload, finalize',
        },
        body: file
      });
      
      if (!uploadRes.ok) throw new Error('Failed to upload file to Gemini');
      const fileInfo = await uploadRes.json();
      const fileUri = fileInfo.file.uri;

      // 3. Generate content using the uploaded file URI
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            fileData: {
              fileUri: fileUri,
              mimeType: file.type
            }
          },
          { text: prompt }
        ]
      });

      return response.text || '';
    } else {
      // Inline for smaller files
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

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
    }
  } catch (error: any) {
    console.error("Extraction Error:", error);
    throw new Error(error.message || "An error occurred during text extraction.");
  }
};

export const generateEducationalContent = async (
  rawText: string,
  type: 'Summary' | 'LessonPlan' | 'Quiz' | 'CourseOutline',
  apiKey: string,
  language: string = 'Arabic'
) => {
  try {
    const ai = new GoogleGenAI({ apiKey });
    
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
