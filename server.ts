import express from 'express';
import path from 'path';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

// Set up AI services
const upload = multer({ dest: '/tmp/' });

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    let reqApiKey = req.body.apiKey;
    if (reqApiKey === 'null' || reqApiKey === 'undefined' || reqApiKey === '') {
       reqApiKey = null;
    }
    const finalApiKey = reqApiKey || process.env.GEMINI_API_KEY;
    if (!finalApiKey) {
        return res.status(400).json({ error: 'No API key provided. Please pass a valid API key or set GEMINI_API_KEY.' });
    }

    const ai = new GoogleGenAI({ apiKey: finalApiKey });

    const { mimetype, originalname, path: filePath } = file;
    const response = await ai.files.upload({
        file: filePath,
        config: {
          mimeType: mimetype,
          displayName: originalname
        }
    });

    res.json({
      uri: response.uri,
      mimeType: response.mimeType,
      name: response.name
    });
  } catch (error: any) {
    console.error('Upload Error:', error);
    res.status(500).json({ error: error.message || 'Error processing the file' });
  }
});

app.post('/api/generate', async (req, res) => {
  try {
    const { fileUri, mimeType, prompt, apiKey, systemInstruction } = req.body;
    
    let reqApiKey = apiKey;
    if (reqApiKey === 'null' || reqApiKey === 'undefined' || reqApiKey === '') {
       reqApiKey = null;
    }
    const finalApiKey = reqApiKey || process.env.GEMINI_API_KEY;
    if (!finalApiKey) {
        return res.status(400).json({ error: 'No API key provided. Please pass a valid API key or set GEMINI_API_KEY.' });
    }

    const ai = new GoogleGenAI({ apiKey: finalApiKey });
    
    const contents: any[] = [];
    if (fileUri) {
        contents.push({ fileData: { fileUri, mimeType } });
    }
    if (prompt) {
        contents.push({ text: prompt });
    }

    const config: any = {};
    if (systemInstruction) {
        config.systemInstruction = systemInstruction;
    }

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.flushHeaders();

    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents,
      config
    });

    for await (const chunk of responseStream) {
      if (chunk.text) {
        res.write(chunk.text);
      }
    }
    res.end();
  } catch (error: any) {
    console.error('Generate Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || 'Error generating content' });
    } else {
      res.end(`\n\n[ERROR] ${error.message}`);
    }
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
