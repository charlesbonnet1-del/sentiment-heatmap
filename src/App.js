import React, { useState } from 'react';
import { AlertCircle, TrendingUp, Zap, Target, Copy, Loader2, Send } from 'lucide-react';

const API_URL = '/api/analyze';

function SentimentHeatmapPro() {
  const [text, setText] = useState("Try our product free for 30 days. Maybe you'll like it. We think it's okay.");
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('heatmap');
  const [error, setError] = useState(null);

  const analyzeText = async () => {
    if (!text.trim()) return;
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 429) {
          throw new Error(`Rate limit atteint. Réessayez dans ${errorData.remainingTime || '1 heure'}.`);
        }
        throw new Error(errorData.error || `Erreur ${response.status}`);
      }

      const parsed = await response.json();
      setAnalysis(parsed);
      setActiveTab('heatmap');
      
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.message || 'Échec de l\'analyse. Réessayez.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSentimentColor = (sentiment) => {
    if (sentiment > 0.6) return '#10b981';
    if (sentiment > 0.2) return '#EA580C';
    if (sentiment > -0.2) return '#A8A29E';
    if (sentiment > -0.5) return '#f59e0b';
    return '#ef4444';
  };

  const getSentimentBg = (sentiment) => {
    if (sentiment > 0.6) return 'bg-green-50 border-green-300';
    if (sentiment > 0.2) return 'bg-orange-50 border-orange-300';
    if (sentiment > -0.2) return 'border-[#A8A29E]';
    if (sentiment > -0.5) return 'bg-yellow-50 border-yellow-300';
    return 'bg-red-50 border-red-300';
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-[#EA580C]';
    return 'text-red-600';
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F9F7F1', fontFamily: '"Consolas", "Monaco", "Lucida Console", "Courier New", monospace' }}>
      <div style={{ maxWidth: '672px', margin: '0 auto', padding: '32px 16px' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '30px', fontWeight: 'bold', marginBottom: '8px', color: '#2D2D2D' }}>
            Sentiment Heatmap Live
          </h1>
          <p style={{ fontSize: '15px', lineHeight: '1.6', color: '#44403C' }}>
            AI-powered copy analysis for maximum conversion
          </p>
          <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#EA580C', animation: 'pulse 2s infinite' }}></div>
            <span style={{ fontSize: '14px', color: '#A8A29E' }}>Powered by Claude Sonnet 4</span>
          </div>
        </div>

        <div style={{ backgroundColor: '#E5E0D8', border: '2px solid #D6D3D1', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#44403C' }}>
            Your Marketing Copy
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{
              width: '100%',
              height: '128px',
              padding: '16px',
              backgroundColor: '#F9F7F1',
              border: '2px solid #D6D3D1',
              borderRadius: '16px',
              fontSize: '15px',
              lineHeight: '1.6',
              color: '#2D2D2D',
              fontFamily: 'inherit',
              resize: 'none',
              outline: 'none'
            }}
            onFocus={(e) => e.target.style.borderColor = '#EA580C'}
            onBlur={(e) => e.target.style.borderColor = '#D6D3D1'}
            placeholder="Paste your headline, CTA, email subject, or landing page copy..."
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '16px' }}>
            <button
              onClick={analyzeText}
              disabled={isAnalyzing || !text.trim()}
              style={{
                padding: '12px 24px',
                backgroundColor: '#EA580C',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '9999px',
                fontWeight: '600',
                fontSize: '15px',
                cursor: isAnalyzing || !text.trim() ? 'not-allowed' : 'pointer',
                opacity: isAnalyzing || !text.trim() ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!isAnalyzing && text.trim()) {
                  e.target.style.backgroundColor = '#DC2626';
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#EA580C';
              }}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite' }} />
                  Analyzing...
                </>
              ) : (
                <>
                  <Send style={{ width: '20px', height: '20px' }} />
                  Analyze Copy
                </>
              )}
            </button>
            {error && (
              <div style={{ color: '#DC2626', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle style={{ width: '16px', height: '16px' }} />
                {error}
              </div>
            )}
          </div>
          <div style={{ marginTop: '16px', fontSize: '12px', color: '#A8A29E' }}>
            💡 Limite : 10 analyses par heure • Les analyses identiques sont en cache
          </div>
        </div>

        {analysis && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
              <div style={{ backgroundColor: '#E5E0D8', border: '2px solid #D6D3D1', borderRadius: '16px', padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#44403C' }}>Conversion Score</span>
                  <Target style={{ width: '20px', height: '20px', color: '#EA580C' }} />
                </div>
                <div style={{ fontSize: '36px', fontWeight: 'bold' }} className={getScoreColor(analysis.overallMetrics.conversionScore)}>
                  {Math.round(analysis.overallMetrics.conversionScore)}
                </div>
                <div style={{ fontSize: '12px', marginTop: '4px', color: '#A8A29E' }}>Industry avg: 65</div>
              </div>

              <div style={{ backgroundColor: '#E5E0D8', border: '2px solid #D6D3D1', borderRadius: '16px', padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#44403C' }}>Issues Found</span>
                  <AlertCircle style={{ width: '20px', height: '20px', color: '#DC2626' }} />
                </div>
                <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#2D2D2D' }}>
                  {analysis.wordAnalysis.filter(w => w.issue).length}
                </div>
                <div style={{ fontSize: '12px', marginTop: '4px', color: '#A8A29E' }}>Need optimization</div>
              </div>

              <div style={{ backgroundColor: '#E5E0D8', border: '2px solid #D6D3D1', borderRadius: '16px', padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#44403C' }}>Clarity Score</span>
                  <TrendingUp style={{ width: '20px', height: '20px', color: '#EA580C' }} />
                </div>
                <div style={{ fontSize: '36px', fontWeight: 'bold' }} className={getScoreColor(analysis.overallMetrics.clarityScore)}>
                  {Math.round(analysis.overallMetrics.clarityScore)}
                </div>
                <div style={{ fontSize: '12px', marginTop: '4px', color: '#A8A29E' }}>Message clarity</div>
              </div>

              <div style={{ backgroundColor: '#E5E0D8', border: '2px solid #D6D3D1', borderRadius: '16px', padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#44403C' }}>Urgency</span>
                  <Zap style={{ width: '20px', height: '20px', color: '#EA580C' }} />
                </div>
                <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#2D2D2D', textTransform: 'capitalize' }}>
                  {analysis.overallMetrics.urgencyLevel}
                </div>
                <div style={{ fontSize: '12px', marginTop: '4px', color: '#A8A29E', textTransform: 'capitalize' }}>
                  {analysis.overallMetrics.emotionalTone}
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: '#E5E0D8', border: '2px solid #D6D3D1', borderRadius: '16px', overflow: 'hidden' }}>
              <div style={{ display: 'flex', borderBottom: '2px solid #D6D3D1' }}>
                {['heatmap', 'recommendations', 'optimized', 'insights'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      flex: 1,
                      padding: '16px',
                      fontWeight: '600',
                      textTransform: 'capitalize',
                      fontSize: '15px',
                      backgroundColor: activeTab === tab ? '#F9F7F1' : 'transparent',
                      color: activeTab === tab ? '#EA580C' : '#44403C',
                      border: 'none',
                      borderBottom: activeTab === tab ? '2px solid #EA580C' : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div style={{ padding: '24px', backgroundColor: '#F9F7F1' }}>
                {activeTab === 'heatmap' && (
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#2D2D2D' }}>
                      Word-by-Word Analysis
                    </h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
                      {analysis.wordAnalysis.map((item, idx) => (
                        <div
                          key={idx}
                          className={getSentimentBg(item.sentiment)}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '9999px',
                            border: '2px solid',
                            cursor: 'pointer',
                            transition: 'transform 0.2s',
                            position: 'relative',
                            backgroundColor: item.sentiment > -0.2 ? 'transparent' : undefined
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                        >
                          <span style={{ fontWeight: '500', fontSize: '15px', color: getSentimentColor(item.sentiment) }}>
                            {item.word}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                      <div style={{ backgroundColor: '#E5E0D8', borderRadius: '16px', padding: '16px' }}>
                        <h4 style={{ fontWeight: '600', marginBottom: '12px', fontSize: '14px', color: '#2D2D2D' }}>Legend</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '15px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: 'rgb(240, 253, 244)', border: '2px solid rgb(134, 239, 172)' }}></div>
                            <span style={{ color: '#44403C' }}>Power words</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: 'rgb(255, 237, 213)', border: '2px solid rgb(251, 146, 60)' }}></div>
                            <span style={{ color: '#44403C' }}>Positive</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: 'rgb(254, 242, 242)', border: '2px solid rgb(252, 165, 165)' }}></div>
                            <span style={{ color: '#44403C' }}>Weak</span>
                          </div>
                        </div>
                      </div>
                      <div style={{ backgroundColor: '#FED7AA', borderRadius: '16px', padding: '16px' }}>
                        <h4 style={{ fontWeight: '600', marginBottom: '12px', fontSize: '14px', color: '#7C2D12' }}>AI Insights</h4>
                        <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '15px', color: '#9A3412', listStyle: 'none', padding: 0 }}>
                          <li>• Confidence: {analysis.overallMetrics.confidenceLevel}</li>
                          <li>• Tone: {analysis.overallMetrics.emotionalTone}</li>
                          <li>• Urgency: {analysis.overallMetrics.urgencyLevel}</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'recommendations' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {analysis.recommendations.map((rec, idx) => (
                      <div
                        key={idx}
                        style={{
                          borderLeft: `4px solid ${rec.type === 'critical' ? '#DC2626' : rec.type === 'high' ? '#EA580C' : '#EAB308'}`,
                          padding: '16px',
                          borderRadius: '16px',
                          borderBottomLeftRadius: 0,
                          backgroundColor: rec.type === 'critical' ? 'rgb(254, 242, 242)' : rec.type === 'high' ? 'rgb(255, 237, 213)' : 'rgb(254, 249, 195)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <h4 style={{ fontWeight: '600', fontSize: '15px', color: '#2D2D2D' }}>{rec.title}</h4>
                          <span style={{ padding: '4px 12px', borderRadius: '9999px', fontSize: '14px', fontWeight: 'bold', backgroundColor: '#EA580C', color: '#FFFFFF' }}>
                            {rec.impact}
                          </span>
                        </div>
                        <p style={{ fontSize: '15px', marginBottom: '12px', lineHeight: '1.6', color: '#44403C' }}>{rec.detail}</p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', padding: '16px', borderRadius: '16px', border: '2px solid #D6D3D1', backgroundColor: '#F9F7F1' }}>
                          <div>
                            <div style={{ fontSize: '12px', color: '#DC2626', fontWeight: '600', marginBottom: '4px' }}>BEFORE</div>
                            <div style={{ fontSize: '15px', textDecoration: 'line-through', color: '#44403C' }}>{rec.before}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '12px', color: '#16A34A', fontWeight: '600', marginBottom: '4px' }}>AFTER</div>
                            <div style={{ fontSize: '15px', fontWeight: '500', color: '#2D2D2D' }}>{rec.after}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'optimized' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {analysis.optimizedVersions.map((version, idx) => (
                      <div
                        key={idx}
                        style={{
                          border: '2px solid #D6D3D1',
                          borderRadius: '16px',
                          padding: '20px',
                          transition: 'border-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.borderColor = '#EA580C'}
                        onMouseLeave={(e) => e.currentTarget.style.borderColor = '#D6D3D1'}
                      >
                        <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '12px' }}>
                          <div>
                            <h4 style={{ fontWeight: 'bold', fontSize: '18px', color: '#2D2D2D' }}>{version.title}</h4>
                            <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                              {version.changes.map((change, i) => (
                                <span
                                  key={i}
                                  style={{
                                    fontSize: '12px',
                                    padding: '4px 12px',
                                    borderRadius: '9999px',
                                    border: '1px solid #FDBA74',
                                    backgroundColor: '#FED7AA',
                                    color: '#7C2D12'
                                  }}
                                >
                                  {change}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '30px', fontWeight: 'bold', color: '#EA580C' }}>{version.score}</div>
                            <div style={{ fontSize: '12px', color: '#A8A29E' }}>Score</div>
                          </div>
                        </div>
                        <div style={{ backgroundColor: '#E5E0D8', borderRadius: '16px', padding: '16px', marginBottom: '12px' }}>
                          <p style={{ fontWeight: '500', fontSize: '15px', lineHeight: '1.6', color: '#2D2D2D' }}>{version.text}</p>
                        </div>
                        <button
                          onClick={() => copyToClipboard(version.text)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '15px',
                            fontWeight: '600',
                            color: '#EA580C',
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 0
                          }}
                        >
                          <Copy style={{ width: '16px', height: '16px' }} />
                          Copy to clipboard
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'insights' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', color: '#2D2D2D' }}>
                        Common Patterns in High-Converting Copy
                      </h3>
                      <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px', listStyle: 'none', padding: 0 }}>
                        {analysis.competitorInsights.commonPatterns.map((pattern, idx) => (
                          <li key={idx} style={{ display: 'flex', alignItems: 'start', gap: '12px', fontSize: '15px', lineHeight: '1.6', color: '#44403C' }}>
                            <span style={{ marginTop: '4px', fontWeight: 'bold', color: '#EA580C' }}>•</span>
                            <span>{pattern}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', color: '#2D2D2D' }}>
                        Differentiation Opportunities
                      </h3>
                      <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px', listStyle: 'none', padding: 0 }}>
                        {analysis.competitorInsights.differentiationOpportunities.map((opp, idx) => (
                          <li key={idx} style={{ display: 'flex', alignItems: 'start', gap: '12px', fontSize: '15px', lineHeight: '1.6', color: '#44403C' }}>
                            <span style={{ marginTop: '4px', fontWeight: 'bold', color: '#16A34A' }}>✓</span>
                            <span>{opp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default SentimentHeatmapPro;
