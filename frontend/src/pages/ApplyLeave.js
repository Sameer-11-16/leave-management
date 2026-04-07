import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import API from '../api';
import { useAuth } from '../context/AuthContext';

const LEAVE_INFO = {
  casual: { label: 'Casual Leave', icon: '🏖️', color: '#7c3aed', total: 10, desc: 'For personal errands and short breaks' },
  medical: { label: 'Medical Leave', icon: '💊', color: '#db2777', total: 10, desc: 'For medical appointments and illness' },
  special: { label: 'Special Leave', icon: '⭐', color: '#0284c7', total: null, desc: 'Unlimited — document proof required' },
};

export default function ApplyLeave() {
  const { user } = useAuth();
  const [form, setForm] = useState({ leaveType: 'casual', startDate: '', endDate: '', reason: '', document: '' });
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    API.get('/users/me').then(({ data }) => setBalance(data.leaveBalance)).catch(() => {});
  }, []);

  const days = form.startDate && form.endDate
    ? Math.max(Math.ceil((new Date(form.endDate) - new Date(form.startDate)) / (1000 * 60 * 60 * 24)) + 1, 0)
    : 0;

  const info = LEAVE_INFO[form.leaveType];
  const remaining = form.leaveType === 'special' ? null : (balance ? balance[form.leaveType] : null);
  const isEnough = form.leaveType === 'special' || remaining === null || days === 0 || remaining >= days;

  const getBalanceStatus = () => {
    if (form.leaveType === 'special') return null;
    if (remaining === null) return null;
    if (days === 0) return null;
    const pct = remaining / info.total;
    if (!isEnough) return 'low';
    if (pct <= 0.3) return 'warn';
    return 'ok';
  };

  const balStatus = getBalanceStatus();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (days <= 0) return toast.error('End date must be after start date');
    if (!isEnough) return toast.error(`Not enough ${info.label} balance`);
    if (form.leaveType === 'special' && !form.document.trim()) return toast.error('Please attach document proof for Special Leave');
    setLoading(true);
    try {
      await API.post('/leaves', form);
      toast.success('Leave application submitted!');
      navigate('/my-leaves');
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to apply');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page anim-fadeInUp" style={{ maxWidth: '640px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 className="page-title">Apply for Leave</h1>
        <p className="page-sub">Fill in the details below to submit your request</p>
      </div>

      {/* Leave Type Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {Object.entries(LEAVE_INFO).map(([type, info]) => {
          const bal = type === 'special' ? null : (balance ? balance[type] : null);
          const isSelected = form.leaveType === type;
          return (
            <div key={type} onClick={() => setForm({ ...form, leaveType: type })}
              style={{
                padding: '14px', borderRadius: '14px', cursor: 'pointer',
                border: `2px solid ${isSelected ? info.color : 'var(--border)'}`,
                background: isSelected ? info.color + '12' : 'var(--bg2)',
                transition: 'all 0.2s ease',
                transform: isSelected ? 'translateY(-2px)' : 'none',
                boxShadow: isSelected ? `0 4px 16px ${info.color}30` : 'none',
              }}>
              <div style={{ fontSize: '24px', marginBottom: '6px' }}>{info.icon}</div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: isSelected ? info.color : 'var(--text)', marginBottom: '2px' }}>{info.label}</div>
              <div style={{ fontSize: '11px', color: 'var(--text3)' }}>
                {type === 'special' ? 'Unlimited' : (bal !== null ? `${bal} days left` : `${info.total} days`)}
              </div>
            </div>
          );
        })}
      </div>

      <div className="card">
        <div className="card-body">
          {/* Leave info banner */}
          <div style={{ padding: '12px 14px', borderRadius: '10px', background: info.color + '12', border: `1px solid ${info.color}30`, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>{info.icon}</span>
            <div>
              <div style={{ fontWeight: '600', color: info.color, fontSize: '14px' }}>{info.label}</div>
              <div style={{ fontSize: '12px', color: 'var(--text3)' }}>{info.desc}</div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Dates */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Start date</label>
                <input className="form-input" type="date" value={form.startDate}
                  onChange={e => setForm({ ...form, startDate: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">End date</label>
                <input className="form-input" type="date" value={form.endDate}
                  onChange={e => setForm({ ...form, endDate: e.target.value })} required />
              </div>
            </div>

            {/* Days count banner */}
            {days > 0 && (
              <div className="days-banner">
                📅 {days} day{days > 1 ? 's' : ''} of {info.label}
              </div>
            )}

            {/* Balance remaining alert */}
            {days > 0 && form.leaveType !== 'special' && remaining !== null && (
              <div className={`balance-alert balance-${balStatus}`}>
                {balStatus === 'ok' && `✅ You have ${remaining} days remaining — enough for this request`}
                {balStatus === 'warn' && `⚠️ Only ${remaining} days left after this request`}
                {balStatus === 'low' && `❌ Insufficient balance — you need ${days} days but only have ${remaining}`}
              </div>
            )}

            {/* Reason */}
            <div className="form-group">
              <label className="form-label">Reason</label>
              <textarea className="form-textarea" placeholder="Briefly describe the reason for your leave..."
                value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} required />
            </div>

            {/* Document upload - Special leave only */}
            {form.leaveType === 'special' && (
              <div className="form-group">
                <label className="form-label">Document Proof <span style={{ color: '#ef4444' }}>*</span></label>
                <div style={{ padding: '16px', border: '2px dashed var(--border)', borderRadius: '12px', background: 'var(--bg3)', textAlign: 'center' }}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>📎</div>
                  <p style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '10px' }}>Attach document URL or description</p>
                  <input className="form-input" style={{ textAlign: 'center' }}
                    placeholder="e.g. Medical certificate / court document link"
                    value={form.document}
                    onChange={e => setForm({ ...form, document: e.target.value })} />
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '6px' }}>
                  Special leave requires supporting document proof
                </p>
              </div>
            )}

            <button className="btn btn-primary btn-full btn-lg" type="submit"
              disabled={loading || (!isEnough && form.leaveType !== 'special')}
              style={{ marginTop: '8px' }}>
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}