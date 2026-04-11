import { useState, useEffect } from 'react';
import { getLeaderboard } from '../services/api';

function Leaderboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [targetYear, setTargetYear] = useState('');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (search) params.search = search;
      if (targetYear) params.targetYear = targetYear;
      const res = await getLeaderboard(params);
      setData(res.data.leaderboard);
      setPage(0);
    } catch {
      setError('Failed to load leaderboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [targetYear]);

  useEffect(() => {
    const timer = setTimeout(() => fetchLeaderboard(), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const paged = data.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(data.length / PAGE_SIZE);

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

  const getScoreBadge = (score) => {
    if (score >= 75) return { bg: '#d1fae5', color: '#065f46', label: 'Excellent' };
    if (score >= 60) return { bg: '#dbeafe', color: '#1e40af', label: 'Good' };
    if (score >= 45) return { bg: '#fef3c7', color: '#92400e', label: 'Average' };
    return { bg: '#fee2e2', color: '#991b1b', label: 'Needs Work' };
  };

  const getRankDisplay = (rank) => {
    if (rank === 1) return { emoji: '🥇', cls: 'rank-gold' };
    if (rank === 2) return { emoji: '🥈', cls: 'rank-silver' };
    if (rank === 3) return { emoji: '🥉', cls: 'rank-bronze' };
    return { emoji: `#${rank}`, cls: '' };
  };

  return (
    <div className="dashboard">
      <h1 style={{ textAlign: 'center', marginBottom: '4px' }}>UPSC Preparation Leaderboard</h1>
      <p style={{ textAlign: 'center', color: 'var(--text)', marginBottom: '24px' }}>
        {data.length} students ranked by mentorship performance score
      </p>

      {/* Filters */}
      <div style={{
        display: 'flex', gap: '12px', justifyContent: 'center',
        flexWrap: 'wrap', marginBottom: '24px',
      }}>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px',
            fontSize: '15px', background: 'var(--bg)', color: 'var(--text-h)',
            minWidth: '250px', outline: 'none',
          }}
        />
        <select
          value={targetYear}
          onChange={(e) => setTargetYear(e.target.value)}
          style={{
            padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px',
            fontSize: '15px', background: 'var(--bg)', color: 'var(--text-h)',
          }}
        >
          <option value="">All Years</option>
          <option value="2026">UPSC 2026</option>
          <option value="2027">UPSC 2027</option>
          <option value="2028">UPSC 2028</option>
        </select>
      </div>

      {/* Scoring explanation */}
      <div style={{
        maxWidth: '900px', margin: '0 auto 20px', padding: '10px 16px', borderRadius: '8px',
        background: 'var(--accent-bg)', border: '1px solid var(--accent-border)',
        fontSize: '13px', color: 'var(--text)', textAlign: 'center',
      }}>
        Score = Avg Rating (40%) + Sessions Completed (20%) + Improvement Trend (20%) + Latest Rating (20%)
      </div>

      {loading ? (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: '52px', marginBottom: '8px', borderRadius: '8px' }} />
          ))}
        </div>
      ) : error ? (
        <div className="error-state">
          <p>{error}</p>
          <button className="retry-btn" onClick={fetchLeaderboard}>Retry</button>
        </div>
      ) : data.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--text)' }}>No students found.</p>
      ) : (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          {/* Top 3 Highlight Cards */}
          {page === 0 && !search && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '28px' }}>
              {data.slice(0, 3).map((s, i) => {
                const badge = getScoreBadge(s.score);
                const colors = ['#fbbf24', '#9ca3af', '#cd7f32'];
                return (
                  <div key={s.id} style={{
                    padding: '20px', borderRadius: '12px', textAlign: 'center',
                    border: `2px solid ${colors[i]}`, background: 'var(--bg)',
                  }}>
                    <div style={{ fontSize: '36px', marginBottom: '8px' }}>{['🥇', '🥈', '🥉'][i]}</div>
                    <h3 style={{ margin: '0 0 4px', color: 'var(--text-h)' }}>{s.name}</h3>
                    <p style={{ margin: '0 0 8px', color: 'var(--text)', fontSize: '13px' }}>{s.email}</p>
                    <div style={{
                      display: 'inline-block', padding: '6px 16px', borderRadius: '20px',
                      fontSize: '20px', fontWeight: 700, background: badge.bg, color: badge.color,
                    }}>
                      {s.score}
                    </div>
                    <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text)' }}>
                      ★ {s.avgRating} avg &middot; {s.totalSessions} sessions &middot;{' '}
                      <span style={{ color: getTrendColor(s.trend) }}>{getTrendIcon(s.trend)} {s.trend}</span>
                    </div>
                    <div style={{ marginTop: '4px', fontSize: '12px', color: 'var(--text)' }}>
                      Target: UPSC {s.targetYear}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  <th style={{ padding: '10px 6px', color: 'var(--text-h)', width: '50px' }}>Rank</th>
                  <th style={{ padding: '10px 6px', color: 'var(--text-h)' }}>Student</th>
                  <th style={{ padding: '10px 6px', color: 'var(--text-h)', textAlign: 'center' }}>Year</th>
                  <th style={{ padding: '10px 6px', color: 'var(--text-h)', textAlign: 'center' }}>Avg</th>
                  <th style={{ padding: '10px 6px', color: 'var(--text-h)', textAlign: 'center' }}>Sessions</th>
                  <th style={{ padding: '10px 6px', color: 'var(--text-h)', textAlign: 'center' }}>Trend</th>
                  <th style={{ padding: '10px 6px', color: 'var(--text-h)', textAlign: 'center' }}>Score</th>
                </tr>
              </thead>
              <tbody>
                {paged.map(s => {
                  const rd = getRankDisplay(s.rank);
                  const badge = getScoreBadge(s.score);
                  return (
                    <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 6px', fontSize: '16px', fontWeight: 600 }}>{rd.emoji}</td>
                      <td style={{ padding: '10px 6px' }}>
                        <strong style={{ color: 'var(--text-h)' }}>{s.name}</strong>
                        <br />
                        <span style={{ fontSize: '12px', color: 'var(--text)' }}>{s.email}</span>
                      </td>
                      <td style={{ padding: '10px 6px', textAlign: 'center', fontSize: '13px' }}>{s.targetYear}</td>
                      <td style={{ padding: '10px 6px', textAlign: 'center' }}>
                        <span style={{ color: '#f59e0b' }}>★</span> {s.avgRating}
                      </td>
                      <td style={{ padding: '10px 6px', textAlign: 'center' }}>{s.totalSessions}</td>
                      <td style={{ padding: '10px 6px', textAlign: 'center', fontSize: '18px', color: getTrendColor(s.trend) }}>
                        {getTrendIcon(s.trend)}
                      </td>
                      <td style={{ padding: '10px 6px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block', padding: '3px 10px', borderRadius: '10px',
                          fontWeight: 600, fontSize: '13px', background: badge.bg, color: badge.color,
                        }}>
                          {s.score}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
              <button
                className="role-btn"
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
              >
                Previous
              </button>
              <span style={{ padding: '10px', color: 'var(--text)' }}>
                Page {page + 1} of {totalPages}
              </span>
              <button
                className="role-btn"
                disabled={page >= totalPages - 1}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Leaderboard;
