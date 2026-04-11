import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import API from '../api';

const LEAVE_INFO = {
  casual: { label: 'Casual Leave', icon: '🏖️', color: '#7c3aed', total: 14, desc: 'For personal errands and short breaks' },
  medical: { label: 'Medical Leave', icon: '💊', color: '#db2777', total: 10, desc: 'For medical appointments and illness' },
  special: { label: 'Special Leave', icon: '⭐', color: '#0284c7', total: null, desc: 'Conditional — document proof required' },
};

// Popup Modal Component
function InsufficientModal({ show, leaveType, remaining, needed, onClose }) {
  if (!show) return null;
  const info = LEAVE_INFO[leaveType] || {};
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: 'var(--bg2)', borderRadius: '20px', padding: '32px', maxWidth: '400px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', animation: 'scaleIn 0.2s ease', border: '1px solid var(--border)' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '52px', marginBottom: '12px' }}>🚫</div>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '22px', color: 'var(--text)', marginBottom: '8px' }}>
            Leave Not Available
          </h2>
          <p style={{ color: 'var(--text2)', fontSize: '14px', lineHeight: '1.6' }}>
            You don't have enough <strong style={{ color: info.color }}>{info.label}</strong> balance for this request.
          </p>
        </div>
        <div style={{ background: 'var(--danger-light)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text2)' }}>Days requested</span>
            <span style={{ fontWeight: '700', color: 'var(--danger)' }}>{needed} days</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', color: 'var(--text2)' }}>Days available</span>
            <span style={{ fontWeight: '700', color: 'var(--danger)' }}>{remaining} days</span>
          </div>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text3)', textAlign: 'center', marginBottom: '20px' }}>
          💡 Try reducing the number of days or use a different leave type.
        </p>
        <button onClick={onClose} className="btn btn-primary btn-full" style={{ padding: '12px' }}>
          Got it, go back
        </button>
      </div>
    </div>
  );
}

export default function ApplyLeave() {
  const [form, setForm] = useState({ leaveType: 'casual', startDate: '', endDate: '', reason: '', document: '' });
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(null);
  const [showModal, setShowModal] = useState(false);
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
    if (form.leaveType === 'special' || remaining === null || days === 0) return null;
    if (!isEnough) return 'low';
    if (remaining / info.total <= 0.3) return 'warn';
    return 'ok';
  };

  const balStatus = getBalanceStatus();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (days <= 0) return toast.error('End date must be after start date');

    // Show popup if insufficient balance
    if (!isEnough && form.leaveType !== 'special') {
      setShowModal(true);
      return;
    }

    if (form.leaveType === 'special' && !form.document.trim()) {
      return toast.error('Please attach document proof for Special Leave');
    }

    setLoading(true);
    try {
      await API.post('/leaves', form);
      toast.success('Leave application submitted!');
      navigate('/my-leaves');
    } catch (err) {
      const msg = err.response?.data?.msg || 'Failed to apply';
      // Also show popup on backend insufficient balance error
      if (msg.toLowerCase().includes('insufficient')) {
        setShowModal(true);
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page" style={{ maxWidth: '640px' }}>

      {/* Insufficient Leave Popup */}
      <InsufficientModal
        show={showModal}
        leaveType={form.leaveType}
        remaining={remaining || 0}
        needed={days}
        onClose={() => setShowModal(false)}
      />

      <div style={{ marginBottom: '28px' }}>
        <h1 className="page-title">Apply for Leave</h1>
        <p className="page-sub">Fill in the details below to submit your request</p>
      </div>

      <div className="card">
        <div className="card-body">

          {/* Leave Type Selector Dropdown */}
          <div className="form-group">
            <label className="form-label">Select Leave Type</label>
            <select 
              className="form-input" 
              value={form.leaveType}
              onChange={e => setForm({ ...form, leaveType: e.target.value })}
              style={{ 
                paddingRight: '40px', 
                background: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E") no-repeat right 12px center/18px`, 
                appearance: 'none',
                color: 'inherit',
                backgroundColor: 'inherit'
              }}
            >
              {Object.entries(LEAVE_INFO).map(([type, lInfo]) => {
                const bal = type === 'special' ? null : (balance ? balance[type] : null);
                const balText = type === 'special' ? '(Conditional)' : (bal !== null ? `(${bal} days left)` : '');
                const isFull = type !== 'special' && bal !== null && bal <= 0;
                return (
                  <option key={type} value={type} disabled={isFull}>
                    {lInfo.icon} {lInfo.label} {balText} {isFull ? '— NO BALANCE' : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Leave info banner */}
          <div style={{ padding: '12px 14px', borderRadius: '10px', background: info.color + '12', border: `1px solid ${info.color}30`, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>{info.icon}</span>
            <div>
              <div style={{ fontWeight: '600', color: info.color, fontSize: '14px' }}>{info.label}</div>
              <div style={{ fontSize: '12px', color: 'var(--text3)' }}>{info.desc}
                {form.leaveType !== 'special' && remaining !== null && (
                  <span style={{ marginLeft: '6px', fontWeight: '600', color: remaining > 0 ? info.color : 'var(--danger)' }}>
                    · {remaining} days remaining
                  </span>
                )}
              </div>
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

            {/* Days count */}
            {days > 0 && (
              <div className="days-banner">
                📅 {days} day{days > 1 ? 's' : ''} of {info.label}
              </div>
            )}

            {/* Balance alert */}
            {days > 0 && form.leaveType !== 'special' && remaining !== null && balStatus && (
              <div className={`balance-alert balance-${balStatus}`}>
                {balStatus === 'ok' && `✅ You have ${remaining} days remaining — sufficient for this request`}
                {balStatus === 'warn' && `⚠️ Low balance — only ${remaining} day${remaining !== 1 ? 's' : ''} remaining after this`}
                {balStatus === 'low' && `❌ Not enough balance — need ${days} days but only ${remaining} available`}
              </div>
            )}

            {/* Reason */}
            <div className="form-group">
              <label className="form-label">Reason</label>
              <textarea className="form-textarea"
                placeholder="Briefly describe the reason for your leave..."
                value={form.reason}
                onChange={e => setForm({ ...form, reason: e.target.value })} required />
            </div>

            {/* Document proof - Special leave only */}
            {form.leaveType === 'special' && (
              <div className="form-group">
                <label className="form-label">Document Proof <span style={{ color: '#ef4444' }}>*</span></label>
                <div style={{ padding: '20px', border: '2px dashed var(--border)', borderRadius: '12px', background: 'var(--bg3)', textAlign: 'center', marginBottom: '8px' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📎</div>
                  <p style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '10px' }}>
                    Attach document URL or description
                  </p>
                  <input className="form-input"
                    style={{ textAlign: 'center', background: 'var(--bg2)' }}
                    placeholder="e.g. https://drive.google.com/... or Medical certificate"
                    value={form.document}
                    onChange={e => setForm({ ...form, document: e.target.value })} />
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text3)' }}>
                  ⭐ Special leave requires supporting document proof. Admin will review before approval.
                </p>
              </div>
            )}

            <button
              className="btn btn-primary btn-full btn-lg"
              type="submit"
              disabled={loading}
              style={{ marginTop: '8px' }}>
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}