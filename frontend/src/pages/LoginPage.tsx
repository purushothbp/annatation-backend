import { FormEvent, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { login } from '../services/authService';
import { useAuthStore } from '../store/authStore';

const LoginPage = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setAuth(data);
      navigate('/documents', { replace: true });
    },
    onError: (err: Error | any) => {
      setError(err?.response?.data?.message || err.message || 'Login failed');
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    mutation.mutate({ email, password });
  };

  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: '5vh' }}>
      <form onSubmit={handleSubmit} className="card" style={{ width: 'min(420px, 90%)', display: 'grid', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: '0 0 0.5rem 0' }}>Welcome back</h1>
          <p style={{ margin: 0, color: 'rgba(148, 163, 184, 0.8)' }}>
            Sign in to continue annotating documents in real-time.
          </p>
        </div>

        <label>
          <span style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem' }}>Email</span>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label>
          <span style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem' }}>Password</span>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        {error ? (
          <div
            style={{
              padding: '0.75rem',
              borderRadius: '0.5rem',
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              color: '#fca5a5',
            }}
          >
            {error}
          </div>
        ) : null}

        <button className="button" type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Signing in…' : 'Sign in'}
        </button>

        <p style={{ fontSize: '0.9rem', color: 'rgba(148, 163, 184, 0.8)' }}>
          Need an account?{' '}
          <Link to="/register" style={{ color: '#38bdf8' }}>
            Register
          </Link>
        </p>
      </form>
    </div>
  );
};

export default LoginPage;
