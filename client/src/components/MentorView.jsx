import { useState, useEffect } from 'react';
import { getStudents, getReviews, submitReview, summarizeAll, getMe } from '../services/api';
import MentorLogin from './MentorLogin';

function MentorView() {
  const [mentor, setMentor] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [pastReviews, setPastReviews] = useState([]);
  const [pastLoading, setPastLoading] = useState(false);

  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState(null);

  const [aiSummary, setAiSummary] = useState(null);
  const [summarizing, setSummarizing] = useState(false);

  // Check if already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('mentor_token');
      if (token) {
        try {
          const res = await getMe();
          setMentor(res.data.mentor);
        } catch {
          localStorage.removeItem('mentor_token');
        }
      }
      setAuthChecked(true);
    };
    checkAuth();
  }, []);

  // Fetch students once logged in
  useEffect(() => {
    if (!mentor) return;
    const fetchStudents = async () => {
      setLoading(true);
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
  }, [mentor]);

  const handleLogout = () => {
    localStorage.removeItem('mentor_token');
    setMentor(null);
    setSelectedStudent(null);
  };

  const selectStudent = async (student) => {
    setSelectedStudent(student);
    setSubmitMsg(null);
    setAiSummary(null);
    setReviewForm({ rating: 0, comment: '' });
    setPastLoading(true);
    try {
      const res = await getReviews(student.id);
      setPastReviews(res.data.reviews);
    } catch {
      setPastReviews([]);
    } finally {
      setPastLoading(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (reviewForm.rating === 0) {
      setSubmitMsg({ type: 'error', text: 'Please select a rating.' });
      return;
    }
    setSubmitting(true);
    setSubmitMsg(null);
    try {
      const res = await submitReview({
        studentId: selectedStudent.id,
        mentorId: mentor.id,
        ...reviewForm,
      });
      setSubmitMsg({ type: 'success', text: res.data.message });
      setReviewForm({ rating: 0, comment: '' });
      const reviewsRes = await getReviews(selectedStudent.id);
      setPastReviews(reviewsRes.data.reviews);
    } catch (err) {
      setSubmitMsg({ type: 'error', text: err.response?.data?.error || 'Failed to submit review.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSummarizeAll = async () => {
    setSummarizing(true);
    setAiSummary(null);
    try {
      const res = await summarizeAll(selectedStudent.id);
      setAiSummary(res.data);
    } catch {
      setAiSummary({ summary: 'Failed to generate summary. Try again.', totalSessions: 0 });
    } finally {
      setSummarizing(false);
    }
  };

  // Wait for auth check
  if (!authChecked) {
    return <div className="skeleton card" style={{ maxWidth: '400px', margin: '40px auto' }} />;
  }

  // Not logged in — show login form
  if (!mentor) {
    return <MentorLogin onLogin={setMentor} />;
  }

  if (loading) {
    return (
      <div className="students-grid">
        {[1, 2, 3].map(i => <div key={i} className="skeleton card" />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <p>{error}</p>
        <button className="retry-btn" onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  // Student detail view (reviews + new review form)
  if (selectedStudent) {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <button className="role-btn" onClick={() => { setSelectedStudent(null); setAiSummary(null); }}>
            &larr; Back to Students
          </button>
          <button className="role-btn" onClick={handleLogout}>Logout</button>
        </div>

        <h2 style={{ textAlign: 'center', marginBottom: '4px' }}>{selectedStudent.name}</h2>
        <p style={{ textAlign: 'center', color: 'var(--text)', marginBottom: '24px' }}>
          {selectedStudent.email} &middot; <span className={`status ${selectedStudent.status}`}>{selectedStudent.status}</span>
        </p>

        <h3>Session History</h3>

          {pastLoading ? (
            <div className="skeleton card" />
          ) : pastReviews.length === 0 ? (
            <p style={{ color: 'var(--text)' }}>No past sessions. This will be Session #1.</p>
          ) : (
            <>
              <p style={{ color: 'var(--text)', marginBottom: '12px' }}>
                {pastReviews.length} session(s) recorded
              </p>

              {pastReviews.length >= 2 && (
                <button
                  className="ai-btn"
                  onClick={handleSummarizeAll}
                  disabled={summarizing}
                  style={{ marginBottom: '16px' }}
                >
                  {summarizing ? 'Generating Summary...' : `AI Summary of All ${pastReviews.length} Sessions`}
                </button>
              )}

              {aiSummary && (
                <div className="ai-summary" style={{ marginBottom: '20px', whiteSpace: 'pre-wrap' }}>
                  <h4>AI Overview — {aiSummary.totalSessions} Sessions</h4>
                  <div dangerouslySetInnerHTML={{
                    __html: aiSummary.summary
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\n/g, '<br/>')
                  }} />
                </div>
              )}

              {pastReviews.map(review => (
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

          <div className="review-form-container" style={{ marginTop: '24px' }}>
            <h3>New Session Review — Session #{pastReviews.length + 1}</h3>
            <form className="review-form" onSubmit={handleReviewSubmit}>
              <div className="form-group">
                <label>Rating</label>
                <div className="rating-input">
                  {[1, 2, 3, 4, 5].map(star => (
                    <span
                      key={star}
                      onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                      style={{ opacity: star <= reviewForm.rating ? 1 : 0.3 }}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Session Review</label>
                <textarea
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  placeholder="Write about what was covered in this session, student's progress, strengths, and areas for improvement..."
                  required
                />
              </div>

              {submitMsg && (
                <div className={`form-message ${submitMsg.type}`}>{submitMsg.text}</div>
              )}

              <button type="submit" className="submit-btn" disabled={submitting}>
                {submitting ? 'Submitting...' : `Submit Session #${pastReviews.length + 1} Review`}
              </button>
            </form>
          </div>
      </div>
    );
  }

  // Student list view
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0 }}>Welcome, {mentor.name}</h2>
        <button className="role-btn" onClick={handleLogout}>Logout</button>
      </div>

      <h3>Students</h3>
      <input
        type="text"
        placeholder="Search students by name or email..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{
          width: '100%', padding: '10px 14px', border: '1px solid var(--border)',
          borderRadius: '8px', fontSize: '16px', background: 'var(--bg)', color: 'var(--text-h)',
          marginBottom: '16px', outline: 'none', boxSizing: 'border-box',
        }}
      />
      <div className="students-grid">
        {students.filter(s =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.email.toLowerCase().includes(searchQuery.toLowerCase())
        ).map(student => (
          <div
            className="student-card"
            key={student.id}
            style={{ cursor: 'pointer' }}
            onClick={() => selectStudent(student)}
          >
            <h3>{student.name}</h3>
            <p className="email">{student.email}</p>
            <span className={`status ${student.status}`}>{student.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MentorView;
