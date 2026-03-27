import { motion } from "framer-motion";
import { Reveal, StaggerContainer, staggerChild } from "./shared";

export function Roles() {
  const roles = [
    { 
      level: "PHASE 01", 
      title: "Admin Dashboard", 
      desc: "Comprehensive controls for resource management and state-wide oversight.",
      perks: ["Unified Ops Control", "State Analytics", "Resource Allocation"], 
      color: "border-emerald-500/20 bg-emerald-500/5 shadow-emerald-500/10" 
    },
    { 
      level: "PHASE 02", 
      title: "Regional Intel", 
      desc: "District heads managing local operations and real-time coordination.",
      perks: ["Constituency Map", "Field Updates", "Analytical Reports"], 
      color: "border-amber-500/20 bg-amber-500/5 shadow-amber-500/10" 
    },
    { 
      level: "PHASE 03", 
      title: "Field Operations", 
      desc: "Booth workers focused on hyper-local voter outreach and on-ground issue neutralization.",
      perks: ["Voter Matrix", "Street Tracking", "Live Verification"], 
      color: "border-rose-500/20 bg-rose-500/5 shadow-rose-500/10" 
    },
    { 
      level: "PHASE 04", 
      title: "Citizen Portal", 
      desc: "Direct conduit for governance transparency, AI-driven grievance resolution and trackability.",
      perks: ["Governance AI", "Track Progress", "Direct Support"], 
      color: "border-white/10 bg-white/5 shadow-white/5" 
    },
  ];

  return (
    <section id="roles" className="py-32 bg-background relative overflow-hidden border-y border-border">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsla(var(--primary),0.03),transparent)] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-8 relative z-10">
        <Reveal>
          <div className="flex flex-col mb-16">
            <h2 className="text-4xl md:text-5xl font-display font-black text-foreground mb-4 uppercase tracking-tight">
              Operational Hierarchy
            </h2>
            <div className="w-24 h-1 bg-primary rounded-full shadow-[0_0_10px_hsl(var(--primary))]" />
          </div>
        </Reveal>

        <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {roles.map((role, i) => (
            <motion.div
              key={role.title}
              variants={staggerChild}
              whileHover={{ y: -10, backgroundColor: "hsla(var(--foreground), 0.02)" }}
              className={`glass-panel p-8 rounded-[2.5rem] border border-border bg-card hover:shadow-[0_20px_40px_rgba(0,0,0,0.5)] transition-all duration-500 group relative overflow-hidden`}
            >
              <div className="text-[10px] font-mono font-black text-muted-foreground/40 mb-4 tracking-[0.4em] uppercase">
                {role.level}
              </div>
              <h3 className="text-xl font-display font-bold text-foreground mb-4 group-hover:text-primary transition-colors uppercase tracking-tight">
                {role.title}
              </h3>
              <p className="text-[11px] text-muted-foreground/30 font-medium leading-relaxed mb-6 italic uppercase tracking-[2px]">
                {role.desc}
              </p>
              <ul className="space-y-4">
                {role.perks.map((perk) => (
                  <li key={perk} className="flex items-center gap-3 text-[9px] font-bold text-muted-foreground/60 uppercase tracking-[0.3em]">
                    <div className="size-1.5 rounded-full bg-primary/30" />
                    {perk}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}

