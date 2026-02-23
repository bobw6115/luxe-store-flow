import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ShoppingBag } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTimeout(() => {
      const success = login(username, password);
      if (!success) setError('Invalid credentials');
      setLoading(false);
    }, 400);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gold-gradient mb-4">
            <ShoppingBag className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-foreground">MAISON HOMME</h1>
          <p className="text-muted-foreground mt-1 text-sm">Premium Men's Fashion POS</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card rounded-xl p-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder="Enter username"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder="Enter password"
            />
          </div>

          {error && (
            <p className="text-destructive text-sm animate-fade-in">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg gold-gradient text-primary-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <div className="text-center text-xs text-muted-foreground space-y-1 pt-2">
            <p>Admin: admin / admin123</p>
            <p>Cashier: cashier / cashier123</p>
          </div>
        </form>
      </div>
    </div>
  );
}
