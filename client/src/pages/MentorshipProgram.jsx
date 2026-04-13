import { useState } from 'react';
import { submitLead } from '../services/api';

const features = [
  { icon: '🎯', title: 'Personalized Mentoring', desc: 'Get matched with industry experts who guide your career path with tailored advice.' },
  { icon: '📊', title: 'Progress Tracking', desc: 'Track your growth with detailed reviews and actionable feedback from mentors.' },
  { icon: '🤖', title: 'AI-Powered Insights', desc: 'Get AI-generated summaries of your reviews to focus on what matters most.' },
];

function MentorshipProgram() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', targetYear: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await submitLead(form);
      setMessage({ type: 'success', text: 'Registration successful! We will contact you soon.' });
      setForm({ name: '', email: '', phone: '', targetYear: '' });
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Something went wrong. Please try again.';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="hero-section">
        <h1>Transform Your Career with Expert Mentorship</h1>
        <p>
          Join our mentorship program to get personalized guidance, track your
          progress, and accelerate your growth with AI-powered insights.
        </p>
        <a href="#signup" className="hero-cta">Get Started</a>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2>Why Join Our Program?</h2>
        <div className="features-grid">
          {features.map((f, i) => (
            <div className="feature-card" key={i}>
              <div className="icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Signup Form */}
      <section className="form-section" id="signup">
        <h2>Register for the Mentorship Program</h2>
        <form className="signup-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="10-digit phone number"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="targetYear">Target Year</label>
            <select
              id="targetYear"
              name="targetYear"
              value={form.targetYear}
              onChange={handleChange}
              required
            >
              <option value="">Select target year</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
              <option value="2028">2028</option>
            </select>
          </div>

          {message && (
            <div className={`form-message ${message.type}`}>
              {message.text}
            </div>
          )}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Submitting...' : 'Register Now'}
          </button>
        </form>
      </section>

      <footer className="footer">
        Sarrthi Mentorship Program &copy; 2026
      </footer>
    </div>
  );
}

export default MentorshipProgram;
