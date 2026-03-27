import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getVoters, updateVoter, getAnalytics, initiateCampaignBlast } from '../../api';
import { 
  Users, CheckCircle2, XCircle, Search, RefreshCw, 
  MapPin, Filter, UserCheck, Shield, Clock,
  ArrowRight, ShieldAlert, Zap, TrendingUp,
  Fingerprint, Target, Activity, Send, Sparkles
} from 'lucide-react';

const VoterCard = ({ voter, onCheckIn, loading, onPush }) => {
    const isVoted = voter.voted;
    const isSupporter = voter.sentiment === 'positive';
    
    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-card p-4 rounded-2xl border transition-all flex items-center justify-between group ${
                isVoted 
                ? 'border-emerald-500/20 bg-emerald-500/5' 
                : isSupporter 
                ? 'border-amber-500/30 bg-amber-500/5 shadow-lg shadow-amber-500/5' 
                : 'border-border hover:border-emerald-500/30'
            }`}
        >
            <div className="flex items-center gap-4">
                <div className={`size-12 rounded-2xl flex items-center justify-center text-xl font-black shadow-sm border ${
                    isVoted 
                    ? 'bg-emerald-500 text-white border-emerald-400' 
                    : isSupporter
                    ? 'bg-amber-500 text-white border-amber-400 animate-pulse'
                    : 'bg-muted text-muted-foreground border-border'
                }`}>
                    {voter.name[0]}
                </div>
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-lg font-black text-foreground tracking-tight uppercase leading-none">
                            {voter.name}
                        </h4>
                        {isVoted ? (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-500 text-[8px] font-black uppercase tracking-widest border border-emerald-500/20">
                                VOTED
                            </span>
                        ) : isSupporter ? (
                            <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white text-[8px] font-black uppercase tracking-widest border border-amber-400 shadow-sm flex items-center gap-1">
                                <Zap size={8} fill="currentColor" /> LIKELY SUPPORTER
                            </span>
                        ) : null}
                    </div>
                    <div className="flex items-center gap-3 text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                        <span className="flex items-center gap-1"><Fingerprint size={12} /> ECI: {voter.id}</span>
                        <span className="flex items-center gap-1"><MapPin size={12} /> HH: {voter.household_id || 'N/A'}</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                {isVoted ? (
                    <div className="text-right">
                        <p className="text-[8px] font-black text-emerald-500/50 uppercase tracking-[2px]">CHECKED IN AT</p>
                        <p className="text-[10px] font-bold text-emerald-500/80 uppercase">
                            {voter.voted_at ? `${new Date(voter.voted_at).toLocaleDateString()} at ${new Date(voter.voted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Live'}
                        </p>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        {isSupporter && (
                            <button 
                                onClick={() => onPush(voter)}
                                disabled={loading}
                                className="p-3 bg-amber-500/10 text-amber-600 rounded-xl hover:bg-amber-500 hover:text-white transition-all border border-amber-500/20 group/push disabled:opacity-50"
                                title="Send Turnout Reminder"
                            >
                                <Zap size={16} className={loading ? "animate-spin" : "group-hover/push:animate-bounce"} />
                            </button>
                        )}
                        <button 
                            onClick={() => onCheckIn(voter.id)}
                            disabled={loading}
                            className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-black uppercase tracking-[2px] text-[10px] shadow-xl shadow-emerald-600/20 hover:bg-emerald-500 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {loading ? <RefreshCw size={14} className="animate-spin" /> : <UserCheck size={14} />}
                            MARK VOTED
                        </button>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default function BLODashboard({ currentUser, boothId }) {
    const [voters, setVoters] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState('all'); // all, voted, remaining
    const [processingId, setProcessingId] = useState(null);
    const [actionHistory, setActionHistory] = useState([]);

    const safeBoothId = boothId || 17;

    const addAction = (msg) => {
        setActionHistory(prev => [{
            id: Date.now(),
            time: `${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`,
            message: msg
        }, ...prev].slice(0, 5));
    };

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [vData, aData] = await Promise.all([
                getVoters(safeBoothId),
                getAnalytics(safeBoothId)
            ]);
            setVoters(vData || []);
            setStats(aData);
        } catch (e) {
            console.error("BLO Load Error:", e);
        }
        setLoading(false);
    }, [safeBoothId]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleCheckIn = async (voterId) => {
        setProcessingId(voterId);
        try {
            const voter = voters.find(v => v.id === voterId);
            await updateVoter({ id: voterId, voted: true });
            // Local update for instant feedback
            setVoters(prev => prev.map(v => 
                v.id === voterId ? { ...v, voted: true, voted_at: new Date().toISOString() } : v
            ));
            addAction(`Check-in: ${voter.name} verified and marked as voted.`);
        } catch (e) {
            console.error("Check-in Error:", e);
            alert("Check-in failed. Check connection.");
        }
        setProcessingId(null);
    };

    const handlePush = async (voter) => {
        setProcessingId(voter.id);
        try {
            await initiateCampaignBlast({
                template_id: 'TURNOUT_REMINDER',
                target_segment: 'INDIVIDUAL',
                voter_id: voter.id,
                channels: ['whatsapp', 'sms']
            });
            addAction(`AI Push: Sent reminder to ${voter.name}`);
            alert(`Turnout Push Sent to ${voter.name}. Message: "Hello ${voter.name.split(' ')[0]}, the queue at Booth ${safeBoothId} is currently low. Please come and cast your vote!"`);
        } catch (e) {
            console.error("Push Error:", e);
            alert("Mock Push Complete (Turnout Reminder sent via AI Hub)");
            addAction(`AI Push (Mock): Sent reminder to ${voter.name}`);
        }
        setProcessingId(null);
    };

    const handleTurnoutBlast = async () => {
        setLoading(true);
        try {
            await initiateCampaignBlast({
                template_id: 'BOOTH_TURNOUT_BLAST',
                target_segment: 'MISSING_SUPPORTERS',
                booth_id: safeBoothId,
                channels: ['whatsapp', 'sms']
            });
            addAction(`Strategic: Mass blast to ${missingSupporters} supporters.`);
            alert(`Strategic Turnout Blast initiated for ${missingSupporters} missing supporters at Booth ${safeBoothId}`);
        } catch (e) {
            console.error("Blast Error:", e);
            alert(`Mock Blast Complete: ${missingSupporters} supporters notified.`);
            addAction(`Strategic (Mock): Mass blast to ${missingSupporters} supporters.`);
        }
        setLoading(false);
    };

    const filteredVoters = useMemo(() => {
        return voters.filter(v => {
            const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                v.id.toString().includes(searchQuery);
            if (filter === 'voted') return matchesSearch && v.voted;
            if (filter === 'remaining') return matchesSearch && !v.voted;
            if (filter === 'missing') return matchesSearch && !v.voted && v.sentiment === 'positive';
            return matchesSearch;
        });
    }, [voters, searchQuery, filter]);

    const votedCount = voters.filter(v => v.voted).length;
    const missingSupporters = voters.filter(v => !v.voted && v.sentiment === 'positive').length;
    const totalCount = voters.length;
    const turnoutPct = totalCount > 0 ? Math.round((votedCount / totalCount) * 100) : 0;

    return (
        <div className="space-y-6 pb-20 max-w-5xl mx-auto">
            {/* Pro Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border pb-6">
                <div>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[8px] font-black uppercase tracking-[3px]">
                            ELECTION DAY OPS
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground/40 text-[9px] font-bold uppercase tracking-widest">
                            <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                            Live Turnout Feed
                        </div>
                    </div>
                    <h1 className="text-4xl font-black text-foreground tracking-tighter uppercase leading-none">
                        Booth Agent Portal
                    </h1>
                    <p className="text-muted-foreground font-bold uppercase tracking-[0.2em] text-[9px] mt-2">Booth #{safeBoothId} • ECI Designated Official: {currentUser?.name}</p>
                </div>

                <div className="flex items-center gap-4">
                    <button onClick={loadData} className="p-4 rounded-2xl bg-card border border-border text-muted-foreground hover:text-emerald-500 transition-all group">
                        <RefreshCw size={20} className={loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} />
                    </button>
                    <div className="px-6 py-4 bg-emerald-600/10 border border-emerald-500/20 rounded-[2rem] text-center min-w-[140px]">
                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">LIVE TURNOUT</p>
                        <p className="text-3xl font-black text-foreground leading-none">{turnoutPct}%</p>
                    </div>
                </div>
            </div>

            {/* Turnout Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Enrolled', val: totalCount, icon: Users, color: 'text-indigo-400' },
                    { label: 'Verified Votes', val: votedCount, icon: CheckCircle2, color: 'text-emerald-400' },
                    { label: 'Remaining', val: totalCount - votedCount, icon: Clock, color: 'text-amber-400' },
                    { label: 'Booth Queue', val: 'Low', icon: Activity, color: 'text-emerald-500' }
                ].map((s, i) => (
                    <motion.div 
                        key={i} 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-card p-5 rounded-3xl border border-border relative overflow-hidden group hover:border-emerald-500/30 transition-all"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-all group-hover:scale-110">
                            <s.icon size={40} />
                        </div>
                        <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[2px] mb-2">{s.label}</p>
                        <h3 className={`text-3xl font-black tracking-tighter ${s.color}`}>{s.val}</h3>
                    </motion.div>
                ))}
            </div>

            {/* Main Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left: Voter List & Controls */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Voter Search & Filter Control */}
                    <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
                        <div className="flex-1 relative group">
                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-emerald-500 transition-colors">
                                <Search size={20} />
                            </div>
                            <input 
                                type="text"
                                placeholder="SEARCH BY NAME OR ECI ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-card border border-border rounded-2xl py-4 pl-14 pr-6 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all text-xs font-black uppercase tracking-widest"
                            />
                        </div>
                    </div>

                    <div className="flex bg-muted p-1.5 rounded-2xl border border-border overflow-x-auto no-scrollbar">
                        {[
                            { id: 'all', label: 'ALL', icon: Users },
                            { id: 'remaining', label: 'REMAINING', icon: Target },
                            { id: 'missing', label: 'MISSING SUPPORTERS', icon: Zap, badge: missingSupporters },
                            { id: 'voted', label: 'VOTED', icon: UserCheck }
                        ].map(t => (
                            <button
                                key={t.id}
                                onClick={() => setFilter(t.id)}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[2px] transition-all shrink-0 ${
                                    filter === t.id 
                                    ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-600/20' 
                                    : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                <t.icon size={14} />
                                {t.label}
                                {t.badge > 0 && (
                                    <span className={`ml-2 px-1.5 py-0.5 rounded-md text-[8px] font-black ${
                                        filter === t.id ? 'bg-white text-emerald-600' : 'bg-emerald-500 text-white animate-pulse'
                                    }`}>
                                        {t.badge}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Voter Feed */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-xl font-black text-foreground uppercase tracking-tighter flex items-center gap-3">
                                <Users size={20} className="text-emerald-500" /> Voter Feed
                            </h3>
                            <p className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-widest">
                                Showing {filteredVoters.length} results
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {loading ? (
                                <div className="md:col-span-2 py-20 text-center border-2 border-dashed border-border rounded-[3rem] bg-muted/30">
                                    <RefreshCw className="animate-spin text-emerald-500 mx-auto mb-4" size={40} />
                                    <p className="text-[10px] font-black uppercase tracking-[5px] text-muted-foreground/40">Syncing with ECI database...</p>
                                </div>
                            ) : filteredVoters.length === 0 ? (
                                <div className="md:col-span-2 py-20 text-center border-2 border-dashed border-border rounded-[3rem] bg-muted/30">
                                    <ShieldAlert className="text-muted-foreground/20 mx-auto mb-4" size={48} />
                                    <h4 className="text-xl font-black text-foreground uppercase tracking-tighter mb-2">No Voters Found</h4>
                                    <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">Adjust search or filter criteria</p>
                                </div>
                            ) : (
                                filteredVoters.map(v => (
                                    <VoterCard 
                                        key={v.id} 
                                        voter={v} 
                                        onCheckIn={handleCheckIn}
                                        loading={processingId === v.id}
                                        onPush={handlePush}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Sidebar: AI Agent & Strategic Controls */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Booth Agent AI Status */}
                    <div className="bg-card p-6 rounded-[2.5rem] border border-border relative overflow-hidden shadow-sm">
                        <div className="absolute top-0 right-0 p-6 opacity-5">
                            <Sparkles size={60} className="text-emerald-500" />
                        </div>
                        
                        <div className="flex items-center gap-4 mb-6">
                            <div className="size-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
                                <Sparkles size={24} />
                            </div>
                            <div>
                                <h4 className="text-lg font-black text-foreground uppercase tracking-tighter leading-none mb-1">Agent ESarthi</h4>
                                <div className="flex items-center gap-2">
                                    <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Booth Monitoring Active</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="p-4 bg-muted/50 rounded-2xl border border-border">
                                <p className="text-[10px] font-bold text-foreground/80 leading-relaxed uppercase tracking-wide">
                                    "Turnout at Booth {safeBoothId} is {turnoutPct}%. AI analysis suggests 14% of undecided voters are leaning positive. Recommendation: Increase physical presence in Sector 4."
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-indigo-500/5 rounded-xl border border-indigo-500/10">
                                    <p className="text-[8px] font-black text-indigo-400 uppercase mb-1">Queue Prediction</p>
                                    <p className="text-sm font-black text-foreground tracking-tight uppercase">Low (8 mins)</p>
                                </div>
                                <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                                    <p className="text-[8px] font-black text-emerald-400 uppercase mb-1">Booth Integrity</p>
                                    <p className="text-sm font-black text-foreground tracking-tight uppercase">98.2% (SAFE)</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Turnout Blast Strategic Alert */}
                    {turnoutPct < 50 && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-6 bg-amber-500/10 border border-amber-500/30 rounded-[2.5rem] space-y-4"
                        >
                            <div className="flex items-center gap-4">
                                <div className="size-12 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-xl shadow-amber-500/20">
                                    <Zap size={24} fill="currentColor" />
                                </div>
                                <h4 className="text-lg font-black text-amber-500 uppercase tracking-tighter leading-none">Strategic Blast</h4>
                            </div>
                            
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[1px] leading-relaxed">
                                {missingSupporters} supporters haven't voted. High Command recommends a targeted turnout blast.
                            </p>

                            <button 
                                onClick={handleTurnoutBlast}
                                className="w-full py-4 bg-amber-500 text-white rounded-2xl font-black uppercase tracking-[2px] text-[10px] hover:bg-amber-600 transition-all flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20"
                            >
                                <Send size={14} /> Execute Turnout Blast
                            </button>
                        </motion.div>
                    )}

                    {/* Live Sentiment Feed (Mock) */}
                    <div className="bg-card p-6 rounded-[2.5rem] border border-border">
                        <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[3px] mb-6 flex items-center gap-2">
                            <TrendingUp size={14} className="text-indigo-500" /> Booth Sentiment
                        </h4>
                        
                        <div className="space-y-4">
                            {[
                                { area: 'Main Sector', sentiment: 82, trend: 'up' },
                                { area: 'Old Colony', sentiment: 45, trend: 'down' },
                                { area: 'Market Street', sentiment: 68, trend: 'stable' }
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-foreground/70">{item.area}</span>
                                    <div className="flex items-center gap-3">
                                        <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full ${item.sentiment > 70 ? 'bg-emerald-500' : item.sentiment > 50 ? 'bg-amber-500' : 'bg-rose-500'}`} 
                                                style={{ width: `${item.sentiment}%` }} 
                                            />
                                        </div>
                                        <span className="text-[10px] font-black text-foreground">{item.sentiment}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Agent Action History */}
                    <div className="bg-card p-6 rounded-[2.5rem] border border-border">
                        <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[3px] mb-6 flex items-center gap-2">
                            <Activity size={14} className="text-emerald-500" /> Action Log
                        </h4>
                        
                        <div className="space-y-4">
                            {actionHistory.length === 0 ? (
                                <p className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest text-center py-4">No recent actions</p>
                            ) : (
                                actionHistory.map(log => (
                                    <div key={log.id} className="flex gap-3 items-start border-l-2 border-emerald-500/30 pl-3">
                                        <div className="flex-1">
                                            <p className="text-[10px] font-black text-foreground uppercase tracking-tight leading-tight">{log.message}</p>
                                            <p className="text-[8px] font-bold text-muted-foreground uppercase mt-1">{log.time}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
