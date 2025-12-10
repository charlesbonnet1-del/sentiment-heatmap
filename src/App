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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error');
      }

      const parsed = await response.json();
      setAnalysis(parsed);
      setActiveTab('heatmap');
    } catch (err) {
      setError(err.message || 'Failed to analyze');
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!analysis) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F9F7F1', padding: '32px', fontFamily: 'Consolas, Monaco, monospace' }}>
        <div style={{ maxWidth: '672px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '30px', fontWeight: 'bold', marginBottom: '8px', color: '#2D2D2D' }}>
            Sentiment Heatmap Live
          </h1>
          <p style={{ fontSize: '15px', lineHeight: '1.6', color: '#44403C' }}>
            AI-powered copy analysis for maximum conversion
          </p>
          
          <div style={{ backgroundColor: '#E5E0D8', border: '2px solid #D6D3D1', borderRadius: '16px', padding: '24px', marginTop: '
