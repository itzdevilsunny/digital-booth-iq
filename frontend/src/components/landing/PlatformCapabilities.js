import { motion } from "framer-motion";
import { Icon, Reveal, StaggerContainer, staggerChild } from "./shared";

export function PlatformCapabilities() {
  const capabilities = [
    { icon: "hub", title: "Intelligence Graph", desc: "Map voter influence networks, family hierarchies, and demographic cross-sections in a unified tactical matrix." },
    { icon: "pie_chart", title: "Neural Segmentation", desc: "Precision micro-targeting utilizing 50+ strategic parameters including historic loyalty and sentiment trajectory." },
    { icon: "psychology", title: "Cognitive Insights", desc: "AI-driven sentiment extraction from real-time ground reports, social intelligence, and local narrative tracking." },
    { icon: "map", title: "Theater Ops", desc: "Coordinate ground assets, track deployment progress, and verify field operations in a 1:1 real-time environment." },
  ];

  return (
    <section id="capabilities" className="py-32 bg-[#0c0c0c] border-t border-white/5 relative overflow-hidden">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_100%_0%,rgba(16,185,129,0.05),transparent)]" />
      
      <div className="max-w-7xl mx-auto px-8 mb-20 flex flex-col md:flex-row md:items-end justify-between gap-8 relative z-10">
        <Reveal>
          <div className="flex flex-col">
            <span className="text-emerald-500 font-bold text-[10px] font-mono uppercase tracking-[0.5em] mb-4 block opacity-60">
              Strategic Assets
            </span>
            <h2 className="text-4xl md:text-5xl font-display font-black text-white tracking-tight uppercase">
              Platform Capabilities
            </h2>
          </div>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="text-white/40 max-w-md font-display italic text-lg leading-relaxed uppercase tracking-tight">
            A comprehensive terminal for high-command oversight and hyper-local tactical execution.
          </p>
        </Reveal>
      </div>

      <StaggerContainer className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
        {capabilities.map((feature) => (
          <motion.div
            key={feature.title}
            variants={staggerChild}
            whileHover={{ y: -8, backgroundColor: "rgba(255,255,255,0.02)" }}
            className="glass-panel p-10 rounded-[2.5rem] border border-white/5 bg-[#141414] transition-all duration-500 group relative overflow-hidden"
          >
            <motion.div
              className="size-14 rounded-2xl bg-white/5 text-white/40 flex items-center justify-center mb-8 border border-white/5 group-hover:bg-emerald-500/10 group-hover:text-emerald-500 group-hover:border-emerald-500/20 transition-all duration-500"
              whileHover={{ rotate: 10 }}
            >
              <Icon name={feature.icon} size={24} />
            </motion.div>
            <h3 className="text-2xl font-display font-bold text-white mb-4 group-hover:text-emerald-400 transition-colors uppercase tracking-tight">{feature.title}</h3>
            <p className="text-[11px] text-white/30 font-medium leading-relaxed italic uppercase tracking-[2px]">{feature.description || feature.desc}</p>
          </motion.div>
        ))}

        <motion.div
          variants={staggerChild}
          whileHover={{ y: -8, backgroundColor: "rgba(255,255,255,0.02)" }}
          className="lg:col-span-2 glass-panel p-10 rounded-[2.5rem] border border-white/5 bg-[#141414] transition-all duration-500 group relative overflow-hidden"
        >
          <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
            <div>
              <motion.div
                className="size-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-8 border border-amber-500/20 group-hover:bg-amber-500 group-hover:text-black transition-all duration-500 shadow-lg"
              >
                <Icon name="chat" size={24} />
              </motion.div>
              <h3 className="text-2xl font-display font-bold text-white mb-4 uppercase tracking-tight">Tactical Communications</h3>
              <p className="text-[11px] text-white/30 font-medium leading-relaxed italic uppercase tracking-[2px] max-w-md">
                Deploy high-impact campaigns across WhatsApp and SMS directly from the command center. Personalized engagement at institutional scale.
              </p>
            </div>
            <div className="hidden md:flex flex-col gap-3">
              {[1, 2, 3].map(i => (
                <div key={i} className={`h-1.5 rounded-full bg-amber-500/${i*20} w-${48 - (i*8)}`} />
              ))}
            </div>
          </div>
          <motion.div
            className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-amber-500/5 to-transparent pointer-none"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
        </motion.div>
      </StaggerContainer>
    </section>
  );
}

