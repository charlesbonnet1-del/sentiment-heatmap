// api/analyze.js - Vercel Serverless Function
// Ce fichier sera placé dans le dossier /api de ton projet

const rateLimit = new Map(); // Cache temporaire pour rate limiting
const analysisCache = new Map(); // Cache des analyses

export default async function handler(req, res) {
  // 1. CORS - Autoriser les requêtes depuis ton site
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); // En prod: remplace par ton domaine
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Gérer les requêtes OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 2. Accepter uniquement POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text } = req.body;

    // 3. Validation
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text is required' });
    }

    if (text.length > 5000) {
      return res.status(400).json({ error: 'Text too long (max 5000 chars)' });
    }

    // 4. RATE LIMITING - Max 10 requêtes/heure par IP
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

    // 5. CACHE - Éviter de rappeler l'API pour le même texte
    const cacheKey = text.trim().toLowerCase();
    if (analysisCache.has(cacheKey)) {
      console.log('✅ Cache hit - No API call needed');
      return res.status(200).json(analysisCache.get(cacheKey));
    }

    // 6. APPEL À L'API CLAUDE (sécurisé côté serveur)
    const apiKey = process.env.ANTHROPIC_API_KEY; // Variable d'environnement
    
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    console.log('📡 Calling Claude API...');

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
      "sentiment": number between -1 and 1 (negative = hurts conversion, positive = helps),
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
    
    // 7. Parser le JSON
    let jsonStr = content.trim();
    jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    const parsed = JSON.parse(jsonStr);

    // 8. Stocker en cache (1 heure)
    analysisCache.set(cacheKey, parsed);
    setTimeout(() => analysisCache.delete(cacheKey), 60 * 60 * 1000);

    console.log('✅ Analysis completed successfully');

    // 9. Retourner le résultat
    return res.status(200).json(parsed);

  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ 
      error: 'Analysis failed',
      message: error.message 
    });
  }
}

// Nettoyage automatique du cache toutes les heures
setInterval(() => {
  const now = Date.now();
  const hourAgo = now - (60 * 60 * 1000);
  
  // Nettoyer rate limit
  for (const [ip, timestamps] of rateLimit.entries()) {
    const validTimestamps = timestamps.filter(t => t > hourAgo);
    if (validTimestamps.length === 0) {
      rateLimit.delete(ip);
    } else {
      rateLimit.set(ip, validTimestamps);
    }
  }
}, 60 * 60 * 1000); // Toutes les heures