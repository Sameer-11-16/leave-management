import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import API from '../api';
import { useAuth } from '../context/AuthContext';

const DEPARTMENTS = ['Engineering', 'HR', 'Finance', 'Marketing', 'Operations', 'Design', 'Sales', 'Legal', 'General'];

const EyeIcon = ({ open }) => open ? (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
) : (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'employee', department: 'Engineering' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const getStrength = (p) => {
    if (!p) return null;
    if (p.length < 6) return { label: 'Too short', color: '#ef4444', width: '20%' };
    if (p.length < 8) return { label: 'Weak', color: '#f59e0b', width: '40%' };
    if (/[A-Z]/.test(p) && /[0-9]/.test(p)) return { label: 'Strong', color: '#10b981', width: '100%' };
    return { label: 'Good', color: '#3b82f6', width: '70%' };
  };
  const strength = getStrength(form.password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    if (form.password.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        department: form.department
      };
      const { data } = await API.post('/auth/register', payload);
      login(data);
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const iconField = (icon, children) => (
    <div style={{ position: 'relative' }}>
      <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>{icon}</span>
      {children}
    </div>
  );

  return (
    <div className="auth-page">
      <div className="auth-card animate-fadeInUp">
        <div className="auth-header">
          <div className="auth-logo" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '16px', background: 'var(--primary-light)', color: 'var(--primary)', marginBottom: '20px' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
          </div>
          <h1 className="auth-title">Create account</h1>
          <p className="auth-sub">Join your team on LeaveMS</p>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          <div className="form-group" style={{ marginBottom: '0px' }}>
            <label className="form-label" htmlFor="reg-name">Full name</label>
            {iconField(
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
              <input id="reg-name" className="form-input" placeholder="John Smith" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })} required
                style={{ paddingLeft: '44px' }} />
            )}
          </div>

          <div className="form-group" style={{ marginBottom: '0px' }}>
            <label className="form-label" htmlFor="reg-email">Email address</label>
            {iconField(
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>,
              <input id="reg-email" className="form-input" type="email" placeholder="you@company.com" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} required
                style={{ paddingLeft: '44px' }} />
            )}
          </div>

          <div className="form-row" style={{ display: 'flex', gap: '12px' }}>
            <div className="form-group" style={{ flex: 1, marginBottom: '0px' }}>
              <label className="form-label" htmlFor="reg-dept">Department</label>
              {iconField(
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>,
                <select id="reg-dept" className="form-select" value={form.department}
                  onChange={e => setForm({ ...form, department: e.target.value })}
                  style={{ paddingLeft: '44px', width: '100%' }}>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              )}
            </div>
            <div className="form-group" style={{ flex: 1, marginBottom: '0px' }}>
              <label className="form-label" htmlFor="reg-role">Role</label>
              {iconField(
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
                <select id="reg-role" className="form-select" value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value })}
                  style={{ paddingLeft: '44px', width: '100%' }}>
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                </select>
              )}
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '0px' }}>
            <label className="form-label" htmlFor="reg-password">Password</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              </span>
              <input id="reg-password" className="form-input" type={showPass ? 'text' : 'password'} placeholder="Min 6 characters"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required
                style={{ paddingLeft: '44px', paddingRight: '44px', width: '100%', boxSizing: 'border-box' }} />
              <button type="button" onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', display: 'flex', alignItems: 'center' }}
                aria-label={showPass ? 'Hide password' : 'Show password'}>
                <EyeIcon open={showPass} />
              </button>
            </div>
            {/* Strength bar */}
            {strength && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ height: '4px', background: 'var(--bg3)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: strength.width, background: strength.color, borderRadius: '4px', transition: 'all 0.4s ease' }} />
                </div>
                <span style={{ fontSize: '11px', color: strength.color, fontWeight: '600', marginTop: '4px', display: 'block' }}>{strength.label}</span>
              </div>
            )}
          </div>

          <div className="form-group" style={{ marginBottom: '8px' }}>
            <label className="form-label" htmlFor="reg-confirm">Confirm password</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              </span>
              <input id="reg-confirm" className="form-input" type={showConfirm ? 'text' : 'password'} placeholder="Re-enter password"
                value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} required
                style={{
                  paddingLeft: '44px', paddingRight: '44px', width: '100%', boxSizing: 'border-box',
                  borderColor: form.confirmPassword && (form.password !== form.confirmPassword ? '#ef4444' : '#10b981')
                }} />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', display: 'flex', alignItems: 'center' }}
                aria-label={showConfirm ? 'Hide' : 'Show'}>
                <EyeIcon open={showConfirm} />
              </button>
            </div>
            {form.confirmPassword && form.password !== form.confirmPassword && (
              <span style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px', display: 'block' }}>Passwords don't match</span>
            )}
          </div>

          <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading} style={{ position: 'relative', marginTop: '8px' }}>
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <svg style={{ animation: 'spin 1s linear infinite' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="2" x2="12" y2="6" /><line x1="12" y1="18" x2="12" y2="22" />
                  <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" /><line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
                  <line x1="2" y1="12" x2="6" y2="12" /><line x1="18" y1="12" x2="22" y2="12" />
                  <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" /><line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
                </svg>
                Creating account...
              </span>
            ) : 'Create account'}
          </button>
        </form>
        <p className="auth-footer" style={{ marginTop: '24px' }}>Have an account? <Link to="/login" style={{ fontWeight: '600' }}>Sign in</Link></p>
      </div>
    </div>
  );
}