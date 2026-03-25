import { motion } from "framer-motion";
import { Icon, Reveal, StaggerContainer, staggerChild } from "./shared";

export function ProblemStatement() {
  return (
    <section id="problem" className="py-28 bg-[var(--background-dark)] relative">
      <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none" />
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center relative z-10">
        <Reveal>
          <h2 className="text-4xl md:text-5xl font-serif font-bold leading-tight mb-6 text-white">
            <span className="text-[var(--primary)]">&ldquo;</span>Politics is a game of
            inches.<span className="text-[var(--primary)]">&rdquo;</span>
          </h2>
          <p className="text-xl text-[var(--cream)]/80 font-body leading-relaxed mb-8 border-l-4 border-[var(--primary)]/30 pl-6">
            Don&apos;t let data silos, manual errors, or delayed intelligence
            cost you the election. Traditional campaign methods leave 40% of
            potential swing voters untouched.
          </p>
          <div className="flex items-center gap-4 text-sm font-mono text-[var(--primary)]/80">
            <motion.span
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Icon name="warning" />
            </motion.span>
            <span>CAMPAIGN RISK ASSESSMENT: CRITICAL</span>
          </div>
        </Reveal>

        <StaggerContainer className="grid gap-4">
          <motion.div variants={staggerChild} whileHover={{ scale: 1.02, y: -4 }} className="glass-panel p-6 rounded-lg flex items-start gap-4 transition-colors group cursor-default">
            <div className="p-3 bg-red-900/20 text-red-500 rounded border border-red-500/20 group-hover:border-red-500/50 group-hover:shadow-[0_0_12px_rgba(239,68,68,0.2)] transition-all duration-300">
              <Icon name="database" />
            </div>
            <div>
              <h3 className="text-white text-lg font-bold mb-1">Fragmented Data</h3>
              <p className="text-[var(--cream)]/70 text-sm">Voter lists scattered across Excel sheets, PDFs, and notebooks lead to duplicate efforts.</p>
            </div>
          </motion.div>

          <motion.div variants={staggerChild} whileHover={{ scale: 1.02, y: -4 }} className="glass-panel p-6 rounded-lg flex items-start gap-4 transition-colors group cursor-default">
            <div className="p-3 bg-orange-900/20 text-orange-500 rounded border border-orange-500/20 group-hover:border-orange-500/50 group-hover:shadow-[0_0_12px_rgba(249,115,22,0.2)] transition-all duration-300">
              <Icon name="schedule" />
            </div>
            <div>
              <h3 className="text-white text-lg font-bold mb-1">Slow Decisions</h3>
              <p className="text-[var(--cream)]/70 text-sm">Critical insights arriving 48 hours too late to act upon effectively.</p>
            </div>
          </motion.div>

          <motion.div variants={staggerChild} whileHover={{ scale: 1.02, y: -4 }} className="glass-panel p-6 rounded-lg flex items-start gap-4 transition-colors group cursor-default">
            <div className="p-3 bg-yellow-900/20 text-yellow-500 rounded border border-yellow-500/20 group-hover:border-yellow-500/50 group-hover:shadow-[0_0_12px_rgba(234,179,8,0.2)] transition-all duration-300">
              <Icon name="monetization_on" />
            </div>
            <div>
              <h3 className="text-white text-lg font-bold mb-1">Wasted Resources</h3>
              <p className="text-[var(--cream)]/70 text-sm">Campaign funds spent on safe seats instead of battling for swing booths.</p>
            </div>
          </motion.div>
        </StaggerContainer>
      </div>
    </section>
  );
}
