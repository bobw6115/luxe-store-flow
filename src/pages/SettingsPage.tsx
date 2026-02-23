import { useState } from 'react';
import { getSettings, updateSettings, getUsers, addUser, deleteUser, resetUserPassword } from '@/lib/store';
import { StoreSettings, User } from '@/types/pos';
import { DollarSign, Users, Store, Trash2, Key, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [settings, setSettings] = useState<StoreSettings>(getSettings());
  const [users, setUsersState] = useState<User[]>(getUsers());
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'employee'>('employee');
  const [resetModal, setResetModal] = useState<string | null>(null);
  const [resetPwd, setResetPwd] = useState('');

  const saveSettings = (updates: Partial<StoreSettings>) => {
    const updated = { ...settings, ...updates };
    setSettings(updated);
    updateSettings(updates);
    toast.success('Settings saved');
  };

  const handleAddUser = () => {
    if (!newUsername || !newPassword) { toast.error('Fill all fields'); return; }
    addUser(newUsername, newPassword, newRole);
    setUsersState(getUsers());
    setShowAddUser(false);
    setNewUsername('');
    setNewPassword('');
    toast.success('User created');
  };

  const handleDeleteUser = (id: string) => {
    deleteUser(id);
    setUsersState(getUsers());
    toast.success('User deleted');
  };

  const handleResetPassword = () => {
    if (!resetModal || !resetPwd) return;
    resetUserPassword(resetModal, resetPwd);
    setResetModal(null);
    setResetPwd('');
    toast.success('Password reset');
  };

  return (
    <div className="p-6 max-w-3xl animate-fade-in">
      <h1 className="font-serif text-2xl font-bold text-foreground mb-8">Settings</h1>

      {/* Currency Settings */}
      <section className="glass-card rounded-xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <DollarSign className="w-5 h-5 text-primary" />
          <h2 className="font-serif text-lg font-semibold text-foreground">Currency Settings</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm text-muted-foreground">Enable LBP Currency</label>
            <button
              onClick={() => saveSettings({ enableLbp: !settings.enableLbp })}
              className={`w-12 h-6 rounded-full transition-colors relative ${settings.enableLbp ? 'gold-gradient' : 'bg-secondary'}`}
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-foreground transition-transform ${settings.enableLbp ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">1 USD = ? LBP</label>
            <input
              type="number"
              value={settings.usdToLbpRate}
              onChange={e => saveSettings({ usdToLbpRate: parseInt(e.target.value) || 0 })}
              className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>
        </div>
      </section>

      {/* Employee Management */}
      <section className="glass-card rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-primary" />
            <h2 className="font-serif text-lg font-semibold text-foreground">Employees</h2>
          </div>
          <button
            onClick={() => setShowAddUser(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg gold-gradient text-primary-foreground text-sm font-semibold hover:opacity-90"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>

        <div className="space-y-2">
          {users.map(u => (
            <div key={u.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary">
              <div>
                <p className="text-foreground text-sm font-medium">{u.username}</p>
                <p className="text-xs text-muted-foreground capitalize">{u.role}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => { setResetModal(u.id); setResetPwd(''); }} className="p-2 rounded-lg hover:bg-surface-hover text-muted-foreground hover:text-foreground transition-colors">
                  <Key className="w-4 h-4" />
                </button>
                <button onClick={() => handleDeleteUser(u.id)} className="p-2 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {showAddUser && (
          <div className="mt-4 p-4 rounded-xl bg-muted animate-fade-in space-y-3">
            <input value={newUsername} onChange={e => setNewUsername(e.target.value)} placeholder="Username" className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Password" className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
            <select value={newRole} onChange={e => setNewRole(e.target.value as any)} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary/50">
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
            </select>
            <div className="flex gap-2">
              <button onClick={() => setShowAddUser(false)} className="flex-1 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm">Cancel</button>
              <button onClick={handleAddUser} className="flex-1 py-2 rounded-lg gold-gradient text-primary-foreground text-sm font-semibold">Create</button>
            </div>
          </div>
        )}
      </section>

      {/* Store Settings */}
      <section className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Store className="w-5 h-5 text-primary" />
          <h2 className="font-serif text-lg font-semibold text-foreground">Store Info</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Store Name</label>
            <input
              value={settings.storeName}
              onChange={e => saveSettings({ storeName: e.target.value })}
              className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Receipt Footer</label>
            <input
              value={settings.receiptFooter}
              onChange={e => saveSettings({ receiptFooter: e.target.value })}
              className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>
        </div>
      </section>

      {/* Reset Password Modal */}
      {resetModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="glass-card rounded-2xl p-6 w-80 animate-scale-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-serif font-bold text-foreground">Reset Password</h3>
              <button onClick={() => setResetModal(null)} className="p-1 hover:bg-secondary rounded-lg"><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            <input type="password" value={resetPwd} onChange={e => setResetPwd(e.target.value)} placeholder="New password" className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-foreground mb-4 placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
            <button onClick={handleResetPassword} className="w-full py-2.5 rounded-xl gold-gradient text-primary-foreground font-semibold">Reset</button>
          </div>
        </div>
      )}
    </div>
  );
}
