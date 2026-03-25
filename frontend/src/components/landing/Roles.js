import { motion } from "framer-motion";
import { Icon, Reveal, StaggerContainer, staggerChild } from "./shared";

export function Roles() {
  return (
    <section id="roles" className="py-28 bg-[#0e0e14]">
      <div className="max-w-7xl mx-auto px-6">
        <Reveal>
          <h2 className="text-3xl font-serif font-bold text-white mb-10 border-l-4 border-[var(--saffron)] pl-4">
            Hierarchy of Command
          </h2>
        </Reveal>

        <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { level: "LEVEL 1", title: "Super Admin", perks: ["Full Access Control", "State-wide Analytics", "Budget Allocation"], color: "from-[var(--primary)]/10 to-transparent" },
            { level: "LEVEL 2", title: "State Head", perks: ["Constituency Mgmt", "Candidate Reports", "Media Monitoring"], color: "from-[var(--saffron)]/10 to-transparent" },
            { level: "LEVEL 3", title: "District Lead", perks: ["Mandal Operations", "Worker Assignment", "Event Coordination"], color: "from-blue-500/10 to-transparent" },
            { level: "LEVEL 4", title: "Booth Worker", perks: ["Voter Verification", "Door-to-Door App", "Issue Reporting"], color: "from-green-500/10 to-transparent" },
          ].map((role) => (
            <motion.div
              key={role.title}
              variants={staggerChild}
              whileHover={{ scale: 1.04, y: -6 }}
              className={`bg-gradient-to-b ${role.color} bg-[#15151a] p-6 rounded-lg border border-white/5 hover:border-[var(--primary)]/50 transition-all duration-300 cursor-default`}
            >
              <div className="text-xs font-mono text-[var(--primary)] mb-2 tracking-wider">{role.level}</div>
              <h3 className="text-lg font-bold text-white mb-4">{role.title}</h3>
              <ul className="text-sm text-[var(--cream)]/70 space-y-2.5">
                {role.perks.map((perk) => (
                  <li key={perk} className="flex items-center gap-2">
                    <Icon name="check_circle" size={16} className="text-green-400" />
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
