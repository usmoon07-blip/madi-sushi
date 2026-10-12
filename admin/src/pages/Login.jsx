import { useState } from 'react';
import { api } from '../api.js';

export default function Login({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { token } = await api.login(password);
      onLogin(token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login">
      <form className="login__card" onSubmit={submit}>
        <span className="logo__mark logo__mark--lg">鮨</span>
        <h1>Madi Sushi</h1>
        <p className="muted">Admin panelga kirish</p>
        <input type="password" autoFocus placeholder="Parol" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <div className="error">{error}</div>}
        <button className="btn btn--primary btn--block" disabled={loading || !password}>
          {loading ? 'Tekshirilmoqda...' : 'Kirish'}
        </button>
      </form>
    </div>
  );
}
