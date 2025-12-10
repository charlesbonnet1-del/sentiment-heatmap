const rateLimit = new Map();
const analysisCache = new Map();

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text is required' });
    }

    if (text.length > 5000) {
      return res.status(400).json({ error: 'Text too long (max 5000 chars)' });
    }

    const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const now = Date.now();
    const hourAgo = now - (60 * 60 * 1000);

    if (!rateLimit.has(clientIP)) {
      rateLimit.set(clientIP, []);
    }

    const userRequests = rateLimit.get(clientIP).filter(time => time > hourAgo);
    
    if (userRequests.length >= 10) {
      return res.status(429).json({ 
        error: 'Rate limit exceeded. Try again in 1 hour.',
        remainingTime: Math.ceil((userRequests[0] + 3600000 - now) / 60000) + ' minutes'
      });
    }

    userRequests.push(now);
    rateLimit.set(clientIP, userRequests);

    const cacheKey = text.trim().toLowerCase();
    if (analysisCache.has(cacheKey)) {
      console.log('Cache hit');
      return res.status(200).json(analysisCache.get(cacheKey));
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
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
      "sentiment": number between -1 and 1,
      "issue": "weak_conviction" | "passive" | "friction" | "hedge" | null,
      "suggestion": "specific actionable fix" | null,
      "reasoning": "why this word impacts conversion"
    }
  ],
  "overallMetrics": {
    "conversionScore": number 0-100,
    "emotionalTone": "positive" | "neutral" | "negative",
    "urgencyLevel": "high" | "medium" | "low",
    "clarityScore": number 0-100,
    "confidenceLevel": "strong" | "moderate" | "weak"
  },
  "recommendations": [
    {
      "type": "critical" | "high" | "medium",
      "title": "brief title",
      "impact": "estimated % lift like +34%",
      "detail": "explanation of the psychology",
      "before": "exact text from original",
      "after": "improved version"
    }
  ],
  "optimizedVersions": [
    {
      "title": "strategy name",
      "text": "complete rewritten copy",
      "score": number 0-100,
      "changes": ["change 1", "change 2", "change 3"]
    }
  ],
  "competitorInsights": {
    "commonPatterns": ["pattern 1", "pattern 2"],
    "differentiationOpportunities": ["opportunity 1", "opportunity 2"]
  }
}

Focus on real conversion psychology: power words vs weak words, urgency creation, friction removal, specificity, social proof elements, and emotional triggers.`
        }],
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Claude API Error:', errorData);
      return res.status(response.status).json({ 
        error: `API Error: ${response.status}`,
        details: errorData
      });
    }

    const data = await response.json();
    const content = data.content[0].text;
    
    let jsonStr = content.trim();
    jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    const parsed = JSON.parse(jsonStr);

    analysisCache.set(cacheKey, parsed);
    setTimeout(() => analysisCache.delete(cacheKey), 60 * 60 * 1000);

    console.log('Analysis completed');

    return res.status(200).json(parsed);

  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ 
      error: 'Analysis failed',
      message: error.message 
    });
  }
}
