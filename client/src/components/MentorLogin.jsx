import { useState } from 'react';
import { login, forgotPassword } from '../services/api';

function MentorLogin({ onLogin }) {
  const [mode, setMode] = useState('login'); // 'login' or 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await login(email, password);
      localStorage.setItem('mentor_token', res.data.token);
      onLogin(res.data.mentor);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Login failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await forgotPassword(email);
      setMessage({ type: 'success', text: res.data.message });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Something went wrong' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '40px auto' }}>
      <div className="review-form-container">
        {mode === 'login' ? (
          <>
            <h2 style={{ marginTop: 0, textAlign: 'center' }}>Mentor Login</h2>
            <form className="review-form" onSubmit={handleLogin}>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                />
              </div>

              {message && (
                <div className={`form-message ${message.type}`}>{message.text}</div>
              )}

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
            <p style={{ textAlign: 'center', marginTop: '16px' }}>
              <button
                onClick={() => { setMode('forgot'); setMessage(null); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  textDecoration: 'underline',
                }}
              >
                Forgot Password?
              </button>
            </p>
            <p style={{ textAlign: 'center', color: 'var(--text)', fontSize: '13px', marginTop: '12px' }}>
              Default password: <code>12345</code>
            </p>
          </>
        ) : (
          <>
            <h2 style={{ marginTop: 0, textAlign: 'center' }}>Reset Password</h2>
            <p style={{ textAlign: 'center', color: 'var(--text)', fontSize: '14px' }}>
              Enter your mentor email and we'll send a reset link.
            </p>
            <form className="review-form" onSubmit={handleForgot}>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                />
              </div>

              {message && (
                <div className={`form-message ${message.type}`}>{message.text}</div>
              )}

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
            <p style={{ textAlign: 'center', marginTop: '16px' }}>
              <button
                onClick={() => { setMode('login'); setMessage(null); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  textDecoration: 'underline',
                }}
              >
                Back to Login
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default MentorLogin;
