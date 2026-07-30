export default async function handler(req, res) {
  // Allow requests from your website
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, activeModel, uploadedImageBase64 } = req.body;
    
    // Reads your hidden key safely from server memory
    const geminiKey = process.env.GEMINI_API_KEY;

    if (!geminiKey) {
      return res.status(500).json({ error: 'Server key not configured!' });
    }

    const model = activeModel || 'gemini-2.5-flash';
    const parts = [{ text: `You are a Roblox Luau engine code generator. Output ONLY raw, executable Luau code for Workspace based on the request/image. Do NOT wrap in markdown or backticks. Prompt: ${prompt || "Recreate what is shown in the image"}` }];

    if (uploadedImageBase64) {
      parts.push({
        inline_data: {
          mime_type: "image/png",
          data: uploadedImageBase64
        }
      });
    }

    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts }] })
    });

    const data = await geminiRes.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

