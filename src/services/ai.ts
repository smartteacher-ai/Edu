import { GoogleGenAI } from '@google/genai';

export const extractTextFromMedia = async (
  file: File, 
  apiKey: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
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
      
      // 2. Upload the file chunks with progress tracking
      const fileInfo = await new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', uploadUrlResumable, true);
        xhr.setRequestHeader('Content-Length', file.size.toString());
        xhr.setRequestHeader('X-Goog-Upload-Offset', '0');
        xhr.setRequestHeader('X-Goog-Upload-Command', 'upload, finalize');
        
        if (onProgress) {
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percentComplete = Math.round((event.loaded / event.total) * 100);
              onProgress(percentComplete);
            }
          };
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.send(file);
      });

      const fileUri = fileInfo.file.uri;

      // 3. Generate content using the uploaded file URI
      let attempt = 0;
      const maxRetries = 3;
      let lastError: any;

      while (attempt < maxRetries) {
        try {
          const modelToUse = attempt === maxRetries - 1 ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
          const response = await ai.models.generateContent({
            model: modelToUse,
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
        } catch (error: any) {
          lastError = error;
          const errorMessage = error?.message || '';
          const isHighDemand = errorMessage.includes('503') || errorMessage.includes('UNAVAILABLE') || errorMessage.includes('high demand') || error?.status === 503 || error?.status === 'UNAVAILABLE';
          
          if (isHighDemand && attempt < maxRetries - 1) {
            attempt++;
            const waitTime = Math.pow(2, attempt) * 1000;
            console.log(`Extraction model overloaded. Waiting ${waitTime}ms before retrying...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          } else {
            throw error;
          }
        }
      }
      throw lastError;
    } else {
      // Inline for smaller files
      if (onProgress) onProgress(10); // Fake initial progress
      
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      if (onProgress) onProgress(50); // Fake processing progress

      let attempt = 0;
      const maxRetries = 3;
      let lastError: any;

      while (attempt < maxRetries) {
        try {
          const modelToUse = attempt === maxRetries - 1 ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
          const response = await ai.models.generateContent({
            model: modelToUse,
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

          if (onProgress) onProgress(100);
          return response.text || '';
        } catch (error: any) {
          lastError = error;
          const errorMessage = error?.message || '';
          const isHighDemand = errorMessage.includes('503') || errorMessage.includes('UNAVAILABLE') || errorMessage.includes('high demand') || error?.status === 503 || error?.status === 'UNAVAILABLE';
          
          if (isHighDemand && attempt < maxRetries - 1) {
            attempt++;
            const waitTime = Math.pow(2, attempt) * 1000;
            console.log(`Extraction model overloaded. Waiting ${waitTime}ms before retrying...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          } else {
            throw error;
          }
        }
      }
      throw lastError;
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

  const maxRetries = 4; // Increased retries for better resilience
  let attempt = 0;
  let lastError: any;

  while (attempt < maxRetries) {
    try {
      // Use gemini-2.5-flash initially. If it fails due to high demand or rate limits, 
      // the final attempt will fallback to gemini-2.5-pro to ensure success.
      const modelToUse = attempt === maxRetries - 1 ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
      
      const response = await ai.models.generateContent({
        model: modelToUse,
        contents: prompt,
        config: {
          systemInstruction: "You are an expert educational content synthesizer. Never invent facts, only use the provided text. Output in a highly structured, exportable Markdown format.",
        }
      });

      if (!response || !response.text) {
        throw new Error("Unexpected empty response from the model.");
      }

      return response.text;
    } catch (error: any) {
      lastError = error;
      console.error(`AI Generation Error (Attempt ${attempt + 1}/${maxRetries}):`, error);
      
      const errorMessage = error?.message || '';
      const isRateLimited = errorMessage.includes('429') || error?.status === 429 || errorMessage.toLowerCase().includes('quota');
      const isHighDemand = errorMessage.includes('503') || 
                           errorMessage.includes('UNAVAILABLE') || 
                           errorMessage.includes('high demand') ||
                           error?.status === 503 || 
                           error?.status === 'UNAVAILABLE';
      
      if ((isHighDemand || isRateLimited) && attempt < maxRetries - 1) {
        attempt++;
        // Exponential backoff with jitter: (2^attempt * 1000ms) + random jitter up to 1000ms
        const baseWaitTime = Math.pow(2, attempt) * 1000;
        const jitter = Math.random() * 1000;
        const waitTime = baseWaitTime + jitter;
        
        console.log(`Model overloaded or rate limited. Waiting ${Math.round(waitTime)}ms before retrying with ${attempt === maxRetries - 1 ? 'fallback model' : 'same model'}...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else {
        // If it's not a high demand/rate limit error, or we've exhausted retries, throw immediately
        throw new Error(error.message || "An error occurred during generation.");
      }
    }
  }
  
  throw new Error(lastError?.message || "An error occurred during generation.");
};
