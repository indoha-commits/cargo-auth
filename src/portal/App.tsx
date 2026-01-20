import { useState } from 'react';
import { Lock, User } from 'lucide-react';
import { login, signOut } from './supabase';

type MeResponse = {
  id: string;
  email: string;
  role: 'client' | 'ops' | 'admin';
  client_id: string | null;
};

function env(name: string, fallback?: string) {
  return (import.meta.env[name] as string | undefined) ?? fallback;
}

const apiBaseUrl = env('VITE_API_BASE_URL', 'http://localhost:8787');
const internalDashboardUrl = env('VITE_INTERNAL_DASHBOARD_URL', 'http://localhost:5173');
const clientDashboardUrl = env('VITE_CLIENT_DASHBOARD_URL', 'http://localhost:5174');

export function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const session = await login(email, password);
      if (!session) throw new Error('No session returned');

      const meRes = await fetch(`${apiBaseUrl}/me`, {
        headers: { authorization: `Bearer ${session.access_token}` },
      });

      if (!meRes.ok) {
        const txt = await meRes.text().catch(() => '');
        throw new Error(`Role lookup failed: ${meRes.status} ${txt}`);
      }

      const me = (await meRes.json()) as MeResponse;

      const targetBase = me.role === 'ops' || me.role === 'admin'
        ? internalDashboardUrl
        : clientDashboardUrl;

      const target = new URL(targetBase);
      target.pathname = '/auth/callback';
      target.hash = new URLSearchParams({
        access_token: session.access_token,
        refresh_token: session.refresh_token ?? '',
      }).toString();

      // hard redirect
      window.location.href = target.toString();
    } catch (e) {
      // ensure we don't keep a partial session on failure
      await signOut();
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="portal-shell">
      <div>
        <div className="portal-card">
          <h1 style={{ color: '#0a1628', margin: '0 0 8px 0' }}>Cargo Management System</h1>
          <p style={{ color: '#64748b', margin: '0 0 24px 0' }}>Sign in to continue</p>

          {error && <div className="portal-error">{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="portal-label">Email</label>
              <div style={{ position: 'relative' }}>
                <User size={16} color="#64748b" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  className="portal-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="user@company.com"
                />
              </div>
            </div>

            <div>
              <label className="portal-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="#64748b" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  className="portal-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button type="submit" disabled={submitting} className="portal-button">
              {submitting ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="portal-footer">© 2026 Cargo Management System</p>
      </div>
    </div>
  );
}
