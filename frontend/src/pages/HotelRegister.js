import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { showSuccess, showError } from '../components/common/ConfirmDialog';
import { isValidEmail } from '../utils/validators';

const CURRENCIES = [
  { value: 'NPR', label: 'NPR', flag: '🇳🇵', name: 'Nepalese Rupee' },
  { value: 'USD', label: 'USD', flag: '🇺🇸', name: 'US Dollar' },
  { value: 'EUR', label: 'EUR', flag: '🇪🇺', name: 'Euro' },
  { value: 'GBP', label: 'GBP', flag: '🇬🇧', name: 'British Pound' },
  { value: 'INR', label: 'INR', flag: '🇮🇳', name: 'Indian Rupee' },
];

export default function HotelRegister() {
  const { user, loading, registerHotel } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    hotel_name: '',
    hotel_email: '',
    hotel_phone: '',
    hotel_address: '',
    currency: 'NPR',
    admin_name: '',
    admin_email: '',
    admin_password: '',
    admin_phone: '',
  });

  const [errors, setErrors] = useState({});

  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;

  const update = (field, value) => {
    setForm(p => ({ ...p, [field]: value }));
    if (errors[field]) setErrors(p => ({ ...p, [field]: '' }));
  };

  const validateStep1 = () => {
    const e = {};
    if (!form.hotel_name.trim()) e.hotel_name = 'Hotel name is required';
    if (form.hotel_email && !isValidEmail(form.hotel_email)) e.hotel_email = 'Invalid email format';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const validateStep2 = () => {
    const e = {};
    if (!form.admin_name.trim()) e.admin_name = 'Admin name is required';
    if (!form.admin_email.trim()) e.admin_email = 'Admin email is required';
    else if (!isValidEmail(form.admin_email)) e.admin_email = 'Invalid email format';
    if (!form.admin_password) e.admin_password = 'Password is required';
    else if (form.admin_password.length < 6) e.admin_password = 'Minimum 6 characters';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateStep2()) return;
    setSubmitting(true);
    try {
      const res = await registerHotel(form);
      showSuccess('Hotel Registered!', res.message || 'You can now log in with your admin account.');
      navigate('/login');
    } catch (err) {
      showError('Registration failed', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="reg-page">
      <div className="reg-container">
        <div className="reg-card">
          <div className="reg-header">
            <div className="reg-logo">
              <i className="fas fa-hotel"></i>
            </div>
            <h1>Get started</h1>
            <p>Create your hotel account — takes less than 2 minutes</p>
          </div>

          <div className="reg-progress">
            <div className="reg-p-step">
              <div className={`reg-p-circle ${step === 1 ? 'active' : step > 1 ? 'done' : ''}`}>
                {step > 1 ? <i className="fas fa-check"></i> : '1'}
              </div>
              <span className={`reg-p-label ${step === 1 ? 'active' : ''}`}>Hotel Details</span>
            </div>
            <div className={`reg-p-line ${step > 1 ? 'done' : ''}`}></div>
            <div className="reg-p-step">
              <div className={`reg-p-circle ${step === 2 ? 'active' : ''}`}>2</div>
              <span className={`reg-p-label ${step === 2 ? 'active' : ''}`}>Admin Account</span>
            </div>
          </div>

          <form onSubmit={handleRegister}>
            {step === 1 && (
              <div className="reg-fields fade-in">
                <div className="form-group">
                  <label className="form-label">Hotel Name <span className="text-danger">*</span></label>
                  <div className="input-icon-group">
                    <i className="fas fa-hotel input-icon"></i>
                    <input
                      className={`form-control ${errors.hotel_name ? 'is-invalid' : ''}`}
                      value={form.hotel_name}
                      onChange={e => update('hotel_name', e.target.value)}
                      placeholder="e.g. Grand Hotel"
                      autoFocus
                    />
                  </div>
                  {errors.hotel_name && <div className="invalid-feedback">{errors.hotel_name}</div>}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <div className="input-icon-group">
                      <i className="fas fa-envelope input-icon"></i>
                      <input
                        className={`form-control ${errors.hotel_email ? 'is-invalid' : ''}`}
                        type="email"
                        value={form.hotel_email}
                        onChange={e => update('hotel_email', e.target.value)}
                        placeholder="hotel@example.com"
                      />
                    </div>
                    {errors.hotel_email && <div className="invalid-feedback">{errors.hotel_email}</div>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <div className="input-icon-group">
                      <i className="fas fa-phone input-icon"></i>
                      <input
                        className="form-control"
                        value={form.hotel_phone}
                        onChange={e => update('hotel_phone', e.target.value)}
                        placeholder="+977 98..."
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Address</label>
                  <div className="input-icon-group">
                    <i className="fas fa-map-marker-alt input-icon"></i>
                    <input
                      className="form-control"
                      value={form.hotel_address}
                      onChange={e => update('hotel_address', e.target.value)}
                      placeholder="City, Street"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Currency</label>
                  <div className="input-icon-group">
                    <i className="fas fa-money-bill-wave input-icon"></i>
                    <select
                      className="form-control"
                      value={form.currency}
                      onChange={e => update('currency', e.target.value)}
                    >
                      {CURRENCIES.map(c => (
                        <option key={c.value} value={c.value}>{c.flag} {c.label} — {c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-primary btn-block"
                  onClick={() => { if (validateStep1()) setStep(2); }}
                >
                  Continue <i className="fas fa-arrow-right"></i>
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="reg-fields fade-in">
                <div className="reg-summary">
                  <div className="reg-summary-icon">
                    <i className="fas fa-hotel"></i>
                  </div>
                  <div>
                    <div className="reg-summary-name">{form.hotel_name}</div>
                    <div className="reg-summary-meta">{form.hotel_email || form.hotel_phone || 'No contact info'}</div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Admin Name <span className="text-danger">*</span></label>
                  <div className="input-icon-group">
                    <i className="fas fa-user input-icon"></i>
                    <input
                      className={`form-control ${errors.admin_name ? 'is-invalid' : ''}`}
                      value={form.admin_name}
                      onChange={e => update('admin_name', e.target.value)}
                      placeholder="Your full name"
                      autoFocus
                    />
                  </div>
                  {errors.admin_name && <div className="invalid-feedback">{errors.admin_name}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label">Admin Email <span className="text-danger">*</span></label>
                  <div className="input-icon-group">
                    <i className="fas fa-envelope input-icon"></i>
                    <input
                      className={`form-control ${errors.admin_email ? 'is-invalid' : ''}`}
                      type="email"
                      value={form.admin_email}
                      onChange={e => update('admin_email', e.target.value)}
                      placeholder="you@example.com"
                    />
                  </div>
                  {errors.admin_email && <div className="invalid-feedback">{errors.admin_email}</div>}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Password <span className="text-danger">*</span></label>
                    <div className="input-icon-group">
                      <i className="fas fa-lock input-icon"></i>
                      <input
                        className={`form-control ${errors.admin_password ? 'is-invalid' : ''}`}
                        type="password"
                        value={form.admin_password}
                        onChange={e => update('admin_password', e.target.value)}
                        placeholder="Min. 6 characters"
                      />
                    </div>
                    {errors.admin_password && <div className="invalid-feedback">{errors.admin_password}</div>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <div className="input-icon-group">
                      <i className="fas fa-phone-alt input-icon"></i>
                      <input
                        className="form-control"
                        value={form.admin_phone}
                        onChange={e => update('admin_phone', e.target.value)}
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                </div>

                <div className="reg-btn-row">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setStep(1)}
                  >
                    <i className="fas fa-arrow-left"></i> Back
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-check"></i>}
                    {submitting ? 'Creating...' : 'Create Hotel'}
                  </button>
                </div>
              </div>
            )}
          </form>

          <div className="reg-footer">
            Already have an account? <Link to="/login">Sign In</Link>
          </div>
        </div>
      </div>

      <style>{`
        .reg-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-body);
          padding: 24px;
        }

        .reg-container {
          width: 100%;
          max-width: 520px;
        }

        .reg-card {
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 36px 32px 28px;
          box-shadow: var(--shadow-lg);
        }

        .reg-header {
          text-align: center;
          margin-bottom: 28px;
        }

        .reg-logo {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          background: linear-gradient(135deg, var(--primary), var(--primary-dark));
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          font-size: 1.4rem;
          color: var(--white);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        .reg-header h1 {
          color: var(--text-primary);
          font-size: 1.4rem;
          font-weight: 700;
          margin-bottom: 6px;
        }

        .reg-header p {
          color: var(--text-secondary);
          font-size: 0.88rem;
        }

        /* ── Progress stepper ── */
        .reg-progress {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 28px;
        }

        .reg-p-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }

        .reg-p-circle {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.85rem;
          font-weight: 600;
          background: var(--bg-subtle);
          color: var(--text-muted);
          border: 2px solid var(--border-color);
          transition: all 0.3s ease;
        }

        .reg-p-circle.active {
          background: var(--primary);
          border-color: var(--primary);
          color: var(--white);
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.15);
        }

        .reg-p-circle.done {
          background: var(--success);
          border-color: var(--success);
          color: var(--white);
        }

        .reg-p-label {
          font-size: 0.72rem;
          color: var(--text-muted);
          font-weight: 500;
        }

        .reg-p-label.active {
          color: var(--primary);
          font-weight: 600;
        }

        .reg-p-line {
          width: 60px;
          height: 2px;
          background: var(--border-color);
          margin: 0 10px;
          margin-bottom: 24px;
          border-radius: 2px;
          transition: background 0.3s ease;
        }

        .reg-p-line.done {
          background: var(--success);
        }

        /* ── Fields ── */
        .reg-fields {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .input-icon-group {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          font-size: 0.85rem;
          pointer-events: none;
          z-index: 2;
        }

        .input-icon-group .form-control {
          padding-left: 42px;
        }

        .input-icon-group select.form-control {
          padding-left: 42px;
        }

        .text-danger {
          color: var(--error);
        }

        /* ── Summary ── */
        .reg-summary {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          background: var(--bg-subtle);
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
          margin-bottom: 4px;
        }

        .reg-summary-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: linear-gradient(135deg, var(--primary), var(--primary-dark));
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--white);
          font-size: 1rem;
          flex-shrink: 0;
        }

        .reg-summary-name {
          font-weight: 600;
          color: var(--text-primary);
          font-size: 0.92rem;
        }

        .reg-summary-meta {
          font-size: 0.78rem;
          color: var(--text-muted);
          margin-top: 2px;
        }

        /* ── Buttons ── */
        .reg-btn-row {
          display: flex;
          gap: 10px;
          margin-top: 4px;
        }

        .reg-btn-row .btn {
          flex: 1;
        }

        .btn-block {
          width: 100%;
        }

        .reg-footer {
          text-align: center;
          margin-top: 22px;
          padding-top: 18px;
          border-top: 1px solid var(--border-color);
          font-size: 0.85rem;
          color: var(--text-muted);
        }

        .reg-footer a {
          color: var(--primary);
          font-weight: 600;
        }

        .reg-footer a:hover {
          color: var(--primary-dark);
        }

        .fade-in {
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 480px) {
          .reg-page { padding: 16px; align-items: flex-start; padding-top: 40px; }
          .reg-card { padding: 24px 20px 20px; }
          .form-row { grid-template-columns: 1fr; }
          .reg-header h1 { font-size: 1.25rem; }
          .reg-p-line { width: 36px; }
          .reg-btn-row { flex-direction: column; }
        }
      `}</style>
    </div>
  );
}
