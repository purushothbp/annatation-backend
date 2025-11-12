import { PropsWithChildren } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const AppLayout = ({ children }: PropsWithChildren) => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true, state: { from: location.pathname } });
  };

  return (
    <div className="app-shell">
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem 1.5rem',
          borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
          backgroundColor: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Link to="/documents" style={{ fontWeight: 700, fontSize: '1.2rem', color: '#38bdf8' }}>
          AnnoSphere
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {user ? (
            <>
              <span className="tag">
                {user.name} · {user.role}
              </span>
              <button className="button secondary" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <Link to="/login" className="button secondary">
              Log in
            </Link>
          )}
        </div>
      </header>
      <main className="content">{children}</main>
    </div>
  );
};

export default AppLayout;
