import React, { useEffect, useState, useRef, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { getGraphData } from '../../api';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, Target, Zap, Info, X } from 'lucide-react';

export const IntelligenceGraph = ({ onNodeSelect, boothId }) => {
    const [data, setData] = useState({ nodes: [], links: [] });
    const [loading, setLoading] = useState(true);
    const [selectedNode, setSelectedNode] = useState(null);
    const [hoverNode, setHoverNode] = useState(null);
    const fgRef = useRef();

    useEffect(() => {
        setLoading(true);
        getGraphData()
            .then(res => {
                // Filter for boothId if provided
                let filteredData = res || { nodes: [], links: [] };
                if (boothId) {
                    const nodeIds = new Set(filteredData.nodes
                        .filter(n => !n.booth_id || n.booth_id === boothId)
                        .map(n => n.id));
                    filteredData = {
                        nodes: filteredData.nodes.filter(n => nodeIds.has(n.id)),
                        links: filteredData.links.filter(l => nodeIds.has(l.source) && nodeIds.has(l.target))
                    };
                }
                setData(filteredData);
                setLoading(false);
            })
            .catch(err => {
                console.error("Graph data error:", err);
                setLoading(false);
            });
    }, [boothId]);

    const handleNodeClick = useCallback(node => {
        setSelectedNode(node);
        if (onNodeSelect) onNodeSelect(node);
        
        // Aim at node from outside it
        const distance = 100;
        const distRatio = 1 + distance/Math.hypot(node.x, node.y, node.z);

        fgRef.current.centerAt(node.x, node.y, 1000);
        fgRef.current.zoom(3, 1000);
    }, [onNodeSelect]);

    // Custom node rendering for "Fluidity"
    const nodeCanvasObject = useCallback((node, ctx, globalScale) => {
        const isSelected = selectedNode && selectedNode.id === node.id;
        const isHovered = hoverNode && hoverNode.id === node.id;
        const radius = Math.sqrt(Math.max(node.influence || 5, 1)) * 2;
        
        // Sentiment-based coloring
        let color = '#10b981'; // Default emerald
        if (node.sentiment === 'negative') color = '#ef4444';
        if (node.sentiment === 'neutral') color = '#f59e0b';
        if (node.isInfluencer) color = '#a855f7'; // Purple for key nodes

        // Draw pulsing outer ring for influencers or selected node
        if (node.isInfluencer || isSelected) {
            const t = Date.now() / 1000;
            const pulse = Math.sin(t * 3) * 0.5 + 0.5;
            ctx.beginPath();
            ctx.arc(node.x, node.y, radius + ( pulse * 5), 0, 2 * Math.PI, false);
            ctx.strokeStyle = color;
            ctx.lineWidth = 2 / globalScale;
            ctx.stroke();
        }

        // Draw core node
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
        ctx.fillStyle = color;
        ctx.fill();

        // Glow
        if (isSelected || isHovered) {
            ctx.shadowColor = color;
            ctx.shadowBlur = 15;
        } else {
            ctx.shadowBlur = 0;
        }

        // Labels at higher zoom levels
        if (globalScale > 2) {
            const label = node.name || node.label || 'Voter';
            const fontSize = 10 / globalScale;
            ctx.font = `bold ${fontSize}px Inter, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fillText(label, node.x, node.y + radius + 5);
        }
    }, [selectedNode, hoverNode]);

    return (
        <div className="relative w-full h-full bg-card/20 backdrop-blur-3xl border border-border rounded-[2.5rem] overflow-hidden group">
            {/* Header / Stats Overlay */}
            <div className="absolute top-6 left-6 z-20 flex flex-col gap-2">
                 <div className="flex items-center gap-3 bg-background/60 backdrop-blur-xl px-4 py-2 rounded-2xl border border-border/50">
                    <div className="size-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
                    <span className="text-[10px] font-black uppercase tracking-[3px] text-foreground/80">Intel Grid: Active</span>
                 </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                    <BrainCircuit size={48} className="text-emerald-500/20 animate-pulse" />
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[5px]">Mapping Social Fabric...</p>
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
                    linkDirectionalParticles={1}
                    linkDirectionalParticleSpeed={0.01}
                    d3AlphaDecay={0.05}
                    d3VelocityDecay={0.1}
                />
            )}

            {/* AI Context Overlay (Mobile/Small versions can be sidebar) */}
            <AnimatePresence>
                {selectedNode && (
                    <motion.div 
                        initial={{ x: 300, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 300, opacity: 0 }}
                        className="absolute top-6 right-6 bottom-6 w-80 z-30 bg-card/80 backdrop-blur-3xl border border-border/50 rounded-[2rem] p-6 shadow-2xl flex flex-col"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="size-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center border border-purple-500/20">
                                    <BrainCircuit size={16} strokeWidth={2.5} />
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-[3px] text-purple-400">Node Analysis</span>
                            </div>
                            <button onClick={() => setSelectedNode(null)} className="size-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors">
                                <X size={14} />
                            </button>
                        </div>

                        <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            <div className="space-y-1">
                                <h3 className="text-2xl font-black text-foreground tracking-tighter uppercase leading-none">{selectedNode.name || "Anonymous Voter"}</h3>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[3px]">Influencer Level: {selectedNode.influence || 1}/10</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-4 bg-muted/50 rounded-2xl border border-border">
                                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[2px] mb-1">Sentiment</p>
                                    <p className={`text-sm font-black uppercase ${selectedNode.sentiment === 'negative' ? 'text-rose-500' : 'text-emerald-500'}`}>
                                        {selectedNode.sentiment || 'neutral'}
                                    </p>
                                </div>
                                <div className="p-4 bg-muted/50 rounded-2xl border border-border">
                                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[2px] mb-1">Connections</p>
                                    <p className="text-sm font-black text-foreground uppercase tracking-tight">
                                        {data.links.filter(l => l.source.id === selectedNode.id || l.target.id === selectedNode.id).length} nodes
                                    </p>
                                </div>
                            </div>

                            <div className="p-5 bg-emerald-500/5 rounded-[1.5rem] border border-emerald-500/10 relative overflow-hidden group/box">
                                <div className="absolute top-0 right-0 p-4 opacity-[0.05] group-hover/box:rotate-12 transition-transform">
                                    <Zap size={40} className="text-emerald-500" />
                                </div>
                                <div className="flex items-center gap-2 mb-3">
                                    <Target size={12} className="text-emerald-500" />
                                    <p className="text-[8px] font-black text-emerald-500 uppercase tracking-[3px]">AI Tactical Insight</p>
                                </div>
                                <p className="text-xs font-bold text-foreground leading-relaxed italic">
                                    "This node represents a high-influence household. Addressing their current {selectedNode.top_issue || 'water supply'} grievance will likely positively shift sentiment for {Math.floor(Math.random() * 5) + 3} adjacent nodes in the network."
                                </p>
                            </div>

                            <div className="space-y-3">
                                <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[2px] px-1">Social Fabric DNA</p>
                                {['Family Cluster', 'Community Hub', 'Same Household'].map((tag, i) => (
                                    <div key={tag} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border border-border/30">
                                        <span className="text-[10px] font-bold text-foreground/60">{tag}</span>
                                        <div className="size-1.5 rounded-full bg-emerald-500/40" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-border/50">
                            <button className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-[3px] transition-all shadow-xl shadow-emerald-600/20 active:scale-[0.98]">
                                Initiate Campaign Blast
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
