import { useState } from 'react';
import { getTopperPrediction } from '../services/api';

function TopperPredictor() {
  const [targetYear, setTargetYear] = useState('2026');
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePredict = async () => {
    setLoading(true);
    setError(null);
    setPredictions(null);
    try {
      const res = await getTopperPrediction(targetYear);
      setPredictions(res.data);
    } catch {
      setError('Failed to generate predictions. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const getProbabilityColor = (p) => {
    if (p >= 70) return { bg: '#d1fae5', color: '#065f46' };
    if (p >= 50) return { bg: '#dbeafe', color: '#1e40af' };
    if (p >= 30) return { bg: '#fef3c7', color: '#92400e' };
    return { bg: '#fee2e2', color: '#991b1b' };
  };

  return (
    <div className="dashboard">
      <h1 style={{ textAlign: 'center', marginBottom: '8px' }}>UPSC Topper Predictor</h1>
      <p style={{ textAlign: 'center', color: 'var(--text)', marginBottom: '32px' }}>
        AI-powered performance prediction based on mentorship data
      </p>

      {/* Year selector + Predict button */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '32px' }}>
        <select
          value={targetYear}
          onChange={(e) => setTargetYear(e.target.value)}
          style={{
            padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px',
            fontSize: '16px', background: 'var(--bg)', color: 'var(--text-h)', minWidth: '150px',
          }}
        >
          <option value="2026">UPSC 2026</option>
          <option value="2027">UPSC 2027</option>
          <option value="2028">UPSC 2028</option>
        </select>
        <button className="submit-btn" onClick={handlePredict} disabled={loading} style={{ padding: '10px 24px' }}>
          {loading ? 'Analyzing...' : 'Predict Rankings'}
        </button>
      </div>

      {error && (
        <div className="error-state"><p>{error}</p></div>
      )}

      {loading && (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', color: 'var(--text)', marginBottom: '16px' }}>
            AI is analyzing student data and mentor reviews...
          </div>
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton card" style={{ marginBottom: '12px' }} />)}
        </div>
      )}

      {predictions && (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{
            textAlign: 'center', marginBottom: '24px', padding: '16px',
            background: 'var(--accent-bg)', borderRadius: '12px', border: '1px solid var(--accent-border)',
          }}>
            <h3 style={{ margin: '0 0 4px', color: 'var(--accent)' }}>
              UPSC {predictions.targetYear} Predictions
            </h3>
            <p style={{ margin: 0, color: 'var(--text)', fontSize: '14px' }}>
              Source: {predictions.source === 'openai' ? 'AI Analysis (GPT-4o-mini)' : 'Fallback Calculator'}
            </p>
          </div>

          {predictions.predictions.map((p, i) => (
            <div
              key={p.id || i}
              className="review-card"
              style={{
                marginBottom: '16px',
                borderLeft: `4px solid ${getProbabilityColor(p.probability).color}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <span style={{
                      fontSize: '24px', fontWeight: 700, color: 'var(--text-h)',
                      minWidth: '36px',
                    }}>
                      {p.rank <= 3 ? ['🥇', '🥈', '🥉'][p.rank - 1] : `#${p.rank}`}
                    </span>
                    <div>
                      <h3 style={{ margin: 0, color: 'var(--text-h)' }}>{p.name}</h3>
                      <span style={{ fontSize: '13px', color: 'var(--text)' }}>{p.id}</span>
                    </div>
                  </div>
                </div>
                <span style={{
                  display: 'inline-block', padding: '8px 16px', borderRadius: '12px',
                  fontWeight: 700, fontSize: '18px',
                  background: getProbabilityColor(p.probability).bg,
                  color: getProbabilityColor(p.probability).color,
                }}>
                  {p.probability}%
                </span>
              </div>

              <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <strong style={{ color: '#059669', fontSize: '13px' }}>Strengths</strong>
                  <p style={{ margin: '4px 0 0', color: 'var(--text)', fontSize: '14px' }}>{p.strengths}</p>
                </div>
                <div>
                  <strong style={{ color: '#dc2626', fontSize: '13px' }}>Areas to Improve</strong>
                  <p style={{ margin: '4px 0 0', color: 'var(--text)', fontSize: '14px' }}>{p.improvements}</p>
                </div>
              </div>

              {p.prediction && (
                <div style={{
                  marginTop: '12px', padding: '8px 12px', borderRadius: '6px',
                  background: 'var(--code-bg)', fontSize: '14px', color: 'var(--text-h)',
                }}>
                  {p.prediction}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TopperPredictor;
