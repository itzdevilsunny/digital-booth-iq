import { useState, useEffect } from 'react';
import { getBooths } from '../../api';
import { 
  Building2, MapPin, LayoutDashboard, 
  ChevronRight, Search, Globe, Activity
} from 'lucide-react';
import AnalystDashboard from './AnalystDashboard';
import AdminDashboard from './AdminDashboard';

export default function CityManagerDashboard({ currentUser }) {
  const [booths, setBooths] = useState([]);
  const [selectedBooth, setSelectedBooth] = useState(null);
  const [view, setView] = useState('analytics'); // 'analytics' or 'ops'
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchBooths = async () => {
      try {
        const data = await getBooths();
        setBooths(data || []);
      } catch (e) {
        console.error('Failed to fetch booths:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchBooths();
  }, []);

  const filteredBooths = booths.filter(b => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    b.booth_number.toString().includes(searchQuery)
  );

  if (!selectedBooth) {
    return (
      <div className="animate-fade-up p-4 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/10 flex items-center justify-center text-indigo-600 shadow-lg shadow-indigo-500/5">
              <Globe size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-serif font-black text-navy tracking-tight">City Command Center</h1>
              <p className="text-[10px] font-mono font-black text-indigo-500 uppercase tracking-[0.3em]">Global Oversight Protocol / City Manager: {currentUser?.name}</p>
            </div>
          </div>
          
          <div className="relative group max-w-md w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-navy/20 group-focus-within:text-indigo-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="SEARCH SECTORS / BOOTH ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-white border border-gold/10 rounded-2xl font-mono text-xs font-bold tracking-widest focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-40 text-center">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[10px] font-mono font-black text-indigo-500 uppercase tracking-widest">Synchronizing Global Grid...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBooths.map((booth) => (
              <button 
                key={booth.id}
                onClick={() => setSelectedBooth(booth)}
                className="glass-panel group p-8 rounded-3xl text-left hover:border-indigo-500 transition-all duration-500 bg-white/70 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="size-12 rounded-xl bg-indigo-500/5 flex items-center justify-center mb-6 border border-indigo-500/10 group-hover:scale-110 transition-transform">
                  <Building2 size={24} className="text-indigo-600" />
                </div>
                <h3 className="text-xl font-serif font-black mb-1 text-navy group-hover:text-indigo-600 transition-colors">{booth.name}</h3>
                <p className="text-[10px] font-mono font-black text-navy/30 uppercase tracking-widest mb-6">Sector ID: {booth.booth_number}</p>
                
                <div className="flex items-center justify-between pt-6 border-t border-gold/10">
                  <span className="text-[9px] font-mono font-black uppercase tracking-widest text-indigo-500">Access Node</span>
                  <ChevronRight size={16} className="text-indigo-500 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      {/* Sub-Header / Breadcrumbs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 px-4 md:px-8 pt-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setSelectedBooth(null)}
            className="p-3 rounded-xl bg-white border border-gold/10 text-navy/40 hover:text-indigo-600 hover:border-indigo-500 transition-all active:scale-95 shadow-sm"
          >
            <Globe size={18} />
          </button>
          <div className="h-8 w-px bg-gold/10 mx-2 hidden md:block" />
          <div>
            <h2 className="text-2xl font-serif font-black text-navy tracking-tight">{selectedBooth.name}</h2>
            <p className="text-[10px] font-mono font-black text-indigo-500 uppercase tracking-widest">Active Monitoring / Sector {selectedBooth.booth_number}</p>
          </div>
        </div>

        <div className="flex items-center p-1 bg-white border border-gold/10 rounded-2xl shadow-sm">
          <button 
            onClick={() => setView('analytics')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-mono font-black uppercase tracking-widest transition-all flex items-center gap-2 ${view === 'analytics' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-navy/40 hover:text-navy/60'}`}
          >
            <Activity size={14} /> Analytics
          </button>
          <button 
            onClick={() => setView('ops')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-mono font-black uppercase tracking-widest transition-all flex items-center gap-2 ${view === 'ops' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-navy/40 hover:text-navy/60'}`}
          >
            <LayoutDashboard size={14} /> Operations
          </button>
        </div>
      </div>

      {/* Embedded Dashboard View */}
      <div className="px-4 md:px-8 pb-12">
        {view === 'analytics' ? (
          <AnalystDashboard currentUser={currentUser} boothId={selectedBooth.id} />
        ) : (
          <AdminDashboard currentUser={currentUser} boothId={selectedBooth.id} />
        )}
      </div>
    </div>
  );
}
