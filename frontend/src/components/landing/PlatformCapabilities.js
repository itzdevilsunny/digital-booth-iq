import { motion } from "framer-motion";
import { Icon, Reveal, StaggerContainer, staggerChild } from "./shared";

export function PlatformCapabilities() {
  return (
    <section id="capabilities" className="py-28 bg-[#0e0e14] border-t border-[var(--primary)]/10">
      <div className="max-w-7xl mx-auto px-6 mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <Reveal>
          <span className="text-[var(--saffron)] font-mono text-sm uppercase tracking-widest mb-2 block">
            Core Management Suite
          </span>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-white">
            Unified Booth Management
          </h2>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="text-[var(--cream)]/70 max-w-md font-body text-sm">
            Designed for high-command strategists and ground-level executors alike.
          </p>
        </Reveal>
      </div>

      <StaggerContainer className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { icon: "hub", title: "Knowledge Graph", desc: "Connect voters to schemes, family units, caste demographics, and influence networks in a single view." },
          { icon: "pie_chart", title: "Intelligent Segmentation", desc: "Micro-target voters based on 50+ parameters including past voting behavior and scheme beneficiary status." },
          { icon: "psychology", title: "Sentiment Analysis", desc: "AI-driven analysis of local issues and sentiment from ground reports and social listening." },
          { icon: "map", title: "Booth Management", desc: "Assign tasks to booth workers, track door-to-door visits, and verify voter slips in real-time." },
        ].map((feature) => (
          <motion.div
            key={feature.title}
            variants={staggerChild}
            whileHover={{ scale: 1.03, y: -6, borderColor: "rgba(201,167,74,0.5)" }}
            className="bg-gradient-to-br from-[#1a1a22] to-[#121216] border border-white/5 p-8 rounded-xl transition-all duration-300 group cursor-default"
          >
            <motion.div
              className="w-12 h-12 rounded bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center mb-6 group-hover:bg-[var(--primary)] group-hover:text-[var(--background-dark)] transition-all duration-300"
              whileHover={{ rotate: 10 }}
            >
              <Icon name={feature.icon} />
            </motion.div>
            <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
            <p className="text-[var(--cream)]/70 text-sm leading-relaxed">{feature.desc}</p>
          </motion.div>
        ))}

        <motion.div
          variants={staggerChild}
          whileHover={{ scale: 1.02, y: -4, borderColor: "rgba(201,167,74,0.5)" }}
          className="lg:col-span-2 bg-gradient-to-br from-[#1a1a22] to-[#121216] border border-white/5 p-8 rounded-xl transition-all duration-300 group relative overflow-hidden cursor-default"
        >
          <div className="relative z-10">
            <motion.div
              className="w-12 h-12 rounded bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center mb-6 group-hover:bg-[var(--primary)] group-hover:text-[var(--background-dark)] transition-all duration-300"
              whileHover={{ rotate: 10 }}
            >
              <Icon name="chat" />
            </motion.div>
            <h3 className="text-xl font-bold text-white mb-3">WhatsApp &amp; SMS Integration</h3>
            <p className="text-[var(--cream)]/70 text-sm leading-relaxed max-w-md">
              Launch campaigns directly from the dashboard. One-click personalized messaging to thousands of voters.
            </p>
          </div>
          <motion.div
            className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-[var(--primary)]/10 to-transparent"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        </motion.div>
      </StaggerContainer>
    </section>
  );
}
