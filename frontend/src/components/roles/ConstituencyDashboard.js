import React, { useState, useEffect } from 'react';
import { 
    Zap, Globe, Users, Target, Activity, 
    TrendingUp, MapPin, ChevronRight, MessageSquare,
    Shield, ShieldAlert, BarChart3, Clock, ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAnalytics, initiateCampaignBlast } from '../../api';

const ConstituencyDashboard = ({ currentUser, boothId }) => {
    const [tab, setTab] = useState('command');
    const [loading, setLoading] = useState(true);
    const [stats, setAnalytics] = useState(null);

    useEffect(() => {
        getAnalytics(boothId).then(data => {
            setAnalytics(data);
            setLoading(false);
        });
    }, [boothId]);

    const metrics = [
        { label: 'Total Turnout', value: '68.4%', change: '+4.2%', icon: Activity, color: 'text-indigo-400' },
        { label: 'Active Missions', value: '142', change: 'Live', icon: Target, color: 'text-emerald-400' },
        { label: 'Citizen Sentiment', value: 'Positive', change: '82%', icon: TrendingUp, color: 'text-amber-400' },
        { label: 'Nodes Managed', value: '543', change: 'Stable', icon: Zap, color: 'text-indigo-500' }
    ];

    return (
        <div className="space-y-10 pb-20">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-[4px]">
                            Party Command Matrix
                        </div>
                        <div className="flex items-center gap-2 text-white/20 text-[10px] font-bold uppercase tracking-widest">
                            <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Live Uplink Active
                        </div>
                    </div>
                    <h1 className="text-6xl font-black text-white tracking-tighter uppercase leading-none mb-2">
                        Constituency Hub
                    </h1>
                    <p className="text-white/40 font-bold uppercase tracking-[0.2em] text-[11px]">Strategic Oversight & Regional Intervention</p>
                </div>

                <div className="flex bg-white/5 p-1.5 rounded-[2rem] border border-white/5 backdrop-blur-xl">
                    {['command', 'intelligence', 'campaigns'].map((t) => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[3px] transition-all ${
                                tab === t ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'text-white/40 hover:text-white'
                            }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            {/* Metric Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {metrics.map((m, i) => (
                    <motion.div
                        key={m.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-[#141414] p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                            <m.icon size={60} />
                        </div>
                        <p className="text-[10px] font-black text-white/20 uppercase tracking-[3px] mb-4">{m.label}</p>
                        <div className="flex items-end justify-between relative z-10">
                            <h3 className="text-4xl font-black text-white tracking-tighter">{m.value}</h3>
                            <span className={`text-[10px] font-bold px-3 py-1 rounded-full bg-white/5 border border-white/5 ${m.color}`}>
                                {m.change}
                            </span>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="grid lg:col-span-12 gap-8">
                {tab === 'command' && (
                    <div className="grid lg:grid-cols-12 gap-8">
                        {/* AI Intelligence Matrix - Processed Public Data */}
                        <div className="lg:col-span-8 bg-[#141414] rounded-[3rem] border border-white/5 p-10 relative overflow-hidden min-h-[500px]">
                            <div className="absolute inset-0 bg-grid-pattern opacity-5" />
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-10">
                                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-4">
                                        <Zap className="text-indigo-500" /> AI Intelligence Matrix
                                    </h3>
                                    <div className="px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[8px] font-black uppercase tracking-[2px]">
                                        Processing Public Sentiment
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="p-8 bg-white/5 rounded-3xl border border-white/5">
                                        <p className="text-[10px] font-black text-white/20 uppercase tracking-[3px] mb-4">Sentiment Synthesis</p>
                                        <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden flex">
                                            <div className="h-full bg-emerald-500 w-[62%]" title="Positive" />
                                            <div className="h-full bg-amber-500 w-[24%]" title="Neutral" />
                                            <div className="h-full bg-rose-500 w-[14%]" title="Negative" />
                                        </div>
                                        <div className="flex justify-between mt-4 text-[9px] font-bold uppercase tracking-widest text-white/40">
                                            <span>62% Supportive</span>
                                            <span>14% High Risk</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[3px] mb-2">Key Driver</p>
                                            <p className="text-lg font-black text-white leading-tight uppercase">Scheme Awareness</p>
                                        </div>
                                        <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                                            <p className="text-[10px] font-black text-rose-400 uppercase tracking-[3px] mb-2">Critical Friction</p>
                                            <p className="text-lg font-black text-white leading-tight uppercase">Water Supply Delay</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Worker GPS Feed */}
                        <div className="lg:col-span-4 space-y-6">
                            <div className="bg-[#141414] rounded-[3rem] border border-white/5 p-8">
                                <h3 className="text-lg font-black text-white uppercase tracking-tighter mb-8 flex items-center gap-3">
                                    <Target className="text-indigo-500" /> Mission Radar
                                </h3>
                                <div className="space-y-4">
                                    {[
                                        { name: 'Sunil Kumar', loc: 'Sector 4', status: 'Active' },
                                        { name: 'Priya Yadav', loc: 'Booth 17', status: 'In Mission' },
                                        { name: 'Ajay Tiwari', loc: 'Sector 9', status: 'Ready' }
                                    ].map((w, i) => (
                                        <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-4">
                                            <div className="size-10 rounded-xl bg-indigo-600 flex items-center justify-center font-black text-white">
                                                {w.name[0]}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[11px] font-black text-white uppercase tracking-tight">{w.name}</p>
                                                <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">{w.loc}</p>
                                            </div>
                                            <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-[4px] shadow-2xl shadow-indigo-600/20 hover:bg-indigo-500 transition-all group flex items-center justify-center gap-4">
                                <MessageSquare size={20} /> Deploy Global Alert
                            </button>
                        </div>
                    </div>
                )}

                {tab === 'intelligence' && (
                    <div className="space-y-8">
                        {/* Regional Sentiment Heatmap */}
                        <div className="bg-[#141414] rounded-[3rem] border border-white/5 p-10 relative overflow-hidden">
                            <div className="absolute inset-0 bg-grid-pattern opacity-5" />
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-10">
                                    <div>
                                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-4">
                                            <Globe className="text-indigo-500" /> Regional Friction Map
                                        </h3>
                                        <p className="text-[10px] font-bold text-white/20 uppercase tracking-[3px] mt-2">Booth-level sentiment tracking</p>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-rose-500">
                                            <div className="size-2 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]" /> HIGH_FRICTION
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] font-black text-emerald-500">
                                            <div className="size-2 rounded-full bg-emerald-500" /> OPTIMAL
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                                    {[
                                        { id: 101, sent: 'happy', val: 88 },
                                        { id: 102, sent: 'happy', val: 92 },
                                        { id: 103, sent: 'unhappy', val: 34 },
                                        { id: 104, sent: 'happy', val: 76 },
                                        { id: 105, sent: 'unhappy', val: 21 },
                                        { id: 106, sent: 'neutral', val: 55 },
                                        { id: 107, sent: 'happy', val: 81 },
                                        { id: 108, sent: 'unhappy', val: 18 },
                                        { id: 109, sent: 'happy', val: 89 },
                                        { id: 110, sent: 'neutral', val: 48 },
                                        { id: 111, sent: 'unhappy', val: 29 },
                                        { id: 112, sent: 'happy', val: 94 },
                                        { id: 113, sent: 'happy', val: 77 },
                                        { id: 114, sent: 'unhappy', val: 12 },
                                        { id: 115, sent: 'happy', val: 85 },
                                        { id: 116, sent: 'neutral', val: 51 }
                                    ].map((b) => (
                                        <motion.div 
                                            key={b.id}
                                            whileHover={{ scale: 1.05 }}
                                            className={`aspect-square rounded-2xl border flex flex-col items-center justify-center relative group cursor-pointer transition-all duration-500 ${
                                                b.sent === 'unhappy' 
                                                ? 'bg-rose-500/10 border-rose-500/30 text-rose-500 shadow-lg shadow-rose-500/5' 
                                                : b.sent === 'happy' 
                                                ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-500/40' 
                                                : 'bg-white/5 border-white/10 text-white/20'
                                            }`}
                                        >
                                            {b.sent === 'unhappy' && (
                                                <div className="absolute top-2 right-2">
                                                    <ShieldAlert size={12} className="animate-pulse" />
                                                </div>
                                            )}
                                            <span className="text-[8px] font-black mb-1">BOOTH_{b.id}</span>
                                            <span className={`text-xl font-black ${b.sent === 'unhappy' ? 'text-rose-400' : ''}`}>{b.val}%</span>
                                            
                                            {/* Tooltip Simulation */}
                                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 translate-y-full w-48 p-4 bg-black border border-white/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                                                <p className="text-[10px] font-black uppercase text-white mb-2">Booth Intelligence</p>
                                                <p className="text-[9px] text-white/60 leading-tight italic">
                                                    {b.sent === 'unhappy' 
                                                        ? 'Critical infrastructure delays reported. High risk of swing.' 
                                                        : 'Stable support. Consistent engagement with schemes.'}
                                                </p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Critical Intervention Areas */}
                            <div className="bg-[#141414] rounded-[3rem] border border-white/5 p-8">
                                <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-8 flex items-center gap-4">
                                    <ShieldAlert className="text-rose-500" /> Intervention Priority
                                </h3>
                                <div className="space-y-4">
                                    {[
                                        { id: 114, issue: 'Water Scarcity', risk: '92%', loc: 'Sector 9' },
                                        { id: 108, issue: 'Road Connectivity', risk: '84%', loc: 'Sector 4' },
                                        { id: 105, issue: 'Power Voltage', risk: '79%', loc: 'Sector 2' }
                                    ].map((area) => (
                                        <div key={area.id} className="p-6 bg-rose-500/5 border border-rose-500/10 rounded-3xl flex items-center justify-between group hover:bg-rose-500/10 transition-all">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Booth #{area.id}</span>
                                                    <div className="size-1 rounded-full bg-rose-500" />
                                                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{area.loc}</span>
                                                </div>
                                                <p className="text-lg font-black text-white uppercase tracking-tight">{area.issue}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-black text-rose-500 leading-none mb-1">{area.risk}</p>
                                                <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Friction Index</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* AI Strategic Reasoning */}
                            <div className="bg-indigo-600 rounded-[3rem] p-10 text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-20">
                                    <Zap size={120} />
                                </div>
                                <div className="relative z-10">
                                    <h3 className="text-2xl font-black uppercase tracking-tighter mb-6 leading-none">AI Strategic Advice</h3>
                                    <div className="space-y-6">
                                        <div className="p-6 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-md">
                                            <p className="text-[10px] font-black uppercase tracking-[3px] mb-3 opacity-60">Primary Recommendation</p>
                                            <p className="text-lg font-bold leading-tight italic">
                                                "Deploy Manifesto Engine focusing on Water Infrastructure to Sector 9 immediately. 12% potential swing recovery detected."
                                            </p>
                                        </div>
                                        <div className="flex gap-4">
                                            <button className="flex-1 py-4 bg-white text-indigo-600 rounded-2xl font-black uppercase tracking-[3px] text-[10px] hover:bg-indigo-50 transition-all">
                                                Auto-Generate Response
                                            </button>
                                            <button className="px-6 py-4 bg-white/10 border border-white/20 rounded-2xl hover:bg-white/20 transition-all">
                                                <ArrowUpRight size={20} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {tab === 'campaigns' && (
                    <div className="bg-[#1a1a1a] rounded-[4rem] p-12 border border-indigo-500/10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-12 opacity-5">
                            <Zap size={200} className="text-indigo-500" />
                        </div>
                        
                        <div className="relative z-10">
                            <div className="flex flex-col lg:flex-row lg:items-start gap-12">
                                <div className="size-20 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-500 shrink-0 border border-indigo-500/20">
                                    <Globe size={40} />
                                </div>

                                <div className="flex-1">
                                    <h2 className="text-5xl font-black text-white tracking-tighter uppercase mb-6 leading-none">
                                        Campaign & Scheme Engine
                                    </h2>
                                    <p className="text-xl text-white/40 font-bold uppercase tracking-widest leading-relaxed max-w-3xl mb-12">
                                        SMS/WhatsApp campaign blasts to segmented voter lists. Auto-generates 
                                        outreach by scheme type and cross-references enrollment records.
                                    </p>

                                    <div className="flex flex-wrap gap-6">
                                        <button 
                                            onClick={async () => {
                                                try {
                                                    await initiateCampaignBlast({
                                                        template_id: 'MANIFESTO_2026',
                                                        target_segment: 'ALL_VOTERS',
                                                        channels: ['email', 'whatsapp']
                                                    });
                                                    alert('Manifesto Blast Successfully Dispatched to your connected email and phone!');
                                                } catch (e) {
                                                    alert('Blast failed. Check connection.');
                                                }
                                            }}
                                            className="px-10 py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-[4px] hover:bg-indigo-500 transition-all group flex items-center gap-4"
                                        >
                                            Direct to 950M voters
                                            <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConstituencyDashboard;
