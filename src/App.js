import React from 'react';

function App() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#F9F7F1', 
      padding: '32px',
      fontFamily: 'Consolas, Monaco, monospace'
    }}>
      <div style={{ maxWidth: '672px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#2D2D2D' }}>
          Sentiment Heatmap Live
        </h1>
        <p style={{ marginTop: '16px', fontSize: '15px', color: '#44403C' }}>
          ✅ L'application fonctionne ! Backend en cours de connexion...
        </p>
      </div>
    </div>
  );
}

export default App;
