import { useState } from 'react';
import { login } from '../services/api';

function MentorLogin({ onLogin }) {
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

  return (
    <div style={{ maxWidth: '400px', margin: '40px auto' }}>
      <div className="review-form-container">
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
        <p style={{ textAlign: 'center', color: 'var(--text)', fontSize: '13px', marginTop: '12px' }}>
          Default password: <code>12345</code>
        </p>
      </div>
    </div>
  );
}

export default MentorLogin;
