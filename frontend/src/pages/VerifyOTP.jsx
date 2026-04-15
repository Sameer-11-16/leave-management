import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import API from '../api';
import { useAuth } from '../context/AuthContext';

export default function VerifyOTP() {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const registrationData = location.state || JSON.parse(sessionStorage.getItem('registrationData'));

  useEffect(() => {
    if (!registrationData) {
      toast.error('No registration data found. Please start over.');
      navigate('/register');
    }
  }, [registrationData, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!otp || otp.length < 6) return toast.error('Please enter the 6-digit code');
    
    setLoading(true);
    try {
      const payload = { ...registrationData, otp };
      const { data } = await API.post('/auth/register', payload);
      login(data);
      sessionStorage.removeItem('registrationData');
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await API.post('/auth/send-otp', { email: registrationData.email });
      toast.success('New OTP sent to your email!');
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  if (!registrationData) return null;

  return (
    <div className="auth-page">
      <div className="auth-form-side">
        <div className="auth-card anim-fadeInUp">
          <div className="auth-header">
            <div className="auth-logo">✉️</div>
            <h1 className="auth-title">Verify Email</h1>
            <p className="auth-sub">Enter the 6-digit code we sent to <strong>{registrationData.email}</strong></p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">OTP Code</label>
              <input 
                className="form-input" 
                placeholder="000000" 
                maxLength="6"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                required
                style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '8px', fontWeight: '700' }}
              />
            </div>

            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
              {loading ? 'Verifying...' : 'Complete Registration'}
            </button>
          </form>

          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <p style={{ fontSize: '13px', color: 'var(--text3)' }}>
              Didn't receive the code?{' '}
              <button 
                onClick={handleResend} 
                disabled={resending}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '600', cursor: 'pointer', padding: 0 }}
              >
                {resending ? 'Resending...' : 'Resend OTP'}
              </button>
            </p>
          </div>

          <div className="auth-footer">
            <Link to="/register" style={{ fontWeight: '500' }}>Back to Sign Up</Link>
          </div>
        </div>
      </div>

      <div className="auth-aside">
        <div className="auth-aside-content">
          <h2 className="auth-aside-title">Almost There!</h2>
          <p className="auth-aside-text">
            For security reasons, we need to verify your email address. This ensures that you're a real human and that you'll receive important notifications about your leave requests.
          </p>
        </div>
      </div>
    </div>
  );
}
