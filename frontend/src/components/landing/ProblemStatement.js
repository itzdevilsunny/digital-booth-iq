import { motion } from "framer-motion";
import { Icon, Reveal, StaggerContainer, staggerChild } from "./shared";

export function ProblemStatement() {
  return (
    <section id="problem" className="py-32 bg-[#0c0c0c] relative overflow-hidden border-y border-white/5">
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none" />
      <div className="max-w-7xl mx-auto px-8 grid lg:grid-cols-2 gap-20 items-center relative z-10">
        <Reveal>
          <div className="flex flex-col gap-8">
            <h2 className="text-5xl md:text-7xl font-display font-black leading-tight text-white tracking-tighter uppercase">
              <span className="text-emerald-500 italic">&ldquo;</span>Politics is a <br />Game of <span className="text-emerald-500">Inches.</span><span className="text-emerald-500 italic">&rdquo;</span>
            </h2>
            <p className="text-xl md:text-2xl text-white/40 font-display italic leading-relaxed border-l-4 border-emerald-500/20 pl-8 uppercase tracking-tight">
              Data silos, operational friction, and delayed intelligence are the primary causes of electoral attrition. 
              Traditional models fail to engage 40% of the critical swing electorate.
            </p>
            <div className="inline-flex items-center gap-4 py-3 px-6 rounded-[2rem] bg-rose-500/5 border border-rose-500/20 shadow-[0_0_30px_rgba(239,68,68,0.05)] w-fit">
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="size-2 rounded-full bg-rose-500 shadow-[0_0_10px_#ef4444]"
              />
              <span className="text-[10px] font-bold text-rose-500 uppercase tracking-[4px]">Intelligence Risk: Critical</span>
            </div>
          </div>
        </Reveal>

        <StaggerContainer className="grid grid-cols-1 gap-6">
          {[
            { 
              title: "Information Fragmentation", 
              desc: "Voter information hidden in disconnected paper logs and separate digital systems.", 
              icon: "data_exploration", 
              color: "border-rose-500/20 bg-rose-500/5 shadow-rose-500/5" 
            },
            { 
              title: "Operational Latency", 
              desc: "Ground-level insights arriving too late to be actionable for the campaign.", 
              icon: "timer_10_alt_1", 
              color: "border-amber-500/20 bg-amber-500/5 shadow-amber-500/5" 
            },
            { 
              title: "Resource Gaps", 
              desc: "Campaign resources misallocated to stable zones instead of contested swing matrices.", 
              icon: "account_balance_wallet", 
              color: "border-emerald-500/20 bg-emerald-500/5 shadow-emerald-500/5" 
            },
          ].map((item) => (
            <motion.div 
              key={item.title} 
              variants={staggerChild} 
              whileHover={{ x: 10, backgroundColor: "rgba(255,255,255,0.02)" }} 
              className={`glass-panel p-8 rounded-[2.5rem] border border-white/5 bg-[#141414] flex items-start gap-6 transition-all duration-500 group shadow-lg cursor-default relative overflow-hidden`}
            >
              <div className="size-14 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 border border-white/5 group-hover:bg-emerald-500/10 group-hover:text-emerald-500 group-hover:border-emerald-500/20 transition-all duration-500 group-hover:rotate-6">
                <Icon name={item.icon} size={28} />
              </div>
              <div>
                <h3 className="text-xl font-display font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors uppercase tracking-tight">{item.title}</h3>
                <p className="text-[11px] text-white/30 font-medium leading-relaxed italic group-hover:text-white/60 transition-colors uppercase tracking-[2px]">
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

