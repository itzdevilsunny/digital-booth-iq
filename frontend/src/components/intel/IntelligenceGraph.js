import React, { useEffect, useState, useRef, useCallback, useLayoutEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { getGraphData, getPersuasionStrategy, managerBroadcast } from '../../api';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, Target, Zap, X, Globe, Search, ChevronDown, MapPin, Send, Sparkles, RefreshCw } from 'lucide-react';
import { forceCollide } from 'd3-force';
import { toast } from 'sonner';

export const IntelligenceGraph = ({ boothId, perspective: initialPerspective = 'social', booths = [], onBoothChange, onNodeSelect }) => {
    const [perspective, setPerspective] = useState(initialPerspective);
    const [data, setData] = useState({ nodes: [], links: [] });
    const [loading, setLoading] = useState(true);
    const [selectedNode, setSelectedNode] = useState(null);
    const [selectedLink, setSelectedLink] = useState(null);
    const [persuasionStrategy, setPersuasionStrategy] = useState(null);
    const [loadingStrategy, setLoadingStrategy] = useState(false);
    const [hoverNode, setHoverNode] = useState(null);
    const fgRef = useRef();
    const containerRef = useRef(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    useLayoutEffect(() => {
        if (!containerRef.current) return;
        
        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                setDimensions({
                    width: entry.contentRect.width,
                    height: entry.contentRect.height
                });
            }
        });
        
        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showSearch, setShowSearch] = useState(false);
    const [cypherQuery, setCypherQuery] = useState('MATCH (n:Voter)-[r:VOTED_IN]->(e:Election {year: 2024, area: "Delhi"}) RETURN n, r, e');

    useEffect(() => {
        const fetchGraph = (showLoading = true) => {
            if (showLoading) setLoading(true);
            getGraphData((boothId && boothId !== 'undefined') ? boothId : 17, perspective)
                .then(res => {
                    setData(res || { nodes: [], links: [] });
                    if (showLoading) setLoading(false);
                    if (showLoading && fgRef.current) {
                        fgRef.current.zoomToFit(400);
                        // Apply custom forces once data is loaded
                        fgRef.current.d3Force('charge').strength(-250).distanceMax(300);
                        fgRef.current.d3Force('link').distance(100);
                        fgRef.current.d3Force('collide', forceCollide(node => {
                            const influence = node.influence || node.influence_score || 2.0;
                            return (7 + (influence * 2.5)) + 8; // Improved collision for clusters
                        }));
                    }
                })
                .catch(err => {
                    console.error("Graph data error:", err);
                    if (showLoading) setLoading(false);
                });
        };

        fetchGraph(true);
        const interval = setInterval(() => {
            fetchGraph(false);
        }, 45000);
        return () => clearInterval(interval);
    }, [boothId, perspective]);

    useEffect(() => {
        const fetchStrategy = async () => {
            if (selectedNode) {
                setLoadingStrategy(true);
                try {
                    const res = await getPersuasionStrategy(selectedNode.id);
                    setPersuasionStrategy(res);
                } catch (err) {
                    console.error("Strategy fetch fail:", err);
                    setPersuasionStrategy({ strategy: "Maintain standard outreach protocol." });
                } finally {
                    setLoadingStrategy(false);
                }
            } else {
                setPersuasionStrategy(null);
            }
        };
        fetchStrategy();
    }, [selectedNode]);

    const handleSearch = (query) => {
        setSearchQuery(query);
        if (query.length > 1) {
            const results = data.nodes.filter(n => 
                (n.name && n.name.toLowerCase().includes(query.toLowerCase())) ||
                (n.id && n.id.toString().includes(query))
            ).slice(0, 5);
            setSearchResults(results);
            setShowSearch(true);
        } else {
            setSearchResults([]);
            setShowSearch(false);
        }
    };

    const jumpToNode = (node) => {
        setSelectedNode(node);
        setSearchQuery('');
        setShowSearch(false);
        if (fgRef.current) {
            fgRef.current.centerAt(node.x, node.y, 1000);
            fgRef.current.zoom(4, 1000);
        }
    };

    const handleNodeClick = useCallback(node => {
        setSelectedNode(node);
        setSelectedLink(null);
        if (onNodeSelect) onNodeSelect(node);
        if (fgRef.current) {
            fgRef.current.centerAt(node.x, node.y, 1000);
            fgRef.current.zoom(3, 1000);
        }
    }, [onNodeSelect]);

    const handleLinkClick = useCallback(link => {
        setSelectedLink(link);
        setSelectedNode(null);
    }, []);

    const nodeCanvasObject = useCallback((node, ctx, globalScale) => {
        const isSelected = selectedNode && selectedNode.id === node.id;
        const isHovered = hoverNode && hoverNode.id === node.id;
        
        if (!isFinite(node.x) || !isFinite(node.y)) return;

        // DYNAMIC SIZING: Influencer Gravity
        const influence = node.influence || node.influence_score || 2.0;
        let radius = node.type === 'issue' ? 10 : (7 + (influence * 1.5));
        if (node.role === 'admin') radius = 16;
        if (node.role === 'worker') radius = 12;
        if (!isFinite(radius) || radius <= 0) radius = 8;

        // Pulsing Ring for High Influence Non-Voters
        if (!node.voted && influence > 3.5) {
            const t = Date.now() / 1000;
            const pulseRadius = radius + 4 + Math.sin(t * 5) * 2;
            ctx.beginPath();
            ctx.arc(node.x, node.y, pulseRadius, 0, 2 * Math.PI, false);
            ctx.strokeStyle = 'rgba(244, 63, 94, 0.4)';
            ctx.lineWidth = 2 / globalScale;
            ctx.stroke();
        }

        // Node Color based on voted status and role
        let color = '#10b981'; // Emerald for voted
        if (node.type === 'voter' && !node.voted) {
            color = node.sentiment === 'negative' ? '#f43f5e' : '#94a3b8'; // Rose for negative non-voters
        }
        if (node.type === 'issue') color = '#a855f7'; // Purple for clusters
        if (node.role === 'admin') color = '#3b82f6'; // Blue for Admin
        if (node.role === 'worker') color = '#eab308'; // Amber for Worker
        
        if (isSelected) color = '#6366f1'; // Indigo for selection
        if (isHovered && !isSelected) color = '#4f46e5';

        // Draw Node Shadow/Glow
        if (isSelected || isHovered) {
            ctx.beginPath();
            ctx.arc(node.x, node.y, radius + 4, 0, 2 * Math.PI, false);
            ctx.fillStyle = `${color}22`;
            ctx.fill();
            
            ctx.shadowColor = color;
            ctx.shadowBlur = 15 / globalScale;
            ctx.strokeStyle = color;
            ctx.lineWidth = 2 / globalScale;
            ctx.stroke();
        }

        // SENTIMENT HALO: Soft glow based on sentiment
        const sentimentColor = node.sentiment === 'negative' ? 'rgba(244, 63, 94, 0.2)' : 
                               node.sentiment === 'positive' ? 'rgba(16, 185, 129, 0.2)' : 
                               'rgba(148, 163, 184, 0.1)';
        
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius * 2.5, 0, 2 * Math.PI, false);
        const gradient = ctx.createRadialGradient(node.x, node.y, radius, node.x, node.y, radius * 2.5);
        gradient.addColorStop(0, sentimentColor);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.fill();

        // Draw Main Circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
        ctx.fillStyle = color;
        ctx.fill();

        // White inner highlight for 3D effect
        ctx.beginPath();
        ctx.arc(node.x - radius/3, node.y - radius/3, radius/4, 0, 2 * Math.PI, false);
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fill();

        // Node Label
        const label = (node.name || node.label || 'Voter').toUpperCase();
        const fontSize = 8 / globalScale;
        ctx.font = `bold ${fontSize}px "Inter", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.fillStyle = '#0f172a'; // Deep Navy
        ctx.fillText(label, node.x, node.y + radius + 10);

        // Sub-label (Status + House No)
        if (node.type === 'voter') {
            const statusLabel = node.voted ? 'VOTED' : 'ACTION REQ';
            ctx.font = `900 ${fontSize * 0.7}px "Inter", sans-serif`;
            ctx.fillStyle = node.voted ? '#10b981' : '#f43f5e';
            ctx.fillText(statusLabel, node.x, node.y + radius + 18);
            
            if (node.house_no) {
                ctx.font = `500 ${fontSize * 0.6}px "JetBrains Mono", monospace`;
                ctx.fillStyle = '#64748b';
                ctx.fillText(`H#${node.house_no}`, node.x, node.y + radius + 25);
            }
        }

        // TARGET POINTER: Dynamic Arrow pointing to selected node
        if (isSelected) {
            const arrowSize = 10 / globalScale;
            const offset = radius + 25 / globalScale;
            
            ctx.beginPath();
            ctx.moveTo(node.x, node.y - offset - arrowSize);
            ctx.lineTo(node.x - arrowSize/2, node.y - offset - arrowSize * 2);
            ctx.lineTo(node.x + arrowSize/2, node.y - offset - arrowSize * 2);
            ctx.closePath();
            ctx.fillStyle = '#6366f1';
            ctx.fill();
            
            // Pulsing ring
            const pulse = (Date.now() % 1000) / 1000;
            ctx.beginPath();
            ctx.arc(node.x, node.y, radius + 10 * pulse, 0, 2 * Math.PI);
            ctx.strokeStyle = `rgba(99, 102, 241, ${1 - pulse})`;
            ctx.lineWidth = 2 / globalScale;
            ctx.stroke();
        }
    }, [selectedNode, hoverNode]);

    const linkCanvasObject = useCallback((link, ctx, globalScale) => {
        const source = link.source;
        const target = link.target;
        
        if (!source || !target || !source.x || !target.x) return;

        const isPropagating = source.voted && source.sentiment === 'positive' && !target.voted;
        const color = isPropagating ? '#10b981' : (link.type === 'family' ? '#cbd5e1' : '#f1f5f9');
        const width = isPropagating ? 4 / globalScale : (link.type === 'family' ? 2 / globalScale : 1 / globalScale);

        // Draw Line
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.stroke();

        // Propagation Pulse/Gradient for High Influence
        if (isPropagating) {
            const time = Date.now() / 1000;
            const dashOffset = (time * 20) % 40;
            
            ctx.beginPath();
            ctx.moveTo(source.x, source.y);
            ctx.lineTo(target.x, target.y);
            ctx.strokeStyle = '#34d399';
            ctx.lineWidth = width * 1.5;
            ctx.setLineDash([10, 10]);
            ctx.lineDashOffset = -dashOffset;
            ctx.stroke();
            ctx.setLineDash([]); // Reset
            
            // Influence Label
            const midX = (source.x + target.x) / 2;
            const midY = (source.y + target.y) / 2;
            const fontSize = 5 / globalScale;
            ctx.font = `bold ${fontSize}px "JetBrains Mono", monospace`;
            ctx.fillStyle = '#059669';
            ctx.textAlign = 'center';
            ctx.fillText(`${Math.round((source.influence || 2.0) * 15)}% IMPACT`, midX, midY - 5);
        }
    }, [globalScale => 1.0]); // globalScale is passed by the graph component

    const perspectives = [
        { id: 'social', label: 'Social Fabric', icon: BrainCircuit },
        { id: 'sentiment', label: 'Sentiment Flow', icon: Zap },
        { id: 'issues', label: 'Issue Clusters', icon: Target }
    ];


    return (
        <div className="relative w-full h-full bg-[#f8fafc] border border-slate-200 rounded-[1.5rem] overflow-hidden group shadow-2xl flex flex-col">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
            
            {/* Top Query Bar - Ultra Compact for Regional View */}
            <div className="w-full bg-[#020617] px-4 py-3 flex items-center gap-4 z-40 border-b border-white/5 shadow-2xl">
                <div className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-2 border border-white/10 flex-1">
                   <Search size={14} className="text-slate-400" />
                   <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder="Search Social Fabric..."
                        className="bg-transparent border-none outline-none text-[10px] text-white w-full placeholder:text-slate-600 font-bold tracking-tight"
                   />
                </div>
                <div className="hidden lg:flex items-center gap-3 bg-white/5 rounded-xl px-4 py-2 border border-white/10 flex-[2]">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest border-r border-white/10 pr-4 whitespace-nowrap">Cypher Logic</span>
                    <input 
                        type="text" 
                        value={cypherQuery}
                        onChange={(e) => setCypherQuery(e.target.value)}
                        className="bg-transparent border-none outline-none text-[10px] font-mono text-emerald-400/80 w-full"
                        placeholder="MATCH (n) WHERE n.voted = false RETURN n"
                    />
                </div>
                {booths.length > 0 && (
                    <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-1 border border-white/10">
                        <MapPin size={12} className="text-slate-400" />
                        <select 
                            value={boothId}
                            onChange={(e) => onBoothChange?.(e.target.value)}
                            className="bg-transparent border-none outline-none text-[9px] font-black text-white uppercase tracking-widest cursor-pointer appearance-none"
                        >
                            {booths.map(b => (
                                <option key={b.id} value={b.id} className="bg-[#020617] text-white">
                                    Booth {b.booth_number}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
                <div className="flex items-center gap-1.5">
                    {['Non-Voters', 'Influence'].map((label) => (
                        <button 
                            key={label}
                            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/40 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all border border-white/5"
                        >
                            {label}
                        </button>
                    ))}
                    <button 
                        onClick={async () => {
                            const msg = prompt("Enter Tactical Directive for this Sector:");
                            if (msg) {
                                try {
                                    await managerBroadcast({ message: `SECTOR ${boothId} DIRECTIVE: ${msg}` });
                                    toast.success("Sector-specific directive issued.");
                                } catch (e) { console.error(e); }
                            }
                        }}
                        className="px-4 py-1.5 bg-emerald-500 text-white rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center gap-2"
                    >
                        <Send size={10} />
                        Sector Broadcast
                    </button>
                </div>
            </div>

            <div className="flex-1 relative" ref={containerRef}>
                {/* Perspective Selector - Floating Navigator */}
                <div className="absolute bottom-10 left-10 z-30">
                    <div className="bg-white/80 backdrop-blur-xl p-1 rounded-2xl border border-slate-200 shadow-2xl flex flex-col gap-1">
                        {perspectives.map((p) => {
                            const Icon = p.icon;
                            const isActive = perspective === p.id;
                            return (
                                <button
                                    key={p.id}
                                    onClick={() => setPerspective(p.id)}
                                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${
                                        isActive 
                                        ? 'bg-[#0f172a] text-white shadow-lg' 
                                        : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'
                                    }`}
                                >
                                    <Icon size={14} />
                                    <span>{p.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>


                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4 bg-white">
                        <div className="size-12 border-4 border-slate-200 border-t-[#0f172a] rounded-full animate-spin" />
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[5px] animate-pulse">Initializing Delhi Graph...</p>
                    </div>
                ) : (
                    <div className="w-full h-full relative">
                        {dimensions.width > 0 && (
                            <ForceGraph2D
                                ref={fgRef}
                                width={dimensions.width}
                                height={dimensions.height}
                                graphData={data}
                                backgroundColor="#ffffff"
                                nodeCanvasObject={nodeCanvasObject}
                                linkCanvasObject={linkCanvasObject}
                                onNodeClick={handleNodeClick}
                                onLinkClick={handleLinkClick}
                                onNodeHover={node => setHoverNode(node)}
                                linkDirectionalArrowLength={4}
                                linkDirectionalArrowRelPos={1}
                                linkDirectionalParticles={link => link.source.voted && link.source.sentiment === 'positive' ? 8 : 1}
                                linkDirectionalParticleWidth={2}
                                linkDirectionalParticleSpeed={0.008}
                                d3AlphaDecay={0.01}
                                d3VelocityDecay={0.4}
                                cooldownTicks={100}
                            />
                        )}
                    </div>
                )}

                {/* Overlay Panels */}
                <div className="absolute inset-0 pointer-events-none">
                    {/* Tactical Voter Dossier - Floating Absolute Panel */}
                    <AnimatePresence>
                        {selectedNode && (
                            <motion.div 
                                initial={{ x: 300, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: 300, opacity: 0 }}
                                className="bg-white/95 backdrop-blur-2xl p-6 rounded-[2.5rem] border border-slate-200 shadow-2xl space-y-6 w-80 relative"
                            >
                                <button 
                                    onClick={() => setSelectedNode(null)}
                                    className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-colors"
                                >
                                    <X size={16} />
                                </button>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`size-12 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg ${selectedNode.voted ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-rose-500 shadow-rose-500/20'}`}>
                                            {selectedNode.name?.[0] || 'V'}
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">{selectedNode.name || 'Anonymous Voter'}</h3>
                                            <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">ID: {selectedNode.id}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Influence</p>
                                            <p className="text-lg font-black text-indigo-600">{(selectedNode.influence || 2.0).toFixed(1)}</p>
                                        </div>
                                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Sentiment</p>
                                            <p className={`text-lg font-black uppercase ${selectedNode.sentiment === 'negative' ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                {selectedNode.sentiment || 'NEUTRAL'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-3xl bg-indigo-500/5 border border-indigo-500/10 space-y-3">
                                        <div className="flex items-center gap-2">
                                            <BrainCircuit size={14} className="text-indigo-600" />
                                            <h4 className="text-[9px] font-black text-indigo-900 uppercase tracking-[2px]">AI Persuasion Strategy</h4>
                                        </div>
                                        {loadingStrategy ? (
                                            <div className="flex items-center gap-2 py-2">
                                                <RefreshCw size={10} className="animate-spin text-indigo-400" />
                                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Generating Strategy...</span>
                                            </div>
                                        ) : (
                                            <p className="text-[10px] font-bold text-slate-600 leading-relaxed italic">
                                                {persuasionStrategy?.strategy || "Select a node to analyze tactical engagement options."}
                                            </p>
                                        )}
                                        {persuasionStrategy?.suggested_medium && (
                                            <div className="flex items-center gap-1.5 pt-2 border-t border-indigo-500/10">
                                                <Zap size={10} className="text-amber-500" />
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Recommended Channel: {persuasionStrategy.suggested_medium}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        <button className="flex-1 py-3 bg-[#0f172a] text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10">
                                            Contact
                                        </button>
                                        <button className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">
                                            Dossier
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Bottom Right Intelligence Panels */}
                    <div className="absolute bottom-10 right-10 flex flex-col items-end gap-4 pointer-events-auto">
                        {/* Legend */}
                        <div className="bg-white/80 backdrop-blur-xl p-4 rounded-2xl border border-slate-200 shadow-xl w-48">
                            <h4 className="text-[8px] font-black text-slate-400 uppercase tracking-[3px] mb-3">Tactical Legend</h4>
                            <div className="space-y-2">
                                {[
                                    { label: 'Voted Citizens', color: 'bg-emerald-500' },
                                    { label: 'Action Required', color: 'bg-rose-500' },
                                    { label: 'Issue Clusters', color: 'bg-purple-500' }
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <div className={`size-1.5 rounded-full ${item.color}`} />
                                        <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tight">{item.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* AI Summary Card - Minimal */}
                        <div className="bg-[#0f172a] p-5 rounded-2xl border border-white/5 shadow-2xl w-72">
                            <div className="flex items-center gap-2 mb-3">
                                <Sparkles size={12} className="text-emerald-500" />
                                <h4 className="text-[9px] font-black text-white uppercase tracking-[2px]">Regional Intel Summary</h4>
                            </div>
                            <p className="text-[10px] font-medium text-slate-400 leading-snug">
                                72% of neutral nodes in this sector show positive sentiment shift. Priority outreach needed for 14 influencers.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Entity Detail Panel - Precision Match to Screenshot */}
            <div className="w-full bg-white border-t border-slate-200 z-40">
                <div className="bg-[#0f172a] px-6 py-2.5 flex items-center gap-4">
                    <div className="size-6 rounded bg-amber-500 flex items-center justify-center text-[11px] font-black text-white shadow-sm">
                        {selectedNode?.type === 'issue' ? 'I' : 'M'}
                    </div>
                    <span className="text-[10px] font-black text-white uppercase tracking-[2.5px]">
                        Entity: {selectedNode?.type === 'issue' ? 'Complaint Cluster' : 'House'}
                    </span>
                </div>
                
                <div className="grid grid-cols-4 gap-0 p-0">
                    <div className="p-6 space-y-2 hover:bg-slate-50 transition-colors cursor-default">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Area</p>
                        <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{selectedNode?.area || 'UNKNOWN'}</p>
                    </div>
                    <div className="p-6 space-y-2 border-l border-slate-100 hover:bg-slate-50 transition-colors cursor-default">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Booth ID</p>
                        <p className="text-sm font-black text-slate-900 uppercase tracking-tight">DL_{boothId || 17}_SEC40</p>
                    </div>
                    <div className="p-6 space-y-2 border-l border-slate-100 hover:bg-slate-50 transition-colors cursor-default">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Election Context</p>
                        <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight">
                            {selectedNode?.assembly || 'AC-40'} | Part {selectedNode?.part_no || '12'}
                        </p>
                        <p className="text-[8px] font-bold text-indigo-500 uppercase tracking-widest">{selectedNode?.election || 'GENERAL ELECTION 2024'}</p>
                    </div>
                    <div className="p-6 space-y-2 border-l border-slate-100 hover:bg-slate-50 transition-colors cursor-default">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Status / Intelligence Status</p>
                        <p className={`text-sm font-black uppercase tracking-tight ${selectedNode?.voted ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {selectedNode ? `${selectedNode.voted ? 'Voted' : 'Action Req'} - H#${selectedNode.house_no || '793'}` : 'READY'}
                        </p>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{__html: `
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; }
            `}} />
        </div>
    );
};
