import { useState, useEffect } from 'react';
import { getRankings } from '../services/api';

function Rankings() {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRankings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getRankings();
      setRankings(res.data.rankings);
    } catch {
      setError('Failed to load rankings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRankings();
  }, []);

  const getTrendIcon = (trend) => {
    if (trend === 'improving') return '↑';
    if (trend === 'declining') return '↓';
    return '→';
  };

  const getTrendColor = (trend) => {
    if (trend === 'improving') return '#059669';
    if (trend === 'declining') return '#dc2626';
    return '#6b7280';
  };

  const getMedalEmoji = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div className="dashboard">
      <h1 style={{ textAlign: 'center', marginBottom: '8px' }}>Student Rankings</h1>
      <p style={{ textAlign: 'center', color: 'var(--text)', marginBottom: '32px' }}>
        Performance-based ranking of all active students
      </p>

      {loading ? (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton card" style={{ marginBottom: '12px' }} />)}
        </div>
      ) : error ? (
        <div className="error-state">
          <p>{error}</p>
          <button className="retry-btn" onClick={fetchRankings}>Retry</button>
        </div>
      ) : (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {/* Scoring info */}
          <div style={{
            padding: '12px 16px', marginBottom: '24px', borderRadius: '8px',
            background: 'var(--accent-bg)', border: '1px solid var(--accent-border)',
            fontSize: '13px', color: 'var(--text)',
          }}>
            Score = Avg Rating (40%) + Sessions (20%) + Trend (20%) + Latest Rating (20%)
          </div>

          {/* Rankings table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  <th style={{ padding: '12px 8px', color: 'var(--text-h)' }}>Rank</th>
                  <th style={{ padding: '12px 8px', color: 'var(--text-h)' }}>Student</th>
                  <th style={{ padding: '12px 8px', color: 'var(--text-h)', textAlign: 'center' }}>Avg Rating</th>
                  <th style={{ padding: '12px 8px', color: 'var(--text-h)', textAlign: 'center' }}>Sessions</th>
                  <th style={{ padding: '12px 8px', color: 'var(--text-h)', textAlign: 'center' }}>Trend</th>
                  <th style={{ padding: '12px 8px', color: 'var(--text-h)', textAlign: 'center' }}>Score</th>
                </tr>
              </thead>
              <tbody>
                {rankings.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 8px', fontSize: '20px' }}>{getMedalEmoji(r.rank)}</td>
                    <td style={{ padding: '12px 8px' }}>
                      <strong style={{ color: 'var(--text-h)' }}>{r.name}</strong>
                      <br />
                      <span style={{ fontSize: '13px', color: 'var(--text)' }}>{r.email}</span>
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                      <span style={{ color: '#f59e0b' }}>★</span> {r.avgRating || '—'}
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'center' }}>{r.totalSessions}</td>
                    <td style={{ padding: '12px 8px', textAlign: 'center', fontSize: '20px', color: getTrendColor(r.trend) }}>
                      {r.totalSessions > 0 ? getTrendIcon(r.trend) : '—'}
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block', padding: '4px 12px', borderRadius: '12px',
                        fontWeight: 600, fontSize: '14px',
                        background: r.score >= 60 ? '#d1fae5' : r.score >= 30 ? '#fef3c7' : '#fee2e2',
                        color: r.score >= 60 ? '#065f46' : r.score >= 30 ? '#92400e' : '#991b1b',
                      }}>
                        {r.score}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {rankings.every(r => r.totalSessions === 0) && (
            <p style={{ textAlign: 'center', color: 'var(--text)', marginTop: '24px' }}>
              No reviews yet. Rankings will update as mentors submit session reviews.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default Rankings;
