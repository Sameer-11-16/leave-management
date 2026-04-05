import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import API from '../api';

const STATUS_COLORS = {
  pending: { bg: '#fef3c7', color: '#92400e' },
  approved: { bg: '#d1fae5', color: '#065f46' },
  rejected: { bg: '#fee2e2', color: '#991b1b' }
};

const TYPE_COLORS = {
  casual: '#6366f1',
  sick: '#ec4899',
  annual: '#0891b2'
};

export default function MyLeaves() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchLeaves = async () => {
    try {
      const { data } = await API.get('/leaves/my');
      setLeaves(data);
    } catch {
      toast.error('Failed to load leaves');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeaves(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Cancel this leave request?')) return;
    try {
      await API.delete(`/leaves/${id}`);
      toast.success('Leave cancelled');
      setLeaves(prev => prev.filter(l => l._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to cancel');
    }
  };

  const filtered = filter === 'all' ? leaves : leaves.filter(l => l.status === filter);

  if (loading) return <div style={styles.center}>Loading...</div>;

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h2 style={styles.title}>My Leave Requests</h2>
        <div style={styles.filters}>
          {['all', 'pending', 'approved', 'rejected'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ ...styles.filterBtn, ...(filter === f ? styles.filterActive : {}) }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={styles.empty}>
          <div style={{ fontSize: '48px' }}>📭</div>
          <p>No leave requests found.</p>
        </div>
      ) : (
        <div style={styles.list}>
          {filtered.map(leave => (
            <div key={leave._id} style={styles.card}>
              <div style={styles.cardTop}>
                <div>
                  <span style={{ ...styles.typeBadge, background: TYPE_COLORS[leave.leaveType] }}>
                    {leave.leaveType.charAt(0).toUpperCase() + leave.leaveType.slice(1)} Leave
                  </span>
                  <span style={{ ...styles.statusBadge, ...STATUS_COLORS[leave.status] }}>
                    {leave.status.toUpperCase()}
                  </span>
                </div>
                {leave.status === 'pending' && (
                  <button onClick={() => handleDelete(leave._id)} style={styles.deleteBtn}>✕ Cancel</button>
                )}
              </div>

              <div style={styles.cardBody}>
                <div style={styles.infoRow}>
                  <span>📅 {new Date(leave.startDate).toLocaleDateString()} → {new Date(leave.endDate).toLocaleDateString()}</span>
                  <span style={styles.days}>{leave.days} day{leave.days > 1 ? 's' : ''}</span>
                </div>
                <p style={styles.reason}>💬 {leave.reason}</p>
                {leave.adminComment && (
                  <p style={styles.adminComment}>🔖 Admin: {leave.adminComment}</p>
                )}
                <p style={styles.date}>Applied on {new Date(leave.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { maxWidth: '800px', margin: '30px auto', padding: '0 20px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' },
  title: { color: '#1e40af', margin: 0 },
  filters: { display: 'flex', gap: '8px' },
  filterBtn: { padding: '6px 14px', border: '1px solid #d1d5db', borderRadius: '20px', background: '#fff', cursor: 'pointer', fontSize: '13px', color: '#6b7280' },
  filterActive: { background: '#1e40af', color: '#fff', border: '1px solid #1e40af' },
  list: { display: 'flex', flexDirection: 'column', gap: '16px' },
  card: { background: '#fff', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #f3f4f6' },
  cardBody: { padding: '16px 20px' },
  typeBadge: { color: '#fff', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', marginRight: '8px' },
  statusBadge: { padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' },
  deleteBtn: { background: '#fee2e2', color: '#991b1b', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
  infoRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  days: { background: '#eff6ff', color: '#1e40af', padding: '2px 10px', borderRadius: '12px', fontSize: '13px', fontWeight: '600' },
  reason: { color: '#4b5563', fontSize: '14px', margin: '0 0 6px' },
  adminComment: { color: '#065f46', background: '#d1fae5', padding: '8px 12px', borderRadius: '6px', fontSize: '13px', margin: '8px 0' },
  date: { color: '#9ca3af', fontSize: '12px', margin: 0 },
  empty: { textAlign: 'center', padding: '60px 20px', color: '#9ca3af' },
  center: { textAlign: 'center', padding: '60px', color: '#6b7280' }
};