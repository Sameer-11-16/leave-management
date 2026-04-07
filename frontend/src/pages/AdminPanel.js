import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import API from '../api';

export default function AdminPanel() {
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [tab, setTab] = useState('leaves');
  const [commentMap, setCommentMap] = useState({});
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    Promise.all([API.get('/leaves/all'), API.get('/users')])
      .then(([l, e]) => { setLeaves(l.data); setEmployees(e.data); })
      .catch(() => toast.error('Failed to load data'))
      .finally(() => setLoading(false));
  }, []);

  const handleAction = async (id, status) => {
    setActionLoading(id + status);
    try {
      const { data } = await API.put(`/leaves/${id}`, { status, adminComment: commentMap[id] || '' });
      setLeaves(prev => prev.map(l => l._id === id ? { ...l, status: data.status, adminComment: data.adminComment } : l));
      toast.success(`Leave ${status}!`);
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = filter === 'all' ? leaves : leaves.filter(l => l.status === filter);
  const counts = { pending: leaves.filter(l => l.status === 'pending').length, approved: leaves.filter(l => l.status === 'approved').length, rejected: leaves.filter(l => l.status === 'rejected').length };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Admin Panel</h1>
        <p className="page-sub">Manage leave requests and employees</p>
      </div>

      <div className="stats-grid" style={{ marginBottom: '28px' }}>
        <div className="stat-card" style={{ borderTop: '3px solid #d97706' }}>
          <div className="stat-value" style={{ color: '#d97706' }}>{counts.pending}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card" style={{ borderTop: '3px solid #16a34a' }}>
          <div className="stat-value" style={{ color: '#16a34a' }}>{counts.approved}</div>
          <div className="stat-label">Approved</div>
        </div>
        <div className="stat-card" style={{ borderTop: '3px solid #dc2626' }}>
          <div className="stat-value" style={{ color: '#dc2626' }}>{counts.rejected}</div>
          <div className="stat-label">Rejected</div>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab-btn ${tab === 'leaves' ? 'active' : ''}`} onClick={() => setTab('leaves')}>Leave Requests</button>
        <button className={`tab-btn ${tab === 'employees' ? 'active' : ''}`} onClick={() => setTab('employees')}>Employees ({employees.length})</button>
      </div>

      {tab === 'leaves' && (
        <>
          <div className="filter-tabs">
            {['all', 'pending', 'approved', 'rejected'].map(f => (
              <button key={f} className={`filter-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
                {f !== 'all' && <span style={{ marginLeft: '6px', opacity: 0.7 }}>({counts[f] || 0})</span>}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="empty"><div className="empty-icon">📭</div><p className="empty-text">No requests found</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {filtered.map(leave => (
                <div key={leave._id} className="leave-card">
                  <div className="leave-card-top">
                    <div>
                      <span style={{ fontWeight: '600', color: '#1e293b' }}>{leave.employee?.name}</span>
                      <span style={{ color: '#94a3b8', fontSize: '13px', marginLeft: '8px' }}>{leave.employee?.department}</span>
                    </div>
                    <span className={`badge badge-${leave.status}`}>{leave.status}</span>
                  </div>
                  <div className="leave-card-body">
                    <div className="leave-meta">
                      <span className={`badge badge-${leave.leaveType}`}>{leave.leaveType}</span>
                      <span className="leave-days">{leave.days} day{leave.days > 1 ? 's' : ''}</span>
                      <span className="leave-date">{new Date(leave.startDate).toLocaleDateString()} → {new Date(leave.endDate).toLocaleDateString()}</span>
                    </div>
                    <p className="leave-reason">💬 {leave.reason}</p>

                    {leave.status === 'pending' && (
                      <div className="action-area">
                        <input className="form-input" style={{ fontSize: '13px', padding: '8px 12px' }}
                          placeholder="Optional comment for employee..."
                          value={commentMap[leave._id] || ''}
                          onChange={e => setCommentMap(p => ({ ...p, [leave._id]: e.target.value }))} />
                        <div className="action-btns">
                          <button className="btn btn-success" style={{ flex: 1 }}
                            disabled={actionLoading === leave._id + 'approved'}
                            onClick={() => handleAction(leave._id, 'approved')}>
                            {actionLoading === leave._id + 'approved' ? '...' : '✓ Approve'}
                          </button>
                          <button className="btn btn-danger" style={{ flex: 1 }}
                            disabled={actionLoading === leave._id + 'rejected'}
                            onClick={() => handleAction(leave._id, 'rejected')}>
                            {actionLoading === leave._id + 'rejected' ? '...' : '✕ Reject'}
                          </button>
                        </div>
                      </div>
                    )}
                    {leave.adminComment && <div className="leave-comment">🔖 {leave.adminComment}</div>}
                    <p className="leave-footer">{leave.employee?.email} · {new Date(leave.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'employees' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {employees.map(emp => (
            <div key={emp._id} className="card">
              <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="avatar">{emp.name.charAt(0).toUpperCase()}</div>
                  <div>
                    <div style={{ fontWeight: '600', color: '#1e293b' }}>{emp.name}</div>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>{emp.email} · {emp.department}</div>
                  </div>
                </div>
                <div className="balance-row">
                  {Object.entries(emp.leaveBalance).filter(([type]) => ['casual','medical','special'].includes(type)).map(([type, val]) => (
                    <span key={type} className={`balance-chip badge badge-${type}`}>
                      <strong>{val}</strong> {type}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}