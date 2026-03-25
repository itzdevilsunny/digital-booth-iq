import { useState, useEffect } from 'react';
import { getUsers, getBooths, seedData, healthCheck } from './api';
import PannaDashboard from './components/roles/PannaDashboard';
import AdminDashboard from './components/roles/AdminDashboard';
import WorkerDashboard from './components/roles/WorkerDashboard';
import CitizenDashboard from './components/roles/CitizenDashboard';
import AnalystDashboard from './components/roles/AnalystDashboard';
import { Users, Shield, Wrench, UserCircle, BarChart3, ChevronDown, MapPin, Database, CheckCircle } from 'lucide-react';

const ROLE_CONFIG = {
  panna: { label: 'Panna Pramukh', icon: Users, color: '#FF6B00', desc: 'Voter management & outreach' },
  admin: { label: 'Booth Adhyaksh', icon: Shield, color: '#1B2A4A', desc: 'Grievance management' },
  worker: { label: 'Field Worker', icon: Wrench, color: '#059669', desc: 'Task resolution' },
  citizen: { label: 'Citizen', icon: UserCircle, color: '#3B82F6', desc: 'Submit & track issues' },
  analyst: { label: 'Analyst', icon: BarChart3, color: '#8B5CF6', desc: 'View analytics' },
};

const DASHBOARD_MAP = {
  panna: PannaDashboard,
  admin: AdminDashboard,
  worker: WorkerDashboard,
  citizen: CitizenDashboard,
  analyst: AnalystDashboard,
};

function App() {
  const [users, setUsers] = useState([]);
  const [booths, setBooths] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedBooth, setSelectedBooth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [seedDone, setSeedDone] = useState(false);
  const [roleDropdown, setRoleDropdown] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const [u, b] = await Promise.all([getUsers(), getBooths()]);
        setUsers(u);
        setBooths(b.filter(bo => [17, 18].includes(bo.id)));
        if (u.length === 0) {
          // Auto-seed if no users
          await seedData();
          const [u2, b2] = await Promise.all([getUsers(), getBooths()]);
          setUsers(u2);
          setBooths(b2.filter(bo => [17, 18].includes(bo.id)));
          setSeedDone(true);
        }
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    init();
  }, []);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await seedData();
      const [u, b] = await Promise.all([getUsers(), getBooths()]);
      setUsers(u);
      setBooths(b.filter(bo => [17, 18].includes(bo.id)));
      setSeedDone(true);
    } catch (e) { console.error(e); }
    setSeeding(false);
  };

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    const roleUsers = users.filter(u => u.role === role);
    if (roleUsers.length > 0) {
      setCurrentUser(roleUsers[0]);
      setSelectedBooth(roleUsers[0].booth_id);
    }
    setRoleDropdown(false);
  };

  const handleUserChange = (userId) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setCurrentUser(user);
      setSelectedBooth(user.booth_id);
    }
  };

  const DashboardComponent = selectedRole ? DASHBOARD_MAP[selectedRole] : null;
  const roleConfig = selectedRole ? ROLE_CONFIG[selectedRole] : null;
  const roleUsers = selectedRole ? users.filter(u => u.role === selectedRole) : [];
  const currentBooth = booths.find(b => b.id === selectedBooth);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#5A6B80]">Loading BoothIQ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA]" data-testid="app-root">
      {/* Top Nav */}
      <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#FF6B00] flex items-center justify-center">
              <span className="text-white font-bold text-sm">BQ</span>
            </div>
            <div>
              <h1 className="font-bold text-[#1B2A4A] text-base leading-tight">BoothIQ</h1>
              <p className="text-[10px] text-[#8899AA] leading-tight">Booth Management System</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Booth Selector */}
            {selectedBooth && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F0F9FF] text-[#0284C7]" data-testid="booth-indicator">
                <MapPin size={14} />
                <span className="text-xs font-medium">{currentBooth?.name || `Booth ${selectedBooth}`}</span>
              </div>
            )}

            {/* Seed Button */}
            <button data-testid="seed-btn" onClick={handleSeed} disabled={seeding}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#F7F8FA] text-[#5A6B80] hover:bg-gray-200 flex items-center gap-1.5 transition-all">
              <Database size={13} /> {seeding ? 'Seeding...' : seedDone ? 'Re-seed' : 'Seed Data'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {!selectedRole ? (
          /* Role Selection Screen */
          <div data-testid="role-selection">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-[#1B2A4A] mb-2">Select Your Role</h2>
              <p className="text-sm text-[#5A6B80]">Choose your role to access the appropriate dashboard</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl mx-auto">
              {Object.entries(ROLE_CONFIG).map(([role, config]) => {
                const Icon = config.icon;
                const count = users.filter(u => u.role === role).length;
                return (
                  <button key={role} data-testid={`role-select-${role}`}
                    onClick={() => handleRoleSelect(role)}
                    className="bg-white rounded-2xl p-6 border-2 border-[#E2E8F0] hover:border-[#FF6B00] hover:shadow-lg transition-all text-left group">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all"
                      style={{ background: `${config.color}15` }}>
                      <Icon size={22} style={{ color: config.color }} />
                    </div>
                    <h3 className="font-semibold text-[#1B2A4A] mb-1">{config.label}</h3>
                    <p className="text-xs text-[#8899AA] mb-2">{config.desc}</p>
                    <p className="text-xs text-[#5A6B80]">{count} user{count !== 1 ? 's' : ''}</p>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Dashboard View */
          <div data-testid="dashboard-view">
            {/* Dashboard Header */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <button data-testid="back-to-roles" onClick={() => { setSelectedRole(''); setCurrentUser(null); }}
                className="px-4 py-2 rounded-xl bg-white text-[#5A6B80] text-sm font-medium hover:bg-gray-100 border border-[#E2E8F0]">
                &larr; Roles
              </button>

              <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
                style={{ background: roleConfig.color }}>
                {roleConfig.icon && <roleConfig.icon size={16} />}
                {roleConfig.label}
              </div>

              {/* User Switcher */}
              {roleUsers.length > 1 && (
                <select data-testid="user-switcher" value={currentUser?.id || ''} onChange={e => handleUserChange(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-[#E2E8F0] bg-white text-sm text-[#1B2A4A] focus:ring-2 focus:ring-[#FF6B00]/30 outline-none">
                  {roleUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              )}

              {/* Booth Switcher */}
              {selectedRole !== 'worker' && (
                <select data-testid="booth-switcher" value={selectedBooth || ''} onChange={e => setSelectedBooth(Number(e.target.value))}
                  className="px-3 py-2 rounded-xl border border-[#E2E8F0] bg-white text-sm text-[#1B2A4A] focus:ring-2 focus:ring-[#FF6B00]/30 outline-none">
                  {booths.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Dashboard Content */}
            {DashboardComponent && currentUser && selectedBooth && (
              <DashboardComponent currentUser={currentUser} boothId={selectedBooth} />
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
