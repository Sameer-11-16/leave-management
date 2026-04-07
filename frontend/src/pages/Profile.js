import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import API from '../api';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, login } = useAuth();
  const [profile, setProfile] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('profile');
  const [form, setForm] = useState({ name: '', department: '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: p } = await API.get('/users/me');
        setProfile(p);
        setForm({ name: p.name, department: p.department });
        const { data: l } = await API.get('/leaves/my');
        setLeaves(Array.isArray(l) ? l : []);
      } catch (e) { toast.error('Failed to load profile'); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('Name is required');
    setSaving(true);
    try {
      const { data } = await API.put('/users/me', form);
      setProfile(data);
      login({ token: localStorage.getItem('token'), user: { ...user, name: data.name, department: data.department } });
      toast.success('Profile updated!');
      setEditMode(false);
    } catch (e) { toast.error(e.response?.data?.msg || 'Failed to update'); }
    finally { setSaving(false); }
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) return toast.error('Passwords do not match');
    if (pwForm.newPassword.length < 6) return toast.error('Minimum 6 characters');
    setPwLoading(true);
    try {
      await API.put('/users/change-password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed!');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (e) { toast.error(e.response?.data?.msg || 'Failed to change password'); }
    finally { setPwLoading(false); }
  };

  const stats = {
    total: leaves.length,
    approved: leaves.filter(l => l.status === 'approved').length,
    pending: leaves.filter(l => l.status === 'pending').length,
    rejected: leaves.filter(l => l.status === 'rejected').length,
  };

  const balance = profile?.leaveBalance;
  const typeIcon = t => ({ casual: '🏖️', medical: '💊', special: '⭐' }[t] || '📋');
  const typeLabel = t => ({ casual: 'Casual', medical: 'Medical', special: 'Special' }[t] || t);
  const typeColor = t => ({ casual: '#7c3aed', medical: '#db2777', special: '#0284c7' }[t] || '#64748b');

  const statusStyle = s => ({
    padding: '3px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: '0.04em',
    ...(s === 'approved' ? { background: 'var(--success-light)', color: 'var(--success)' }
      : s === 'pending' ? { background: 'var(--warning-light)', color: 'var(--warning)' }
      : { background: 'var(--danger-light)', color: 'var(--danger)' })
  });

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTop: '3px solid var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: 'var(--text3)', marginTop: '16px' }}>Loading profile...</p>
    </div>
  );

  return (
    <div className="page" style={{ maxWidth: '760px' }}>

      {/* Profile Hero */}
      <div className="profile-hero anim-fadeInUp" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: '3px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: '700', color: '#fff', flexShrink: 0, backdropFilter: 'blur(8px)' }}>
            {profile?.name?.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: '140px' }}>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '22px', color: '#fff', margin: '0 0 4px' }}>{profile?.name}</h1>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '13px', margin: '0 0 10px' }}>{profile?.email}</p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ padding: '3px 12px', borderRadius: '99px', fontSize: '12px', fontWeight: '600', background: 'rgba(255,255,255,0.2)', color: '#fff', backdropFilter: 'blur(4px)' }}>
                {profile?.department}
              </span>
              <span style={{ padding: '3px 12px', borderRadius: '99px', fontSize: '12px', fontWeight: '600', background: 'rgba(255,255,255,0.2)', color: '#fff', backdropFilter: 'blur(4px)' }}>
                {user?.role === 'admin' ? '👑 Admin' : '👤 Employee'}
              </span>
            </div>
          </div>
          <button onClick={() => setEditMode(!editMode)}
            style={{ padding: '8px 18px', background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.4)', borderRadius: '10px', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: '600', backdropFilter: 'blur(4px)', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
            {editMode ? 'Cancel' : '✏️ Edit'}
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Total', value: stats.total, color: 'var(--primary)' },
          { label: 'Approved', value: stats.approved, color: 'var(--success)' },
          { label: 'Pending', value: stats.pending, color: 'var(--warning)' },
          { label: 'Rejected', value: stats.rejected, color: 'var(--danger)' },
        ].map((s, i) => (
          <div key={s.label} className={`stat-card delay-${i + 1}`} style={{ textAlign: 'center', padding: '16px' }}>
            <div style={{ fontSize: '28px', fontWeight: '700', color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '3px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tabs">
        {[
          { key: 'profile', label: '👤 Profile' },
          { key: 'balance', label: '📊 Balance' },
          { key: 'history', label: '📋 History' },
          { key: 'password', label: '🔒 Password' },
        ].map(t => (
          <button key={t.key} className={`tab-btn ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {tab === 'profile' && (
        <div className="card anim-scaleIn">
          <div className="card-header">
            <span style={{ fontWeight: '700', color: 'var(--text)', fontSize: '15px' }}>Personal Information</span>
          </div>
          <div className="card-body">
            {editMode ? (
              <div>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Your full name" />
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <input className="form-input" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} placeholder="Your department" />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input className="form-input" value={profile?.email} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
                  <p style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '4px' }}>Email cannot be changed</p>
                </div>
                <button onClick={handleSave} disabled={saving} className="btn btn-primary btn-full btn-lg">
                  {saving ? 'Saving...' : '✓ Save Changes'}
                </button>
              </div>
            ) : (
              <div>
                {[
                  { label: 'Full Name', value: profile?.name },
                  { label: 'Email', value: profile?.email },
                  { label: 'Department', value: profile?.department },
                  { label: 'Role', value: user?.role === 'admin' ? 'Administrator' : 'Employee' },
                  { label: 'Member Since', value: profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A' },
                ].map((row, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: i < 4 ? '1px solid var(--border2)' : 'none' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text3)', fontWeight: '500' }}>{row.label}</span>
                    <span style={{ fontSize: '14px', color: 'var(--text)', fontWeight: '600' }}>{row.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Balance Tab */}
      {tab === 'balance' && balance && (
        <div className="card anim-scaleIn">
          <div className="card-header">
            <span style={{ fontWeight: '700', color: 'var(--text)', fontSize: '15px' }}>Leave Balance</span>
          </div>
          <div className="card-body">
            {[
              { key: 'casual', label: 'Casual Leave', total: 10, icon: '🏖️', color: '#7c3aed' },
              { key: 'medical', label: 'Medical Leave', total: 10, icon: '💊', color: '#db2777' },
              { key: 'special', label: 'Special Leave', total: null, icon: '⭐', color: '#0284c7', unlimited: true },
            ].map((item, i) => {
              const val = balance[item.key];
              const pct = item.unlimited ? 100 : (item.total > 0 ? Math.round((val / item.total) * 100) : 0);
              return (
                <div key={item.key} style={{ marginBottom: i < 2 ? '24px' : '0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '22px' }}>{item.icon}</span>
                      <span style={{ fontWeight: '600', color: 'var(--text)', fontSize: '14px' }}>{item.label}</span>
                    </div>
                    <div>
                      {item.unlimited ? (
                        <span style={{ fontSize: '18px', fontWeight: '700', color: item.color }}>Unlimited</span>
                      ) : (
                        <span>
                          <span style={{ fontSize: '24px', fontWeight: '700', color: item.color }}>{val}</span>
                          <span style={{ fontSize: '13px', color: 'var(--text3)' }}> / {item.total} days</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="stat-bar">
                    <div className="stat-fill" style={{ width: `${pct}%`, background: item.color }} />
                  </div>
                  {!item.unlimited && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text3)' }}>{item.total - val} used</span>
                      <span style={{ fontSize: '11px', color: item.color, fontWeight: '600' }}>{pct}% remaining</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* History Tab */}
      {tab === 'history' && (
        <div className="card anim-scaleIn">
          <div className="card-header">
            <span style={{ fontWeight: '700', color: 'var(--text)', fontSize: '15px' }}>Leave History</span>
            <span style={{ fontSize: '12px', color: 'var(--text3)', background: 'var(--bg3)', padding: '3px 10px', borderRadius: '99px' }}>{leaves.length} requests</span>
          </div>
          <div>
            {leaves.length === 0 ? (
              <div className="empty"><span className="empty-icon">📭</span><p>No leave history yet</p></div>
            ) : leaves.map((leave, i) => (
              <div key={leave._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', borderBottom: i < leaves.length - 1 ? '1px solid var(--border2)' : 'none', gap: '10px', flexWrap: 'wrap', transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: typeColor(leave.leaveType) + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
                    {typeIcon(leave.leaveType)}
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', color: 'var(--text)', fontSize: '14px' }}>{typeLabel(leave.leaveType)} Leave</div>
                    <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px' }}>
                      {new Date(leave.startDate).toLocaleDateString()} → {new Date(leave.endDate).toLocaleDateString()} · {leave.days} day{leave.days !== 1 ? 's' : ''}
                    </div>
                    {leave.adminComment && <div style={{ fontSize: '12px', color: 'var(--success)', marginTop: '3px' }}>💬 {leave.adminComment}</div>}
                  </div>
                </div>
                <span style={statusStyle(leave.status)}>{leave.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Password Tab */}
      {tab === 'password' && (
        <div className="card anim-scaleIn">
          <div className="card-header">
            <span style={{ fontWeight: '700', color: 'var(--text)', fontSize: '15px' }}>Change Password</span>
          </div>
          <div className="card-body">
            <form onSubmit={handlePassword}>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input className="form-input" type="password" placeholder="••••••••"
                  value={pwForm.currentPassword} onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input className="form-input" type="password" placeholder="••••••••"
                  value={pwForm.newPassword} onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input className="form-input" type="password" placeholder="••••••••"
                  value={pwForm.confirmPassword} onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })} required />
              </div>
              {pwForm.newPassword && pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword && (
                <p style={{ color: 'var(--danger)', fontSize: '13px', marginBottom: '12px' }}>⚠️ Passwords do not match</p>
              )}
              <button type="submit" disabled={pwLoading} className="btn btn-primary btn-full btn-lg">
                {pwLoading ? 'Changing...' : '🔒 Change Password'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}