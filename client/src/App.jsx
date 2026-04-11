import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import MentorshipProgram from './pages/MentorshipProgram';
import Dashboard from './pages/Dashboard';
import ResetPassword from './pages/ResetPassword';
import './App.css';

function App() {
  return (
    <Router>
      <nav className="navbar">
        <Link to="/" className="nav-logo">Sarthi Mentorship</Link>
        <div className="nav-links">
          <Link to="/mentorship-program">Program</Link>
          <Link to="/dashboard">Dashboard</Link>
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<MentorshipProgram />} />
        <Route path="/mentorship-program" element={<MentorshipProgram />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    </Router>
  );
}

export default App;
