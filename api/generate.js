export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const apiKey = process.env.GEMINI_API_KEY;

  // Debug check: If no key or key is empty
  if (!apiKey) {
    return res.status(500).json({ 
      error: 'Vercel sees NO key at all! Check Environment Variable name (must be GEMINI_API_KEY).' 
    });
  }

  // Debug check: Print first 4 letters of the key so you know which one Vercel has loaded
  const keySnippet = apiKey.substring(0, 4);

  try {
    const { prompt, model, history } = req.body;
    const selectedModel = model || 'gemini-2.5-flash';

    const googleResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: history || [{ role: 'user', parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await googleResponse.json();

    if (data.error) {
      // Passes back Google's exact error along with the key prefix Vercel used
      return res.status(400).json({
        error: `Google rejected key starting with '${keySnippet}...': ${data.error.message}`
      });
    }

    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
