export default async function handler(req, res) {
  // Handle CORS headers so GitHub Pages can request this endpoint
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured in Vercel environment variables.' });
  }

  try {
    const { prompt, model, history, imagePart } = req.body;
    const selectedModel = model || 'gemini-2.5-flash';

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

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents })
      }
    );

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to process request.' });
  }
}
