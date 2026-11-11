import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { api, findDeep, getToken, setSession } from '../api.js';
import { LOGIN_FIELD } from '../config.js';

export default function Login() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (getToken()) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await api.post('/api/auth/login', { [LOGIN_FIELD]: identifier, password });
      const token = findDeep(res, /token|jwt/i);
      if (!token) throw new Error('Login succeeded but no token was returned.');

      const role = findDeep(res, /^role$/i);
      if (role && !/admin/i.test(role)) throw new Error('This console is restricted to administrators.');

      const user = (res && (res.user || res.data?.user)) || { email: identifier };
      setSession(token, user);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <section className="auth-hero">
        <div className="brand light">
          <span className="logo">B</span>
          <div>
            <strong>BookingHub</strong>
            <small>Admin Console</small>
          </div>
        </div>
        <div>
          <h1>Manage bookings, tests and reports in one place.</h1>
          <p>Track customer bookings, configure tests and time slots, and deliver reports — all from a single console.</p>
        </div>
        <small>© {new Date().getFullYear()} BookingHub. All rights reserved.</small>
      </section>

      <section className="auth-form-wrap">
        <form className="auth-form" onSubmit={submit}>
          <h2>Sign in</h2>
          <p className="muted">Enter your administrator credentials to continue.</p>

          {error && <div className="alert">{error}</div>}

          <label className="field">
            <span>{LOGIN_FIELD === 'email' ? 'Email address' : 'Username or phone'}</span>
            <input
              type={LOGIN_FIELD === 'email' ? 'email' : 'text'}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={LOGIN_FIELD === 'email' ? 'admin@example.com' : ''}
              required
              autoFocus
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
          </label>
          <button className="btn primary lg block" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </section>
    </div>
  );
}
