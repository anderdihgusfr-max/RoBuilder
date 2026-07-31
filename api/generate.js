export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, activeModel, mode, uploadedImages } = req.body;
    
    // Fallback model selection matching your frontend options
    const modelToUse = activeModel || 'gemini-2.5-flash';

    // Build contents array for Gemini API (supporting text and multiple images)
    const parts = [];
    
    if (uploadedImages && uploadedImages.length > 0) {
      uploadedImages.forEach(base64Data => {
        parts.push({
          inline_data: {
            mime_type: "image/jpeg",
            data: base64Data
          }
        });
      });
    }

    if (prompt) {
      parts.push({ text: prompt });
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: parts }
        ]
      })
    });

    if (response.status === 429) {
      return res.status(429).json({ error: "RATE_LIMIT" });
    }

    const data = await response.json();
    
    if (data.error) {
      return res.status(400).json({ error: data.error.message || data.error });
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
