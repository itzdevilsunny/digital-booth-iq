import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { getAnalytics, getGraphData } from '../../api';
import { 
  BarChart3, Users, AlertTriangle, CheckCircle2, 
  PhoneCall, Lightbulb, RefreshCw, TrendingUp, 
  TrendingDown, Zap, ShieldCheck, Activity,
  Target, BrainCircuit, Network, Info
} from 'lucide-react';
import ForceGraph2D from 'react-force-graph-2d';

export default function AnalystDashboard({ currentUser, boothId }) {
  const [stats, setStats] = useState(null);
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [analytics, graph] = await Promise.all([
        getAnalytics(boothId),
        getGraphData()
      ]);
      setStats(analytics);
      setGraphData(graph);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [boothId]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) {
    return (
      <div className="py-40 text-center animate-pulse" data-testid="analyst-loading">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6" />
        <p className="text-primary font-mono text-[10px] uppercase tracking-[0.4em] font-black">Decrypting Analytics Pipeline...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="py-40 text-center bg-white border border-dashed border-gold/20 rounded-3xl shadow-sm">
        <AlertTriangle size={48} className="mx-auto mb-4 text-saffron opacity-50" />
        <p className="text-navy/40 font-mono text-[10px] uppercase tracking-[0.3em]">Data Link Severed / Connection Error</p>
      </div>
    );
  }

  const sentTotal = Object.values(stats.sentiment_distribution).reduce((a, b) => a + b, 0);
  const sentPcts = Object.entries(stats.sentiment_distribution).map(([k, v]) => ({
    key: k, value: v, pct: sentTotal > 0 ? ((v / sentTotal) * 100).toFixed(1) : 0
  }));

  const SENTIMENT_CONFIG = { 
    positive: { color: 'text-emerald-500', bg: 'bg-emerald-500', label: 'Positive Bias' },
    neutral: { color: 'text-blue-400', bg: 'bg-blue-400', label: 'Neutral Baseline' },
    negative: { color: 'text-rose-500', bg: 'bg-rose-500', label: 'Negative Variance' }
  };

  const CATEGORY_COLORS = {
    water: 'bg-blue-400', road: 'bg-purple-400', electricity: 'bg-amber-400',
    sanitation: 'bg-emerald-400', healthcare: 'bg-rose-400', education: 'bg-indigo-400', other: 'bg-slate-400'
  };

  return (
    <div data-testid="analyst-dashboard" className="animate-fade-up">
      {/* Intelligence Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-8 border-b border-gold/10">
        <div className="flex items-center gap-4">
          <div className="size-14 rounded-2xl bg-gold/10 border border-gold/10 flex items-center justify-center text-primary shadow-[0_4px_15px_rgba(212,175,55,0.05)]">
            <Activity size={28} />
          </div>
          <div>
            <h3 className="text-3xl font-serif font-black text-navy tracking-tight">Intelligence Dashboard</h3>
            <p className="text-[10px] font-mono font-black text-primary uppercase tracking-[0.3em] opacity-80">Real-time Sector Analysis / BOOTH-{boothId}</p>
          </div>
        </div>
        <button onClick={loadData} data-testid="analyst-refresh" 
          className="self-end md:self-auto p-4 rounded-2xl bg-white border border-gold/10 text-primary hover:bg-gold/5 transition-all active:scale-95 shadow-md group">
          <RefreshCw size={20} className={loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} />
        </button>
      </div>

      {/* Primary Metrics Group */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Total Electorate', value: stats.total_voters, icon: Users, color: 'text-blue-500', trend: '+1.2%' },
          { label: 'Dispatch Total', value: stats.total_issues, icon: AlertTriangle, color: 'text-saffron', trend: '-4.8%' },
          { label: 'Neutralized', value: stats.resolved_issues, icon: ShieldCheck, color: 'text-emerald-600', trend: '92%' },
          { label: 'Engagement', value: stats.total_calls, icon: PhoneCall, color: 'text-primary', trend: '+14%' },
        ].map((kpi, idx) => (
          <div key={kpi.label} className="bg-white p-6 rounded-3xl border border-gold/10 relative overflow-hidden group shadow-sm">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl bg-gold/5 border border-gold/10 ${kpi.color}`}>
                <kpi.icon size={20} />
              </div>
              <span className={`text-[9px] font-mono font-black ${idx % 2 === 0 ? 'text-emerald-600' : 'text-rose-500'}`}>{kpi.trend}</span>
            </div>
            <p className="text-3xl font-serif font-black text-navy mb-1">{kpi.value.toLocaleString()}</p>
            <p className="text-[10px] font-mono font-black text-navy/30 uppercase tracking-widest">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Knowledge Graph Visualization */}
      <div className="bg-white p-8 rounded-3xl border border-gold/10 shadow-sm mb-10 overflow-hidden" data-testid="knowledge-graph">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Network size={22} className="text-primary" />
            <div>
              <h4 className="text-lg font-serif font-bold text-navy uppercase tracking-tight text-left">Sector Knowledge Graph</h4>
              <p className="text-[9px] font-mono font-black text-navy/40 uppercase tracking-widest text-left">Autonomous Relationship Discovery / Social Fabric</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-[9px] font-mono font-black uppercase tracking-widest">
            <div className="flex items-center gap-2"><div className="size-2 rounded-full bg-emerald-500" /> Positive</div>
            <div className="flex items-center gap-2"><div className="size-2 rounded-full bg-blue-400" /> Neutral</div>
            <div className="flex items-center gap-2"><div className="size-2 rounded-full bg-rose-500" /> Negative</div>
          </div>
        </div>
        
        <div className="h-[500px] w-full bg-gold/5 rounded-2xl border border-gold/10 relative cursor-crosshair">
          {graphData.nodes.length > 0 ? (
            <ForceGraph2D
              graphData={graphData}
              nodeLabel={node => `
                <div class="p-2 font-mono text-[10px]">
                  <div class="font-bold border-b border-navy/10 mb-1 pb-1">${node.label}</div>
                  <div class="flex justify-between gap-4"><span>Influence:</span> <span class="text-primary">${node.influence}</span></div>
                  <div class="flex justify-between gap-4"><span>Risk:</span> <span class="${node.risk === 'high' ? 'text-rose-500 font-bold' : 'text-emerald-500'}">${node.risk.toUpperCase()}</span></div>
                  <div class="mt-1 text-navy/30 uppercase text-[8px]">Sentiment: ${node.sentiment}</div>
                </div>
              `}
              nodeColor={node => {
                if (node.sentiment === 'positive') return '#10b981';
                if (node.sentiment === 'negative') return '#f43f5e';
                return '#60a5fa';
              }}
              nodeVal={node => node.influence + 2} // Node size based on influence
              linkColor={() => '#d4af3733'}
              linkWidth={1.5}
              backgroundColor="transparent"
              width={1000}
              height={500}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <BrainCircuit size={48} className="mx-auto mb-4 text-gold/20 animate-pulse" />
                <p className="text-[10px] font-mono font-black text-navy/20 uppercase tracking-[0.3em]">Map Synchronization in Progress...</p>
              </div>
            </div>
          )}
          
          <div className="absolute top-4 right-4 p-4 bg-white/80 backdrop-blur-md rounded-xl border border-gold/10 shadow-lg max-w-[200px]">
            <div className="flex items-center gap-2 mb-2 text-primary">
              <Info size={14} />
              <span className="text-[9px] font-mono font-black uppercase">Graph Legend</span>
            </div>
            <p className="text-[8px] text-navy/60 leading-relaxed font-sans">
              Nodes represent voters. Edges represent discovered family or community relationships. 
              Drag nodes to explore clusters.
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mb-10">
        {/* Sentiment Matrix */}
        <div className="bg-white p-8 rounded-3xl border border-gold/10 shadow-sm" data-testid="sentiment-chart">
          <div className="flex items-center gap-3 mb-8">
            <Target size={18} className="text-primary" />
            <h4 className="text-lg font-serif font-bold text-navy uppercase tracking-tight">Sentiment Trajectory</h4>
          </div>
          <div className="space-y-6">
            {sentPcts.map(s => {
              const config = SENTIMENT_CONFIG[s.key] || SENTIMENT_CONFIG.neutral;
              return (
                <div key={s.key}>
                  <div className="flex justify-between items-end mb-2">
                    <span className={`text-[10px] font-mono font-black uppercase tracking-widest ${config.color}`}>{config.label}</span>
                    <span className="text-navy font-serif font-bold opacity-40">{s.value} <span className="text-[10px] font-mono ml-1">[{s.pct}%]</span></span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-gold/10 overflow-hidden border border-gold/5">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${s.pct}%` }} transition={{ duration: 1, ease: "easeOut" }}
                      className={`h-full rounded-full ${config.bg} shadow-[0_0_10px_rgba(0,0,0,0.05)]`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Operational Variance (Categories) */}
        <div className="bg-white p-8 rounded-3xl border border-gold/10 shadow-sm" data-testid="category-chart">
          <div className="flex items-center gap-3 mb-8">
            <Activity size={18} className="text-primary" />
            <h4 className="text-lg font-serif font-bold text-navy uppercase tracking-tight">Thematic Distribution</h4>
          </div>
          {Object.keys(stats.category_breakdown).length === 0 ? (
            <div className="py-12 text-center border border-dashed border-gold/10 rounded-2xl">
              <p className="text-[10px] font-mono font-black text-navy/20 uppercase tracking-[0.2em]">Operational silence / No issues reported</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(stats.category_breakdown)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([cat, count]) => {
                  const pct = stats.total_issues > 0 ? ((count / stats.total_issues) * 100).toFixed(0) : 0;
                  const color = CATEGORY_COLORS[cat] || 'bg-slate-400';
                  return (
                    <div key={cat}>
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-[10px] font-mono font-black uppercase tracking-widest text-navy/60">{cat}</span>
                        <span className="text-navy font-serif font-bold opacity-40">{count} <span className="text-[10px] font-mono ml-1">[{pct}%]</span></span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-gold/10 overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                          className={`h-full rounded-full ${color}`} />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 mb-10">
        {/* Performance Coefficient */}
        <div className="bg-white p-8 rounded-3xl border border-gold/10 lg:col-span-1 shadow-sm" data-testid="resolution-rate">
          <h4 className="text-lg font-serif font-bold text-navy mb-8 uppercase tracking-tight">Neutralization Coeff.</h4>
          <div className="flex flex-col items-center">
            <div className="relative size-40 mb-6 font-black italic">
              <svg className="size-full -rotate-90">
                <circle cx="80" cy="80" r="70" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-gold/10" />
                <motion.circle cx="80" cy="80" r="70" fill="transparent" stroke="currentColor" strokeWidth="8"
                  strokeDasharray="440" strokeDashoffset={440 - (440 * (stats.total_issues > 0 ? (stats.resolved_issues / stats.total_issues) : 0))}
                  initial={{ strokeDashoffset: 440 }} animate={{ strokeDashoffset: 440 - (440 * (stats.total_issues > 0 ? (stats.resolved_issues / stats.total_issues) : 0)) }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                  className={stats.total_issues > 0 && (stats.resolved_issues / stats.total_issues) > 0.6 ? 'text-emerald-600' : 'text-saffron'} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-serif font-black text-navy">
                  {stats.total_issues > 0 ? Math.round((stats.resolved_issues / stats.total_issues) * 100) : 0}%
                </span>
                <span className="text-[8px] font-mono font-black uppercase tracking-widest text-primary">SLA Factor</span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-xs text-navy/40 font-mono font-bold uppercase mb-1">{stats.resolved_issues} Resolved / {stats.total_issues} Total</p>
              <p className="text-[10px] text-saffron font-mono font-black uppercase tracking-widest">{stats.pending_issues} Issues in Queue</p>
            </div>
          </div>
        </div>

        {/* Intelligence Briefing (AI Insights) */}
        <div className="bg-white p-8 rounded-3xl border border-gold/10 lg:col-span-2 shadow-sm" data-testid="ai-insights">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <BrainCircuit size={22} className="text-primary" />
              <h4 className="text-lg font-serif font-bold text-navy uppercase tracking-tight">Tactical Intelligence</h4>
            </div>
            <div className="px-3 py-1 rounded-full bg-gold/10 border border-gold/10 text-[9px] font-mono font-black text-primary uppercase tracking-widest">
              Live Feed
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {stats.insights.map((insight, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}
                className="flex items-start gap-4 bg-gold/5 border border-gold/10 p-4 rounded-2xl hover:bg-gold/10 transition-colors group">
                <div className="size-8 rounded-lg bg-gold/10 flex items-center justify-center text-primary shrink-0 group-hover:scale-110 transition-transform">
                  <Lightbulb size={16} />
                </div>
                <p className="text-xs text-navy font-serif leading-relaxed italic opacity-70 group-hover:opacity-100 transition-opacity">
                  {insight}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
