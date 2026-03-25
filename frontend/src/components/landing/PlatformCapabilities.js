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
    <section id="capabilities" className="py-32 bg-[#f8f5f0] border-t border-gold/10 relative overflow-hidden">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_100%_0%,rgba(212,175,55,0.05),transparent)]" />
      
      <div className="max-w-7xl mx-auto px-8 mb-20 flex flex-col md:flex-row md:items-end justify-between gap-8 relative z-10">
        <Reveal>
          <div className="flex flex-col">
            <span className="text-primary font-mono text-[10px] font-black uppercase tracking-[0.5em] mb-4 block opacity-60">
              Strategic Assets
            </span>
            <h2 className="text-4xl md:text-5xl font-serif font-black text-navy tracking-tight">
              Platform Capabilities
            </h2>
          </div>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="text-cream/40 max-w-md font-serif italic text-lg leading-relaxed">
            A comprehensive terminal for high-command oversight and hyper-local tactical execution.
          </p>
        </Reveal>
      </div>

      <StaggerContainer className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
        {capabilities.map((feature) => (
          <motion.div
            key={feature.title}
            variants={staggerChild}
            whileHover={{ y: -8 }}
            className="glass-panel p-10 rounded-3xl border border-gold/10 hover:border-primary/30 transition-all duration-500 group animate-soft-glow"
          >
            <motion.div
              className="size-14 rounded-2xl bg-primary/5 text-primary flex items-center justify-center mb-8 border border-primary/20 group-hover:bg-primary group-hover:text-background-dark group-hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all duration-500"
              whileHover={{ rotate: 10 }}
            >
              <Icon name={feature.icon} size={24} />
            </motion.div>
            <h3 className="text-2xl font-serif font-bold text-navy mb-4 group-hover:text-primary transition-colors">{feature.title}</h3>
            <p className="text-xs text-navy/40 font-serif leading-relaxed italic">{feature.description || feature.desc}</p>
          </motion.div>
        ))}

        <motion.div
          variants={staggerChild}
          whileHover={{ y: -8 }}
          className="lg:col-span-2 glass-panel p-10 rounded-3xl border border-gold/10 hover:border-saffron/30 transition-all duration-500 group relative overflow-hidden"
        >
          <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
            <div>
              <motion.div
                className="size-14 rounded-2xl bg-saffron/10 text-saffron flex items-center justify-center mb-8 border border-saffron/20 group-hover:bg-saffron group-hover:text-white transition-all duration-500 shadow-lg shadow-saffron/5"
              >
                <Icon name="chat" size={24} />
              </motion.div>
              <h3 className="text-2xl font-serif font-bold text-navy mb-4">Tactical Communications</h3>
              <p className="text-xs text-navy/40 font-serif leading-relaxed italic max-w-md">
                Deploy high-impact campaigns across WhatsApp and SMS directly from the command center. Personalized engagement at institutional scale.
              </p>
            </div>
            <div className="hidden md:flex flex-col gap-3">
              {[1, 2, 3].map(i => (
                <div key={i} className={`h-1.5 rounded-full bg-saffron/${i*20} w-${48 - (i*8)}`} />
              ))}
            </div>
          </div>
          <motion.div
            className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-saffron/5 to-transparent pointer-none"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
        </motion.div>
      </StaggerContainer>
    </section>
  );
}
