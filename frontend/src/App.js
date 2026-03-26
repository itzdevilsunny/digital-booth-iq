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
import CityManagerDashboard from './components/roles/CityManagerDashboard';
import { Users, Shield, Wrench, UserCircle, BarChart3, MapPin, RefreshCw, LogOut, ChevronRight, ShieldCheck, Globe } from 'lucide-react';
import { NotificationProvider } from './contexts/NotificationContext';

/* ─── Role Configuration ─── */
const ROLE_CONFIG = {
  city_manager: { label: 'City Manager', icon: Globe, color: '#6366f1', desc: 'Global city-wide oversight & strategic command' },
  panna: { label: 'Panna Pramukh', icon: Users, color: '#e8761a', desc: 'Voter registry & outreach management' },
  admin: { label: 'Booth Adhyaksh', icon: Shield, color: '#c9a84c', desc: 'Central command & mission deployment' },
  worker: { label: 'Field Staff', icon: Wrench, color: '#10b981', desc: 'On-site incident resolution units' },
  citizen: { label: 'Citizen Portal', icon: UserCircle, color: '#3B82F6', desc: 'Submit grievances & track progress' },
  analyst: { label: 'Strategic Analyst', icon: BarChart3, color: '#8B5CF6', desc: 'Data-driven tactical insights' },
};

const DASHBOARD_MAP = {
  city_manager: CityManagerDashboard,
  panna: PannaDashboard,
  admin: AdminDashboard,
  worker: WorkerDashboard,
  citizen: CitizenDashboard,
  analyst: AnalystDashboard,
};

function LandingPage() {
  return (
    <div className="font-body antialiased bg-[#fdfaf3] text-[#080d1a]">
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

function DashboardPage() {
  const [users, setUsers] = useState([]);
  const [booths, setBooths] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    const init = async () => {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Network Timeout')), 15000)
      );
      
      try {
        // Race the actual fetch against a 8-second timeout
        const [u, b] = await Promise.race([
          Promise.all([getUsers(), getBooths()]),
          timeoutPromise
        ]);
        
        setUsers(u || []);
        // Auto-select relevant booths for the demo
        setBooths(b?.filter(bo => [17, 18, 1, 2].includes(bo.id)) || []);
        console.log("BoothIQ: Initialization complete.");
      } catch (e) { 
        console.error('BoothIQ Initialization error:', e);
        // Fallback to empty data so the dashboard at least renders
        setUsers([]);
        setBooths([]);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    const roleUsers = users.filter(u => u.role === role);
    if (roleUsers.length > 0) {
      setCurrentUser(roleUsers[0]);
    } else {
      // Fallback if no user found for role
      setCurrentUser({ role, name: 'Guest User', booth_id: 17 });
    }
  };

  const DashboardComponent = selectedRole ? DASHBOARD_MAP[selectedRole] : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0ece3] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-10 h-10 text-[#c9a84c] animate-spin mx-auto mb-4" />
          <p className="text-[10px] font-mono font-black uppercase tracking-[0.3em] text-[#080d1a]/40">Securing Link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0ece3] text-[#080d1a]">
      {!selectedRole ? (
        <div className="page-container py-12 md:py-24">
          <div className="text-center mb-16">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-3 px-4 py-2 bg-[#c9a84c]/10 text-[#c9a84c] rounded-full text-[10px] font-mono font-black uppercase tracking-widest mb-6">
              <ShieldCheck size={14} /> Operational Protocol v1.0
            </motion.div>
            <h2 className="text-4xl md:text-6xl font-serif font-black text-[#080d1a] mb-6 tracking-tight">System Access</h2>
            <p className="max-w-xl mx-auto text-[#080d1a]/60 font-medium text-sm md:text-base">Select your operational vector to proceed with deployment.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(ROLE_CONFIG).map(([role, config], idx) => {
              const Icon = config.icon;
              return (
                <motion.button key={role} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                  onClick={() => handleRoleSelect(role)}
                  className="glass-panel group p-8 rounded-3xl text-left hover:border-[#c9a84c] transition-all duration-500 relative overflow-hidden bg-white/70">
                  <div className="size-14 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-8 border border-[#c9a84c]/10 group-hover:scale-110 transition-transform">
                    <Icon size={28} style={{ color: config.color }} />
                  </div>
                  <h3 className="text-2xl font-serif font-black mb-2 group-hover:text-[#c9a84c] transition-colors">{config.label}</h3>
                  <p className="text-xs font-medium text-[#080d1a]/50 mb-8 leading-relaxed">{config.desc}</p>
                  <div className="flex items-center justify-between pt-6 border-t border-[#c9a84c]/10">
                    <span className="text-[10px] font-mono font-black uppercase tracking-widest text-[#c9a84c]">Secure Login</span>
                    <ChevronRight size={16} className="text-[#c9a84c] group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.button>
              );
            })}
          </div>

          <div className="mt-16 text-center">
            <button onClick={() => window.location.href = '/'} className="text-xs font-mono font-bold text-[#c9a84c] uppercase hover:underline">
              Back to Command Port
            </button>
          </div>
        </div>
      ) : (
        <NotificationProvider userId={currentUser?.id}>
          <div className="relative">
          <button onClick={() => setSelectedRole('')} 
            className="fixed bottom-8 left-8 z-[60] px-6 py-3 bg-[#080d1a] text-white rounded-2xl text-[10px] font-mono font-black uppercase tracking-widest shadow-2xl hover:bg-[#c9a84c] transition-all flex items-center gap-3 active:scale-95">
            <LogOut size={16} /> Exit Role
          </button>
          {DashboardComponent && (
            <DashboardComponent 
              currentUser={currentUser} 
              boothId={currentUser?.booth_id || 17} 
            />
          )}
          </div>
        </NotificationProvider>
      )}
    </div>
  );
}

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
