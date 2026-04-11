import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import MentorshipProgram from './pages/MentorshipProgram';
import Dashboard from './pages/Dashboard';
import ResetPassword from './pages/ResetPassword';
import Rankings from './pages/Rankings';
import TopperPredictor from './pages/TopperPredictor';
import './App.css';

function App() {
  return (
    <Router>
      <nav className="navbar">
        <Link to="/" className="nav-logo">Sarthi Mentorship</Link>
        <div className="nav-links">
          <Link to="/mentorship-program">Program</Link>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/rankings">Rankings</Link>
          <Link to="/topper-predictor">Predictor</Link>
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<MentorshipProgram />} />
        <Route path="/mentorship-program" element={<MentorshipProgram />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/rankings" element={<Rankings />} />
        <Route path="/topper-predictor" element={<TopperPredictor />} />
      </Routes>
    </Router>
  );
}

export default App;
