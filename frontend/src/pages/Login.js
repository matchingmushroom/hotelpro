import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { showError } from '../components/common/ConfirmDialog';
import { isValidEmail } from '../utils/validators';

export default function Login() {
  const { signIn, user, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValidEmail(email)) return showError('Invalid email');
    if (!password) return showError('Password is required');
    setSubmitting(true);
    try {
      await signIn(email, password);
    } catch (err) {
      showError('Login failed', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <i className="fas fa-hotel"></i>
          <h1>Otel.Pro</h1>
          <p>Run Hotel Like a Pro</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
          </div>
          <button type="submit" className="btn btn-primary btn-lg auth-btn" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <div className="auth-footer">
          <Link to="/forgot-password">Forgot password?</Link>
        </div>
      </div>
      <style>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
          padding: 20px;
        }
        .auth-card {
          background: var(--white);
          border-radius: 16px;
          padding: 40px;
          width: 100%;
          max-width: 420px;
          box-shadow: var(--shadow-lg);
        }
        .auth-logo {
          text-align: center;
          margin-bottom: 32px;
        }
        .auth-logo i {
          font-size: 2.5rem;
          color: var(--accent);
          margin-bottom: 8px;
        }
        .auth-logo h1 {
          font-size: 1.75rem;
          color: var(--primary);
        }
        .auth-logo p {
          color: var(--text-muted);
          font-size: 0.9rem;
          margin-top: 4px;
        }
        .auth-btn {
          width: 100%;
          justify-content: center;
          margin-top: 8px;
        }
        .auth-footer {
          text-align: center;
          margin-top: 20px;
        }
        .auth-footer a {
          font-size: 0.85rem;
          color: var(--text-muted);
        }
        .auth-footer a:hover { color: var(--primary); }
      `}</style>
    </div>
  );
}
