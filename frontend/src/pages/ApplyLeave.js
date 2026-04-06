import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import API from '../api';

export default function ApplyLeave() {
  const [form, setForm] = useState({ leaveType: 'casual', startDate: '', endDate: '', reason: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const days = form.startDate && form.endDate
    ? Math.ceil((new Date(form.endDate) - new Date(form.startDate)) / (1000 * 60 * 60 * 24)) + 1
    : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (days <= 0) return toast.error('End date must be after start date');
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
    <div className="page" style={{ maxWidth: '600px' }}>
      <div className="page-header">
        <h1 className="page-title">Apply for Leave</h1>
        <p className="page-sub">Fill in the details below to submit your request</p>
      </div>

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Leave type</label>
              <select className="form-select" value={form.leaveType} onChange={e => setForm({ ...form, leaveType: e.target.value })}>
                <option value="casual">Casual Leave</option>
                <option value="sick">Sick Leave</option>
                <option value="annual">Annual Leave</option>
              </select>
            </div>

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

            {days > 0 && (
              <div className="days-banner">
                📅 {days} day{days > 1 ? 's' : ''} of {form.leaveType} leave
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Reason</label>
              <textarea className="form-textarea" placeholder="Briefly describe the reason for your leave..."
                value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} required />
            </div>

            <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}