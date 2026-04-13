import { useState, useEffect } from 'react';
import { getReviews, summarizeAll, getStudentMe } from '../services/api';
import StudentLogin from './StudentLogin';

function StudentView() {
  const [student, setStudent] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const [aiSummary, setAiSummary] = useState(null);
  const [summarizing, setSummarizing] = useState(false);

  // Check if already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('student_token');
      if (token) {
        try {
          const res = await getStudentMe();
          setStudent(res.data.student);
        } catch {
          localStorage.removeItem('student_token');
        }
      }
      setAuthChecked(true);
    };
    checkAuth();
  }, []);

  // Fetch reviews once logged in
  useEffect(() => {
    if (!student) return;
    const fetchReviews = async () => {
      setReviewsLoading(true);
      try {
        const res = await getReviews(student.id);
        setReviews(res.data.reviews);
      } catch {
        setReviews([]);
      } finally {
        setReviewsLoading(false);
      }
    };
    fetchReviews();
  }, [student]);

  const handleLogout = () => {
    localStorage.removeItem('student_token');
    setStudent(null);
    setReviews([]);
    setAiSummary(null);
  };

  const handleSummarizeAll = async () => {
    setSummarizing(true);
    setAiSummary(null);
    try {
      const res = await summarizeAll(student.id);
      setAiSummary(res.data);
    } catch {
      setAiSummary({ summary: 'Failed to generate summary. Try again.', totalSessions: 0 });
    } finally {
      setSummarizing(false);
    }
  };

  if (!authChecked) {
    return <div className="skeleton card" style={{ maxWidth: '400px', margin: '40px auto' }} />;
  }

  if (!student) {
    return <StudentLogin onLogin={setStudent} />;
  }

  return (
    <div className="progress-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0 }}>Welcome, {student.name}</h2>
        <button className="role-btn" onClick={handleLogout}>Logout</button>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <p>{student.email}</p>
        {reviews.length > 0 && (
          <p style={{ color: 'var(--text)', marginTop: '8px' }}>
            {reviews.length} session(s) completed
          </p>
        )}
      </div>

      {reviewsLoading ? (
        <>
          {[1, 2].map(i => <div key={i} className="skeleton card" />)}
        </>
      ) : reviews.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--text)' }}>No sessions reviewed yet.</p>
      ) : (
        <>
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
      )}
    </div>
  );
}

export default StudentView;
