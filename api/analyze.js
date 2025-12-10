export default async function handler(req, res) {
  console.log('=== API Called ===');
  console.log('Method:', req.method);
  
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
    console.log('Text received:', text ? text.substring(0, 50) : 'NONE');

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    console.log('API Key exists:', !!apiKey);
    console.log('API Key prefix:', apiKey ? apiKey.substring(0, 15) : 'MISSING');
    
    if (!apiKey) {
      console.error('❌ API key not found in environment!');
      return res.status(500).json({ error: 'API key not configured. Go to Vercel Settings → Environment Variables' });
    }

    console.log('📡 Calling Claude API...');

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
          content: `You are an expert conversion copywriter. Analyze this copy: "${text}"

Respond ONLY with valid JSON (no markdown):
{
  "wordAnalysis": [{"word": "Try", "sentiment": -0.5, "issue": "weak_conviction", "suggestion": "Use 'Start' instead", "reasoning": "More decisive"}],
  "overallMetrics": {"conversionScore": 65, "emotionalTone": "neutral", "urgencyLevel": "low", "clarityScore": 70, "confidenceLevel": "weak"},
  "recommendations": [{"type": "high", "title": "Remove hedging", "impact": "+25%", "detail": "Replace weak words", "before": "Maybe you'll like it", "after": "You'll love it"}],
  "optimizedVersions": [{"title": "Direct & Confident", "text": "Start your free 30-day trial. Experience real results.", "score": 85, "changes": ["Removed hedging", "Added benefit"]}],
  "competitorInsights": {"commonPatterns": ["Strong CTAs"], "differentiationOpportunities": ["Add urgency"]}
}`
        }]
      })
    });

    console.log('Claude response status:', claudeResponse.status);

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error('❌ Claude API error:', errorText);
      return res.status(500).json({ 
        error: `Claude API error: ${claudeResponse.status}`,
        details: errorText.substring(0, 200)
      });
    }

    const data = await claudeResponse.json();
    console.log('✅ Claude response received');
    
    const content = data.content[0].text;
    console.log('Content preview:', content.substring(0, 100));
    
    let jsonStr = content.trim();
    jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    const parsed = JSON.parse(jsonStr);
    console.log('✅ JSON parsed successfully');

    return res.status(200).json(parsed);

  } catch (error) {
    console.error('❌ Server Error:', error.message);
    console.error('Stack:', error.stack);
    return res.status(500).json({ 
      error: 'Analysis failed',
      message: error.message,
      type: error.constructor.name
    });
  }
}
