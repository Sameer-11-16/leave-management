import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api';

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: profileData } = await API.get('/users/me');
        setProfile(profileData);

        const { data: leaves } = await API.get(user.role === 'admin' ? '/leaves/all' : '/leaves/my');
        const pending = leaves.filter(l => l.status === 'pending').length;
        const approved = leaves.filter(l => l.status === 'approved').length;
        const rejected = leaves.filter(l => l.status === 'rejected').length;
        setStats({ pending, approved, rejected });
      } catch (err) {}
    };
    fetchData();
  }, [user]);

  const balance = profile?.leaveBalance;

  return (
    <div style={styles.page}>
      <h2 style={styles.heading}>Welcome, {user?.name} 👋</h2>
      <p style={styles.sub}>{user?.department} • {user?.role === 'admin' ? '🔑 Admin' : '👤 Employee'}</p>

      <div style={styles.grid}>
        <StatCard label="Pending" value={stats.pending} color="#f59e0b" />
        <StatCard label="Approved" value={stats.approved} color="#10b981" />
        <StatCard label="Rejected" value={stats.rejected} color="#ef4444" />
      </div>

      {user?.role === 'employee' && balance && (
        <>
          <h3 style={styles.sectionTitle}>Leave Balance</h3>
          <div style={styles.grid}>
            <BalanceCard label="Casual Leave" value={balance.casual} total={10} color="#6366f1" />
            <BalanceCard label="Sick Leave" value={balance.sick} total={7} color="#ec4899" />
            <BalanceCard label="Annual Leave" value={balance.annual} total={15} color="#0891b2" />
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={{ ...styles.card, borderTop: `4px solid ${color}` }}>
      <div style={{ fontSize: '32px', fontWeight: 'bold', color }}>{value}</div>
      <div style={{ color: '#6b7280', marginTop: '4px' }}>{label} Leaves</div>
    </div>
  );
}

function BalanceCard({ label, value, total, color }) {
  const pct = Math.round((value / total) * 100);
  return (
    <div style={styles.card}>
      <div style={{ fontWeight: '600', marginBottom: '8px' }}>{label}</div>
      <div style={{ fontSize: '28px', fontWeight: 'bold', color }}>{value} <span style={{ fontSize: '14px', color: '#9ca3af' }}>/ {total}</span></div>
      <div style={styles.barBg}><div style={{ ...styles.bar, width: `${pct}%`, background: color }} /></div>
      <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>{pct}% remaining</div>
    </div>
  );
}

const styles = {
  page: { maxWidth: '900px', margin: '30px auto', padding: '0 20px' },
  heading: { fontSize: '24px', fontWeight: 'bold', color: '#1e40af' },
  sub: { color: '#6b7280', marginBottom: '24px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' },
  card: { background: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  sectionTitle: { fontSize: '18px', fontWeight: '600', marginBottom: '12px', color: '#374151' },
  barBg: { background: '#e5e7eb', borderRadius: '99px', height: '6px', marginTop: '8px' },
  bar: { height: '6px', borderRadius: '99px', transition: 'width 0.5s' }
};