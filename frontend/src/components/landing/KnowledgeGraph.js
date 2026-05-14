import React, { useEffect, useState, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { getGraphData } from '../../api';
import { Reveal } from './shared';

export const KnowledgeGraph = () => {
    const [data, setData] = useState({ nodes: [], links: [] });
    const [loading, setLoading] = useState(true);
    const containerRef = useRef();
    const fgRef = useRef();

    useEffect(() => {
        getGraphData(17) // Default to Booth 17 for landing page visualization
            .then(res => {
                setData(res || { nodes: [], links: [] });
                setLoading(false);
            })
            .catch(err => {
                console.error("Graph data error:", err);
                setLoading(false);
            });
    }, []);

    // Custom node rendering for premium look
    const nodeCanvasObject = (node, ctx, globalScale) => {
        const label = node.label || 'Voter';
        const fontSize = 12 / globalScale;
        ctx.font = `${fontSize}px Inter, sans-serif`;
        const textWidth = ctx.measureText(label).width;
        const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2); // some padding

        // node circle
        const radius = Math.sqrt(Math.max(node.influence || 5, 1)) * 2;
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
        
        // Color based on sentiment
        let color = '#10b981'; // Default emerald
        if (node.sentiment === 'negative') color = '#ef4444';
        if (node.sentiment === 'neutral') color = '#f59e0b';
        
        ctx.fillStyle = color;
        ctx.fill();
        
        // Glow effect
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;
        
        // label
        if (globalScale > 1.5) {
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--foreground').trim() || 'rgba(0, 0, 0, 0.8)';
            ctx.fillText(label, node.x, node.y + radius + 5);
        }
    };

    return (
        <section id="network" className="py-32 bg-background relative overflow-hidden transition-colors duration-500">
            <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_0%_100%,var(--primary),transparent)] opacity-5" />
            
            <div className="max-w-7xl mx-auto px-8 mb-20 relative z-10">
                <Reveal>
                    <div className="flex flex-col items-center text-center">
                        <span className="text-primary font-bold text-[10px] font-mono uppercase tracking-[0.5em] mb-4 block opacity-60">
                            The Voter Network
                        </span>
                        <h2 className="text-4xl md:text-6xl font-display font-black text-foreground tracking-tight uppercase max-w-4xl">
                            Visualizing your <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">Constituency</span>
                        </h2>
                        <p className="mt-8 text-muted-foreground/40 max-w-2xl font-display italic text-lg leading-relaxed uppercase tracking-tight">
                            Every relationship, every issue, and every feedback shift mapped clearly. 
                            Understand influence patterns before election day.
                        </p>
                    </div>
                </Reveal>
            </div>

            <div className="relative w-full h-[600px] bg-card/50 backdrop-blur-3xl border-y border-border cursor-move overflow-hidden group">
                {/* Decorative scanning line */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-scan z-20" />
                
                {loading ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground/20 font-mono uppercase tracking-widest animate-pulse">
                        Loading Map...
                    </div>
                ) : (
                    <ForceGraph2D
                        ref={fgRef}
                        graphData={data}
                        backgroundColor="transparent"
                        nodeLabel="label"
                        nodeColor={node => {
                            if (node.sentiment === 'negative') return '#ef4444';
                            if (node.sentiment === 'neutral') return '#f59e0b';
                            return '#10b981';
                        }}
                        linkColor={() => 'var(--border)'}
                        linkWidth={1}
                        nodeCanvasObject={nodeCanvasObject}
                        cooldownTicks={100}
                        onEngineStop={() => fgRef.current.zoomToFit(400)}
                    />
                )}

                {/* Legend Overlay */}
                <div className="absolute bottom-8 left-8 z-10 p-6 glass-panel rounded-2xl border border-border bg-card/60 backdrop-blur-xl flex flex-col gap-4">
                    <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[2px] mb-2">Network Legend</p>
                    <div className="flex items-center gap-3">
                        <div className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                        <span className="text-[10px] text-muted-foreground/60 font-mono uppercase tracking-wider">Positive Alignment</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="size-2 rounded-full bg-fuchsia-500" />
                        <span className="text-[10px] text-muted-foreground/60 font-mono uppercase tracking-wider">High Influence Agent</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="size-2 rounded-full bg-amber-500" />
                        <span className="text-[10px] text-muted-foreground/60 font-mono uppercase tracking-wider">Neutral / Targetable</span>
                    </div>
                </div>

                {/* Dynamic Stats overlay */}
                <div className="absolute top-8 right-8 z-10 flex flex-col gap-4">
                    <div className="glass-panel px-6 py-4 rounded-2xl border border-border bg-card/40 backdrop-blur-xl">
                        <p className="text-[8px] font-bold text-primary uppercase tracking-[3px] mb-1">Nodes Detected</p>
                        <p className="text-2xl font-black text-foreground font-display uppercase tracking-tighter">{data.nodes.length}</p>
                    </div>
                    <div className="glass-panel px-6 py-4 rounded-2xl border border-border bg-card/40 backdrop-blur-xl">
                        <p className="text-[8px] font-bold text-primary uppercase tracking-[3px] mb-1">Influencer Connections</p>
                        <p className="text-2xl font-black text-foreground font-display uppercase tracking-tighter">{data.links.length}</p>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{__html: `
                @keyframes scan {
                    0% { top: 0; }
                    100% { top: 100%; }
                }
                .animate-scan {
                    animation: scan 8s linear infinite;
                }
                .glass-panel {
                    box-shadow: 0 0 40px rgba(0,0,0,0.5);
                }
            `}} />
        </section>
    );
};
