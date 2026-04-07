import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import API from '../api';

export default function MyLeaves() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    API.get('/leaves/my')
      .then(({ data }) => setLeaves(data))
      .catch(() => toast.error('Failed to load leaves'))
      .finally(() => setLoading(false));
  }, []);

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

  if (loading) return <div className="loading">Loading your leaves...</div>;

  return (
    <div className="page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="page-title">My Leaves</h1>
          <p className="page-sub">{leaves.length} total requests</p>
        </div>
        <Link to="/apply" className="btn btn-primary">+ Apply Leave</Link>
      </div>

      <div className="filter-tabs">
        {['all', 'pending', 'approved', 'rejected'].map(f => (
          <button key={f} className={`filter-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f !== 'all' && <span style={{ marginLeft: '6px', opacity: 0.7 }}>({leaves.filter(l => l.status === f).length})</span>}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">📭</div>
          <p className="empty-text">No {filter !== 'all' ? filter : ''} leave requests found</p>
          <Link to="/apply" className="btn btn-primary" style={{ marginTop: '16px' }}>Apply for Leave</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filtered.map(leave => (
            <div key={leave._id} className="leave-card">
              <div className="leave-card-top">
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span className={`badge badge-${leave.leaveType}`}>
                    {({casual:'Casual',medical:'Medical',special:'Special'}[leave.leaveType] || leave.leaveType)}
                  </span>
                  <span className={`badge badge-${leave.status}`}>{leave.status}</span>
                </div>
                {leave.status === 'pending' && (
                  <button onClick={() => handleDelete(leave._id)} className="btn btn-danger" style={{ padding: '5px 12px', fontSize: '13px' }}>
                    Cancel
                  </button>
                )}
              </div>
              <div className="leave-card-body">
                <div className="leave-meta">
                  <span className="leave-days">{leave.days} day{leave.days > 1 ? 's' : ''}</span>
                  <span className="leave-date">
                    {new Date(leave.startDate).toLocaleDateString()} → {new Date(leave.endDate).toLocaleDateString()}
                  </span>
                </div>
                <p className="leave-reason">💬 {leave.reason}</p>
                {leave.adminComment && <div className="leave-comment">🔖 Admin: {leave.adminComment}</div>}
                <p className="leave-footer">Applied on {new Date(leave.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}