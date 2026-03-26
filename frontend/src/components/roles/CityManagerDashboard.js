import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getBoothsSummary, analyzeBooth, sendTargetedUpdate, 
  getVoters, getGrievances 
} from '../../api';
import { 
  Globe, Activity, LayoutDashboard, Search, 
  AlertTriangle, CheckCircle2, Users, Target,
  Zap, Send, ShieldAlert, BarChart3,
  ChevronRight, ArrowRight, Filter, MessageSquare,
  PieChart, MapPin
} from 'lucide-react';

export default function CityManagerDashboard({ currentUser }) {
  const [booths, setBooths] = useState([]);
  const [selectedBooth, setSelectedBooth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // States for the Action Flow
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [selectedVoters, setSelectedVoters] = useState([]);
  const [voterFilter, setVoterFilter] = useState({ category: '', sentiment: '' });
  const [voters, setVoters] = useState([]);
  const [sendingUpdate, setSendingUpdate] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');

  const loadBooths = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getBoothsSummary();
      setBooths(data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { loadBooths(); }, [loadBooths]);

  const handleAnalyze = async (boothId) => {
    setAnalyzing(true);
    try {
      const result = await analyzeBooth(boothId);
      setAnalysisResult(result);
      
      // Auto-filter voters based on top priority
      const voterData = await getVoters(boothId);
      setVoters(voterData || []);
      
      if (result.top_priority) {
        setVoterFilter(prev => ({ ...prev, category: result.top_priority }));
      }
    } catch (e) { console.error(e); }
    setAnalyzing(false);
  };

  const handleSendUpdate = async () => {
    if (!updateMessage || selectedVoters.length === 0) return;
    setSendingUpdate(true);
    try {
      await sendTargetedUpdate({
        booth_id: selectedBooth.id,
        voter_ids: selectedVoters,
        message: updateMessage,
        action_type: 'targeted'
      });
      alert(`Message broadcasted to ${selectedVoters.length} targeted voters.`);
      setUpdateMessage('');
      setSelectedVoters([]);
    } catch (e) { console.error(e); }
    setSendingUpdate(false);
  };

  const filteredBooths = booths.filter(b => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    b.booth_number.toString().includes(searchQuery)
  );

  const filteredVoters = voters.filter(v => {
    const catMatch = !voterFilter.category || v.category === voterFilter.category;
    const sentMatch = !voterFilter.sentiment || v.sentiment === voterFilter.sentiment;
    return catMatch && sentMatch;
  });

  // Main Grid View
  if (!selectedBooth) {
    return (
      <div className="p-4 md:p-8 space-y-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-lg shadow-indigo-600/20">
                <Globe size={20} />
              </div>
              <p className="text-[10px] font-mono font-black text-indigo-500 uppercase tracking-[0.3em]">Operational Vector: Global Oversight</p>
            </div>
            <h1 className="text-4xl font-serif font-black text-navy tracking-tight">City Manager Dashboard</h1>
            <p className="text-navy/40 text-sm font-medium mt-1 italic">Strategizing for Sector {currentUser?.city_id || 'DELHI-01'}</p>
          </div>
          
          <div className="relative group w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-navy/20 group-focus-within:text-indigo-600 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="SEARCH OPERATIONAL SECTORS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-white border border-gold/10 rounded-2xl font-mono text-[10px] font-bold tracking-widest focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* Booth Overview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBooths.map((booth) => (
            <motion.div 
              layoutId={booth.id}
              key={booth.id}
              onClick={() => setSelectedBooth(booth)}
              className="glass-panel group p-6 rounded-3xl border-2 border-transparent hover:border-indigo-600/20 transition-all cursor-pointer bg-white relative overflow-hidden"
            >
              <div className="flex items-start justify-between mb-8">
                <div className={`p-3 rounded-2xl ${booth.status === 'critical' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                  {booth.status === 'critical' ? <AlertTriangle size={24} /> : <CheckCircle2 size={24} />}
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-mono font-black text-navy/20 uppercase tracking-widest">Sector Code</p>
                  <p className="text-lg font-mono font-black text-navy">#{booth.booth_number}</p>
                </div>
              </div>

              <h3 className="text-2xl font-serif font-black text-navy mb-1 group-hover:text-indigo-600 transition-colors">{booth.name}</h3>
              <p className="text-[10px] font-mono font-black text-navy/30 uppercase tracking-[0.2em] mb-8">Strategic Node</p>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div>
                  <p className="text-[8px] font-mono font-black text-navy/20 uppercase tracking-widest mb-1">Turnout</p>
                  <p className="text-sm font-mono font-black text-navy">{booth.turnout}%</p>
                </div>
                <div>
                  <p className="text-[8px] font-mono font-black text-navy/20 uppercase tracking-widest mb-1">Issues</p>
                  <p className="text-sm font-mono font-black text-red-600">{booth.issue_count}</p>
                </div>
                <div>
                  <p className="text-[8px] font-mono font-black text-navy/20 uppercase tracking-widest mb-1">Sentiment</p>
                  <p className={`text-sm font-mono font-black ${booth.sentiment_score > 70 ? 'text-green-600' : 'text-orange-600'}`}>
                    {booth.sentiment_score}%
                  </p>
                </div>
              </div>

              {/* Heatmap Indicator */}
              <div className="h-1.5 w-full bg-black/5 rounded-full overflow-hidden mb-6">
                <div 
                  className={`h-full transition-all duration-1000 ${booth.status === 'critical' ? 'bg-red-500' : 'bg-green-500'}`}
                  style={{ width: `${booth.sentiment_score}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-indigo-600">
                <span className="text-[9px] font-mono font-black uppercase tracking-widest">Open Operations</span>
                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  // Selected Booth Detail View (Decision & Action Flow)
  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Breadcrumb Header */}
      <div className="flex items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              setSelectedBooth(null);
              setAnalysisResult(null);
            }}
            className="p-3 rounded-xl bg-white border border-gold/10 text-navy/40 hover:text-indigo-600 hover:border-indigo-600 transition-all active:scale-95"
          >
            <Globe size={18} />
          </button>
          <div>
            <h2 className="text-3xl font-serif font-black text-navy tracking-tight">{selectedBooth.name}</h2>
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-mono font-black text-indigo-500 uppercase tracking-widest">Sector {selectedBooth.booth_number} Operations</p>
              <div className="size-1 rounded-full bg-gold/30" />
              <p className="text-[10px] font-mono font-black text-navy/40 uppercase tracking-widest">Active Analysis</p>
            </div>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={() => handleAnalyze(selectedBooth.id)}
            disabled={analyzing}
            className={`px-6 py-3 rounded-xl text-[10px] font-mono font-black uppercase tracking-widest flex items-center gap-2 transition-all ${analyzing ? 'bg-navy/10 text-navy/40' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:scale-105 active:scale-95'}`}
          >
            {analyzing ? <RefreshCw className="animate-spin" size={14} /> : <Zap size={14} />}
            Analyze Booth
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Analysis & Detection */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-panel p-6 rounded-3xl bg-white space-y-6">
            <h3 className="text-xs font-mono font-black text-navy/20 uppercase tracking-[0.2em] flex items-center gap-2">
              <ShieldAlert size={14} /> Intelligence Report
            </h3>

            {analysisResult ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="p-5 rounded-2xl bg-indigo-50 border border-indigo-100">
                  <p className="text-[9px] font-mono font-black text-indigo-400 uppercase tracking-widest mb-2">Primary Detection</p>
                  <p className="text-sm font-bold text-navy leading-relaxed">
                    {analysisResult.recommendation}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-red-50 border border-red-100">
                    <p className="text-[8px] font-mono font-black text-red-400 uppercase tracking-widest mb-1">Top Concern</p>
                    <p className="text-xs font-black text-red-600 uppercase tracking-wider">{analysisResult.top_priority}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100">
                    <p className="text-[8px] font-mono font-black text-indigo-400 uppercase tracking-widest mb-1">Voters Affected</p>
                    <p className="text-xs font-black text-indigo-600 uppercase tracking-wider">{analysisResult.affected_count} Targets</p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="py-12 text-center space-y-4">
                <div className="size-12 rounded-2xl bg-black/5 flex items-center justify-center mx-auto text-navy/10">
                  <BarChart3 size={24} />
                </div>
                <p className="text-[10px] font-mono font-bold text-navy/30 uppercase tracking-widest max-w-[200px] mx-auto">
                  Trigger AI Analysis to detect problem areas and group voters.
                </p>
              </div>
            )}
          </div>

          <div className="glass-panel p-6 rounded-3xl bg-white space-y-6">
            <h3 className="text-xs font-mono font-black text-navy/20 uppercase tracking-[0.2em] flex items-center gap-2">
              <PieChart size={14} /> Quick Stats
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-black text-navy/40 uppercase tracking-widest">Issue Velocity</span>
                <span className="text-xs font-mono font-black text-red-600">+12%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-black text-navy/40 uppercase tracking-widest">Voter Outreach</span>
                <span className="text-xs font-mono font-black text-green-600">84%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-black text-navy/40 uppercase tracking-widest">Tactical Score</span>
                <span className="text-xs font-mono font-black text-indigo-600">A+</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center Column: Voter Segmentation */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel p-6 rounded-3xl bg-white flex flex-col h-[600px]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-mono font-black text-navy/20 uppercase tracking-[0.2em] flex items-center gap-2">
                <Users size={14} /> Voter Segmentation
              </h3>
              <div className="flex gap-2">
                <select 
                  value={voterFilter.sentiment}
                  onChange={(e) => setVoterFilter(prev => ({ ...prev, sentiment: e.target.value }))}
                  className="text-[8px] font-mono font-black uppercase tracking-widest bg-black/5 border-none rounded-lg px-2 py-1 focus:ring-0 cursor-pointer"
                >
                  <option value="">Sentiment</option>
                  <option value="positive">Positive</option>
                  <option value="neutral">Neutral</option>
                  <option value="negative">Negative</option>
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
              {filteredVoters.map((voter) => (
                <div 
                  key={voter.id}
                  onClick={() => {
                    setSelectedVoters(prev => 
                      prev.includes(voter.id) 
                        ? prev.filter(id => id !== voter.id)
                        : [...prev, voter.id]
                    )
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${selectedVoters.includes(voter.id) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gold/10 hover:border-indigo-600/30'}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-bold ${selectedVoters.includes(voter.id) ? 'text-white' : 'text-navy'}`}>{voter.name}</p>
                      <p className={`text-[8px] font-mono font-black uppercase tracking-widest ${selectedVoters.includes(voter.id) ? 'text-white/60' : 'text-navy/30'}`}>
                        {voter.segment || 'Citizen'} • {voter.sentiment}
                      </p>
                    </div>
                    {selectedVoters.includes(voter.id) && <CheckCircle2 size={16} />}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="pt-6 border-t border-gold/10 mt-6">
              <div className="flex items-center justify-between text-[10px] font-mono font-black text-navy/40 uppercase tracking-widest">
                <span>Total Selected</span>
                <span className="text-indigo-600">{selectedVoters.length} Voters</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Action Panel */}
        <div className="lg:col-span-3 space-y-6">
          <div className="glass-panel p-6 rounded-3xl bg-white space-y-6 sticky top-8">
            <h3 className="text-xs font-mono font-black text-navy/20 uppercase tracking-[0.2em] flex items-center gap-2">
              <Target size={14} /> Action Center
            </h3>

            <div className="space-y-4">
              <p className="text-[10px] font-mono font-black text-navy/40 uppercase tracking-widest">Targeted Communication</p>
              <textarea 
                placeholder="TYPE ACTION RESPONSE MESSAGE..."
                value={updateMessage}
                onChange={(e) => setUpdateMessage(e.target.value)}
                className="w-full h-32 p-4 bg-black/5 border-none rounded-2xl text-xs font-bold text-navy placeholder:text-navy/20 focus:ring-2 focus:ring-indigo-600/20 resize-none outline-none transition-all"
              />
              
              <button 
                onClick={handleSendUpdate}
                disabled={sendingUpdate || selectedVoters.length === 0}
                className={`w-full py-4 rounded-2xl text-[10px] font-mono font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${sendingUpdate || selectedVoters.length === 0 ? 'bg-navy/5 text-navy/20' : 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 hover:scale-[1.02] active:scale-[0.98]'}`}
              >
                {sendingUpdate ? <RefreshCw className="animate-spin" size={16} /> : <Send size={16} />}
                Dispatch Update
              </button>

              <div className="pt-6 space-y-3">
                <button className="w-full p-4 rounded-2xl border border-gold/10 flex items-center justify-between text-navy/60 hover:bg-black/5 transition-all">
                  <span className="text-[9px] font-mono font-black uppercase tracking-widest">Governance Action</span>
                  <ArrowRight size={14} />
                </button>
                <button className="w-full p-4 rounded-2xl border border-gold/10 flex items-center justify-between text-navy/60 hover:bg-black/5 transition-all">
                  <span className="text-[9px] font-mono font-black uppercase tracking-widest">Escalate to Sector Head</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
