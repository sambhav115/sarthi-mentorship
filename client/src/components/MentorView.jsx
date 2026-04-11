import { useState, useEffect } from 'react';
import { getStudents, getMentors, getReviews, submitReview, summarizeAll } from '../services/api';

function MentorView() {
  const [mentors, setMentors] = useState([]);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [pastReviews, setPastReviews] = useState([]);
  const [pastLoading, setPastLoading] = useState(false);

  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState(null);

  const [aiSummary, setAiSummary] = useState(null);
  const [summarizing, setSummarizing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentsRes, mentorsRes] = await Promise.all([getStudents(), getMentors()]);
        setStudents(studentsRes.data.students);
        setMentors(mentorsRes.data.mentors);
      } catch {
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
        mentorId: selectedMentor.id,
        ...reviewForm,
      });
      setSubmitMsg({ type: 'success', text: res.data.message });
      setReviewForm({ rating: 0, comment: '' });
      // Refresh past reviews
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

  // Step 1: Select mentor
  if (!selectedMentor) {
    return (
      <div>
        <h2 style={{ textAlign: 'center' }}>Select Your Profile</h2>
        <div className="students-grid" style={{ maxWidth: '500px', margin: '0 auto' }}>
          {mentors.map(mentor => (
            <div
              className="student-card"
              key={mentor.id}
              style={{ cursor: 'pointer' }}
              onClick={() => setSelectedMentor(mentor)}
            >
              <h3>{mentor.name}</h3>
              <p className="email">{mentor.email}</p>
              <span className="status active">Mentor</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Step 2: Show students + review flow
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0 }}>Logged in as: {selectedMentor.name}</h2>
        <button className="role-btn" onClick={() => { setSelectedMentor(null); setSelectedStudent(null); }}>
          Switch Mentor
        </button>
      </div>

      <h3>Students</h3>
      <div className="students-grid">
        {students.map(student => (
          <div
            className="student-card"
            key={student.id}
            style={{
              cursor: 'pointer',
              borderColor: selectedStudent?.id === student.id ? 'var(--accent)' : undefined,
            }}
            onClick={() => selectStudent(student)}
          >
            <h3>{student.name}</h3>
            <p className="email">{student.email}</p>
            <span className={`status ${student.status}`}>{student.status}</span>
          </div>
        ))}
      </div>

      {selectedStudent && (
        <div style={{ marginTop: '32px' }}>
          {/* Past Reviews */}
          <h3>Session History for {selectedStudent.name}</h3>

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

          {/* New Review Form */}
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
      )}
    </div>
  );
}

export default MentorView;
