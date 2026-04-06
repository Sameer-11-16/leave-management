import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api';

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: profileData } = await API.get('/users/me');
        setProfile(profileData);
        const { data: leaves } = await API.get(user.role === 'admin' ? '/leaves/all' : '/leaves/my');
        setStats({
          pending: leaves.filter(l => l.status === 'pending').length,
          approved: leaves.filter(l => l.status === 'approved').length,
          rejected: leaves.filter(l => l.status === 'rejected').length,
          total: leaves.length,
        });
      } catch (err) {}
    };
    fetchData();
  }, [user]);

  const balance = profile?.leaveBalance;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Good morning, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="page-sub">{user?.department} · {user?.role === 'admin' ? 'Administrator' : 'Employee'}</p>
      </div>

      <div className="stats-grid">
        <StatCard label="Pending" value={stats.pending} color="#d97706" bg="#fef3c7" />
        <StatCard label="Approved" value={stats.approved} color="#16a34a" bg="#dcfce7" />
        <StatCard label="Rejected" value={stats.rejected} color="#dc2626" bg="#fee2e2" />
      </div>

      {user?.role === 'employee' && balance && (
        <>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '20px', marginBottom: '16px', color: '#1e293b' }}>
            Leave Balance
          </h2>
          <div className="stats-grid">
            <BalanceCard label="Casual Leave" value={balance.casual} total={10} color="#7c3aed" bg="#ede9fe" />
            <BalanceCard label="Sick Leave" value={balance.sick} total={7} color="#be185d" bg="#fce7f3" />
            <BalanceCard label="Annual Leave" value={balance.annual} total={15} color="#0369a1" bg="#e0f2fe" />
          </div>
          <div style={{ marginTop: '8px' }}>
            <Link to="/apply" className="btn btn-primary btn-lg">Apply for Leave</Link>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, color, bg }) {
  return (
    <div className="stat-card" style={{ borderTop: `3px solid ${color}` }}>
      <div className="stat-value" style={{ color }}>{value}</div>
      <div className="stat-label">{label} Leaves</div>
    </div>
  );
}

function BalanceCard({ label, value, total, color, bg }) {
  const pct = Math.round((value / total) * 100);
  return (
    <div className="stat-card">
      <div style={{ fontSize: '13px', fontWeight: '500', color: '#64748b', marginBottom: '6px' }}>{label}</div>
      <div style={{ fontSize: '28px', fontWeight: '600', color }}>
        {value} <span style={{ fontSize: '14px', color: '#94a3b8', fontWeight: '400' }}>/ {total} days</span>
      </div>
      <div className="stat-bar">
        <div className="stat-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>{pct}% remaining</div>
    </div>
  );
}