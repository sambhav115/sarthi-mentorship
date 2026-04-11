import { useState, useEffect } from 'react';
import { getStudents, getReviews, summarizeAll } from '../services/api';

function StudentView() {
  const [students, setStudents] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [aiSummary, setAiSummary] = useState(null);
  const [summarizing, setSummarizing] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await getStudents();
        setStudents(res.data.students);
      } catch {
        setError('Failed to load students.');
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setReviews([]);
      setAiSummary(null);
      return;
    }
    const fetchReviews = async () => {
      setReviewsLoading(true);
      setAiSummary(null);
      try {
        const res = await getReviews(selectedId);
        setReviews(res.data.reviews);
      } catch {
        setReviews([]);
      } finally {
        setReviewsLoading(false);
      }
    };
    fetchReviews();
  }, [selectedId]);

  const handleSummarizeAll = async () => {
    setSummarizing(true);
    setAiSummary(null);
    try {
      const res = await summarizeAll(selectedId);
      setAiSummary(res.data);
    } catch {
      setAiSummary({ summary: 'Failed to generate summary. Try again.', totalSessions: 0 });
    } finally {
      setSummarizing(false);
    }
  };

  if (loading) {
    return (
      <div className="progress-section">
        <div className="skeleton" style={{ width: '60%', height: '40px', margin: '0 auto 24px' }} />
        {[1, 2].map(i => <div key={i} className="skeleton card" />)}
      </div>
    );
  }

  if (error) {
    return <div className="error-state"><p>{error}</p></div>;
  }

  const selectedStudent = students.find(s => s.id === selectedId);

  return (
    <div className="progress-section">
      <div className="student-select-section">
        <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
          <option value="">Select your profile</option>
          {students.map(s => (
            <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
          ))}
        </select>
      </div>

      {selectedStudent && (
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2>{selectedStudent.name}</h2>
          <p>
            {selectedStudent.email} &middot;{' '}
            <span className={`status ${selectedStudent.status}`}>{selectedStudent.status}</span>
          </p>
          {reviews.length > 0 && (
            <p style={{ color: 'var(--text)', marginTop: '8px' }}>
              {reviews.length} session(s) completed
            </p>
          )}
        </div>
      )}

      {reviewsLoading ? (
        <>
          {[1, 2].map(i => <div key={i} className="skeleton card" />)}
        </>
      ) : selectedId && reviews.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--text)' }}>No sessions reviewed yet.</p>
      ) : selectedId && reviews.length > 0 ? (
        <>
          {/* Single AI Summary button for ALL sessions */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <button
              className="ai-btn"
              onClick={handleSummarizeAll}
              disabled={summarizing}
              style={{ padding: '12px 24px', fontSize: '16px' }}
            >
              {summarizing ? 'Analyzing all sessions...' : `AI Summary of All ${reviews.length} Sessions`}
            </button>
          </div>

          {aiSummary && (
            <div className="ai-summary" style={{ marginBottom: '24px', whiteSpace: 'pre-wrap' }}>
              <h4>Overall Progress Summary — {aiSummary.totalSessions} Sessions</h4>
              <div dangerouslySetInnerHTML={{
                __html: aiSummary.summary
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\n/g, '<br/>')
              }} />
            </div>
          )}

          {/* Chronological session reviews */}
          <h3 style={{ textAlign: 'center' }}>Session History</h3>
          {reviews.map(review => (
            <div className="review-card" key={review.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="mentor">
                  Session #{review.sessionNumber} &mdash; {review.mentorName}
                </span>
                <span className="date">{new Date(review.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="rating">
                {[1, 2, 3, 4, 5].map(star => (
                  <span key={star} style={{ color: star <= review.rating ? '#f59e0b' : '#d1d5db' }}>★</span>
                ))}
              </div>
              <p className="comment">{review.comment}</p>
            </div>
          ))}
        </>
      ) : null}
    </div>
  );
}

export default StudentView;
