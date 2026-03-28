import React, { useEffect, useState, useRef, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { getGraphData } from '../../api';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, Target, Zap, Info, X, Globe } from 'lucide-react';

export const IntelligenceGraph = ({ onNodeSelect, boothId }) => {
    const [perspective, setPerspective] = useState('social');
    const [data, setData] = useState({ nodes: [], links: [] });
    const [loading, setLoading] = useState(true);
    const [selectedNode, setSelectedNode] = useState(null);
    const [selectedLink, setSelectedLink] = useState(null);
    const [hoverNode, setHoverNode] = useState(null);
    const fgRef = useRef();

    useEffect(() => {
        const fetchGraph = (showLoading = true) => {
            if (showLoading) setLoading(true);
            getGraphData(boothId || 17, perspective)
                .then(res => {
                    setData(res || { nodes: [], links: [] });
                    if (showLoading) setLoading(false);
                    // Only auto-zoom on first load or perspective change
                    if (showLoading && fgRef.current) {
                        fgRef.current.zoomToFit(400);
                    }
                })
                .catch(err => {
                    console.error("Graph data error:", err);
                    if (showLoading) setLoading(false);
                });
        };

        fetchGraph(true);

        // --- LIVE ENGINE: Auto-refresh graph data every 45 seconds ---
        const interval = setInterval(() => {
            fetchGraph(false); // Silent refresh
        }, 45000);

        return () => clearInterval(interval);
    }, [boothId, perspective]);

    const handleNodeClick = useCallback(node => {
        setSelectedNode(node);
        setSelectedLink(null); // Clear link selection
        if (onNodeSelect) onNodeSelect(node);
        fgRef.current.centerAt(node.x, node.y, 1000);
        fgRef.current.zoom(3, 1000);
    }, [onNodeSelect]);

    const handleLinkClick = useCallback(link => {
        setSelectedLink(link);
        setSelectedNode(null); // Clear node selection
    }, []);

    const nodeCanvasObject = useCallback((node, ctx, globalScale) => {
        const isSelected = selectedNode && selectedNode.id === node.id;
        const isHovered = hoverNode && hoverNode.id === node.id;
        
        // Safety check for non-finite coordinates which can happen during D3 simulation warmup
        if (!isFinite(node.x) || !isFinite(node.y)) return;

        // Base radius based on node type and influence
        let radius = node.type === 'issue' ? 12 : (Math.sqrt(Math.max(node.influence || 5, 1)) * 3);
        if (node.role === 'admin') radius = 16;
        if (node.role === 'worker') radius = 14;
        
        // Final safety check for radius
        if (!isFinite(radius) || radius <= 0) radius = 5;

        // Pulse effect for special nodes
        const t = Date.now() / 1000;
        const pulse = Math.sin(t * 3) * 0.5 + 0.5;

        let color = '#10b981'; // Default emerald (Citizen/Neutral)
        if (node.type === 'issue') {
            color = '#6366f1'; // Indigo for issues
        } else if (node.role === 'admin') {
            color = '#f59e0b'; // Amber for Admin
        } else if (node.role === 'worker') {
            color = '#3b82f6'; // Blue for Worker
        } else {
            if (node.sentiment === 'negative') color = '#ef4444'; // Red
            if (node.sentiment === 'positive') color = '#10b981'; // Green
            if (node.isInfluencer) color = '#a855f7'; // Purple
        }

        // Draw Glow/Pulse
        if (node.isInfluencer || isSelected || node.type === 'issue' || node.role === 'admin') {
            ctx.beginPath();
            ctx.arc(node.x, node.y, radius + (pulse * 6), 0, 2 * Math.PI, false);
            ctx.strokeStyle = `${color}44`; // Low opacity color
            ctx.lineWidth = 4 / globalScale;
            ctx.stroke();
        }

        // Draw 3D "Ball" Shape using Radial Gradient with safety checks
        try {
            const gradX = node.x - radius/3;
            const gradY = node.y - radius/3;
            const gradR1 = radius/10;
            
            if (isFinite(gradX) && isFinite(gradY) && isFinite(gradR1) && isFinite(node.x) && isFinite(node.y) && isFinite(radius)) {
                const gradient = ctx.createRadialGradient(
                    gradX, gradY, gradR1,
                    node.x, node.y, radius
                );
                gradient.addColorStop(0, '#fff'); // Highlight
                gradient.addColorStop(0.2, color);
                gradient.addColorStop(1, '#000'); // Shadow

                ctx.beginPath();
                ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
                ctx.fillStyle = gradient;
                ctx.fill();
            } else {
                // Fallback to simple circle if gradient params are invalid
                ctx.beginPath();
                ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
                ctx.fillStyle = color;
                ctx.fill();
            }
        } catch (e) {
            // Ultimate fallback
            ctx.beginPath();
            ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
            ctx.fillStyle = color;
            ctx.fill();
        }

        // Draw Shadow/Outer Glow on Hover/Select
        if (isSelected || isHovered) {
            ctx.shadowColor = color;
            ctx.shadowBlur = 25 / globalScale;
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2 / globalScale;
            ctx.stroke();
        } else {
            ctx.shadowBlur = 0;
        }

        // Draw Label
        const label = node.name || node.label || 'Node';
        const fontSize = (node.role === 'admin' ? 14 : 10) / globalScale;
        ctx.font = `bold ${fontSize}px "Inter", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Label background for readability
        const textWidth = ctx.measureText(label.toUpperCase()).width;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(node.x - textWidth/2 - 2, node.y + radius + 4, textWidth + 4, fontSize + 4);
        
        ctx.fillStyle = '#fff';
        ctx.fillText(label.toUpperCase(), node.x, node.y + radius + 10);

        // Icon/Indicator for roles
        if (node.role === 'admin' || node.role === 'worker') {
            ctx.fillStyle = '#fff';
            ctx.font = `${fontSize * 0.8}px Arial`;
            ctx.fillText(node.role === 'admin' ? '★' : '⚡', node.x, node.y);
        }
    }, [selectedNode, hoverNode]);

    const perspectives = [
        { id: 'social', label: 'Social Fabric', icon: BrainCircuit },
        { id: 'sentiment', label: 'Sentiment Flow', icon: Zap },
        { id: 'issues', label: 'Issue Clusters', icon: Target },
        { id: 'mobility', label: 'Live Mobility', icon: Globe }
    ];

    return (
        <div className="relative w-full h-full bg-[#050505] border border-white/5 rounded-[2.5rem] overflow-hidden group shadow-2xl">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:40px_40px] pointer-events-none" />
            
            {/* Perspective Selector */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 flex items-center bg-background/40 backdrop-blur-3xl p-1.5 rounded-2xl border border-white/10 shadow-2xl scale-90 md:scale-100">
                {perspectives.map((p) => {
                    const Icon = p.icon;
                    return (
                        <button
                            key={p.id}
                            onClick={() => setPerspective(p.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                                perspective === p.id 
                                ? 'bg-white text-black shadow-xl' 
                                : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                            }`}
                        >
                            <Icon size={14} />
                            <span className="hidden md:inline">{p.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Header Overlay */}
            <div className="absolute top-6 left-6 z-20 flex flex-col gap-2">
                 <div className="flex items-center gap-3 bg-background/60 backdrop-blur-xl px-4 py-2 rounded-2xl border border-border/50">
                    <div className="size-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
                    <span className="text-[10px] font-black uppercase tracking-[3px] text-foreground/80">
                        {perspective.replace('_', ' ')}: Active
                    </span>
                 </div>
                 <div className="text-[8px] font-bold text-muted-foreground/40 uppercase tracking-[2px] ml-2">
                    {data.nodes.length} Intelligence Nodes Linked
                 </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 bg-[#050505]">
                    <div className="relative">
                        <BrainCircuit size={48} className="text-emerald-500/20 animate-pulse" />
                        <div className="absolute inset-0 blur-2xl bg-emerald-500/10 animate-pulse" />
                    </div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[5px] animate-pulse">Syncing Intelligence Matrix...</p>
                </div>
            ) : (
                <ForceGraph2D
                    ref={fgRef}
                    graphData={data}
                    backgroundColor="transparent"
                    nodeCanvasObject={nodeCanvasObject}
                    onNodeClick={handleNodeClick}
                    onLinkClick={handleLinkClick}
                    onNodeHover={node => setHoverNode(node)}
                    linkColor={link => {
                        if (selectedLink && (link === selectedLink)) {
                            return '#f59e0b'; // Gold for selected link
                        }
                        if (selectedNode && (link.source.id === selectedNode.id || link.target.id === selectedNode.id)) {
                            return '#fff'; // Highlighted link for selected node
                        }
                        return 'rgba(255, 255, 255, 0.15)'; // More visible default links
                    }}
                    linkWidth={link => {
                        if (selectedLink && (link === selectedLink)) return 6;
                        if (selectedNode && (link.source.id === selectedNode.id || link.target.id === selectedNode.id)) {
                            return 3;
                        }
                        return 1.5;
                    }}
                    linkDirectionalParticles={link => (selectedLink && link === selectedLink) ? 8 : 4}
                    linkDirectionalParticleSpeed={0.005}
                    linkDirectionalParticleWidth={link => (selectedLink && link === selectedLink) ? 5 : 3}
                    d3AlphaDecay={0.02}
                    d3VelocityDecay={0.3}
                    cooldownTicks={100}
                />
            )}

            {/* AI Context Overlay */}
            <AnimatePresence>
                {selectedNode && (
                    <motion.div 
                        initial={{ x: 300, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 300, opacity: 0 }}
                        className="absolute top-6 right-6 bottom-6 w-80 z-30 bg-black/60 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-6 shadow-2xl flex flex-col"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="size-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center border border-indigo-500/20">
                                    {selectedNode.type === 'issue' ? <Target size={16} /> : <BrainCircuit size={16} strokeWidth={2.5} />}
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-[3px] text-indigo-400">
                                    Node Analysis
                                </span>
                            </div>
                            <button onClick={() => setSelectedNode(null)} className="size-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors">
                                <X size={14} />
                            </button>
                        </div>

                        <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            <div className="space-y-1">
                                <h3 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">{selectedNode.name || "Anonymous Voter"}</h3>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[3px]">
                                    Type: {selectedNode.type || "Citizen"}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[2px] mb-1">Status</p>
                                    <p className={`text-sm font-black uppercase ${selectedNode.sentiment === 'negative' ? 'text-rose-500' : 'text-emerald-500'}`}>
                                        {selectedNode.sentiment || 'Stable'}
                                    </p>
                                </div>
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[2px] mb-1">Impact</p>
                                    <p className="text-sm font-black text-white uppercase tracking-tight">
                                        {selectedNode.influence ? `${selectedNode.influence}/10` : 'Normal'}
                                    </p>
                                </div>
                            </div>

                            <div className="p-5 bg-indigo-500/5 rounded-[1.5rem] border border-indigo-500/10 relative overflow-hidden group/box">
                                <div className="absolute top-0 right-0 p-4 opacity-[0.05] group-hover/box:rotate-12 transition-transform">
                                    <Zap size={40} className="text-indigo-500" />
                                </div>
                                <div className="flex items-center gap-2 mb-3">
                                    <Zap size={12} className="text-indigo-500" />
                                    <p className="text-[8px] font-black text-indigo-500 uppercase tracking-[3px]">Strategic Pulse</p>
                                </div>
                                <p className="text-xs font-bold text-white/90 leading-relaxed italic">
                                    {selectedNode.type === 'issue' 
                                        ? `This ${selectedNode.name} cluster links ${data.links.filter(l => l.target.id === selectedNode.id).length} voters. Resolving this will significantly boost regional sentiment.`
                                        : `"This node represents a key tactical asset. Engagement strategy: Target via ${selectedNode.influence > 5 ? 'Personal Dialogue' : 'Information Blast'} to influence local clusters."`}
                                </p>
                            </div>

                            <div className="space-y-3">
                                <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[2px] px-1">Connected Entities</p>
                                {data.links.filter(l => l.source.id === selectedNode.id || l.target.id === selectedNode.id).slice(0, 3).map((link, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                                        <span className="text-[10px] font-bold text-white/60">
                                            {typeof link.target === 'object' ? link.target.name : link.target}
                                        </span>
                                        <div className="size-1.5 rounded-full bg-indigo-500/40" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-white/10">
                            <button className="w-full py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-[3px] transition-all hover:opacity-90 active:scale-[0.98]">
                                Execute Response Flow
                            </button>
                        </div>
                    </motion.div>
                )}

                {selectedLink && (
                    <motion.div 
                        initial={{ x: 300, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 300, opacity: 0 }}
                        className="absolute top-6 right-6 w-80 z-30 bg-black/60 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-6 shadow-2xl flex flex-col"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="size-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
                                    <Zap size={16} strokeWidth={2.5} />
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-[3px] text-amber-400">
                                    Relationship Intel
                                </span>
                            </div>
                            <button onClick={() => setSelectedLink(null)} className="size-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors">
                                <X size={14} />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[2px] mb-2">Connection Type</p>
                                <p className="text-xl font-black text-amber-500 uppercase tracking-tighter">
                                    {selectedLink.type?.replace('_', ' ') || 'Community Link'}
                                </p>
                            </div>

                            <div className="flex flex-col gap-4">
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 relative">
                                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[2px] mb-1">Origin Node</p>
                                    <p className="text-sm font-black text-white uppercase tracking-tight">
                                        {typeof selectedLink.source === 'object' ? selectedLink.source.name : selectedLink.source}
                                    </p>
                                </div>
                                <div className="flex justify-center -my-2 relative z-10">
                                    <div className="size-6 rounded-full bg-amber-500 flex items-center justify-center border-2 border-black">
                                        <Zap size={10} className="text-black" />
                                    </div>
                                </div>
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[2px] mb-1">Target Node</p>
                                    <p className="text-sm font-black text-white uppercase tracking-tight">
                                        {typeof selectedLink.target === 'object' ? selectedLink.target.name : selectedLink.target}
                                    </p>
                                </div>
                            </div>

                            <div className="p-5 bg-amber-500/5 rounded-[1.5rem] border border-amber-500/10">
                                <p className="text-[10px] font-bold text-white/90 leading-relaxed italic">
                                    {selectedLink.type === 'family' ? "High-trust familial bond detected. Sentiment shifts in one node will likely propagate to the other." :
                                     selectedLink.type === 'management' ? "Command hierarchy established. Operational commands flow through this conduit." :
                                     selectedLink.type === 'support' ? "Active field resolution channel. Link represents an assigned grievance being addressed." :
                                     "Community-level social connection. Shared geographic or demographic interests detected."}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style dangerouslySetInnerHTML={{__html: `
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
            `}} />
        </div>
    );
};
