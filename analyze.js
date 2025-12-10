export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
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
      console.error('API key missing!');
      return res.status(500).json({ error: 'API key not configured' });
    }

    console.log('Calling Claude API...');

    const response = await fetch("https://api.anthropic.com/v1/messages", {
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
          content: `You are an expert conversion copywriter and marketing psychologist. Analyze this marketing copy for conversion optimization:

"${text}"

Provide a detailed JSON analysis with this EXACT structure (respond ONLY with valid JSON, no markdown, no preamble):

{
  "wordAnalysis": [
    {
      "word": "exact word from text",
      "sentiment": 0.5,
      "issue": null,
      "suggestion": null,
      "reasoning": "analysis"
    }
  ],
  "overallMetrics": {
    "conversionScore": 75,
    "emotionalTone": "positive",
    "urgencyLevel": "medium",
    "clarityScore": 80,
    "confidenceLevel": "strong"
  },
  "recommendations": [
    {
      "type": "high",
      "title": "Recommendation title",
      "impact": "+20%",
      "detail": "Detailed explanation",
      "before": "Original text",
      "after": "Improved text"
    }
  ],
  "optimizedVersions": [
    {
      "title": "Version name",
      "text": "Optimized copy",
      "score": 85,
      "changes": ["change 1", "change 2"]
    }
  ],
  "competitorInsights": {
    "commonPatterns": ["pattern 1"],
    "differentiationOpportunities": ["opportunity 1"]
  }
}`
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API Error:', response.status, errorText);
      return res.status(500).json({ 
        error: `API Error: ${response.status}`,
        details: errorText
      });
    }

    const data = await response.json();
    const content = data.content[0].text;
    
    let jsonStr = content.trim();
    jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    const parsed = JSON.parse(jsonStr);

    console.log('Analysis completed successfully');
    return res.status(200).json(parsed);

  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ 
      error: 'Analysis failed',
      message: error.message 
    });
  }
}
