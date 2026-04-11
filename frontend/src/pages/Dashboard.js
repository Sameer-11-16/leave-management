import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area
} from 'recharts';

const LEAVE_LABELS = { casual: 'Casual', medical: 'Medical', special: 'Special' };
const LEAVE_ICONS  = { casual: '🏖️',  medical: '💊',        special: '⭐' };
const LEAVE_COLORS = { casual: '#7c3aed', medical: '#db2777', special: '#0284c7' };

/* ── helpers ── */
function getMonthlyData(leaves) {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const map = {};
  months.forEach(m => { map[m] = { month: m, approved: 0, pending: 0, rejected: 0 }; });
  leaves.forEach(l => {
    const m = months[new Date(l.startDate).getMonth()];
    if (map[m] && l.status in map[m]) map[m][l.status]++;
  });
  // Return only months that have data (or last 6 months)
  const now = new Date().getMonth();
  return months.slice(Math.max(0, now - 5), now + 1).map(m => map[m]);
}

/* ── custom tooltip ── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg2, #1e293b)', border: '1px solid var(--border, #334155)',
      borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: 'var(--text, #f1f5f9)'
    }}>
      {label && <p style={{ fontWeight: 700, marginBottom: 6 }}>{label}</p>}
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color, margin: '2px 0' }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile]   = useState(null);
  const [leaves,  setLeaves]    = useState([]);
  const [loading, setLoading]   = useState(true);

  const isAdmin = user?.role === 'admin';

  const badgeStyle = {
    padding: '4px 12px', borderRadius: '99px', fontSize: '11px', fontWeight: '700',
    display: 'inline-flex', alignItems: 'center', marginLeft: '12px',
    backgroundColor: isAdmin ? '#e0e7ff' : '#dcfce7',
    color: isAdmin ? '#4338ca' : '#15803d',
    border: `1px solid ${isAdmin ? '#c7d2fe' : '#bbf7d0'}`,
    textTransform: 'uppercase', verticalAlign: 'middle'
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: p } = await API.get('/users/me');
        setProfile(p);
        const endpoint = isAdmin ? '/leaves/all' : '/leaves/my';
        const { data: l } = await API.get(endpoint);
        setLeaves(Array.isArray(l) ? l : []);
      } catch {
        setLeaves([]);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchData();
  }, [user, isAdmin]);

  const stats = {
    pending:  leaves.filter(l => l.status === 'pending').length,
    approved: leaves.filter(l => l.status === 'approved').length,
    rejected: leaves.filter(l => l.status === 'rejected').length,
  };

  const balance     = profile?.leaveBalance;
  const recentLeaves = leaves.slice(0, 4);

  /* chart data */
  const statusPieData = [
    { name: 'Pending',  value: stats.pending,  color: '#f59e0b' },
    { name: 'Approved', value: stats.approved, color: '#10b981' },
    { name: 'Rejected', value: stats.rejected, color: '#ef4444' },
  ].filter(d => d.value > 0);

  const typeCounts = {
    casual:  leaves.filter(l => l.leaveType === 'casual').length,
    medical: leaves.filter(l => l.leaveType === 'medical').length,
    special: leaves.filter(l => l.leaveType === 'special').length,
  };
  const typeBarData = [
    { name: 'Casual',  value: typeCounts.casual,  color: '#7c3aed' },
    { name: 'Medical', value: typeCounts.medical, color: '#db2777' },
    { name: 'Special', value: typeCounts.special, color: '#0284c7' },
  ];

  const monthlyData = getMonthlyData(leaves);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'60vh' }}>
        <div style={{ width:'40px', height:'40px', border:'3px solid var(--border)', borderTop:'3px solid var(--primary)', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
        <p style={{ color:'var(--text3)', marginTop:'16px' }}>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="page">

      {/* ── Header ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'12px', marginBottom:'28px' }} className="anim-fadeInUp">
        <div>
          <p style={{ fontSize:'13px', color:'var(--text3)', marginBottom:'4px', fontWeight:'500' }}>
            {new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' })}
          </p>
          <div style={{ display:'flex', alignItems:'center', flexWrap:'wrap', gap:'4px' }}>
            <h1 className="page-title">{getGreeting()}, {user?.name?.split(' ')[0]} 👋</h1>
            <span style={badgeStyle}>{isAdmin ? '🛡️ Admin' : '👤 Employee'}</span>
          </div>
          <p className="page-sub">{user?.department} · {isAdmin ? 'Management Portal' : 'Staff Portal'}</p>
        </div>
        {!isAdmin && (
          <Link to="/apply" className="btn btn-primary btn-lg">+ Apply Leave</Link>
        )}
      </div>

      {/* ── Stat Cards ── */}
      <div className="stats-grid">
        {[
          { label:'Pending',  value:stats.pending,  color:'#f59e0b', bg:'var(--warning-light)', icon:'⏳' },
          { label:'Approved', value:stats.approved, color:'#10b981', bg:'var(--success-light)', icon:'✅' },
          { label:'Rejected', value:stats.rejected, color:'#ef4444', bg:'var(--danger-light)',  icon:'❌' },
        ].map((s, i) => (
          <div key={s.label} className={`stat-card delay-${i + 1}`} style={{ borderTop:`3px solid ${s.color}` }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div>
                <div className="stat-value" style={{ color:s.color }}>{s.value}</div>
                <div className="stat-label">{s.label} Leaves</div>
              </div>
              <div style={{ width:'46px', height:'46px', borderRadius:'12px', background:s.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px' }}>
                {s.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Charts Row ── */}
      {leaves.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:'20px', marginBottom:'28px' }} className="anim-fadeInUp delay-2">

          {/* Donut — Leave Status */}
          <div className="card">
            <div className="card-body">
              <h3 style={{ fontSize:'15px', fontWeight:'700', color:'var(--text)', marginBottom:'16px' }}>
                📊 Leave Status Distribution
              </h3>
              {statusPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={statusPieData}
                      cx="50%" cy="50%"
                      innerRadius={55} outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                      animationBegin={0}
                      animationDuration={900}
                    >
                      {statusPieData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      iconType="circle" iconSize={9}
                      formatter={v => <span style={{ fontSize:'12px', color:'var(--text2)' }}>{v}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p style={{ textAlign:'center', color:'var(--text3)', padding:'40px 0' }}>No data yet</p>
              )}
            </div>
          </div>

          {/* Bar — Leave Type */}
          <div className="card">
            <div className="card-body">
              <h3 style={{ fontSize:'15px', fontWeight:'700', color:'var(--text)', marginBottom:'16px' }}>
                🗂️ Leaves by Type
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={typeBarData} barSize={36} margin={{ top:4, right:4, left:-20, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill:'var(--text3)', fontSize:12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill:'var(--text3)', fontSize:12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill:'rgba(255,255,255,0.04)' }} />
                  <Bar dataKey="value" name="Leaves" radius={[6, 6, 0, 0]} animationDuration={900}>
                    {typeBarData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

      {/* ── Monthly Trend (Area Chart) ── */}
      {leaves.length > 0 && (
        <div style={{ marginBottom:'28px' }} className="anim-fadeInUp delay-3">
          <h2 style={{ fontFamily:"'DM Serif Display', serif", fontSize:'20px', color:'var(--text)', marginBottom:'16px' }}>
            {isAdmin ? 'Staff Monthly Trend' : 'My Monthly Trend'}
          </h2>
          <div className="card">
            <div className="card-body">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={monthlyData} margin={{ top:4, right:16, left:-20, bottom:0 }}>
                  <defs>
                    <linearGradient id="gradApproved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradPending" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradRejected" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill:'var(--text3)', fontSize:12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill:'var(--text3)', fontSize:12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    iconType="circle" iconSize={9}
                    formatter={v => <span style={{ fontSize:'12px', color:'var(--text2)' }}>{v}</span>}
                  />
                  <Area type="monotone" dataKey="approved" name="Approved" stroke="#10b981" strokeWidth={2} fill="url(#gradApproved)" dot={false} activeDot={{ r:5, fill:'#10b981' }} animationDuration={1000} />
                  <Area type="monotone" dataKey="pending"  name="Pending"  stroke="#f59e0b" strokeWidth={2} fill="url(#gradPending)"  dot={false} activeDot={{ r:5, fill:'#f59e0b' }} animationDuration={1100} />
                  <Area type="monotone" dataKey="rejected" name="Rejected" stroke="#ef4444" strokeWidth={2} fill="url(#gradRejected)" dot={false} activeDot={{ r:5, fill:'#ef4444' }} animationDuration={1200} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── Leave Balance (employee only) ── */}
      {!isAdmin && balance && (
        <div style={{ marginBottom:'28px' }} className="anim-fadeInUp delay-4">
          <h2 style={{ fontFamily:"'DM Serif Display', serif", fontSize:'20px', color:'var(--text)', marginBottom:'16px' }}>
            Leave Balance
          </h2>
          <div className="stats-grid">
            <BalanceCard label="Casual Leave"  value={balance.casual}  total={14} color="#7c3aed" icon="🏖️" delay={1} />
            <BalanceCard label="Medical Leave" value={balance.medical} total={10} color="#db2777" icon="💊" delay={2} />
            <BalanceCard label="Special Leave" value={null} total={null} color="#0284c7" icon="⭐" delay={3} conditional />
          </div>
        </div>
      )}

      {/* ── Recent Leaves ── */}
      {recentLeaves.length > 0 && (
        <div className="anim-fadeInUp delay-5">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
            <h2 style={{ fontFamily:"'DM Serif Display', serif", fontSize:'20px', color:'var(--text)' }}>
              {isAdmin ? 'Recent Staff Requests' : 'Recent My Requests'}
            </h2>
            <Link to={isAdmin ? '/admin' : '/my-leaves'} style={{ fontSize:'13px', color:'var(--primary)', fontWeight:'500' }}>View all →</Link>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            {recentLeaves.map((leave, i) => (
              <div key={leave._id} className={`card delay-${i + 1}`} style={{ animation:'fadeInUp 0.4s ease both' }}>
                <div style={{ padding:'14px 20px', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'10px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                    <div style={{ width:'40px', height:'40px', borderRadius:'10px', background:(LEAVE_COLORS[leave.leaveType]||'#64748b')+'18', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px' }}>
                      {LEAVE_ICONS[leave.leaveType] || '📋'}
                    </div>
                    <div>
                      <div style={{ fontWeight:'600', color:'var(--text)', fontSize:'14px' }}>
                        {LEAVE_LABELS[leave.leaveType] || leave.leaveType} Leave
                        {isAdmin && leave.employee?.name && (
                          <span style={{ color:'var(--text3)', fontWeight:'400', marginLeft:'6px' }}>· {leave.employee.name}</span>
                        )}
                      </div>
                      <div style={{ fontSize:'12px', color:'var(--text3)', marginTop:'2px' }}>
                        {new Date(leave.startDate).toLocaleDateString()} → {new Date(leave.endDate).toLocaleDateString()} · {leave.days} day{leave.days !== 1 ? 's' : ''}
                      </div>
                      {leave.leaveType === 'special' && leave.document && (
                        <a href={leave.document.startsWith('http') ? leave.document : '#'} target="_blank" rel="noreferrer"
                          style={{ fontSize:'11px', color:'var(--primary)', marginTop:'3px', display:'inline-block' }}>
                          📎 View Document
                        </a>
                      )}
                    </div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'6px' }}>
                    <span className={`badge badge-${leave.status}`}>{leave.status}</span>
                    {isAdmin && leave.leaveType === 'special' && (
                      <Link to="/admin" style={{ fontSize:'11px', color:'var(--primary)', fontWeight:'600', textDecoration:'none', background:'var(--primary-light)', padding:'2px 8px', borderRadius:'6px' }}>
                        Review →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Empty State ── */}
      {leaves.length === 0 && !isAdmin && (
        <div className="empty anim-fadeInUp">
          <span className="empty-icon">📋</span>
          <p className="empty-text">No leave requests yet</p>
          <Link to="/apply" className="btn btn-primary" style={{ marginTop:'20px' }}>Apply for your first leave</Link>
        </div>
      )}
    </div>
  );
}

/* ── BalanceCard ── */
function BalanceCard({ label, value, total, color, icon, delay, conditional }) {
  const pct = conditional ? 100 : (total > 0 ? Math.round((value / total) * 100) : 0);
  return (
    <div className={`stat-card delay-${delay}`} style={{ borderLeft:`3px solid ${color}` }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'12px' }}>
        <span style={{ fontSize:'13px', fontWeight:'600', color:'var(--text2)', textTransform:'uppercase', letterSpacing:'0.05em' }}>{label}</span>
        <span style={{ fontSize:'22px' }}>{icon}</span>
      </div>
      {conditional ? (
        <div>
          <div style={{ fontSize:'22px', fontWeight:'700', color, marginBottom:'4px' }}>Conditional</div>
          <div style={{ fontSize:'12px', color:'var(--text3)' }}>Subject to admin approval</div>
        </div>
      ) : (
        <div>
          <div style={{ fontSize:'30px', fontWeight:'700', color, marginBottom:'4px' }}>
            {value} <span style={{ fontSize:'14px', color:'var(--text3)', fontWeight:'400' }}>/ {total} days</span>
          </div>
          <div className="stat-bar">
            <div className="stat-fill" style={{ width:`${pct}%`, background:color }} />
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:'6px' }}>
            <span style={{ fontSize:'11px', color:'var(--text3)' }}>{total - value} used</span>
            <span style={{ fontSize:'11px', color, fontWeight:'600' }}>{pct}% left</span>
          </div>
        </div>
      )}
    </div>
  );
}