export default async function handler(req, res) {
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
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    console.log('Calling Claude API...');

    const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        messages: [{
          role: "user",
          content: `You are a conversion copywriting expert. Analyze this marketing copy and return ONLY valid JSON with NO markdown formatting, NO code blocks, NO explanations - just pure JSON.

Copy to analyze: "${text.replace(/"/g, '\\"')}"

Return this EXACT structure with valid JSON:
{
  "wordAnalysis": [
    {"word": "word1", "sentiment": 0.5, "issue": null, "suggestion": null, "reasoning": "Brief reason"}
  ],
  "overallMetrics": {
    "conversionScore": 70,
    "emotionalTone": "neutral",
    "urgencyLevel": "medium",
    "clarityScore": 75,
    "confidenceLevel": "moderate"
  },
  "recommendations": [
    {
      "type": "high",
      "title": "Short title",
      "impact": "+20%",
      "detail": "Brief explanation without quotes",
      "before": "original text",
      "after": "improved text"
    }
  ],
  "optimizedVersions": [
    {
      "title": "Version Name",
      "text": "Rewritten copy here",
      "score": 85,
      "changes": ["change 1", "change 2"]
    }
  ],
  "competitorInsights": {
    "commonPatterns": ["pattern 1", "pattern 2"],
    "differentiationOpportunities": ["opportunity 1", "opportunity 2"]
  }
}

CRITICAL: Ensure all text values are properly escaped. No unescaped quotes, no newlines in strings. Keep explanations brief and simple.`
        }]
      })
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error('Claude API error:', errorText);
      return res.status(500).json({ 
        error: `API error: ${claudeResponse.status}`
      });
    }

    const data = await claudeResponse.json();
    let content = data.content[0].text;
    
    console.log('Raw response length:', content.length);
    console.log('First 200 chars:', content.substring(0, 200));
    
    // Nettoyage agressif
    content = content.trim();
    
    // Enlever les code blocks markdown
    content = content.replace(/```json\s*/g, '');
    content = content.replace(/```\s*/g, '');
    
    // Enlever tout avant le premier {
    const firstBrace = content.indexOf('{');
    if (firstBrace > 0) {
      content = content.substring(firstBrace);
    }
    
    // Enlever tout après le dernier }
    const lastBrace = content.lastIndexOf('}');
    if (lastBrace > -1 && lastBrace < content.length - 1) {
      content = content.substring(0, lastBrace + 1);
    }
    
    console.log('Cleaned content length:', content.length);
    console.log('Attempting to parse JSON...');
    
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (parseError) {
      console.error('JSON parse error:', parseError.message);
      console.error('Problematic JSON:', content);
      
      // Tentative de réparation basique
      content = content
        .replace(/[\n\r]/g, ' ')  // Supprimer les retours à la ligne
        .replace(/\s+/g, ' ')      // Normaliser les espaces
        .replace(/,(\s*[}\]])/g, '$1'); // Supprimer les virgules orphelines
      
      try {
        parsed = JSON.parse(content);
        console.log('JSON repaired and parsed successfully');
      } catch (secondError) {
        return res.status(500).json({ 
          error: 'Invalid JSON from AI',
          details: parseError.message,
          preview: content.substring(0, 500)
        });
      }
    }

    console.log('Analysis completed successfully');
    return res.status(200).json(parsed);

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ 
      error: 'Analysis failed',
      message: error.message
    });
  }
}
