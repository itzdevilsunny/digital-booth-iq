import { motion } from "framer-motion";
import { Icon, Reveal, StaggerContainer, staggerChild } from "./shared";

export function Roles() {
  const roles = [
    { 
      level: "PHASE 01", 
      title: "Command Center", 
      desc: "Super Admin controls for strategic resource deployment and state-wide tactical oversight.",
      perks: ["Unified Ops Control", "State Analytics", "Resource Allocation"], 
      color: "border-primary/20 bg-primary/5" 
    },
    { 
      level: "PHASE 02", 
      title: "Regional Intel", 
      desc: "District heads managing local mandal operations and real-time candidate synchronisation.",
      perks: ["Constituency Map", "Field Sync", "Tactical Reporting"], 
      color: "border-saffron/20 bg-saffron/5" 
    },
    { 
      level: "PHASE 03", 
      title: "Field Operations", 
      desc: "Booth workers focused on hyper-local voter outreach and on-ground issue neutralization.",
      perks: ["Voter Matrix", "Street Tracking", "Live Verification"], 
      color: "border-white/10 bg-white/5" 
    },
    { 
      level: "PHASE 04", 
      title: "Citizen Hub", 
      desc: "Direct conduit for governance transparency, AI-driven grievance resolution and trackability.",
      perks: ["Governance AI", "Track Progress", "Direct Support"], 
      color: "border-white/10 bg-white/5" 
    },
  ];

  return (
    <section id="roles" className="py-32 bg-[#f8f5f0] relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(212,175,55,0.03),transparent)] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-8 relative z-10">
        <Reveal>
          <div className="flex flex-col mb-16">
            <h2 className="text-4xl md:text-5xl font-serif font-black text-navy mb-4">
              Operational Hierarchy
            </h2>
            <div className="w-24 h-1 bg-primary rounded-full" />
          </div>
        </Reveal>

        <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {roles.map((role, i) => (
            <motion.div
              key={role.title}
              variants={staggerChild}
              whileHover={{ y: -10 }}
              className={`glass-panel p-8 rounded-3xl border ${role.color} hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)] transition-all duration-500 group`}
            >
              <div className="text-[10px] font-mono font-black text-primary mb-4 tracking-[0.3em] opacity-60">
                {role.level}
              </div>
              <h3 className="text-xl font-serif font-bold text-navy mb-4 group-hover:text-primary transition-colors">
                {role.title}
              </h3>
              <p className="text-xs text-navy/40 font-serif leading-relaxed mb-6 italic">
                {role.desc}
              </p>
              <ul className="space-y-4">
                {role.perks.map((perk) => (
                  <li key={perk} className="flex items-center gap-3 text-[10px] font-mono font-bold text-navy/60 uppercase tracking-widest">
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
