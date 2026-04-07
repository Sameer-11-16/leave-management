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
    const fetchData = async () => {
      try {
        const { data: profileData } = await API.get('/users/me');
        setProfile(profileData);
        setForm({ name: profileData.name, department: profileData.department });
        const { data: leavesData } = await API.get('/leaves/my');
        setLeaves(Array.isArray(leavesData) ? leavesData : []);
      } catch (err) {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) return toast.error('Passwords do not match');
    if (pwForm.newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    setPwLoading(true);
    try {
      await API.put('/users/change-password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed!');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to change password');
    } finally {
      setPwLoading(false);
    }
  };

  const stats = {
    total: leaves.length,
    approved: leaves.filter(l => l.status === 'approved').length,
    pending: leaves.filter(l => l.status === 'pending').length,
    rejected: leaves.filter(l => l.status === 'rejected').length,
  };

  const balance = profile?.leaveBalance;

  if (loading) {
    return (
      <div style={S.loadingPage}>
        <div style={S.spinner} />
        <p style={{ color: '#64748b', marginTop: '16px' }}>Loading profile...</p>
      </div>
    );
  }

  return (
    <div style={S.page}>

      {/* ── Profile Hero ── */}
      <div style={S.hero}>
        <div style={S.avatarWrap}>
          <div style={S.avatar}>{profile?.name?.charAt(0).toUpperCase()}</div>
          <div style={S.avatarBadge}>{user?.role === 'admin' ? '👑' : '👤'}</div>
        </div>
        <div style={S.heroInfo}>
          <h1 style={S.heroName}>{profile?.name}</h1>
          <p style={S.heroSub}>{profile?.email}</p>
          <div style={S.heroBadges}>
            <span style={S.deptBadge}>{profile?.department}</span>
            <span style={{ ...S.deptBadge, background: user?.role === 'admin' ? '#fef3c7' : '#eff6ff', color: user?.role === 'admin' ? '#92400e' : '#1e40af' }}>
              {user?.role === 'admin' ? 'Administrator' : 'Employee'}
            </span>
          </div>
        </div>
        <button onClick={() => setEditMode(!editMode)} style={editMode ? S.cancelBtn : S.editBtn}>
          {editMode ? 'Cancel' : '✏️ Edit Profile'}
        </button>
      </div>

      {/* ── Stats Row ── */}
      <div style={S.statsRow}>
        <MiniStat label="Total Leaves" value={stats.total} color="#2563eb" />
        <MiniStat label="Approved" value={stats.approved} color="#10b981" />
        <MiniStat label="Pending" value={stats.pending} color="#f59e0b" />
        <MiniStat label="Rejected" value={stats.rejected} color="#ef4444" />
      </div>

      {/* ── Tabs ── */}
      <div style={S.tabs}>
        {['profile', 'balance', 'history', 'password'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ ...S.tab, ...(tab === t ? S.tabActive : {}) }}>
            {t === 'profile' ? '👤 Profile' : t === 'balance' ? '📊 Balance' : t === 'history' ? '📋 History' : '🔒 Password'}
          </button>
        ))}
      </div>

      {/* ── Profile Tab ── */}
      {tab === 'profile' && (
        <div style={S.card}>
          <div style={S.cardHeader}>
            <span style={S.cardTitle}>Personal Information</span>
          </div>
          <div style={S.cardBody}>
            {editMode ? (
              <div>
                <div style={S.formGroup}>
                  <label style={S.label}>Full Name</label>
                  <input style={S.input} value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="Your full name" />
                </div>
                <div style={S.formGroup}>
                  <label style={S.label}>Department</label>
                  <input style={S.input} value={form.department}
                    onChange={e => setForm({ ...form, department: e.target.value })}
                    placeholder="Your department" />
                </div>
                <div style={S.formGroup}>
                  <label style={S.label}>Email Address</label>
                  <input style={{ ...S.input, background: '#f8fafc', color: '#94a3b8' }}
                    value={profile?.email} disabled />
                  <p style={S.hint}>Email cannot be changed</p>
                </div>
                <button onClick={handleSave} disabled={saving} style={S.saveBtn}>
                  {saving ? 'Saving...' : '✓ Save Changes'}
                </button>
              </div>
            ) : (
              <div>
                <InfoRow label="Full Name" value={profile?.name} />
                <InfoRow label="Email Address" value={profile?.email} />
                <InfoRow label="Department" value={profile?.department} />
                <InfoRow label="Role" value={user?.role === 'admin' ? 'Administrator' : 'Employee'} />
                <InfoRow label="Member Since" value={profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Balance Tab ── */}
      {tab === 'balance' && balance && (
        <div style={S.card}>
          <div style={S.cardHeader}>
            <span style={S.cardTitle}>Leave Balance</span>
          </div>
          <div style={S.cardBody}>
            <BalanceRow label="Casual Leave" used={10 - balance.casual} total={10} color="#7c3aed" icon="🏖️" />
            <BalanceRow label="Sick Leave" used={7 - balance.sick} total={7} color="#db2777" icon="🤒" />
            <BalanceRow label="Annual Leave" used={15 - balance.annual} total={15} color="#0284c7" icon="✈️" />
          </div>
        </div>
      )}

      {/* ── History Tab ── */}
      {tab === 'history' && (
        <div style={S.card}>
          <div style={S.cardHeader}>
            <span style={S.cardTitle}>Leave History</span>
            <span style={S.count}>{leaves.length} requests</span>
          </div>
          <div style={{ ...S.cardBody, padding: 0 }}>
            {leaves.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                <div style={{ fontSize: '36px', marginBottom: '8px' }}>📭</div>
                <p>No leave history yet</p>
              </div>
            ) : (
              leaves.map((leave, i) => (
                <div key={leave._id} style={{ ...S.historyRow, borderBottom: i < leaves.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: typeColor(leave.leaveType) + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
                      {typeIcon(leave.leaveType)}
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>
                        {leave.leaveType?.charAt(0).toUpperCase() + leave.leaveType?.slice(1)} Leave
                      </div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                        {new Date(leave.startDate).toLocaleDateString()} → {new Date(leave.endDate).toLocaleDateString()} · {leave.days} day{leave.days !== 1 ? 's' : ''}
                      </div>
                      {leave.adminComment && (
                        <div style={{ fontSize: '12px', color: '#10b981', marginTop: '3px' }}>💬 {leave.adminComment}</div>
                      )}
                    </div>
                  </div>
                  <span style={{ ...statusStyle(leave.status), flexShrink: 0 }}>{leave.status}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Password Tab ── */}
      {tab === 'password' && (
        <div style={S.card}>
          <div style={S.cardHeader}>
            <span style={S.cardTitle}>Change Password</span>
          </div>
          <div style={S.cardBody}>
            <form onSubmit={handlePasswordChange}>
              <div style={S.formGroup}>
                <label style={S.label}>Current Password</label>
                <input style={S.input} type="password" placeholder="••••••••"
                  value={pwForm.currentPassword}
                  onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })} required />
              </div>
              <div style={S.formGroup}>
                <label style={S.label}>New Password</label>
                <input style={S.input} type="password" placeholder="••••••••"
                  value={pwForm.newPassword}
                  onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })} required />
              </div>
              <div style={S.formGroup}>
                <label style={S.label}>Confirm New Password</label>
                <input style={S.input} type="password" placeholder="••••••••"
                  value={pwForm.confirmPassword}
                  onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })} required />
              </div>
              {pwForm.newPassword && pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword && (
                <p style={{ color: '#ef4444', fontSize: '13px', marginBottom: '12px' }}>Passwords do not match</p>
              )}
              <button type="submit" disabled={pwLoading} style={S.saveBtn}>
                {pwLoading ? 'Changing...' : '🔒 Change Password'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value, color }) {
  return (
    <div style={{ background: '#fff', borderRadius: '12px', padding: '16px 20px', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', textAlign: 'center', flex: 1 }}>
      <div style={{ fontSize: '28px', fontWeight: '700', color }}>{value}</div>
      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{label}</div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #f8fafc' }}>
      <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>{label}</span>
      <span style={{ fontSize: '14px', color: '#1e293b', fontWeight: '600' }}>{value}</span>
    </div>
  );
}

function BalanceRow({ label, used, total, color, icon }) {
  const remaining = total - used;
  const pct = Math.round((remaining / total) * 100);
  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>{icon}</span>
          <span style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>{label}</span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '22px', fontWeight: '700', color }}>{remaining}</span>
          <span style={{ fontSize: '13px', color: '#94a3b8' }}> / {total} days</span>
        </div>
      </div>
      <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '99px', overflow: 'hidden' }}>
        <div style={{ height: '8px', width: `${pct}%`, background: color, borderRadius: '99px', transition: 'width 0.8s ease' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
        <span style={{ fontSize: '11px', color: '#94a3b8' }}>{used} days used</span>
        <span style={{ fontSize: '11px', color, fontWeight: '600' }}>{pct}% remaining</span>
      </div>
    </div>
  );
}

const typeColor = t => ({ casual: '#7c3aed', sick: '#db2777', annual: '#0284c7' }[t] || '#64748b');
const typeIcon = t => ({ casual: '🏖️', sick: '🤒', annual: '✈️' }[t] || '📋');
const statusStyle = s => ({
  padding: '4px 12px', borderRadius: '99px', fontSize: '11px', fontWeight: '700',
  textTransform: 'uppercase', letterSpacing: '0.04em',
  ...(s === 'approved' ? { background: '#ecfdf5', color: '#059669' }
    : s === 'pending' ? { background: '#fffbeb', color: '#d97706' }
    : { background: '#fef2f2', color: '#dc2626' })
});

const S = {
  page: { maxWidth: '760px', margin: '0 auto', padding: '32px 20px' },
  loadingPage: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' },
  spinner: { width: '36px', height: '36px', border: '3px solid #e2e8f0', borderTop: '3px solid #2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  hero: { background: '#fff', borderRadius: '16px', padding: '28px', border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', marginBottom: '20px' },
  avatarWrap: { position: 'relative', flexShrink: 0 },
  avatar: { width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: '700' },
  avatarBadge: { position: 'absolute', bottom: 0, right: 0, width: '24px', height: '24px', borderRadius: '50%', background: '#fff', border: '2px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' },
  heroInfo: { flex: 1, minWidth: '160px' },
  heroName: { fontFamily: "'DM Serif Display', serif", fontSize: '22px', color: '#0f172a', margin: '0 0 4px' },
  heroSub: { color: '#64748b', fontSize: '13px', margin: '0 0 10px' },
  heroBadges: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  deptBadge: { padding: '4px 12px', borderRadius: '99px', fontSize: '12px', fontWeight: '600', background: '#f0fdf4', color: '#166534' },
  editBtn: { padding: '9px 18px', background: '#eff6ff', color: '#2563eb', border: '1.5px solid #bfdbfe', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap' },
  cancelBtn: { padding: '9px 18px', background: '#fff', color: '#64748b', border: '1.5px solid #e2e8f0', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap' },
  statsRow: { display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' },
  tabs: { display: 'flex', borderBottom: '2px solid #f1f5f9', marginBottom: '20px', overflowX: 'auto' },
  tab: { padding: '10px 18px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '500', color: '#94a3b8', borderBottom: '2px solid transparent', marginBottom: '-2px', whiteSpace: 'nowrap', fontFamily: "'DM Sans', sans-serif" },
  tabActive: { color: '#2563eb', borderBottom: '2px solid #2563eb' },
  card: { background: '#fff', borderRadius: '14px', border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' },
  cardHeader: { padding: '18px 24px', borderBottom: '1px solid #f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontWeight: '700', color: '#1e293b', fontSize: '15px' },
  cardBody: { padding: '24px' },
  count: { fontSize: '12px', color: '#94a3b8', background: '#f8fafc', padding: '3px 10px', borderRadius: '99px' },
  formGroup: { marginBottom: '18px' },
  label: { display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' },
  input: { width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', color: '#1e293b', fontFamily: "'DM Sans', sans-serif", outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' },
  hint: { fontSize: '12px', color: '#94a3b8', marginTop: '4px' },
  saveBtn: { width: '100%', padding: '12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
  historyRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', gap: '10px', flexWrap: 'wrap' },
};