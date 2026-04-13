import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import API from '../api';
import { useAuth } from '../context/AuthContext';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function Calendar() {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [current, setCurrent] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', date: '' });
  const [selected, setSelected] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const today = new Date();

  useEffect(() => {
    const load = async () => {
      try {
        const endpoint = user?.role === 'admin' ? '/leaves/all' : '/leaves/my';
        const { data: l } = await API.get(endpoint);
        setLeaves(Array.isArray(l) ? l : []);
      } catch (e) { setLeaves([]); }
      try {
        const { data: h } = await API.get('/holidays');
        setHolidays(Array.isArray(h) ? h : []);
      } catch (e) { setHolidays([]); }
      setLoading(false);
    };
    load();
  }, [user]);

  const year = current.getFullYear();
  const month = current.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();

  const cells = [];
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: prevDays - i, cur: false });
  for (let i = 1; i <= daysInMonth; i++) cells.push({ day: i, cur: true });
  while (cells.length % 7 !== 0) cells.push({ day: cells.length - firstDay - daysInMonth + 1, cur: false });

  const dateStr = (day) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const getEvents = (day, cur) => {
    if (!cur) return [];
    const ds = dateStr(day);
    const events = [];
    holidays.forEach(h => {
      if (h.date && h.date.substring(0, 10) === ds) events.push({ type: 'holiday', label: h.name });
    });
    leaves.forEach(l => {
      if (l.status === 'rejected') return;
      const d = new Date(ds + 'T00:00:00');
      const s = new Date(l.startDate);
      const e = new Date(l.endDate);
      s.setHours(0,0,0,0); e.setHours(23,59,59,999);
      if (d >= s && d <= e) {
        const label = user?.role === 'admin' ? (l.employee?.name || 'Employee') : l.leaveType;
        events.push({ type: l.status, label });
      }
    });
    return events;
  };

  const isToday = (day, cur) => cur && day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  const isHoliday = (day, cur) => {
    if (!cur) return false;
    const ds = dateStr(day);
    return holidays.some(h => h.date && h.date.substring(0, 10) === ds);
  };

  const addHoliday = async (e) => {
    e.preventDefault();
    try {
      const { data } = await API.post('/holidays', form);
      setHolidays(prev => [...prev, data]);
      setForm({ name: '', date: '' });
      setShowForm(false);
      toast.success('Holiday added!');
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to add holiday');
    }
  };

  const deleteHoliday = (id) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await API.delete(`/holidays/${deleteId}`);
      setHolidays(prev => prev.filter(h => h._id !== deleteId));
      toast.success('Holiday removed!');
    } catch (err) {
      toast.error('Failed to remove holiday');
    } finally {
      setDeleteId(null);
    }
  };

  if (loading) return <div className="loading">Loading calendar...</div>;

  const selectedEvents = selected ? getEvents(selected.day, selected.cur) : [];

  return (
    <>
      <div className="page">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
          <div>
            <h1 className="page-title">📅 Leave Calendar</h1>
            <p className="page-sub">{leaves.length} leaves · {holidays.filter(h => new Date(h.date).getFullYear() === year).length} holidays in {year}</p>
          </div>
          {user?.role === 'admin' && (
            <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
              {showForm ? 'Cancel' : '+ Add Holiday'}
            </button>
          )}
        </div>

        {/* Holiday Form */}
        {showForm && user?.role === 'admin' && (
          <div className="card anim-fadeInUp" style={{ marginBottom: '20px' }}>
            <div className="card-body">
              <p style={{ fontWeight: '600', color: 'var(--text)', marginBottom: '16px', fontSize: '15px' }}>Add Public Holiday</p>
              <form onSubmit={addHoliday}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Holiday Name</label>
                    <input className="form-input" placeholder="e.g. Diwali" value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date</label>
                    <input className="form-input" type="date" value={form.date}
                      onChange={e => setForm({ ...form, date: e.target.value })} required />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" className="btn btn-primary">Save Holiday</button>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Calendar */}
        <div className="card" style={{ marginBottom: '20px' }}>
          {/* Nav */}
          <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border2)' }}>
            <button className="btn btn-ghost" style={{ padding: '6px 16px' }}
              onClick={() => setCurrent(new Date(year, month - 1, 1))}>← Prev</button>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '20px', color: 'var(--text)' }}>
              {MONTHS[month]} {year}
            </h2>
            <button className="btn btn-ghost" style={{ padding: '6px 16px' }}
              onClick={() => setCurrent(new Date(year, month + 1, 1))}>Next →</button>
          </div>

          <div style={{ padding: '16px' }}>
            {/* Day names */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '4px' }}>
              {DAYS.map(d => (
                <div key={d} style={{ textAlign: 'center', fontSize: '12px', fontWeight: '600', color: 'var(--text3)', padding: '6px 0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {d}
                </div>
              ))}
            </div>

            {/* Cells */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(7, 1fr)', 
              gap: '1px', 
              background: 'var(--border2)', 
              border: '1px solid var(--border2)',
              borderRadius: '12px',
              overflow: 'hidden'
            }}>
              {cells.map((cell, i) => {
                const events = getEvents(cell.day, cell.cur);
                const todayCell = isToday(cell.day, cell.cur);
                const holidayCell = isHoliday(cell.day, cell.cur);
                return (
                  <div key={i}
                    onClick={() => cell.cur && setSelected(selected?.day === cell.day ? null : cell)}
                    style={{
                      minHeight: '84px',
                      padding: '10px',
                      background: holidayCell ? 'var(--holiday)' : todayCell ? 'var(--primary-light)' : 'var(--bg2)',
                      opacity: cell.cur ? 1 : 0.4,
                      cursor: cell.cur ? 'pointer' : 'default',
                      transition: 'all 0.2s ease',
                      position: 'relative'
                    }}>
                    <div style={{ 
                      fontSize: '14px', 
                      fontWeight: '700', 
                      color: todayCell ? 'var(--primary)' : (cell.cur ? 'var(--text)' : 'var(--text3)'), 
                      marginBottom: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      {cell.day}
                      {todayCell && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)' }} />}
                    </div>
                    {events.slice(0, 2).map((ev, j) => (
                      <div key={j} style={{
                        fontSize: '10px', padding: '3px 6px', borderRadius: '4px', marginBottom: '3px',
                        overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', fontWeight: '600',
                        background: ev.type === 'holiday' ? 'var(--holiday)' : ev.type === 'approved' ? 'var(--success-light)' : 'var(--warning-light)',
                        color: ev.type === 'holiday' ? 'var(--holiday-text)' : ev.type === 'approved' ? 'var(--success)' : 'var(--warning)',
                        border: `1px solid ${ev.type === 'holiday' ? 'var(--border)' : 'transparent'}`
                      }}>
                        {ev.label}
                      </div>
                    ))}
                    {events.length > 2 && (
                      <div style={{ fontSize: '10px', color: 'var(--text3)', fontWeight: '600', marginTop: '2px' }}>+{events.length - 2} more</div>
                    )}
                    {todayCell && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, border: '2px solid var(--primary)', borderRadius: '0', pointerEvents: 'none', zIndex: 1 }} />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border2)', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {[
              { label: 'Today', bg: 'var(--primary-light)', color: 'var(--primary)' },
              { label: 'Approved', bg: 'var(--success-light)', color: 'var(--success)' },
              { label: 'Pending', bg: 'var(--warning-light)', color: 'var(--warning)' },
              { label: 'Holiday', bg: 'var(--holiday)', color: 'var(--holiday-text)' },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: l.bg, border: `1px solid ${l.color}` }} />
                <span style={{ fontSize: '12px', color: 'var(--text2)' }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Day */}
        {selected && selected.cur && (
          <div className="card anim-scaleIn" style={{ marginBottom: '20px' }}>
            <div className="card-header">
              <span style={{ fontWeight: '600', color: 'var(--text)', fontSize: '15px' }}>
                {MONTHS[month]} {selected.day}, {year}
              </span>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: '20px', lineHeight: 1 }}>×</button>
            </div>
            <div className="card-body">
              {selectedEvents.length === 0 ? (
                <p style={{ color: 'var(--text3)', fontSize: '14px' }}>No events on this day</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedEvents.map((ev, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className={`badge badge-${ev.type === 'holiday' ? 'holiday' : ev.type}`}>{ev.type}</span>
                      <span style={{ fontSize: '14px', color: 'var(--text)', fontWeight: '500', textTransform: 'capitalize' }}>{ev.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Holidays List */}
        {holidays.length > 0 && (
          <div className="card">
            <div className="card-header">
              <span style={{ fontWeight: '600', color: 'var(--text)', fontSize: '15px' }}>Public Holidays {year}</span>
              <span style={{ fontSize: '12px', color: 'var(--text3)', background: 'var(--bg3)', padding: '3px 10px', borderRadius: '99px' }}>
                {holidays.filter(h => new Date(h.date).getFullYear() === year).length} this year
              </span>
            </div>
            <div style={{ padding: 0 }}>
              {(() => {
                const monthHolidays = holidays
                  .filter(h => {
                    const d = new Date(h.date);
                    return d.getFullYear() === year && d.getMonth() === month;
                  })
                  .sort((a, b) => new Date(a.date) - new Date(b.date));

                if (monthHolidays.length === 0) {
                  return (
                    <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text3)' }}>
                      <div style={{ fontSize: '24px', marginBottom: '8px' }}>🌤️</div>
                      <p style={{ fontSize: '13px' }}>No public holidays in {MONTHS[month]}</p>
                    </div>
                  );
                }

                return (
                  <div>
                    <div style={{ background: 'var(--bg3)', padding: '8px 24px', fontSize: '12px', fontWeight: '700', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border2)' }}>
                      {MONTHS[month]} {year}
                    </div>
                    {monthHolidays.map((h, i) => (
                      <div key={h._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', borderBottom: i < monthHolidays.length - 1 ? '1px solid var(--border2)' : 'none', gap: '10px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '20px' }}>🎉</span>
                          <div>
                            <div style={{ fontWeight: '600', color: 'var(--text)', fontSize: '14px' }}>{h.name}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px' }}>
                              {new Date(h.date).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric' })}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span className="badge badge-holiday">Holiday</span>
                          {user?.role === 'admin' && (
                            <button onClick={() => deleteHoliday(h._id)}
                              style={{ background: 'var(--danger-light)', border: 'none', borderRadius: '8px', padding: '5px 10px', cursor: 'pointer', color: 'var(--danger)', fontSize: '13px', fontWeight: '600' }}>
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '20px', animation: 'fadeInUp 0.3s ease'
        }} onClick={() => setDeleteId(null)}>
          <div className="card anim-scaleIn" style={{ maxWidth: '400px', width: '100%', padding: '32px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '24px', color: 'var(--text)', marginBottom: '12px' }}>Remove Holiday?</h2>
            <p style={{ color: 'var(--text2)', fontSize: '15px', marginBottom: '28px', lineHeight: '1.5' }}>
              This will permanently delete the holiday from the system. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={confirmDelete}>Yes, Remove</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}