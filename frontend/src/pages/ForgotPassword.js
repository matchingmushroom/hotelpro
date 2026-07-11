import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { isValidEmail } from '../utils/validators';
import { showSuccess, showError } from '../components/common/ConfirmDialog';

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValidEmail(email)) return showError('Please enter a valid email');
    setSubmitting(true);
    try {
      await resetPassword(email);
      setSent(true);
      showSuccess('Email sent', 'Check your inbox for the password reset link');
    } catch (err) {
      showError('Failed', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <i className="fas fa-key"></i>
          <h1>Reset Password</h1>
          <p>{sent ? 'Check your email for the reset link' : 'Enter your email to receive a reset link'}</p>
        </div>
        {!sent && (
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
            <button type="submit" className="btn btn-primary btn-lg auth-btn" disabled={submitting}>
              {submitting ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}
        <div className="auth-footer">
          <Link to="/login">Back to login</Link>
        </div>
      </div>
    </div>
  );
}
