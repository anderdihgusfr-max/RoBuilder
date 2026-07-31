export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured in Vercel settings.' });
  }

  try {
    const { prompt, model, history, imagePart, extendedThinking } = req.body;
    const selectedModel = model || 'gemini-1.5-flash';

    const parts = [];
    if (imagePart && imagePart.data && imagePart.mime_type) {
      parts.push({
        inline_data: {
          mime_type: imagePart.mime_type,
          data: imagePart.data
        }
      });
    }
    if (prompt) {
      parts.push({ text: prompt });
    }

    const contents = [];
    if (Array.isArray(history) && history.length > 0) {
      contents.push(...history);
    }
    contents.push({ role: 'user', parts });

    const requestBody = { contents };

    // Inject extended thinking logic if toggled on
    if (extendedThinking) {
      requestBody.systemInstruction = {
        parts: [{ 
          text: "You are operating in Extended Thinking Mode. Analyze the problem thoroughly, break it down into detailed step-by-step logic, evaluate edge cases, and provide an exhaustive, deeply reasoned response." 
        }]
      };
    }

    const googleResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      }
    );

    const data = await googleResponse.json();
    return res.status(googleResponse.status).json(data);

  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to process request.' });
  }
}
