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

export default function AdminPanel() {
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [activeTab, setActiveTab] = useState('leaves');
  const [commentMap, setCommentMap] = useState({});
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [leavesRes, empRes] = await Promise.all([
          API.get('/leaves/all'),
          API.get('/users')
        ]);
        setLeaves(leavesRes.data);
        setEmployees(empRes.data);
      } catch {
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const handleAction = async (id, status) => {
    setActionLoading(id + status);
    try {
      const { data } = await API.put(`/leaves/${id}`, {
        status,
        adminComment: commentMap[id] || ''
      });
      setLeaves(prev => prev.map(l => l._id === id ? { ...l, status: data.status, adminComment: data.adminComment } : l));
      toast.success(`Leave ${status}!`);
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = filter === 'all' ? leaves : leaves.filter(l => l.status === filter);
  const counts = {
    pending: leaves.filter(l => l.status === 'pending').length,
    approved: leaves.filter(l => l.status === 'approved').length,
    rejected: leaves.filter(l => l.status === 'rejected').length
  };

  if (loading) return <div style={styles.center}>Loading...</div>;

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>Admin Panel</h2>

      {/* Summary Cards */}
      <div style={styles.summaryGrid}>
        <SummaryCard label="Pending" value={counts.pending} color="#f59e0b" />
        <SummaryCard label="Approved" value={counts.approved} color="#10b981" />
        <SummaryCard label="Rejected" value={counts.rejected} color="#ef4444" />
        <SummaryCard label="Total Employees" value={employees.length} color="#6366f1" />
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button onClick={() => setActiveTab('leaves')} style={{ ...styles.tab, ...(activeTab === 'leaves' ? styles.tabActive : {}) }}>
          📋 Leave Requests
        </button>
        <button onClick={() => setActiveTab('employees')} style={{ ...styles.tab, ...(activeTab === 'employees' ? styles.tabActive : {}) }}>
          👥 Employees
        </button>
      </div>

      {activeTab === 'leaves' && (
        <>
          {/* Filter Buttons */}
          <div style={styles.filters}>
            {['all', 'pending', 'approved', 'rejected'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{ ...styles.filterBtn, ...(filter === f ? styles.filterActive : {}) }}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
                {f !== 'all' && <span style={styles.filterCount}>{counts[f]}</span>}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div style={styles.empty}><div style={{ fontSize: '48px' }}>📭</div><p>No requests found.</p></div>
          ) : (
            <div style={styles.list}>
              {filtered.map(leave => (
                <div key={leave._id} style={styles.card}>
                  <div style={styles.cardTop}>
                    <div>
                      <strong style={styles.empName}>{leave.employee?.name}</strong>
                      <span style={styles.dept}> · {leave.employee?.department}</span>
                    </div>
                    <span style={{ ...styles.statusBadge, ...STATUS_COLORS[leave.status] }}>
                      {leave.status.toUpperCase()}
                    </span>
                  </div>

                  <div style={styles.cardBody}>
                    <div style={styles.infoRow}>
                      <span style={{ ...styles.typeBadge, background: TYPE_COLORS[leave.leaveType] }}>
                        {leave.leaveType.charAt(0).toUpperCase() + leave.leaveType.slice(1)} Leave
                      </span>
                      <span style={styles.days}>{leave.days} day{leave.days > 1 ? 's' : ''}</span>
                      <span style={styles.dateRange}>
                        {new Date(leave.startDate).toLocaleDateString()} → {new Date(leave.endDate).toLocaleDateString()}
                      </span>
                    </div>

                    <p style={styles.reason}>💬 {leave.reason}</p>

                    {leave.status === 'pending' && (
                      <div style={styles.actionArea}>
                        <input
                          style={styles.commentInput}
                          placeholder="Optional comment (visible to employee)..."
                          value={commentMap[leave._id] || ''}
                          onChange={e => setCommentMap(prev => ({ ...prev, [leave._id]: e.target.value }))}
                        />
                        <div style={styles.actionBtns}>
                          <button
                            style={styles.approveBtn}
                            disabled={actionLoading === leave._id + 'approved'}
                            onClick={() => handleAction(leave._id, 'approved')}>
                            {actionLoading === leave._id + 'approved' ? '...' : '✓ Approve'}
                          </button>
                          <button
                            style={styles.rejectBtn}
                            disabled={actionLoading === leave._id + 'rejected'}
                            onClick={() => handleAction(leave._id, 'rejected')}>
                            {actionLoading === leave._id + 'rejected' ? '...' : '✕ Reject'}
                          </button>
                        </div>
                      </div>
                    )}

                    {leave.adminComment && (
                      <p style={styles.adminComment}>🔖 Comment: {leave.adminComment}</p>
                    )}

                    <p style={styles.meta}>
                      {leave.employee?.email} · Applied {new Date(leave.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'employees' && (
        <div style={styles.list}>
          {employees.length === 0 ? (
            <div style={styles.empty}><div style={{ fontSize: '48px' }}>👥</div><p>No employees found.</p></div>
          ) : (
            employees.map(emp => (
              <div key={emp._id} style={{ ...styles.card }}>
                <div style={styles.cardBody}>
                  <div style={styles.empRow}>
                    <div style={styles.avatar}>{emp.name.charAt(0).toUpperCase()}</div>
                    <div>
                      <div style={{ fontWeight: '600', color: '#111827' }}>{emp.name}</div>
                      <div style={{ fontSize: '13px', color: '#6b7280' }}>{emp.email} · {emp.department}</div>
                    </div>
                  </div>
                  <div style={styles.balanceRow}>
                    {Object.entries(emp.leaveBalance).map(([type, val]) => (
                      <div key={type} style={{ ...styles.balChip, background: TYPE_COLORS[type] + '22', color: TYPE_COLORS[type] }}>
                        <strong>{val}</strong> {type}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, color }) {
  return (
    <div style={{ background: '#fff', padding: '18px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', borderTop: `4px solid ${color}` }}>
      <div style={{ fontSize: '28px', fontWeight: 'bold', color }}>{value}</div>
      <div style={{ color: '#6b7280', fontSize: '13px', marginTop: '2px' }}>{label}</div>
    </div>
  );
}

const styles = {
  page: { maxWidth: '900px', margin: '30px auto', padding: '0 20px' },
  title: { color: '#1e40af', marginBottom: '20px' },
  summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' },
  tabs: { display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '2px solid #e5e7eb', paddingBottom: '0' },
  tab: { padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '14px', color: '#6b7280', borderBottom: '3px solid transparent', marginBottom: '-2px' },
  tabActive: { color: '#1e40af', borderBottom: '3px solid #1e40af', fontWeight: '600' },
  filters: { display: 'flex', gap: '8px', marginBottom: '16px' },
  filterBtn: { padding: '6px 14px', border: '1px solid #d1d5db', borderRadius: '20px', background: '#fff', cursor: 'pointer', fontSize: '13px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '6px' },
  filterActive: { background: '#1e40af', color: '#fff', border: '1px solid #1e40af' },
  filterCount: { background: 'rgba(255,255,255,0.3)', borderRadius: '10px', padding: '1px 7px', fontSize: '12px' },
  list: { display: 'flex', flexDirection: 'column', gap: '14px' },
  card: { background: '#fff', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid #f3f4f6', background: '#f9fafb' },
  cardBody: { padding: '16px 20px' },
  empName: { color: '#111827' },
  dept: { color: '#6b7280', fontSize: '13px' },
  statusBadge: { padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' },
  typeBadge: { color: '#fff', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', marginRight: '8px' },
  infoRow: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' },
  days: { background: '#eff6ff', color: '#1e40af', padding: '2px 10px', borderRadius: '12px', fontSize: '13px', fontWeight: '600' },
  dateRange: { color: '#6b7280', fontSize: '13px' },
  reason: { color: '#4b5563', fontSize: '14px', margin: '0 0 12px' },
  actionArea: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' },
  commentInput: { padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', width: '100%', boxSizing: 'border-box' },
  actionBtns: { display: 'flex', gap: '10px' },
  approveBtn: { flex: 1, padding: '8px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' },
  rejectBtn: { flex: 1, padding: '8px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' },
  adminComment: { color: '#065f46', background: '#d1fae5', padding: '8px 12px', borderRadius: '6px', fontSize: '13px', margin: '6px 0' },
  meta: { color: '#9ca3af', fontSize: '12px', margin: '8px 0 0' },
  empRow: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' },
  avatar: { width: '40px', height: '40px', background: '#1e40af', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '16px', flexShrink: 0 },
  balanceRow: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  balChip: { padding: '4px 12px', borderRadius: '12px', fontSize: '13px', fontWeight: '500' },
  empty: { textAlign: 'center', padding: '60px 20px', color: '#9ca3af' },
  center: { textAlign: 'center', padding: '60px', color: '#6b7280' }
};