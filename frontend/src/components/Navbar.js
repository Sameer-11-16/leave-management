import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <nav style={styles.nav}>
      <Link to="/dashboard" style={styles.brand}>🗓️ LeaveMS</Link>
      <div style={styles.links}>
        <Link to="/dashboard" style={styles.link}>Dashboard</Link>
        {user?.role === 'employee' && (
          <>
            <Link to="/apply" style={styles.link}>Apply Leave</Link>
            <Link to="/my-leaves" style={styles.link}>My Leaves</Link>
          </>
        )}
        {user?.role === 'admin' && (
          <Link to="/admin" style={styles.link}>Admin Panel</Link>
        )}
        <span style={styles.username}>👤 {user?.name}</span>
        <button onClick={handleLogout} style={styles.btn}>Logout</button>
      </div>
    </nav>
  );
}

const styles = {
  nav: { background: '#1e40af', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  brand: { color: '#fff', fontSize: '20px', fontWeight: 'bold', textDecoration: 'none' },
  links: { display: 'flex', alignItems: 'center', gap: '20px' },
  link: { color: '#bfdbfe', textDecoration: 'none', fontSize: '14px' },
  username: { color: '#e0f2fe', fontSize: '14px' },
  btn: { background: '#ef4444', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }
};