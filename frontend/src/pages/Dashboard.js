import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api';

const LEAVE_LABELS = { casual: 'Casual', medical: 'Medical', special: 'Special' };
const LEAVE_ICONS = { casual: '🏖️', medical: '💊', special: '⭐' };
const LEAVE_COLORS = { casual: '#7c3aed', medical: '#db2777', special: '#0284c7' };

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- MANUAL BADGE LOGIC START ---
  const isAdmin = user?.role === 'admin';
  const badgeStyle = {
    padding: '4px 12px',
    borderRadius: '99px',
    fontSize: '11px',
    fontWeight: '700',
    display: 'inline-flex',
    alignItems: 'center',
    marginLeft: '12px',
    backgroundColor: isAdmin ? '#e0e7ff' : '#dcfce7', 
    color: isAdmin ? '#4338ca' : '#15803d',
    border: `1px solid ${isAdmin ? '#c7d2fe' : '#bbf7d0'}`,
    textTransform: 'uppercase',
    verticalAlign: 'middle'
  };
  // --- MANUAL BADGE LOGIC END ---

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: p } = await API.get('/users/me');
        setProfile(p);
        const endpoint = user?.role === 'admin' ? '/leaves/all' : '/leaves/my';
        const { data: l } = await API.get(endpoint);
        setLeaves(Array.isArray(l) ? l : []);
      } catch (e) { setLeaves([]); }
      finally { setLoading(false); }
    };
    if (user) fetchData();
  }, [user]);

  const stats = {
    pending: leaves.filter(l => l.status === 'pending').length,
    approved: leaves.filter(l => l.status === 'approved').length,
    rejected: leaves.filter(l => l.status === 'rejected').length,
  };

  const balance = profile?.leaveBalance;
  const recentLeaves = leaves.slice(0, 4);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTop: '3px solid var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: 'var(--text3)', marginTop: '16px' }}>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="page">

      {/* Header with Badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '28px' }} className="anim-fadeInUp">
        <div>
          <p style={{ fontSize: '13px', color: 'var(--text3)', marginBottom: '4px', fontWeight: '500' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          
          {/* Badge added here */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <h1 className="page-title">{getGreeting()}, {user?.name?.split(' ')[0]} 👋</h1>
            <span style={badgeStyle}>
              {isAdmin ? '🛡️ Admin' : '👤 Employee'}
            </span>
          </div>

          <p className="page-sub">
            {user?.department} · {isAdmin ? 'Management Portal' : 'Staff Portal'}
          </p>
        </div>
        
        {user?.role === 'employee' && (
          <Link to="/apply" className="btn btn-primary btn-lg">+ Apply Leave</Link>
        )}
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        {[
          { label: 'Pending', value: stats.pending, color: '#f59e0b', bg: 'var(--warning-light)', icon: '⏳' },
          { label: 'Approved', value: stats.approved, color: '#10b981', bg: 'var(--success-light)', icon: '✅' },
          { label: 'Rejected', value: stats.rejected, color: '#ef4444', bg: 'var(--danger-light)', icon: '❌' },
        ].map((s, i) => (
          <div key={s.label} className={`stat-card delay-${i + 1}`} style={{ borderTop: `3px solid ${s.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                <div className="stat-label">{s.label} Leaves</div>
              </div>
              <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
                {s.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Leave Balance - Employee */}
      {user?.role === 'employee' && balance && (
        <div style={{ marginBottom: '28px' }} className="anim-fadeInUp delay-3">
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '20px', color: 'var(--text)', marginBottom: '16px' }}>
            Leave Balance
          </h2>
          <div className="stats-grid">
            <BalanceCard label="Casual Leave" value={balance.casual} total={14} color="#7c3aed" icon="🏖️" delay={1} />
            <BalanceCard label="Medical Leave" value={balance.medical} total={10} color="#db2777" icon="💊" delay={2} />
            <BalanceCard label="Special Leave" value={null} total={null} color="#0284c7" icon="⭐" delay={3} unlimited />
          </div>
        </div>
      )}

      {/* Leave Type Breakdown */}
      {leaves.length > 0 && (
        <div style={{ marginBottom: '28px' }} className="anim-fadeInUp delay-4">
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '20px', color: 'var(--text)', marginBottom: '16px' }}>
            {isAdmin ? 'Staff Leave Breakdown' : 'Leave Breakdown'}
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
        <div className="anim-fadeInUp delay-5">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '20px', color: 'var(--text)' }}>
              {isAdmin ? 'Recent Staff Requests' : 'Recent My Requests'}
            </h2>
            <Link to={user?.role === 'admin' ? '/admin' : '/my-leaves'} style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: '500' }}>View all →</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recentLeaves.map((leave, i) => (
              <div key={leave._id} className={`card delay-${i + 1}`} style={{ animation: 'fadeInUp 0.4s ease both' }}>
                <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: (LEAVE_COLORS[leave.leaveType] || '#64748b') + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                      {LEAVE_ICONS[leave.leaveType] || '📋'}
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', color: 'var(--text)', fontSize: '14px' }}>
                        {LEAVE_LABELS[leave.leaveType] || leave.leaveType} Leave
                        {isAdmin && leave.employee?.name && (
                          <span style={{ color: 'var(--text3)', fontWeight: '400', marginLeft: '6px' }}>· {leave.employee.name}</span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px' }}>
                        {new Date(leave.startDate).toLocaleDateString()} → {new Date(leave.endDate).toLocaleDateString()} · {leave.days} day{leave.days !== 1 ? 's' : ''}
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
        <div className="empty anim-fadeInUp">
          <span className="empty-icon">📋</span>
          <p className="empty-text">No leave requests yet</p>
          <Link to="/apply" className="btn btn-primary" style={{ marginTop: '20px' }}>Apply for your first leave</Link>
        </div>
      )}
    </div>
  );
}

// ... BalanceCard and BreakdownBar functions remain exactly same ...

function BalanceCard({ label, value, total, color, icon, delay, unlimited }) {
  const pct = unlimited ? 100 : (total > 0 ? Math.round((value / total) * 100) : 0);
  return (
    <div className={`stat-card delay-${delay}`} style={{ borderLeft: `3px solid ${color}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
        <span style={{ fontSize: '22px' }}>{icon}</span>
      </div>
      {unlimited ? (
        <div>
          <div style={{ fontSize: '22px', fontWeight: '700', color, marginBottom: '4px' }}>Unlimited</div>
          <div style={{ fontSize: '12px', color: 'var(--text3)' }}>No balance limit</div>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: '30px', fontWeight: '700', color, marginBottom: '4px' }}>
            {value} <span style={{ fontSize: '14px', color: 'var(--text3)', fontWeight: '400' }}>/ {total} days</span>
          </div>
          <div className="stat-bar">
            <div className="stat-fill" style={{ width: `${pct}%`, background: color }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text3)' }}>{total - value} used</span>
            <span style={{ fontSize: '11px', color, fontWeight: '600' }}>{pct}% left</span>
          </div>
        </div>
      )}
    </div>
  );
}

function BreakdownBar({ leaves }) {
  const counts = {
    casual: leaves.filter(l => l.leaveType === 'casual').length,
    medical: leaves.filter(l => l.leaveType === 'medical').length,
    special: leaves.filter(l => l.leaveType === 'special').length,
  };
  const total = leaves.length || 1;
  const items = [
    { label: 'Casual', value: counts.casual, color: '#7c3aed' },
    { label: 'Medical', value: counts.medical, color: '#db2777' },
    { label: 'Special', value: counts.special, color: '#0284c7' },
  ];
  return (
    <div>
      <div style={{ display: 'flex', height: '10px', borderRadius: '99px', overflow: 'hidden', marginBottom: '16px', background: 'var(--bg3)' }}>
        {items.map(item => item.value > 0 && (
          <div key={item.label} style={{ width: `${(item.value / total) * 100}%`, background: item.color, transition: 'width 0.8s ease' }} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        {items.map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: item.color }} />
            <span style={{ fontSize: '13px', color: 'var(--text2)' }}>{item.label}</span>
            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text)' }}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}