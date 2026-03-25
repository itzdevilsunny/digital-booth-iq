import { motion } from "framer-motion";
import { Icon, Reveal, StaggerContainer, staggerChild } from "./shared";

export function SecurityEthics() {
  return (
    <section id="security" className="py-28 bg-[var(--background-dark)] border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16">
        <Reveal>
          <h2 className="text-3xl font-serif font-bold text-white mb-6">Uncompromised Security</h2>
          <p className="text-[var(--cream)]/80 mb-8 font-body">
            Your data is your greatest asset. We protect it with military-grade encryption and strict access controls.
          </p>
          <div className="flex gap-4">
            {[
              { icon: "lock", label: "ISO 27001" },
              { icon: "dns", label: "Data Sovereignty" },
            ].map((badge) => (
              <motion.div
                key={badge.label}
                whileHover={{ scale: 1.08, borderColor: "rgba(232,118,26,0.6)" }}
                className="bg-[#1a1a22] px-4 py-2 rounded border border-white/10 flex items-center gap-2 transition-all duration-300"
              >
                <Icon name={badge.icon} className="text-[var(--saffron)]" />
                <span className="text-sm font-bold text-white">{badge.label}</span>
              </motion.div>
            ))}
          </div>
        </Reveal>

        <StaggerContainer className="grid grid-cols-2 gap-x-8 gap-y-12">
          {[
            { title: "End-to-End Encryption", desc: "Data is encrypted at rest and in transit.", icon: "enhanced_encryption" },
            { title: "Role-Based Access", desc: "Granular permissions prevent leaks.", icon: "admin_panel_settings" },
            { title: "Audit Logs", desc: "Every action is tracked and timestamped.", icon: "history" },
            { title: "2FA Enforcement", desc: "Mandatory dual factor for all admins.", icon: "phonelink_lock" },
          ].map((item) => (
            <motion.div key={item.title} variants={staggerChild}>
              <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-[var(--saffron)] rounded-full" />
                {item.title}
              </h4>
              <p className="text-sm text-[var(--cream)]/60">{item.desc}</p>
            </motion.div>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
