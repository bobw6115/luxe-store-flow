import { NavLink as RouterNavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  ShoppingBag,
  ScanBarcode,
  Package,
  BarChart3,
  RotateCcw,
  Settings,
  LogOut,
} from 'lucide-react';

const navItems = [
  { title: 'POS', path: '/', icon: ScanBarcode, roles: ['admin', 'employee'] },
  { title: 'Inventory', path: '/inventory', icon: Package, roles: ['admin', 'employee'] },
  { title: 'Analytics', path: '/analytics', icon: BarChart3, roles: ['admin'] },
  { title: 'Refunds', path: '/refunds', icon: RotateCcw, roles: ['admin', 'employee'] },
  { title: 'Settings', path: '/settings', icon: Settings, roles: ['admin'] },
];

export default function AppSidebar() {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();

  const filteredItems = navItems.filter(item =>
    item.roles.includes(user?.role || 'employee')
  );

  return (
    <aside className="w-64 min-h-screen bg-sidebar flex flex-col border-r border-sidebar-border">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-serif font-bold text-foreground text-lg leading-tight">MAISON</h2>
            <p className="text-xs text-muted-foreground">HOMME</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {filteredItems.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <RouterNavLink
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-primary/10 text-primary shadow-gold'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />
              <span>{item.title}</span>
            </RouterNavLink>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">{user?.username}</p>
            <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-lg hover:bg-sidebar-accent text-muted-foreground hover:text-foreground transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
