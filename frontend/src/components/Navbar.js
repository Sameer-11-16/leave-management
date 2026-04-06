import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const links = user?.role === 'admin'
    ? [{ to: '/dashboard', label: 'Dashboard' }, { to: '/admin', label: 'Admin Panel' }]
    : [{ to: '/dashboard', label: 'Dashboard' }, { to: '/apply', label: 'Apply Leave' }, { to: '/my-leaves', label: 'My Leaves' }];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/dashboard" className="navbar-brand">
          📅 LeaveMS
        </Link>
        <div className="navbar-links">
          {links.map(l => (
            <Link key={l.to} to={l.to} className={`nav-link ${isActive(l.to) ? 'active' : ''}`}>
              {l.label}
            </Link>
          ))}
        </div>
        <div className="navbar-right">
          <div className="nav-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
          <span className="nav-username">{user?.name}</span>
          <button onClick={handleLogout} className="btn btn-danger" style={{padding:'6px 14px',fontSize:'13px'}}>Logout</button>
          <button className="hamburger-btn" onClick={() => setOpen(!open)}>☰</button>
        </div>
      </div>
      {open && (
        <div className="mobile-menu">
          {links.map(l => (
            <Link key={l.to} to={l.to} className="mobile-nav-link" onClick={() => setOpen(false)}>{l.label}</Link>
          ))}
          <button onClick={() => { handleLogout(); setOpen(false); }} className="btn btn-danger btn-full" style={{marginTop:'8px'}}>Logout</button>
        </div>
      )}
    </nav>
  );
}