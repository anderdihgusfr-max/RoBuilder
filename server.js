const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
let commandQueue = [];

// Website sends prompt here
app.post('/api/generate', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt required' });

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are a Roblox Luau engine code generator. Output ONLY raw, executable Luau code that creates the requested object inside workspace. Do NOT use markdown tags (no \`\`\`lua or blockticks). Prompt: ${prompt}`
          }]
        }]
      })
    });

    const data = await response.json();
    let rawText = data.candidates[0].content.parts[0].text;
    
    // Clean markdown formatting if present
    let cleanCode = rawText.replace(/```lua/g, '').replace(/```/g, '').trim();

    commandQueue.push(cleanCode);
    res.json({ success: true, message: "Queued for Roblox Studio!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Roblox Studio plugin polls here
app.get('/api/poll', (req, res) => {
  res.json({ commands: commandQueue });
  commandQueue = []; // Empty queue once fetched
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
