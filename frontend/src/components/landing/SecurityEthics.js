import { motion } from "framer-motion";
import { Icon, Reveal, StaggerContainer, staggerChild } from "./shared";

export function SecurityEthics() {
  return (
    <section id="security" className="py-32 bg-[#f8f5f0] border-t border-gold/10 relative overflow-hidden">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_0%_100%,rgba(212,175,55,0.03),transparent)]" />
      
      <div className="max-w-7xl mx-auto px-8 grid lg:grid-cols-2 gap-20 relative z-10">
        <Reveal>
          <div className="flex flex-col gap-6">
            <h2 className="text-4xl md:text-5xl font-serif font-black text-navy leading-tight">
              Uncompromised <br />Data Protection
            </h2>
            <p className="text-lg text-navy/40 font-serif italic leading-relaxed max-w-lg">
              Data privacy is the foundation of a modern campaign. We protect your information with professional-grade security and absolute encryption.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              {[
                { icon: "verified_user", label: "ISO 27001 Certified" },
                { icon: "dns", label: "Data Sovereignty 1:1" },
              ].map((badge) => (
                <motion.div
                  key={badge.label}
                  whileHover={{ scale: 1.05, borderColor: "rgba(212,175,55,0.5)" }}
                  className="bg-gold/5 backdrop-blur-xl px-6 py-3 rounded-2xl border border-gold/10 flex items-center gap-3 transition-all duration-300"
                >
                  <Icon name={badge.icon} className="text-primary" size={18} />
                  <span className="text-[10px] font-mono font-black text-navy uppercase tracking-widest">{badge.label}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </Reveal>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {[
            { title: "Quantum-Safe Encryption", desc: "Military-grade 256-bit encryption for data at rest and in transit.", icon: "enhanced_encryption" },
            { title: "Secure Access Control", desc: "Advanced controls to prevent unauthorized data leaks.", icon: "admin_panel_settings" },
            { title: "Complete Audit Logs", desc: "Every action and login attempt is recorded on our secure ledger.", icon: "history" },
            { title: "Multi-Factor Authentication", desc: "Secure biometric and multi-factor authentication for all users.", icon: "phonelink_lock" },
          ].map((item) => (
            <motion.div key={item.title} variants={staggerChild} className="group">
              <div className="flex items-center gap-3 mb-4">
                 <div className="size-2 rounded-full bg-saffron shadow-[0_0_10px_rgba(232,118,26,0.5)] group-hover:scale-125 transition-transform" />
                 <h4 className="text-[11px] font-mono font-black text-navy uppercase tracking-widest group-hover:text-primary transition-colors">
                  {item.title}
                </h4>
              </div>
              <p className="text-[10px] text-navy/30 font-serif leading-relaxed italic group-hover:text-navy/60 transition-colors">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
