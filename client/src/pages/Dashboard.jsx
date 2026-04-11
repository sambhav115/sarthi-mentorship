import { useState } from 'react';
import MentorView from '../components/MentorView';
import StudentView from '../components/StudentView';

function Dashboard() {
  const [role, setRole] = useState('mentor');

  return (
    <div className="dashboard">
      <h1 style={{ textAlign: 'center', marginBottom: '8px' }}>Dashboard</h1>
      <p style={{ textAlign: 'center', marginBottom: '24px' }}>
        Select your role to get started
      </p>

      <div className="role-selector">
        <button
          className={`role-btn ${role === 'mentor' ? 'active' : ''}`}
          onClick={() => setRole('mentor')}
        >
          Mentor
        </button>
        <button
          className={`role-btn ${role === 'student' ? 'active' : ''}`}
          onClick={() => setRole('student')}
        >
          Student
        </button>
      </div>

      {role === 'mentor' ? <MentorView /> : <StudentView />}
    </div>
  );
}

export default Dashboard;
