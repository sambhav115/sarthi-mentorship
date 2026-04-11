import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { resetPassword } from '../services/api';

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  if (!token) {
    return (
      <div style={{ maxWidth: '400px', margin: '80px auto', textAlign: 'center' }}>
        <h2>Invalid Reset Link</h2>
        <p style={{ color: 'var(--text)' }}>No reset token found. Please request a new password reset.</p>
        <Link to="/dashboard" className="hero-cta" style={{ display: 'inline-block', marginTop: '16px' }}>
          Go to Dashboard
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    if (newPassword.length < 5) {
      setMessage({ type: 'error', text: 'Password must be at least 5 characters.' });
      return;
    }

    setLoading(true);
    try {
      const res = await resetPassword(token, newPassword);
      setMessage({ type: 'success', text: res.data.message });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Reset failed. Link may be expired.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '80px auto' }}>
      <div className="review-form-container">
        <h2 style={{ marginTop: 0, textAlign: 'center' }}>Set New Password</h2>

        {message?.type === 'success' ? (
          <div>
            <div className="form-message success">{message.text}</div>
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <Link to="/dashboard" className="hero-cta" style={{ display: 'inline-block' }}>
                Go to Login
              </Link>
            </div>
          </div>
        ) : (
          <form className="review-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                required
                minLength={5}
              />
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                minLength={5}
              />
            </div>

            {message && (
              <div className={`form-message ${message.type}`}>{message.text}</div>
            )}

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default ResetPassword;
