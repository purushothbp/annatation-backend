import { FormEvent, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { register } from '../services/authService';
import { useAuthStore } from '../store/authStore';

const RegisterPage = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'owner' | 'editor' | 'viewer'>('editor');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: register,
    onSuccess: (data) => {
      setAuth(data);
      navigate('/documents', { replace: true });
    },
    onError: (err: Error | any) => {
      setError(err?.response?.data?.message || err.message || 'Registration failed');
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    mutation.mutate({ name, email, password, role });
  };

  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: '5vh' }}>
      <form onSubmit={handleSubmit} className="card" style={{ width: 'min(480px, 90%)', display: 'grid', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: '0 0 0.5rem 0' }}>Create an account</h1>
          <p style={{ margin: 0, color: 'rgba(148, 163, 184, 0.8)' }}>
            Start collaborating on PDF annotations with your team.
          </p>
        </div>

        <label>
          <span style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem' }}>Name</span>
          <input className="input" value={name} onChange={(event) => setName(event.target.value)} required />
        </label>

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
            minLength={6}
          />
        </label>

        <label>
          <span style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem' }}>Role</span>
          <select className="input" value={role} onChange={(event) => setRole(event.target.value as typeof role)}>
            <option value="owner">Owner</option>
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>
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
          {mutation.isPending ? 'Creating account…' : 'Register'}
        </button>

        <p style={{ fontSize: '0.9rem', color: 'rgba(148, 163, 184, 0.8)' }}>
          Already have access?{' '}
          <Link to="/login" style={{ color: '#38bdf8' }}>
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
};

export default RegisterPage;
