import React, { useEffect, useState, useRef, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { getGraphData } from '../../api';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, Target, Zap, Info, X } from 'lucide-react';

export const IntelligenceGraph = ({ onNodeSelect, boothId }) => {
    const [perspective, setPerspective] = useState('social');
    const [data, setData] = useState({ nodes: [], links: [] });
    const [loading, setLoading] = useState(true);
    const [selectedNode, setSelectedNode] = useState(null);
    const [hoverNode, setHoverNode] = useState(null);
    const fgRef = useRef();

    useEffect(() => {
        setLoading(true);
        getGraphData(boothId || 17, perspective)
            .then(res => {
                setData(res || { nodes: [], links: [] });
                setLoading(false);
                if (fgRef.current) {
                    fgRef.current.zoomToFit(400);
                }
            })
            .catch(err => {
                console.error("Graph data error:", err);
                setLoading(false);
            });
    }, [boothId, perspective]);

    const handleNodeClick = useCallback(node => {
        setSelectedNode(node);
        if (onNodeSelect) onNodeSelect(node);
        fgRef.current.centerAt(node.x, node.y, 1000);
        fgRef.current.zoom(3, 1000);
    }, [onNodeSelect]);

    const nodeCanvasObject = useCallback((node, ctx, globalScale) => {
        const isSelected = selectedNode && selectedNode.id === node.id;
        const isHovered = hoverNode && hoverNode.id === node.id;
        const radius = node.type === 'issue' ? 8 : (Math.sqrt(Math.max(node.influence || 5, 1)) * 2);
        
        let color = '#10b981'; // Default emerald
        if (node.type === 'issue') {
            color = '#6366f1'; // Indigo for issues
        } else {
            if (node.sentiment === 'negative') color = '#ef4444';
            if (node.sentiment === 'neutral') color = '#f59e0b';
            if (node.isInfluencer) color = '#a855f7';
        }

        if (node.isInfluencer || isSelected || node.type === 'issue') {
            const t = Date.now() / 1000;
            const pulse = Math.sin(t * 3) * 0.5 + 0.5;
            ctx.beginPath();
            ctx.arc(node.x, node.y, radius + (pulse * (node.type === 'issue' ? 4 : 5)), 0, 2 * Math.PI, false);
            ctx.strokeStyle = color;
            ctx.lineWidth = 2 / globalScale;
            ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
        ctx.fillStyle = color;
        ctx.fill();

        if (isSelected || isHovered) {
            ctx.shadowColor = color;
            ctx.shadowBlur = 15;
        }

        if (globalScale > 1.5 || node.type === 'issue') {
            const label = node.name || 'Voter';
            const fontSize = (node.type === 'issue' ? 12 : 10) / globalScale;
            ctx.font = `${node.type === 'issue' ? 'black' : 'bold'} ${fontSize}px Inter, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = node.type === 'issue' ? color : 'rgba(255, 255, 255, 0.8)';
            ctx.fillText(label.toUpperCase(), node.x, node.y + radius + (8 / globalScale));
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
                    onNodeHover={node => setHoverNode(node)}
                    linkColor={() => 'rgba(255, 255, 255, 0.05)'}
                    linkWidth={link => (selectedNode && (link.source.id === selectedNode.id || link.target.id === selectedNode.id)) ? 2 : 1}
                    linkDirectionalParticles={2}
                    linkDirectionalParticleSpeed={0.01}
                    linkDirectionalParticleWidth={2}
                    d3AlphaDecay={0.05}
                    d3VelocityDecay={0.2}
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
            </AnimatePresence>

            <style dangerouslySetInnerHTML={{__html: `
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
            `}} />
        </div>
    );
};
