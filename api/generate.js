export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, model, history, imagePart } = req.body;
    const selectedModel = model || 'gemini-3.1-flash-lite';

    const currentUserParts = [];
    if (imagePart) {
      currentUserParts.push({
        inline_data: {
          mime_type: imagePart.mime_type,
          data: imagePart.data
        }
      });
    }
    currentUserParts.push({ text: prompt || "Analyze this image." });

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: "Talk like a normal human friend. Keep answers super short, casual, and conversational. Never sound like an AI or a robot." }]
        },
        contents: [
          ...(history || []),
          { role: 'user', parts: currentUserParts }
        ]
      })
    });

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
