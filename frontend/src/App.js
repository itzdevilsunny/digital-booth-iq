import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getUsers, getBooths, seedData } from './api';
import { Navbar } from './components/landing/Navbar';
import { Hero } from './components/landing/Hero';
import { ProblemStatement } from './components/landing/ProblemStatement';
import { PlatformCapabilities } from './components/landing/PlatformCapabilities';
import { HowItWorks } from './components/landing/HowItWorks';
import { Roles } from './components/landing/Roles';
import { SecurityEthics } from './components/landing/SecurityEthics';
import { MultilingualSupport } from './components/landing/MultilingualSupport';
import { CTA_Section } from './components/landing/CTA_Section';
import { Footer } from './components/landing/Footer';
import PannaDashboard from './components/roles/PannaDashboard';
import AdminDashboard from './components/roles/AdminDashboard';
import WorkerDashboard from './components/roles/WorkerDashboard';
import CitizenDashboard from './components/roles/CitizenDashboard';
import AnalystDashboard from './components/roles/AnalystDashboard';
import { Users, Shield, Wrench, UserCircle, BarChart3, MapPin, Database, RefreshCw, ArrowRight } from 'lucide-react';

/* ─── Landing Page (PURE UI — no API calls) ─── */
function LandingPage() {
  return (
    <div className="font-body antialiased selection:bg-primary/30 selection:text-white bg-background text-foreground">
      <Navbar />
      <main className="relative">
        <Hero />
        <ProblemStatement />
        <PlatformCapabilities />
        <HowItWorks />
        <Roles />
        <SecurityEthics />
        <MultilingualSupport />
        <CTA_Section />
      </main>
      <Footer />
    </div>
  );
}

/* ─── Dashboard (Workflow System) ─── */
const ROLE_CONFIG = {
  panna: { label: 'Panna Pramukh', icon: Users, color: '#e8761a', desc: 'Voter management & outreach' }, // Saffron
  admin: { label: 'Booth Adhyaksh', icon: Shield, color: '#c9a84c', desc: 'Grievance management' },    // Gold
  worker: { label: 'Field Worker', icon: Wrench, color: '#10b981', desc: 'Task resolution' },       // Green
  citizen: { label: 'Citizen', icon: UserCircle, color: '#3B82F6', desc: 'Submit & track issues' },    // Blue
  analyst: { label: 'Analyst', icon: BarChart3, color: '#8B5CF6', desc: 'View analytics' },         // Purple
};
const DASHBOARD_MAP = {
  panna: PannaDashboard,
  admin: AdminDashboard,
  worker: WorkerDashboard,
  citizen: CitizenDashboard,
  analyst: AnalystDashboard,
};

function DashboardPage() {
  const [users, setUsers] = useState([]);
  const [booths, setBooths] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedBooth, setSelectedBooth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [seedDone, setSeedDone] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const [u, b] = await Promise.all([getUsers(), getBooths()]);
        setUsers(u);
        setBooths(b.filter(bo => [17, 18].includes(bo.id)));
        if (u.length === 0) {
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-navy/60 font-mono tracking-widest uppercase text-xs">Initializing Intelligence Unit...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-body" data-testid="app-root">
      {/* Universal Premium Header */}
      <header className="bg-white/40 backdrop-blur-2xl border-b border-gold/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => { setSelectedRole(''); setCurrentUser(null); }}>
            <div className="size-11 rounded-xl bg-primary flex items-center justify-center shadow-[0_0_25px_rgba(201,168,76,0.25)] group-hover:scale-105 transition-transform duration-500">
              <span className="text-white font-black text-xl italic font-serif">B</span>
            </div>
            <div>
              <h1 className="font-serif font-black text-navy text-xl tracking-tight leading-none mb-1 group-hover:text-primary transition-colors">BoothIQ</h1>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-primary uppercase tracking-[0.4em] font-mono font-bold">Intelligence Unit</span>
                <div className="size-1 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <AnimatePresence>
              {selectedBooth && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                  className="hidden md:flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-primary group hover:border-primary/40 transition-all" data-testid="booth-indicator">
                  <MapPin size={14} className="text-primary/60 group-hover:text-primary" />
                  <span className="text-[10px] font-mono font-black tracking-[0.2em] uppercase">{currentBooth?.name || `SECTOR-${selectedBooth}`}</span>
                </motion.div>
              )}
            </AnimatePresence>
            
            <button data-testid="seed-btn" onClick={handleSeed} disabled={seeding}
              className="px-5 py-2.5 rounded-xl border border-gold/10 text-[10px] font-mono font-black uppercase tracking-widest bg-black/5 text-navy/60 hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 flex items-center gap-3 shadow-lg active:scale-95">
              <RefreshCw size={14} className={seeding ? 'animate-spin' : ''} /> {seeding ? 'Syncing...' : 'Matrix Sync'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {!selectedRole ? (
          <div data-testid="role-selection" className="animate-fade-up max-w-5xl mx-auto">
            <div className="text-center mb-16 relative">
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-40 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
              <p className="text-saffron font-mono text-[10px] uppercase tracking-[0.4em] font-black mb-4 flex items-center justify-center gap-3">
                <Shield size={12} /> Deployment Protocol v3.0
              </p>
              <h2 className="text-5xl md:text-6xl font-serif font-black text-navy mb-6 tracking-tight">Access Control</h2>
              <p className="text-navy/40 font-mono text-xs uppercase tracking-[0.2em] max-w-md mx-auto leading-relaxed">System-wide clearance required. Select your operational vector for deployment.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Object.entries(ROLE_CONFIG).map(([role, config], idx) => {
                const Icon = config.icon;
                const count = users.filter(u => u.role === role).length;
                return (
                  <motion.button key={role} data-testid={`role-select-${role}`}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                    onClick={() => handleRoleSelect(role)}
                    className="group relative bg-white border border-gold/10 rounded-2xl p-8 hover:border-primary/50 transition-all duration-500 text-left overflow-hidden shadow-sm hover:shadow-xl">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/5 to-transparent pointer-events-none group-hover:from-primary/10 transition-colors" />
                    
                    <div className="size-16 rounded-2xl flex items-center justify-center mb-8 bg-white border border-gold/10 shadow-inner transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-[0_0_20px_rgba(201,168,76,0.15)]">
                      <Icon size={28} style={{ color: config.color }} />
                    </div>
                    
                    <h3 className="font-serif font-black text-2xl text-navy mb-3 tracking-tight group-hover:text-primary transition-colors">{config.label}</h3>
                    <p className="text-xs text-navy/40 mb-8 leading-relaxed font-mono uppercase tracking-tighter opacity-60 group-hover:opacity-100">{config.desc}</p>
                    
                    <div className="flex items-center justify-between pt-6 border-t border-gold/5">
                      <div className="flex items-center gap-2 text-[9px] font-mono text-primary font-black uppercase tracking-[0.2em]">
                         <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                         {count} Operational
                      </div>
                      <ArrowRight size={16} className="text-white/10 translate-x-[-10px] group-hover:translate-x-0 group-hover:text-primary transition-all" />
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        ) : (
          <div data-testid="dashboard-view" className="animate-fade-up">
            <div className="flex flex-wrap items-center gap-4 mb-12 pb-8 border-b border-gold/10">
              <button data-testid="back-to-roles" onClick={() => { setSelectedRole(''); setCurrentUser(null); }}
                className="px-6 py-3 rounded-xl border border-gold/10 bg-white/40 text-navy/60 text-[10px] font-mono font-black uppercase tracking-widest hover:bg-white/60 hover:text-navy hover:border-primary/40 transition-all flex items-center gap-3">
                <ArrowRight size={14} className="rotate-180" /> Exit Terminal
              </button>
              
              <div className="h-10 w-px bg-gold/20 mx-2 hidden md:block" />
 
              <div className="flex items-center gap-3 px-6 py-3 rounded-xl border text-[10px] font-mono font-black uppercase tracking-widest bg-white shadow-xl"
                style={{ borderColor: `${roleConfig.color}40`, color: roleConfig.color }}>
                {roleConfig.icon && <roleConfig.icon size={16} />}
                <span>{roleConfig.label}</span>
              </div>
 
              {roleUsers.length > 1 && (
                <div className="relative group min-w-[200px]">
                  <select data-testid="user-switcher" value={currentUser?.id || ''} onChange={e => handleUserChange(e.target.value)}
                    className="w-full appearance-none px-6 py-3 pr-12 rounded-xl border border-gold/10 bg-white/50 text-xs text-navy font-mono font-bold uppercase tracking-wider focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none cursor-pointer hover:bg-white/5 transition-all">
                    {roleUsers.map(u => (
                      <option key={u.id} value={u.id}>{`${u.name}`}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-primary opacity-40 group-hover:opacity-100 transition-opacity">
                    <UserCircle size={16} />
                  </div>
                </div>
              )}
 
              {selectedRole !== 'worker' && (
                <div className="relative group min-w-[200px]">
                  <select data-testid="booth-switcher" value={selectedBooth || ''} onChange={e => setSelectedBooth(Number(e.target.value))}
                    className="w-full appearance-none px-6 py-3 pr-12 rounded-xl border border-gold/10 bg-white/50 text-xs text-navy font-mono font-bold uppercase tracking-wider focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none cursor-pointer hover:bg-white/5 transition-all">
                    {booths.map(b => (
                      <option key={b.id} value={b.id}>{`${b.name}`}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-primary opacity-40 group-hover:opacity-100 transition-opacity">
                    <MapPin size={16} />
                  </div>
                </div>
              )}
            </div>
            
            {DashboardComponent && currentUser && selectedBooth && (
              <DashboardComponent currentUser={currentUser} boothId={selectedBooth} />
            )}
          </div>
        )}
      </main>
    </div>
  );
}

/* ─── App Router ─── */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
