import { useState, type SubmitEvent } from 'react';
import { useService } from '../context/ServiceContext';

export default function Login() {
  const { state,  authenticate } = useService();
  const [mode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    void authenticate(mode, email, password);
  };


  return (
    <div className="login-page">
      <form className="card login-card" onSubmit={handleSubmit}>
        <h1>
          <span>ServiceHub</span>
        </h1>
        <p className="muted">sign in to continue</p>

        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>

        {state.error && <p className="error">{state.error}</p>}

        <button type="submit" disabled={state.loading}>
          {state.loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
