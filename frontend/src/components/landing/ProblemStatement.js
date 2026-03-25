import { motion } from "framer-motion";
import { Icon, Reveal, StaggerContainer, staggerChild } from "./shared";

export function ProblemStatement() {
  return (
    <section id="problem" className="py-32 bg-[#f8f5f0] relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none" />
      <div className="max-w-7xl mx-auto px-8 grid lg:grid-cols-2 gap-20 items-center relative z-10">
        <Reveal>
          <div className="flex flex-col gap-6">
            <h2 className="text-5xl md:text-7xl font-serif font-black leading-tight text-navy tracking-tighter">
              <span className="text-primary italic">&ldquo;</span>Politics is a <br />Game of <span className="text-primary">Inches.</span><span className="text-primary italic">&rdquo;</span>
            </h2>
            <p className="text-xl md:text-2xl text-navy/40 font-serif italic leading-relaxed border-l-4 border-primary/20 pl-8">
              Data silos, operational friction, and delayed intelligence are the primary causes of electoral attrition. 
              Traditional models fail to engage 40% of the critical swing electorate.
            </p>
            <div className="inline-flex items-center gap-4 py-3 px-6 rounded-2xl bg-red-500/5 border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.05)]">
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="size-2 rounded-full bg-red-500"
              />
              <span className="text-[10px] font-mono font-black text-red-500 uppercase tracking-[0.4em]">Intelligence Risk: Critical</span>
            </div>
          </div>
        </Reveal>

        <StaggerContainer className="grid grid-cols-1 gap-6">
          {[
            { 
              title: "Information Fragmentation", 
              desc: "Voter intelligence sequestered in disparate physical logs and isolated digital nodes.", 
              icon: "data_exploration", 
              color: "border-red-500/20 bg-red-500/5 shadow-red-500/5" 
            },
            { 
              title: "Operational Latency", 
              desc: "Strategic ground insights arriving 48-72 hours post-event, rendering them non-actionable.", 
              icon: "timer_10_alt_1", 
              color: "border-saffron/20 bg-saffron/5 shadow-saffron/5" 
            },
            { 
              title: "Strategic Depletion", 
              desc: "Campaign resources misallocated to stable zones instead of contested swing matrices.", 
              icon: "account_balance_wallet", 
              color: "border-primary/20 bg-primary/5 shadow-primary/5" 
            },
          ].map((item) => (
            <motion.div 
              key={item.title} 
              variants={staggerChild} 
              whileHover={{ x: 10 }} 
              className={`glass-panel p-8 rounded-3xl border ${item.color} flex items-start gap-6 transition-all duration-500 group shadow-lg cursor-default`}
            >
              <div className="size-14 rounded-2xl bg-gold/5 flex items-center justify-center text-primary border border-gold/10 group-hover:bg-primary/10 group-hover:text-white group-hover:border-primary/20 transition-all duration-500 group-hover:rotate-6">
                <Icon name={item.icon} size={28} />
              </div>
              <div>
                <h3 className="text-xl font-serif font-bold text-navy mb-2 group-hover:text-primary transition-colors">{item.title}</h3>
                <p className="text-[11px] text-navy/30 font-serif leading-relaxed italic group-hover:text-navy/60 transition-colors uppercase tracking-wide">
                  {item.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
