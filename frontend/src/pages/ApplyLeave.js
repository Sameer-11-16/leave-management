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
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>Apply for Leave</h2>
        <form onSubmit={handleSubmit}>
          <label style={styles.label}>Leave Type</label>
          <select style={styles.input} value={form.leaveType} onChange={e => setForm({ ...form, leaveType: e.target.value })}>
            <option value="casual">Casual Leave</option>
            <option value="sick">Sick Leave</option>
            <option value="annual">Annual Leave</option>
          </select>

          <div style={styles.row}>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>Start Date</label>
              <input style={styles.input} type="date" value={form.startDate}
                onChange={e => setForm({ ...form, startDate: e.target.value })} required />
            </div>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>End Date</label>
              <input style={styles.input} type="date" value={form.endDate}
                onChange={e => setForm({ ...form, endDate: e.target.value })} required />
            </div>
          </div>

          {days > 0 && (
            <div style={styles.daysBadge}>📅 {days} day{days > 1 ? 's' : ''} of leave</div>
          )}

          <label style={styles.label}>Reason</label>
          <textarea style={{ ...styles.input, height: '100px', resize: 'vertical' }}
            placeholder="Briefly describe the reason..."
            value={form.reason}
            onChange={e => setForm({ ...form, reason: e.target.value })} required />

          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Application'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: { maxWidth: '560px', margin: '40px auto', padding: '0 20px' },
  card: { background: '#fff', padding: '32px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' },
  title: { color: '#1e40af', marginBottom: '24px' },
  label: { display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '4px' },
  input: { width: '100%', padding: '10px 14px', marginBottom: '16px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' },
  row: { display: 'flex', gap: '16px' },
  daysBadge: { background: '#eff6ff', color: '#1e40af', padding: '8px 16px', borderRadius: '8px', marginBottom: '16px', fontWeight: '600', fontSize: '14px' },
  btn: { width: '100%', padding: '12px', background: '#1e40af', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer' }
};