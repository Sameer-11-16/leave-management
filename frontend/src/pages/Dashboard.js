import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api';

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: profileData } = await API.get('/users/me');
        setProfile(profileData);
        const endpoint = user?.role === 'admin' ? '/leaves/all' : '/leaves/my';
        const { data: leavesData } = await API.get(endpoint);
        setLeaves(Array.isArray(leavesData) ? leavesData : []);
      } catch (err) {
        setLeaves([]);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchData();
  }, [user]);

  const stats = {
    pending: leaves.filter(l => l.status === 'pending').length,
    approved: leaves.filter(l => l.status === 'approved').length,
    rejected: leaves.filter(l => l.status === 'rejected').length,
  };

  const typeCount = {
    casual: leaves.filter(l => l.leaveType === 'casual').length,
    sick: leaves.filter(l => l.leaveType === 'sick').length,
    annual: leaves.filter(l => l.leaveType === 'annual').length,
  };

  const balance = profile?.leaveBalance;
  const recentLeaves = leaves.slice(0, 4);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div style={S.loadingPage}>
        <div style={S.spinner} />
        <p style={{ color: '#64748b', marginTop: '16px' }}>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div style={S.page}>

      {/* ── Header ── */}
      <div style={S.header}>
        <div>
          <h1 style={S.title}>{getGreeting()}, {user?.name?.split(' ')[0]} 👋</h1>
          <p style={S.subtitle}>{user?.department} · {user?.role === 'admin' ? 'Administrator' : 'Employee'}</p>
        </div>
        {user?.role === 'employee' && (
          <Link to="/apply" style={S.applyBtn}>+ Apply Leave</Link>
        )}
      </div>

      {/* ── Stat Cards ── */}
      <div style={S.grid3}>
        <StatCard label="Pending" value={stats.pending} color="#f59e0b" lightBg="#fffbeb" icon="⏳" />
        <StatCard label="Approved" value={stats.approved} color="#10b981" lightBg="#ecfdf5" icon="✅" />
        <StatCard label="Rejected" value={stats.rejected} color="#ef4444" lightBg="#fef2f2" icon="❌" />
      </div>

      {/* ── Leave Balance (Employee) ── */}
      {user?.role === 'employee' && balance && (
        <div style={S.section}>
          <p style={S.sectionTitle}>Leave Balance</p>
          <div style={S.grid3}>
            <BalanceCard label="Casual" value={balance.casual} total={10} color="#7c3aed" />
            <BalanceCard label="Sick" value={balance.sick} total={7} color="#db2777" />
            <BalanceCard label="Annual" value={balance.annual} total={15} color="#0284c7" />
          </div>
        </div>
      )}

      {/* ── Charts Row ── */}
      {leaves.length > 0 && (
        <div style={S.chartsRow}>

          {/* Donut Chart - Leave Types */}
          <div style={S.chartCard}>
            <p style={S.cardTitle}>Leave by Type</p>
            <DonutChart
              data={[
                { label: 'Casual', value: typeCount.casual, color: '#7c3aed' },
                { label: 'Sick', value: typeCount.sick, color: '#db2777' },
                { label: 'Annual', value: typeCount.annual, color: '#0284c7' },
              ]}
            />
          </div>

          {/* Donut Chart - Status */}
          <div style={S.chartCard}>
            <p style={S.cardTitle}>Leave by Status</p>
            <DonutChart
              data={[
                { label: 'Approved', value: stats.approved, color: '#10b981' },
                { label: 'Pending', value: stats.pending, color: '#f59e0b' },
                { label: 'Rejected', value: stats.rejected, color: '#ef4444' },
              ]}
            />
          </div>

          {/* Monthly Bar Chart */}
          <div style={{ ...S.chartCard, flex: 2 }}>
            <p style={S.cardTitle}>Monthly Overview</p>
            <MonthlyChart leaves={leaves} />
          </div>
        </div>
      )}

      {/* ── Recent Leaves ── */}
      {recentLeaves.length > 0 && (
        <div style={S.section}>
          <div style={S.sectionHeader}>
            <p style={S.sectionTitle}>Recent Requests</p>
            <Link to={user?.role === 'admin' ? '/admin' : '/my-leaves'} style={S.viewAll}>
              View all →
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recentLeaves.map(leave => (
              <RecentLeaveRow key={leave._id} leave={leave} isAdmin={user?.role === 'admin'} />
            ))}
          </div>
        </div>
      )}

      {/* ── Empty State ── */}
      {leaves.length === 0 && user?.role === 'employee' && (
        <div style={S.emptyState}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
          <p style={{ color: '#64748b', fontSize: '15px', marginBottom: '16px' }}>No leave requests yet</p>
          <Link to="/apply" style={S.applyBtn}>Apply for your first leave</Link>
        </div>
      )}
    </div>
  );
}

/* ── Stat Card ── */
function StatCard({ label, value, color, lightBg, icon }) {
  return (
    <div style={{ ...S.card, borderTop: `3px solid ${color}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '36px', fontWeight: '700', color, lineHeight: 1 }}>{value}</div>
          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '6px' }}>{label} Leaves</div>
        </div>
        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: lightBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

/* ── Balance Card ── */
function BalanceCard({ label, value, total, color }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div style={S.card}>
      <div style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: '30px', fontWeight: '700', color, marginBottom: '12px' }}>
        {value} <span style={{ fontSize: '14px', color: '#94a3b8', fontWeight: '400' }}>/ {total} days</span>
      </div>
      <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '99px', overflow: 'hidden' }}>
        <div style={{ height: '6px', width: `${pct}%`, background: color, borderRadius: '99px', transition: 'width 0.8s ease' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
        <span style={{ fontSize: '11px', color: '#94a3b8' }}>{total - value} used</span>
        <span style={{ fontSize: '11px', color, fontWeight: '600' }}>{pct}% remaining</span>
      </div>
    </div>
  );
}

/* ── SVG Donut Chart ── */
function DonutChart({ data }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <div style={{ textAlign: 'center', color: '#94a3b8', padding: '32px 0', fontSize: '13px' }}>No data yet</div>;

  const size = 140;
  const cx = size / 2;
  const cy = size / 2;
  const r = 52;
  const innerR = 34;

  let cumulative = 0;
  const slices = data.filter(d => d.value > 0).map(d => {
    const angle = (d.value / total) * 360;
    const startAngle = cumulative;
    cumulative += angle;
    return { ...d, startAngle, angle };
  });

  const toRad = deg => (deg - 90) * Math.PI / 180;
  const arcPath = (start, angle, outerR, innerR) => {
    if (angle >= 360) angle = 359.99;
    const x1 = cx + outerR * Math.cos(toRad(start));
    const y1 = cy + outerR * Math.sin(toRad(start));
    const x2 = cx + outerR * Math.cos(toRad(start + angle));
    const y2 = cy + outerR * Math.sin(toRad(start + angle));
    const x3 = cx + innerR * Math.cos(toRad(start + angle));
    const y3 = cy + innerR * Math.sin(toRad(start + angle));
    const x4 = cx + innerR * Math.cos(toRad(start));
    const y4 = cy + innerR * Math.sin(toRad(start));
    const large = angle > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${outerR} ${outerR} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerR} ${innerR} 0 ${large} 0 ${x4} ${y4} Z`;
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
      <svg width={size} height={size} style={{ flexShrink: 0 }}>
        {slices.map((s, i) => (
          <path key={i} d={arcPath(s.startAngle, s.angle, r, innerR)} fill={s.color} opacity="0.9" />
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="20" fontWeight="700" fill="#1e293b">{total}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize="10" fill="#94a3b8">total</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: d.color, flexShrink: 0 }} />
            <span style={{ fontSize: '12px', color: '#64748b' }}>{d.label}</span>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b', marginLeft: 'auto' }}>{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── SVG Bar Chart ── */
function MonthlyChart({ leaves }) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const map = {};
  leaves.forEach(l => {
    const key = months[new Date(l.startDate).getMonth()];
    if (!map[key]) map[key] = { month: key, casual: 0, sick: 0, annual: 0 };
    if (map[key][l.leaveType] !== undefined) map[key][l.leaveType]++;
  });

  const data = Object.values(map).slice(-6);
  if (data.length === 0) return <div style={{ textAlign: 'center', color: '#94a3b8', padding: '32px 0', fontSize: '13px' }}>No data yet</div>;

  const maxVal = Math.max(...data.map(d => d.casual + d.sick + d.annual), 1);
  const chartH = 140;
  const barW = 28;
  const gap = 16;
  const totalW = data.length * (barW * 3 + gap + 8);
  const colors = { casual: '#7c3aed', sick: '#db2777', annual: '#0284c7' };

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg width={Math.max(totalW, 300)} height={chartH + 36}>
        {data.map((d, i) => {
          const groupX = i * (barW * 3 + gap + 8) + 8;
          return (
            <g key={i}>
              {['casual', 'sick', 'annual'].map((type, j) => {
                const h = Math.max((d[type] / maxVal) * chartH, d[type] > 0 ? 4 : 0);
                const x = groupX + j * barW;
                const y = chartH - h;
                return (
                  <g key={type}>
                    <rect x={x} y={y} width={barW - 3} height={h} fill={colors[type]} rx="3" opacity="0.85" />
                    {d[type] > 0 && <text x={x + (barW - 3) / 2} y={y - 4} textAnchor="middle" fontSize="10" fill={colors[type]} fontWeight="600">{d[type]}</text>}
                  </g>
                );
              })}
              <text x={groupX + barW * 1.5} y={chartH + 18} textAnchor="middle" fontSize="11" fill="#94a3b8">{d.month}</text>
            </g>
          );
        })}
        <line x1="0" y1={chartH} x2={Math.max(totalW, 300)} y2={chartH} stroke="#f1f5f9" strokeWidth="1" />
      </svg>
      <div style={{ display: 'flex', gap: '16px', marginTop: '8px', flexWrap: 'wrap' }}>
        {Object.entries(colors).map(([type, color]) => (
          <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: color }} />
            <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'capitalize' }}>{type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Recent Leave Row ── */
function RecentLeaveRow({ leave, isAdmin }) {
  const typeIcons = { casual: '🏖️', sick: '🤒', annual: '✈️' };
  const typeColors = { casual: '#7c3aed', sick: '#db2777', annual: '#0284c7' };
  const statusStyle = {
    pending: { background: '#fffbeb', color: '#d97706' },
    approved: { background: '#ecfdf5', color: '#059669' },
    rejected: { background: '#fef2f2', color: '#dc2626' },
  };
  const color = typeColors[leave.leaveType] || '#64748b';

  return (
    <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #f1f5f9', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
          {typeIcons[leave.leaveType] || '📋'}
        </div>
        <div>
          <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>
            {leave.leaveType?.charAt(0).toUpperCase() + leave.leaveType?.slice(1)} Leave
            {isAdmin && leave.employee?.name && (
              <span style={{ color: '#94a3b8', fontWeight: '400', marginLeft: '6px' }}>· {leave.employee.name}</span>
            )}
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
            {leave.startDate ? new Date(leave.startDate).toLocaleDateString() : ''} → {leave.endDate ? new Date(leave.endDate).toLocaleDateString() : ''} · {leave.days} day{leave.days !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
      <span style={{ padding: '4px 12px', borderRadius: '99px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.04em', textTransform: 'uppercase', ...(statusStyle[leave.status] || {}) }}>
        {leave.status}
      </span>
    </div>
  );
}

/* ── Styles ── */
const S = {
  page: { maxWidth: '960px', margin: '0 auto', padding: '32px 20px' },
  loadingPage: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' },
  spinner: { width: '36px', height: '36px', border: '3px solid #e2e8f0', borderTop: '3px solid #2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '28px' },
  title: { fontFamily: "'DM Serif Display', serif", fontSize: '28px', color: '#0f172a', margin: 0 },
  subtitle: { color: '#64748b', fontSize: '14px', marginTop: '4px' },
  applyBtn: { display: 'inline-flex', alignItems: 'center', padding: '10px 20px', background: '#2563eb', color: '#fff', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: '600', whiteSpace: 'nowrap' },
  grid3: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' },
  card: { background: '#fff', borderRadius: '14px', padding: '20px', border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  section: { marginBottom: '28px' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  sectionTitle: { fontFamily: "'DM Serif Display', serif", fontSize: '20px', color: '#0f172a', margin: 0 },
  viewAll: { fontSize: '13px', color: '#2563eb', textDecoration: 'none' },
  chartsRow: { display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '16px', marginBottom: '28px' },
  chartCard: { background: '#fff', borderRadius: '14px', padding: '20px', border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', minWidth: 0 },
  cardTitle: { fontWeight: '600', color: '#1e293b', fontSize: '14px', marginBottom: '16px', margin: '0 0 16px 0' },
  emptyState: { textAlign: 'center', padding: '60px 20px' },
};