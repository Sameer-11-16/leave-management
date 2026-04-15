import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import API from '../api';
import Skeleton from '../components/Skeleton';
export default function AdminPanel() {
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [tab, setTab] = useState('leaves');
  const [commentMap, setCommentMap] = useState({});
  const [actionLoading, setActionLoading] = useState(null);
  const [employeeSearch, setEmployeeSearch] = useState('');

  useEffect(() => {
    Promise.all([API.get('/leaves/all'), API.get('/users')])
      .then(([l, e]) => { setLeaves(l.data); setEmployees(e.data); })
      .catch(err => {
        console.error('Fetch error:', err);
        toast.error(err.response?.data?.msg || 'Failed to load data');
      })
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

  if (loading) return (
    <div className="page">
      <div className="page-header" style={{ marginBottom: '28px' }}>
        <Skeleton width="200px" height="32px" style={{ marginBottom: '8px' }} />
        <Skeleton width="300px" height="16px" />
      </div>
      <div className="grid-charts" style={{ marginBottom: '28px' }}>
        {[1, 2, 3].map(i => (
          <div key={i} className="stat-card" style={{ border: 'none', boxShadow: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Skeleton width="100px" height="14px" style={{ marginBottom: '8px' }} />
                <Skeleton width="60px" height="28px" />
              </div>
              <Skeleton width="32px" height="32px" borderRadius="50%" />
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '2px solid var(--border2)' }}>
        <Skeleton width="120px" height="35px" borderRadius="8px 8px 0 0" />
        <Skeleton width="120px" height="35px" borderRadius="8px 8px 0 0" />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {[1, 2, 3].map(i => <Skeleton key={i} width="100%" height="160px" borderRadius="16px" />)}
      </div>
    </div>
  );

  return (
    <div className="page">
      <div className="page-header-container">
        <div>
          <h1 className="page-title">Admin Panel</h1>
          <p className="page-sub">Manage leave requests and employees</p>
        </div>
      </div>

      <div className="grid-charts" style={{ marginBottom: '28px' }}>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--warning)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="stat-label">Pending Approval</div>
              <div className="stat-value" style={{ color: 'var(--warning)', marginTop: '4px' }}>{counts.pending}</div>
            </div>
            <div style={{ fontSize: '28px' }}>⏳</div>
          </div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--success)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="stat-label">Approved Today</div>
              <div className="stat-value" style={{ color: 'var(--success)', marginTop: '4px' }}>{counts.approved}</div>
            </div>
            <div style={{ fontSize: '28px' }}>✅</div>
          </div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--danger)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="stat-label">Requests Rejected</div>
              <div className="stat-value" style={{ color: 'var(--danger)', marginTop: '4px' }}>{counts.rejected}</div>
            </div>
            <div style={{ fontSize: '28px' }}>✕</div>
          </div>
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
                      <span style={{ fontWeight: '600', color: 'var(--text)' }}>{leave.employee?.name}</span>
                      <span style={{ color: 'var(--text3)', fontSize: '13px', marginLeft: '8px' }}>{leave.employee?.department}</span>
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

                    {leave.document && (
                      <div style={{ marginTop: '12px', padding: '10px 14px', background: 'var(--bg3)', borderRadius: '12px', border: '1px solid var(--border)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '18px' }}>📄</span>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <a href={leave.document.startsWith('http') ? leave.document : '#'} target="_blank" rel="noreferrer" 
                             style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: '700', textDecoration: 'none' }}>
                            {leave.document.startsWith('http') ? 'View Supporting Document' : 'Attachment Reference'}
                          </a>
                          {!leave.document.startsWith('http') && <span style={{ fontSize: '11px', color: 'var(--text3)' }}>Ref: {leave.document}</span>}
                        </div>
                      </div>
                    )}

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
        <>
          <div style={{ marginBottom: '20px' }}>
            <div className="input-icon-wrapper">
              <span className="input-icon">🔍</span>
              <input className="form-input input-with-icon" placeholder="Search employees by name, email or department..." 
                value={employeeSearch} onChange={e => setEmployeeSearch(e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {(() => {
              const filteredEmps = employees.filter(e => 
                e.name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
                e.email.toLowerCase().includes(employeeSearch.toLowerCase()) ||
                e.department.toLowerCase().includes(employeeSearch.toLowerCase())
              );
              
              if (filteredEmps.length === 0) {
                return <div className="empty"><div className="empty-icon">👥</div><p className="empty-text">No employees match your search</p></div>;
              }

              return filteredEmps.map(emp => (
              <div key={emp._id} className="card anim-fadeInUp">
                <div className="card-body">
                  <div className="flex-between-responsive" style={{ alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                      <div className="avatar" style={{ background: 'linear-gradient(135deg, var(--primary), #7c3aed)', color: '#fff' }}>
                        {emp.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: '700', color: 'var(--text)', fontSize: '15px' }}>{emp.name}</div>
                        <div style={{ fontSize: '13px', color: 'var(--text3)', marginTop: '2px' }}>{emp.email} · {emp.department}</div>
                      </div>
                    </div>
                    <div className="balance-row" style={{ marginTop: '8px' }}>
                      {Object.entries(emp.leaveBalance || {}).filter(([type]) => ['casual','medical','special'].includes(type)).map(([type, val]) => (
                        <div key={type} className={`balance-chip badge badge-${type}`} style={{ padding: '6px 12px' }}>
                          <span style={{ opacity: 0.8, fontSize: '10px', textTransform: 'uppercase', marginRight: '6px' }}>{type}:</span>
                          <strong>{val}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ));
          })()}
          </div>
        </>
      )}
    </div>
  );
}