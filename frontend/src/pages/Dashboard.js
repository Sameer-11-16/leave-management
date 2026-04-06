import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api';

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: profileData } = await API.get('/users/me');
        setProfile(profileData);
        const { data: leavesData } = await API.get(user.role === 'admin' ? '/leaves/all' : '/leaves/my');
        setLeaves(leavesData);
      } catch (err) {}
      finally { setLoading(false); }
    };
    fetchData();
  }, [user]);

  const stats = {
    pending: leaves.filter(l => l.status === 'pending').length,
    approved: leaves.filter(l => l.status === 'approved').length,
    rejected: leaves.filter(l => l.status === 'rejected').length,
    total: leaves.length,
  };

  const balance = profile?.leaveBalance;
  const recentLeaves = leaves.slice(0, 3);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) return <div className="loading">Loading dashboard...</div>;

  return (
    <div className="page">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '28px' }}>
        <div>
          <h1 className="page-title">{getGreeting()}, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="page-sub">{user?.department} · {user?.role === 'admin' ? 'Administrator' : 'Employee'}</p>
        </div>
        {user?.role === 'employee' && (
          <Link to="/apply" className="btn btn-primary btn-lg">+ Apply Leave</Link>
        )}
      </div>

      {/* Stats Cards */}
      <div className="stats-grid" style={{ marginBottom: '28px' }}>
        <StatCard label="Pending" value={stats.pending} color="#d97706" icon="⏳" />
        <StatCard label="Approved" value={stats.approved} color="#16a34a" icon="✅" />
        <StatCard label="Rejected" value={stats.rejected} color="#dc2626" icon="❌" />
      </div>

      {/* Leave Balance - Employee Only */}
      {user?.role === 'employee' && balance && (
        <div style={{ marginBottom: '28px' }}>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '20px', marginBottom: '16px', color: '#1e293b' }}>
            Leave Balance
          </h2>
          <div className="stats-grid">
            <BalanceCard label="Casual Leave" value={balance.casual} total={10} color="#7c3aed" />
            <BalanceCard label="Sick Leave" value={balance.sick} total={7} color="#be185d" />
            <BalanceCard label="Annual Leave" value={balance.annual} total={15} color="#0369a1" />
          </div>
        </div>
      )}

      {/* Leave Type Breakdown */}
      {leaves.length > 0 && (
        <div style={{ marginBottom: '28px' }}>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '20px', marginBottom: '16px', color: '#1e293b' }}>
            Leave Breakdown
          </h2>
          <div className="card">
            <div className="card-body">
              <BreakdownBar leaves={leaves} />
            </div>
          </div>
        </div>
      )}

      {/* Recent Leaves */}
      {recentLeaves.length > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '20px', color: '#1e293b' }}>Recent Requests</h2>
            <Link to={user?.role === 'admin' ? '/admin' : '/my-leaves'} style={{ fontSize: '13px', color: '#2563eb' }}>View all →</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recentLeaves.map(leave => (
              <div key={leave._id} className="card">
                <div className="card-body" style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: typeColor(leave.leaveType) + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
                      {typeIcon(leave.leaveType)}
                    </div>
                    <div>
                      <div style={{ fontWeight: '500', color: '#1e293b', fontSize: '14px' }}>
                        {leave.leaveType.charAt(0).toUpperCase() + leave.leaveType.slice(1)} Leave
                        {user?.role === 'admin' && leave.employee && (
                          <span style={{ color: '#94a3b8', fontWeight: '400' }}> · {leave.employee.name}</span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                        {new Date(leave.startDate).toLocaleDateString()} → {new Date(leave.endDate).toLocaleDateString()} · {leave.days} days
                      </div>
                    </div>
                  </div>
                  <span className={`badge badge-${leave.status}`}>{leave.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {leaves.length === 0 && user?.role === 'employee' && (
        <div className="empty" style={{ marginTop: '20px' }}>
          <div className="empty-icon">📋</div>
          <p className="empty-text">No leave requests yet</p>
          <Link to="/apply" className="btn btn-primary" style={{ marginTop: '16px' }}>Apply for your first leave</Link>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color, icon }) {
  return (
    <div className="stat-card" style={{ borderTop: `3px solid ${color}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="stat-value" style={{ color }}>{value}</div>
          <div className="stat-label">{label} Leaves</div>
        </div>
        <span style={{ fontSize: '24px' }}>{icon}</span>
      </div>
    </div>
  );
}

function BalanceCard({ label, value, total, color }) {
  const pct = Math.round((value / total) * 100);
  const used = total - value;
  return (
    <div className="stat-card">
      <div style={{ fontSize: '13px', fontWeight: '500', color: '#64748b', marginBottom: '8px' }}>{label}</div>
      <div style={{ fontSize: '28px', fontWeight: '600', color, marginBottom: '4px' }}>
        {value} <span style={{ fontSize: '14px', color: '#94a3b8', fontWeight: '400' }}>/ {total} days</span>
      </div>
      <div className="stat-bar">
        <div className="stat-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
        <span style={{ fontSize: '11px', color: '#94a3b8' }}>{used} used</span>
        <span style={{ fontSize: '11px', color: '#94a3b8' }}>{pct}% left</span>
      </div>
    </div>
  );
}

function BreakdownBar({ leaves }) {
  const casual = leaves.filter(l => l.leaveType === 'casual').length;
  const sick = leaves.filter(l => l.leaveType === 'sick').length;
  const annual = leaves.filter(l => l.leaveType === 'annual').length;
  const total = leaves.length || 1;

  const items = [
    { label: 'Casual', value: casual, color: '#7c3aed', bg: '#ede9fe' },
    { label: 'Sick', value: sick, color: '#be185d', bg: '#fce7f3' },
    { label: 'Annual', value: annual, color: '#0369a1', bg: '#e0f2fe' },
  ];

  return (
    <div>
      {/* Bar */}
      <div style={{ display: 'flex', height: '12px', borderRadius: '99px', overflow: 'hidden', marginBottom: '16px', background: '#f1f5f9' }}>
        {items.map(item => item.value > 0 && (
          <div key={item.label} style={{ width: `${(item.value / total) * 100}%`, background: item.color, transition: 'width 0.6s ease' }} />
        ))}
      </div>
      {/* Legend */}
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        {items.map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.color }} />
            <span style={{ fontSize: '13px', color: '#64748b' }}>{item.label}</span>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const typeColor = (type) => ({ casual: '#7c3aed', sick: '#be185d', annual: '#0369a1' }[type] || '#64748b');
const typeIcon = (type) => ({ casual: '🏖️', sick: '🤒', annual: '✈️' }[type] || '📋');